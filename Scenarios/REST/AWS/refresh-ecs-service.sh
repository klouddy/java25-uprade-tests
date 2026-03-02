#!/bin/bash
set -euo pipefail

# Redeploy java-bench-service with a new image (APP_IMAGE).
# Assumes the image has already been built and pushed.

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

if [[ -f "$SCRIPT_DIR/aws-env-vars.sh" ]]; then
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/aws-env-vars.sh"
fi

export AWS_REGION=${AWS_REGION:-us-east-1}
export ECS_CLUSTER_NAME=${ECS_CLUSTER_NAME:-java-bench-cluster}
export ECS_SERVICE_NAME=${ECS_SERVICE_NAME:-java-bench-service}

if [[ -z "${APP_IMAGE:-}" ]]; then
  echo "Error: APP_IMAGE is required (ECR image URI)."
  echo "Example: export APP_IMAGE=123456789.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java25-rest-20260225-01"
  exit 1
fi

echo "=========================================="
echo "Redeploying ECS Service with New Image"
echo "=========================================="
echo "Cluster: $ECS_CLUSTER_NAME"
echo "Service: $ECS_SERVICE_NAME"
echo "Region: $AWS_REGION"
echo "New Image: $APP_IMAGE"
echo ""

echo "Step 1: Checking current service status..."
SERVICE_STATUS=$(aws ecs describe-services \
  --cluster "$ECS_CLUSTER_NAME" \
  --services "$ECS_SERVICE_NAME" \
  --region "$AWS_REGION" \
  --query 'services[0].status' \
  --output text 2>/dev/null || echo "")

if [[ -z "$SERVICE_STATUS" || "$SERVICE_STATUS" == "None" || "$SERVICE_STATUS" == "INACTIVE" ]]; then
  echo "Service not found or inactive. Will discover infrastructure from existing resources."
  SERVICE_EXISTS=false
else
  echo "✓ Service is $SERVICE_STATUS"
  SERVICE_EXISTS=true
fi
echo ""

echo "Step 2: Fetching configuration..."

if [[ "$SERVICE_EXISTS" == "true" ]]; then
  echo "  Cloning from existing service..."
  TASK_DEF_ARN=$(aws ecs describe-services \
    --cluster "$ECS_CLUSTER_NAME" \
    --services "$ECS_SERVICE_NAME" \
    --region "$AWS_REGION" \
    --query 'services[0].taskDefinition' \
    --output text)

  export DESIRED_COUNT=$(aws ecs describe-services \
    --cluster "$ECS_CLUSTER_NAME" \
    --services "$ECS_SERVICE_NAME" \
    --region "$AWS_REGION" \
    --query 'services[0].desiredCount' \
    --output text)

  export LAUNCH_TYPE=$(aws ecs describe-services \
    --cluster "$ECS_CLUSTER_NAME" \
    --services "$ECS_SERVICE_NAME" \
    --region "$AWS_REGION" \
    --query 'services[0].launchType' \
    --output text)

  aws ecs describe-services \
    --cluster "$ECS_CLUSTER_NAME" \
    --services "$ECS_SERVICE_NAME" \
    --region "$AWS_REGION" \
    --query 'services[0].networkConfiguration' \
    --output json > /tmp/java-bench-network.json

  aws ecs describe-services \
    --cluster "$ECS_CLUSTER_NAME" \
    --services "$ECS_SERVICE_NAME" \
    --region "$AWS_REGION" \
    --query 'services[0].loadBalancers' \
    --output json > /tmp/java-bench-loadbalancers.json

  aws ecs describe-task-definition \
    --task-definition "$TASK_DEF_ARN" \
    --region "$AWS_REGION" \
    --output json > /tmp/java-bench-task-def-source.json

  echo "  ✓ Fetched task definition: $TASK_DEF_ARN"
  echo "  ✓ Desired count: $DESIRED_COUNT, Launch type: $LAUNCH_TYPE"
else
  echo "  Discovering infrastructure..."

  # Get VPC
  VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=isDefault,Values=true" \
    --region "$AWS_REGION" \
    --query "Vpcs[0].VpcId" \
    --output text)

  if [[ -z "$VPC_ID" || "$VPC_ID" == "None" ]]; then
    echo "Error: Could not find default VPC"
    exit 1
  fi

  # Get subnets
  SUBNET_IDS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --region "$AWS_REGION" \
    --query "Subnets[].SubnetId" \
    --output json)

  # Get ECS security group
  ECS_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=java-bench-ecs-sg" "Name=vpc-id,Values=$VPC_ID" \
    --region "$AWS_REGION" \
    --query "SecurityGroups[0].GroupId" \
    --output text)

  if [[ -z "$ECS_SG_ID" || "$ECS_SG_ID" == "None" ]]; then
    echo "Error: Could not find security group 'java-bench-ecs-sg'"
    exit 1
  fi

  # Get target group ARN
  TG_ARN=$(aws elbv2 describe-target-groups \
    --names java-bench-tg \
    --region "$AWS_REGION" \
    --query "TargetGroups[0].TargetGroupArn" \
    --output text 2>/dev/null || echo "")

  if [[ -z "$TG_ARN" || "$TG_ARN" == "None" ]]; then
    echo "Error: Could not find target group 'java-bench-tg'"
    exit 1
  fi

  # Build network configuration
  cat > /tmp/java-bench-network.json <<EOF
{
  "awsvpcConfiguration": {
    "subnets": $SUBNET_IDS,
    "securityGroups": ["$ECS_SG_ID"],
    "assignPublicIp": "ENABLED"
  }
}
EOF

  # Build load balancer configuration
  cat > /tmp/java-bench-loadbalancers.json <<EOF
[
  {
    "targetGroupArn": "$TG_ARN",
    "containerName": "java-bench-app",
    "containerPort": 8080
  }
]
EOF

  # Find most recent task definition or use family name
  TASK_DEF_ARN=$(aws ecs describe-task-definition \
    --task-definition java-bench-task \
    --region "$AWS_REGION" \
    --query "taskDefinition.taskDefinitionArn" \
    --output text 2>/dev/null || echo "")

  if [[ -z "$TASK_DEF_ARN" || "$TASK_DEF_ARN" == "None" ]]; then
    echo "Error: Could not find task definition 'java-bench-task'"
    exit 1
  fi

  aws ecs describe-task-definition \
    --task-definition "$TASK_DEF_ARN" \
    --region "$AWS_REGION" \
    --output json > /tmp/java-bench-task-def-source.json

  export DESIRED_COUNT=2
  export LAUNCH_TYPE="FARGATE"

  echo "  ✓ VPC: $VPC_ID"
  echo "  ✓ Security group: $ECS_SG_ID"
  echo "  ✓ Target group: $TG_ARN"
  echo "  ✓ Task definition: $TASK_DEF_ARN"
  echo "  ✓ Desired count: $DESIRED_COUNT, Launch type: $LAUNCH_TYPE"
fi
echo ""

python3 - <<'PY'
import json
import os

app_img = os.environ['APP_IMAGE']

with open('/tmp/java-bench-task-def-source.json', 'r') as f:
  src = json.load(f)['taskDefinition']

for container in src.get('containerDefinitions', []):
  container['image'] = app_img

allowed_keys = [
  'family',
  'taskRoleArn',
  'executionRoleArn',
  'networkMode',
  'containerDefinitions',
  'volumes',
  'placementConstraints',
  'requiresCompatibilities',
  'cpu',
  'memory',
  'ipcMode',
  'pidMode',
  'proxyConfiguration',
  'inferenceAccelerators',
  'ephemeralStorage',
  'runtimePlatform'
]

out = {k: src[k] for k in allowed_keys if k in src}

with open('/tmp/java-bench-task-def.json', 'w') as f:
  json.dump(out, f, indent=2)
PY

echo "Step 3: Registering new task definition with updated image..."
export NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
  --cli-input-json file:///tmp/java-bench-task-def.json \
  --region "$AWS_REGION" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

echo "✓ Registered: $NEW_TASK_DEF_ARN"
echo ""

if [[ "$SERVICE_EXISTS" == "true" ]]; then
  echo "Step 4: Deleting existing service..."
  aws ecs delete-service \
    --cluster "$ECS_CLUSTER_NAME" \
    --service "$ECS_SERVICE_NAME" \
    --force \
    --region "$AWS_REGION"

  echo "✓ Service deleted, waiting for service to become inactive..."
  aws ecs wait services-inactive \
    --cluster "$ECS_CLUSTER_NAME" \
    --services "$ECS_SERVICE_NAME" \
    --region "$AWS_REGION"

  echo "✓ Service is now inactive"
  echo ""
  STEP_NUM=5
else
  echo "Step 4: Skipping service deletion (no existing service)"
  echo ""
  STEP_NUM=4
fi

python3 - <<'PY'
import json
import os

cluster = os.environ['ECS_CLUSTER_NAME']
service = os.environ['ECS_SERVICE_NAME']
launch_type = os.environ.get('LAUNCH_TYPE') or 'FARGATE'

desired = int(os.environ.get('DESIRED_COUNT') or 2)
new_task_def = os.environ['NEW_TASK_DEF_ARN']

with open('/tmp/java-bench-network.json', 'r') as f:
  network = json.load(f)
with open('/tmp/java-bench-loadbalancers.json', 'r') as f:
  load_balancers = json.load(f)

payload = {
  'cluster': cluster,
  'serviceName': service,
  'taskDefinition': new_task_def,
  'desiredCount': desired,
  'launchType': launch_type,
  'networkConfiguration': network,
  'loadBalancers': load_balancers
}

with open('/tmp/java-bench-create-service.json', 'w') as f:
  json.dump(payload, f, indent=2)
PY

echo "Step $STEP_NUM: Creating new ECS service with updated task definition..."
aws ecs create-service \
  --cli-input-json file:///tmp/java-bench-create-service.json \
  --region "$AWS_REGION" > /dev/null

echo "✓ Service created"
echo ""

STEP_NUM=$((STEP_NUM + 1))
echo "Step $STEP_NUM: Waiting for service to stabilize (this may take 2-3 minutes)..."
aws ecs wait services-stable \
  --cluster "$ECS_CLUSTER_NAME" \
  --services "$ECS_SERVICE_NAME" \
  --region "$AWS_REGION"

echo ""
echo "========================================"
echo "✓ Service redeployment complete!"
echo "========================================"

echo "Refresh complete. Service is running image: $APP_IMAGE"
