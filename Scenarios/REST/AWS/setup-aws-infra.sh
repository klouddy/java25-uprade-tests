#!/bin/bash
set -e

# AWS ECS Fargate + RDS + ALB Setup Script
# This script automates the infrastructure setup for Java benchmark testing

echo "=========================================="
echo "AWS Infrastructure Setup Script"
echo "=========================================="
echo ""

# Check prerequisites
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed"
    exit 1
fi

echo "Checking AWS credentials..."
aws sts get-caller-identity || { echo "Error: AWS credentials not configured"; exit 1; }

# ==========================================
# CONFIGURATION VARIABLES
# ==========================================

export AWS_REGION=${AWS_REGION:-us-east-1}
export APP_IMAGE=${APP_IMAGE:-"REPLACE_WITH_YOUR_ECR_IMAGE"}
export DB_PASSWORD=${DB_PASSWORD:-"BenchUserStrongPass123!"}

echo "Region: $AWS_REGION"
echo "App Image: $APP_IMAGE"
echo ""

if [[ "$APP_IMAGE" == "REPLACE_WITH_YOUR_ECR_IMAGE" ]]; then
    echo "Error: Please set APP_IMAGE environment variable to your ECR image URI"
    echo "Example: export APP_IMAGE=123456789.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java17"
    exit 1
fi

# ==========================================
# 1. GET DEFAULT VPC AND SUBNETS
# ==========================================

echo "Step 1: Getting default VPC and subnets..."

export VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --region $AWS_REGION \
  --query "Vpcs[0].VpcId" \
  --output text)

if [[ -z "$VPC_ID" || "$VPC_ID" == "None" ]]; then
    echo "Error: No default VPC found"
    exit 1
fi

echo "VPC ID: $VPC_ID"

export SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --region $AWS_REGION \
  --query "Subnets[*].SubnetId" \
  --output text)

echo "Subnets: $SUBNET_IDS"
echo ""

# ==========================================
# 2. CREATE SECURITY GROUPS
# ==========================================

echo "Step 2: Creating security groups..."

# ALB Security Group
export ALB_SG_ID=$(aws ec2 create-security-group \
  --group-name java-bench-alb-sg \
  --description "ALB SG for Java benchmark" \
  --vpc-id $VPC_ID \
  --region $AWS_REGION \
  --query "GroupId" \
  --output text)

echo "ALB Security Group: $ALB_SG_ID"

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION

# ECS Task Security Group
export ECS_SG_ID=$(aws ec2 create-security-group \
  --group-name java-bench-ecs-sg \
  --description "ECS tasks SG for Java benchmark" \
  --vpc-id $VPC_ID \
  --region $AWS_REGION \
  --query "GroupId" \
  --output text)

echo "ECS Security Group: $ECS_SG_ID"

aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 8080 \
  --source-group $ALB_SG_ID \
  --region $AWS_REGION

# RDS Security Group
export RDS_SG_ID=$(aws ec2 create-security-group \
  --group-name java-bench-rds-sg \
  --description "RDS SG for Java benchmark" \
  --vpc-id $VPC_ID \
  --region $AWS_REGION \
  --query "GroupId" \
  --output text)

echo "RDS Security Group: $RDS_SG_ID"

aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $ECS_SG_ID \
  --region $AWS_REGION

echo ""

# ==========================================
# 3. CREATE RDS INSTANCE
# ==========================================

echo "Step 3: Creating RDS instance..."

# Create DB Subnet Group
aws rds create-db-subnet-group \
  --db-subnet-group-name java-bench-db-subnet-group \
  --db-subnet-group-description "DB subnet group for benchmark" \
  --subnet-ids $(echo $SUBNET_IDS | tr '\t' ' ') \
  --region $AWS_REGION

echo "DB Subnet Group created"

# Create RDS Instance
export DB_INSTANCE_ID="java-bench-db"
export DB_NAME="benchmarkdb"
export DB_USER="benchuser"

aws rds create-db-instance \
  --db-instance-identifier $DB_INSTANCE_ID \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --allocated-storage 20 \
  --master-username $DB_USER \
  --master-user-password "$DB_PASSWORD" \
  --db-name $DB_NAME \
  --vpc-security-group-ids $RDS_SG_ID \
  --db-subnet-group-name java-bench-db-subnet-group \
  --no-publicly-accessible \
  --backup-retention-period 0 \
  --region $AWS_REGION

echo "RDS instance creating... (this takes ~10 minutes)"
echo "Waiting for RDS to be available..."

aws rds wait db-instance-available \
  --db-instance-identifier $DB_INSTANCE_ID \
  --region $AWS_REGION

export DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier $DB_INSTANCE_ID \
  --region $AWS_REGION \
  --query "DBInstances[0].Endpoint.Address" \
  --output text)

echo "RDS Endpoint: $DB_ENDPOINT"
echo ""

# ==========================================
# 4. CREATE ECS CLUSTER
# ==========================================

echo "Step 4: Creating ECS cluster..."

export ECS_CLUSTER_NAME="java-bench-cluster"

aws ecs create-cluster \
  --cluster-name $ECS_CLUSTER_NAME \
  --region $AWS_REGION

echo "ECS Cluster created: $ECS_CLUSTER_NAME"
echo ""

# ==========================================
# 5. CREATE IAM ROLES
# ==========================================

echo "Step 5: Creating IAM roles..."

export ECS_TASK_EXEC_ROLE_NAME="java-bench-ecs-execution-role"

# Check if role already exists
if aws iam get-role --role-name $ECS_TASK_EXEC_ROLE_NAME &>/dev/null; then
    echo "IAM role $ECS_TASK_EXEC_ROLE_NAME already exists, skipping creation"
else
    # Create trust policy
    cat > /tmp/ecsTaskExecutionRoleTrust.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    aws iam create-role \
      --role-name $ECS_TASK_EXEC_ROLE_NAME \
      --assume-role-policy-document file:///tmp/ecsTaskExecutionRoleTrust.json

    echo "IAM role created"
fi

# Attach policies
aws iam attach-role-policy \
  --role-name $ECS_TASK_EXEC_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy 2>/dev/null || true

aws iam attach-role-policy \
  --role-name $ECS_TASK_EXEC_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess 2>/dev/null || true

export ECS_TASK_EXEC_ROLE_ARN=$(aws iam get-role \
  --role-name $ECS_TASK_EXEC_ROLE_NAME \
  --query "Role.Arn" \
  --output text)

echo "IAM Role ARN: $ECS_TASK_EXEC_ROLE_ARN"
echo ""

# ==========================================
# 6. REGISTER TASK DEFINITION
# ==========================================

echo "Step 6: Registering ECS task definition..."

# Create task definition JSON
cat > /tmp/task-def.json <<EOF
{
  "family": "java-bench-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "$ECS_TASK_EXEC_ROLE_ARN",
  "taskRoleArn": "$ECS_TASK_EXEC_ROLE_ARN",
  "containerDefinitions": [
    {
      "name": "java-bench-app",
      "image": "$APP_IMAGE",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "SPRING_DATASOURCE_URL",
          "value": "jdbc:postgresql://$DB_ENDPOINT:5432/$DB_NAME"
        },
        {
          "name": "SPRING_DATASOURCE_USERNAME",
          "value": "$DB_USER"
        },
        {
          "name": "SPRING_DATASOURCE_PASSWORD",
          "value": "$DB_PASSWORD"
        },
        {
          "name": "SPRING_PROFILES_ACTIVE",
          "value": "ecs"
        }
      ],
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8080/actuator/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/java-bench-app",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      },
      "essential": true
    }
  ]
}
EOF

aws ecs register-task-definition \
  --cli-input-json file:///tmp/task-def.json \
  --region $AWS_REGION

echo "Task definition registered"
echo ""

# ==========================================
# 7. CREATE ALB AND TARGET GROUP
# ==========================================

echo "Step 7: Creating Application Load Balancer..."

# Get first two subnets for ALB
export ALB_SUBNET_1=$(echo $SUBNET_IDS | awk '{print $1}')
export ALB_SUBNET_2=$(echo $SUBNET_IDS | awk '{print $2}')

export ALB_ARN=$(aws elbv2 create-load-balancer \
  --name java-bench-alb \
  --subnets $ALB_SUBNET_1 $ALB_SUBNET_2 \
  --security-groups $ALB_SG_ID \
  --scheme internet-facing \
  --type application \
  --region $AWS_REGION \
  --query "LoadBalancers[0].LoadBalancerArn" \
  --output text)

echo "ALB ARN: $ALB_ARN"

export ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --region $AWS_REGION \
  --query "LoadBalancers[0].DNSName" \
  --output text)

echo "ALB DNS: http://$ALB_DNS"

# Create Target Group
export TG_ARN=$(aws elbv2 create-target-group \
  --name java-bench-tg \
  --protocol HTTP \
  --port 8080 \
  --target-type ip \
  --vpc-id $VPC_ID \
  --health-check-path "/actuator/health" \
  --region $AWS_REGION \
  --query "TargetGroups[0].TargetGroupArn" \
  --output text)

echo "Target Group ARN: $TG_ARN"

# Create Listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN \
  --region $AWS_REGION

echo "ALB Listener created"
echo ""

# ==========================================
# 8. CREATE ECS SERVICE
# ==========================================

echo "Step 8: Creating ECS service..."

# Convert subnet IDs to comma-separated for JSON
export SUBNET_1=$(echo $SUBNET_IDS | awk '{print $1}')
export SUBNET_2=$(echo $SUBNET_IDS | awk '{print $2}')
export SUBNET_3=$(echo $SUBNET_IDS | awk '{print $3}')

# Create service configuration
cat > /tmp/create-service.json <<EOF
{
  "cluster": "$ECS_CLUSTER_NAME",
  "serviceName": "java-bench-service",
  "taskDefinition": "java-bench-task",
  "desiredCount": 2,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["$SUBNET_1", "$SUBNET_2"$([ ! -z "$SUBNET_3" ] && echo ", \"$SUBNET_3\"")],
      "securityGroups": ["$ECS_SG_ID"],
      "assignPublicIp": "ENABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "$TG_ARN",
      "containerName": "java-bench-app",
      "containerPort": 8080
    }
  ]
}
EOF

aws ecs create-service \
  --cli-input-json file:///tmp/create-service.json \
  --region $AWS_REGION

echo "ECS Service created"
echo "Waiting for service to stabilize (this may take a few minutes)..."

aws ecs wait services-stable \
  --cluster $ECS_CLUSTER_NAME \
  --services java-bench-service \
  --region $AWS_REGION

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Application URL: http://$ALB_DNS"
echo "Health Check: http://$ALB_DNS/actuator/health"
echo ""
echo "Environment variables saved to: aws-env-vars.sh"

# Save environment variables for cleanup
cat > aws-env-vars.sh <<EOF
#!/bin/bash
export AWS_REGION=$AWS_REGION
export VPC_ID=$VPC_ID
export ALB_SG_ID=$ALB_SG_ID
export ECS_SG_ID=$ECS_SG_ID
export RDS_SG_ID=$RDS_SG_ID
export DB_INSTANCE_ID=$DB_INSTANCE_ID
export ECS_CLUSTER_NAME=$ECS_CLUSTER_NAME
export ECS_TASK_EXEC_ROLE_NAME=$ECS_TASK_EXEC_ROLE_NAME
export ALB_ARN=$ALB_ARN
export TG_ARN=$TG_ARN
export ALB_DNS=$ALB_DNS
EOF

echo ""
echo "To test the application:"
echo "  curl http://$ALB_DNS/actuator/health"
echo ""
echo "To clean up resources, run:"
echo "  ./cleanup-aws-infra.sh"
echo ""
