#!/bin/bash

# AWS Infrastructure Cleanup Script
# Automatically discovers and removes all benchmark resources by name
# No need to save environment variables

echo "=========================================="
echo "AWS Infrastructure Cleanup Script"
echo "=========================================="
echo ""

export AWS_REGION=${AWS_REGION:-us-east-1}
export AWS_PAGER=""
export AWS_CLI_AUTO_PROMPT=off

echo "Region: $AWS_REGION"
echo ""
echo "This will automatically find and delete:"
echo "  - ECS Service (java-bench-service)"
echo "  - ECS Cluster (java-bench-cluster)"
echo "  - Application Load Balancer (java-bench-alb)"
echo "  - Target Group (java-bench-tg)"
echo "  - Task Definitions (java-bench-task)"
echo "  - RDS Instance (java-bench-db)"
echo "  - RDS Parameter Group (java-bench-pg)"
echo "  - RDS DB Subnet Group (java-bench-db-subnet-group)"
echo "  - IAM Role (java-bench-ecs-execution-role)"
echo ""

read -p "Are you sure you want to continue? (yes/no): " confirmation
if [[ "$confirmation" != "yes" ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Starting cleanup..."
echo ""

# ==========================================
# 1. DELETE ECS SERVICE
# ==========================================

echo "Step 1: Deleting ECS service..."

ECS_CLUSTER="java-bench-cluster"
ECS_SERVICE="java-bench-service"

# Check if cluster exists
if aws ecs describe-clusters --clusters $ECS_CLUSTER --region $AWS_REGION &>/dev/null; then
    aws ecs delete-service \
      --cluster $ECS_CLUSTER \
      --service $ECS_SERVICE \
      --force \
      --region $AWS_REGION 2>/dev/null || echo "  (Service not found)"
    echo "  ✓ ECS service deleted"
else
    echo "  (ECS cluster not found)"
fi

echo ""

# ==========================================
# 2. DELETE ALB & LISTENER & TARGET GROUP  
# ==========================================

echo "Step 2: Deleting ALB, listener, and target group..."

# Find ALB by name
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --region $AWS_REGION \
  --query "LoadBalancers[?LoadBalancerName=='java-bench-alb'].LoadBalancerArn" \
  --output text 2>/dev/null || echo "")

if [[ ! -z "$ALB_ARN" && "$ALB_ARN" != "None" ]]; then
    # Delete listeners first
    LISTENER_ARNS=$(aws elbv2 describe-listeners \
      --load-balancer-arn $ALB_ARN \
      --region $AWS_REGION \
      --query "Listeners[*].ListenerArn" \
      --output text 2>/dev/null || echo "")
    
    for listener_arn in $LISTENER_ARNS; do
        aws elbv2 delete-listener \
          --listener-arn $listener_arn \
          --region $AWS_REGION 2>/dev/null || true
    done
    
    # Delete ALB
    aws elbv2 delete-load-balancer \
      --load-balancer-arn $ALB_ARN \
      --region $AWS_REGION 2>/dev/null || true
    
    echo "  ✓ ALB and listeners deleted"
    sleep 10  # Wait for ALB to fully delete
fi

# Delete target group
TG_ARN=$(aws elbv2 describe-target-groups \
  --region $AWS_REGION \
  --names java-bench-tg \
  --query "TargetGroups[0].TargetGroupArn" \
  --output text 2>/dev/null || echo "")

if [[ ! -z "$TG_ARN" && "$TG_ARN" != "None" ]]; then
    aws elbv2 delete-target-group \
      --target-group-arn $TG_ARN \
      --region $AWS_REGION 2>/dev/null || true
    echo "  ✓ Target group deleted"
fi

echo ""

# ==========================================
# 3. DEREGISTER TASK DEFINITIONS
# ==========================================

echo "Step 3: Deregistering task definitions..."

TASK_DEF_ARNS=$(aws ecs list-task-definitions \
  --family-prefix java-bench-task \
  --region $AWS_REGION \
  --query "taskDefinitionArns[*]" \
  --output text 2>/dev/null || echo "")

if [[ ! -z "$TASK_DEF_ARNS" ]]; then
    for task_def in $TASK_DEF_ARNS; do
        aws ecs deregister-task-definition \
          --task-definition $task_def \
          --region $AWS_REGION 2>/dev/null || true
    done
    echo "  ✓ Task definitions deregistered"
else
    echo "  (No task definitions found)"
fi

echo ""

# ==========================================
# 4. DELETE ECS CLUSTER
# ==========================================

echo "Step 4: Deleting ECS cluster..."

aws ecs delete-cluster \
  --cluster $ECS_CLUSTER \
  --region $AWS_REGION 2>/dev/null || echo "  (Cluster not found or already deleted)"

echo "  ✓ ECS cluster deleted"
echo ""

# ==========================================
# 5. DELETE RDS INSTANCE & RELATED RESOURCES
# ==========================================

echo "Step 5: Deleting RDS instance (5-10 minutes)..."

DB_INSTANCE_ID="java-bench-db"

# Delete instance
aws rds delete-db-instance \
  --db-instance-identifier $DB_INSTANCE_ID \
  --skip-final-snapshot \
  --region $AWS_REGION 2>/dev/null || echo "  (RDS instance not found)"

# Wait for deletion
echo "  Waiting for RDS to be deleted..."
aws rds wait db-instance-deleted \
  --db-instance-identifier $DB_INSTANCE_ID \
  --region $AWS_REGION 2>/dev/null || echo "  (Already deleted)"

echo "  ✓ RDS instance deleted"

echo ""

echo "Step 5.1: Deleting RDS parameter group..."

aws rds delete-db-parameter-group \
  --db-parameter-group-name java-bench-pg \
  --region $AWS_REGION 2>/dev/null || echo "  (Parameter group not found)"

echo "  ✓ Parameter group deleted"

echo ""

echo "Step 5.2: Deleting RDS DB subnet group..."

aws rds delete-db-subnet-group \
  --db-subnet-group-name java-bench-db-subnet-group \
  --region $AWS_REGION 2>/dev/null || echo "  (Subnet group not found)"

echo "  ✓ DB subnet group deleted"
echo ""

# ==========================================
# 6. DELETE IAM ROLE
# ==========================================

echo "Step 6: Deleting IAM role..."

ROLE_NAME="java-bench-ecs-execution-role"

# Detach all policies
aws iam detach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy 2>/dev/null || true

aws iam detach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess 2>/dev/null || true

# Delete role
aws iam delete-role \
  --role-name $ROLE_NAME 2>/dev/null || echo "  (IAM role not found)"

echo "  ✓ IAM role deleted"

# ==========================================
# 8. CLEAN UP TEMP FILES
# ==========================================

echo ""
echo "Cleaning up temporary files..."

rm -f /tmp/task-def.json /tmp/create-service.json /tmp/ecsTaskExecutionRoleTrust.json

echo "  ✓ Temp files cleaned"

# ==========================================
# SUMMARY
# ==========================================

echo ""
echo "=========================================="
echo "Cleanup Complete!"
echo "=========================================="
echo ""
echo "All benchmark infrastructure has been removed."
echo "You can now run ./setup-aws-infra.sh to rebuild from scratch."
echo ""
