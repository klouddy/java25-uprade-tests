#!/bin/bash
set -euo pipefail

# Refresh ECS service by rebuilding, pushing, and redeploying a specified image.

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
SPRING_APP_DIR="$ROOT_DIR/spring-boot-app"

if [[ -f "$SCRIPT_DIR/aws-env-vars.sh" ]]; then
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/aws-env-vars.sh"
fi

export AWS_REGION=${AWS_REGION:-us-east-1}
export ECS_CLUSTER_NAME=${ECS_CLUSTER_NAME:-java-bench-cluster}
export ECS_SERVICE_NAME=${ECS_SERVICE_NAME:-java-bench-service}
export ECS_TASK_EXEC_ROLE_NAME=${ECS_TASK_EXEC_ROLE_NAME:-java-bench-ecs-execution-role}
export DB_INSTANCE_ID=${DB_INSTANCE_ID:-java-bench-db}
export DB_NAME=${DB_NAME:-benchmarkdb}
export DB_USER=${DB_USER:-benchuser}
export DB_PASSWORD=${DB_PASSWORD:-BenchUserStrongPass123!}
export DESIRED_COUNT=${DESIRED_COUNT:-2}
export JAVA_TOOL_OPTIONS=${JAVA_TOOL_OPTIONS:--XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+HeapDumpOnOutOfMemoryError}

if [[ -z "${APP_IMAGE:-}" ]]; then
  read -r -p "Enter ECR image (e.g., 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java25-rest-20260224-01): " APP_IMAGE
fi

if [[ -z "$APP_IMAGE" ]]; then
  echo "Error: APP_IMAGE is required."
  exit 1
fi

TAG_PART="${APP_IMAGE#*:}"
DOCKERFILE=""
if [[ "$TAG_PART" == java17* ]]; then
  DOCKERFILE="$SPRING_APP_DIR/Dockerfile.java17"
elif [[ "$TAG_PART" == java21* ]]; then
  DOCKERFILE="$SPRING_APP_DIR/Dockerfile.java21"
elif [[ "$TAG_PART" == java25* ]]; then
  DOCKERFILE="$SPRING_APP_DIR/Dockerfile.java25"
else
  read -r -p "Dockerfile not inferred from tag. Enter Dockerfile path: " DOCKERFILE
fi

if [[ ! -f "$DOCKERFILE" ]]; then
  echo "Error: Dockerfile not found: $DOCKERFILE"
  exit 1
fi

if [[ -z "${ECS_SG_ID:-}" || -z "${TG_ARN:-}" || -z "${ALB_ARN:-}" ]]; then
  echo "Error: Missing ECS/ALB values. Run setup first or ensure aws-env-vars.sh exists."
  exit 1
fi

DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$DB_INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query "DBInstances[0].Endpoint.Address" \
  --output text)

if [[ -z "$DB_ENDPOINT" || "$DB_ENDPOINT" == "None" ]]; then
  echo "Error: Unable to resolve DB endpoint for $DB_INSTANCE_ID"
  exit 1
fi

ECS_TASK_EXEC_ROLE_ARN=$(aws iam get-role \
  --role-name "$ECS_TASK_EXEC_ROLE_NAME" \
  --query "Role.Arn" \
  --output text)

if [[ -z "$ECS_TASK_EXEC_ROLE_ARN" || "$ECS_TASK_EXEC_ROLE_ARN" == "None" ]]; then
  echo "Error: Unable to resolve task role ARN for $ECS_TASK_EXEC_ROLE_NAME"
  exit 1
fi

ECR_REGISTRY="${APP_IMAGE%%/*}"

echo "Using image: $APP_IMAGE"
echo "Dockerfile: $DOCKERFILE"

read -r -p "Proceed to rebuild/push and redeploy this image? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo "Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "Rebuilding image..."
cd "$SPRING_APP_DIR"
docker build -f "$DOCKERFILE" -t "$APP_IMAGE" .

echo "Pushing image..."
docker push "$APP_IMAGE"

SERVICE_EXISTS=$(aws ecs describe-services \
  --cluster "$ECS_CLUSTER_NAME" \
  --services "$ECS_SERVICE_NAME" \
  --region "$AWS_REGION" \
  --query 'services[0].status' \
  --output text 2>/dev/null || echo "")

if [[ "$SERVICE_EXISTS" != "INACTIVE" && -n "$SERVICE_EXISTS" && "$SERVICE_EXISTS" != "None" ]]; then
  echo "Deleting existing service: $ECS_SERVICE_NAME"
  aws ecs delete-service \
    --cluster "$ECS_CLUSTER_NAME" \
    --service "$ECS_SERVICE_NAME" \
    --force \
    --region "$AWS_REGION"

  aws ecs wait services-inactive \
    --cluster "$ECS_CLUSTER_NAME" \
    --services "$ECS_SERVICE_NAME" \
    --region "$AWS_REGION"
fi

echo "Registering new task definition..."
cat > /tmp/task-def.json <<EOF
{
  "family": "java-bench-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "2048",
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
        },
        {
          "name": "JAVA_TOOL_OPTIONS",
          "value": "$JAVA_TOOL_OPTIONS"
        },
        {
          "name": "APP_IMAGE",
          "value": "$APP_IMAGE"
        },
        {
          "name": "METRICS_CLOUDWATCH_ENABLED",
          "value": "true"
        },
        {
          "name": "METRICS_CLOUDWATCH_NAMESPACE",
          "value": "JavaBenchmark"
        },
        {
          "name": "METRICS_CLOUDWATCH_STEP",
          "value": "1m"
        },
        {
          "name": "AWS_REGION",
          "value": "$AWS_REGION"
        }
      ],
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8080/actuator/health || exit 1"
        ],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 120
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
  --region "$AWS_REGION"

# Resolve subnet IDs (reuse VPC subnets for Fargate)
VPC_ID=${VPC_ID:-}
if [[ -z "$VPC_ID" ]]; then
  VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=isDefault,Values=true" \
    --region "$AWS_REGION" \
    --query "Vpcs[0].VpcId" \
    --output text)
fi

SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --region "$AWS_REGION" \
  --query "Subnets[*].SubnetId" \
  --output text)

SUBNET_1=$(echo "$SUBNET_IDS" | awk '{print $1}')
SUBNET_2=$(echo "$SUBNET_IDS" | awk '{print $2}')
SUBNET_3=$(echo "$SUBNET_IDS" | awk '{print $3}')

cat > /tmp/create-service.json <<EOF
{
  "cluster": "$ECS_CLUSTER_NAME",
  "serviceName": "$ECS_SERVICE_NAME",
  "taskDefinition": "java-bench-task",
  "desiredCount": $DESIRED_COUNT,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["$SUBNET_1", "$SUBNET_2"$([ -n "$SUBNET_3" ] && echo ", \"$SUBNET_3\"")],
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

echo "Creating ECS service..."
aws ecs create-service \
  --cli-input-json file:///tmp/create-service.json \
  --region "$AWS_REGION"

echo "Waiting for service to stabilize..."
aws ecs wait services-stable \
  --cluster "$ECS_CLUSTER_NAME" \
  --services "$ECS_SERVICE_NAME" \
  --region "$AWS_REGION"

echo "Refresh complete."
