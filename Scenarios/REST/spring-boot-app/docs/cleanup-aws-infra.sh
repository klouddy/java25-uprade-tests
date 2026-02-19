#!/bin/bash
set -e

# AWS Infrastructure Cleanup Script
# This script tears down all resources created by setup-aws-infra.sh

echo "=========================================="
echo "AWS Infrastructure Cleanup Script"
echo "=========================================="
echo ""

# Load environment variables if available
if [ -f aws-env-vars.sh ]; then
    echo "Loading saved environment variables..."
    source aws-env-vars.sh
else
    echo "Warning: aws-env-vars.sh not found. Please set environment variables manually."
    echo ""
    echo "Required variables:"
    echo "  AWS_REGION"
    echo "  ECS_CLUSTER_NAME"
    echo "  DB_INSTANCE_ID"
    echo "  ALB_ARN"
    echo "  TG_ARN"
    echo "  RDS_SG_ID"
    echo "  ECS_SG_ID"
    echo "  ALB_SG_ID"
    echo "  ECS_TASK_EXEC_ROLE_NAME"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

AWS_REGION=${AWS_REGION:-us-east-1}

echo "Region: $AWS_REGION"
echo ""
echo "This will delete:"
echo "  - ECS Service and Cluster"
echo "  - Application Load Balancer"
echo "  - RDS Instance"
echo "  - Security Groups"
echo "  - IAM Role"
echo ""
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled"
    exit 1
fi

echo ""

# ==========================================
# 1. DELETE ECS SERVICE
# ==========================================

echo "Step 1: Deleting ECS service..."

aws ecs update-service \
  --cluster $ECS_CLUSTER_NAME \
  --service java-bench-service \
  --desired-count 0 \
  --region $AWS_REGION 2>/dev/null || echo "Service not found or already scaled down"

aws ecs delete-service \
  --cluster $ECS_CLUSTER_NAME \
  --service java-bench-service \
  --force \
  --region $AWS_REGION 2>/dev/null || echo "Service not found or already deleted"

echo "ECS service deleted"
echo ""

# ==========================================
# 2. DELETE ECS CLUSTER
# ==========================================

echo "Step 2: Deleting ECS cluster..."

aws ecs delete-cluster \
  --cluster $ECS_CLUSTER_NAME \
  --region $AWS_REGION 2>/dev/null || echo "Cluster not found or already deleted"

echo "ECS cluster deleted"
echo ""

# ==========================================
# 3. DELETE ALB AND TARGET GROUP
# ==========================================

echo "Step 3: Deleting ALB and target group..."

aws elbv2 delete-load-balancer \
  --load-balancer-arn $ALB_ARN \
  --region $AWS_REGION 2>/dev/null || echo "ALB not found or already deleted"

echo "Waiting for ALB to be deleted..."
sleep 30

aws elbv2 delete-target-group \
  --target-group-arn $TG_ARN \
  --region $AWS_REGION 2>/dev/null || echo "Target group not found or already deleted"

echo "ALB and target group deleted"
echo ""

# ==========================================
# 4. DELETE RDS INSTANCE
# ==========================================

echo "Step 4: Deleting RDS instance..."

aws rds delete-db-instance \
  --db-instance-identifier $DB_INSTANCE_ID \
  --skip-final-snapshot \
  --region $AWS_REGION 2>/dev/null || echo "RDS instance not found or already deleted"

echo "Waiting for RDS instance to be deleted (this takes ~5 minutes)..."

aws rds wait db-instance-deleted \
  --db-instance-identifier $DB_INSTANCE_ID \
  --region $AWS_REGION 2>/dev/null || echo "RDS instance already deleted"

aws rds delete-db-subnet-group \
  --db-subnet-group-name java-bench-db-subnet-group \
  --region $AWS_REGION 2>/dev/null || echo "DB subnet group not found or already deleted"

echo "RDS instance deleted"
echo ""

# ==========================================
# 5. DELETE SECURITY GROUPS
# ==========================================

echo "Step 5: Deleting security groups..."

# Wait a bit for resources to fully detach
echo "Waiting for resources to detach..."
sleep 30

aws ec2 delete-security-group \
  --group-id $RDS_SG_ID \
  --region $AWS_REGION 2>/dev/null || echo "RDS security group not found or already deleted"

aws ec2 delete-security-group \
  --group-id $ECS_SG_ID \
  --region $AWS_REGION 2>/dev/null || echo "ECS security group not found or already deleted"

aws ec2 delete-security-group \
  --group-id $ALB_SG_ID \
  --region $AWS_REGION 2>/dev/null || echo "ALB security group not found or already deleted"

echo "Security groups deleted"
echo ""

# ==========================================
# 6. DELETE IAM ROLE
# ==========================================

echo "Step 6: Deleting IAM role..."

aws iam detach-role-policy \
  --role-name $ECS_TASK_EXEC_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
  2>/dev/null || echo "Policy already detached"

aws iam detach-role-policy \
  --role-name $ECS_TASK_EXEC_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess \
  2>/dev/null || echo "Policy already detached"

aws iam delete-role \
  --role-name $ECS_TASK_EXEC_ROLE_NAME \
  2>/dev/null || echo "IAM role not found or already deleted"

echo "IAM role deleted"
echo ""

# Clean up temporary files
rm -f /tmp/task-def.json /tmp/create-service.json /tmp/ecsTaskExecutionRoleTrust.json

echo "=========================================="
echo "Cleanup Complete!"
echo "=========================================="
echo ""
echo "All resources have been deleted."
echo ""
