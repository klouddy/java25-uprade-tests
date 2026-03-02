#!/bin/bash
set -euo pipefail

# Deploy a Prometheus ECS service that scrapes the app through the ALB.

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROM_DIR="$SCRIPT_DIR/prometheus"

if [[ -f "$SCRIPT_DIR/aws-env-vars.sh" ]]; then
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/aws-env-vars.sh"
fi

export AWS_REGION=${AWS_REGION:-us-east-1}
export ECS_CLUSTER_NAME=${ECS_CLUSTER_NAME:-java-bench-cluster}
export ECS_PROM_SERVICE_NAME=${ECS_PROM_SERVICE_NAME:-java-bench-prometheus}
export ECS_TASK_EXEC_ROLE_NAME=${ECS_TASK_EXEC_ROLE_NAME:-java-bench-ecs-execution-role}
export PROM_IMAGE=${PROM_IMAGE:-prom/prometheus:latest}
export PROM_RETENTION=${PROM_RETENTION:-7d}
export PROM_RULE_PRIORITY=${PROM_RULE_PRIORITY:-}

if [[ -z "${ALB_DNS:-}" || -z "${ALB_ARN:-}" || -z "${ECS_SG_ID:-}" || -z "${ALB_SG_ID:-}" ]]; then
  echo "Error: Missing ALB/ECS values. Run setup-aws-infra.sh first or source aws-env-vars.sh."
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

echo "Using Prometheus image: $PROM_IMAGE"
echo "Scraping from: http://$ALB_DNS/actuator/prometheus"
echo ""

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

aws ec2 authorize-security-group-ingress \
  --group-id "$ECS_SG_ID" \
  --protocol tcp \
  --port 9090 \
  --source-group "$ALB_SG_ID" 2>/dev/null || true

PROM_TG_ARN=$(aws elbv2 create-target-group \
  --name java-bench-prometheus-tg \
  --protocol HTTP \
  --port 9090 \
  --target-type ip \
  --vpc-id "$VPC_ID" \
  --health-check-path "/prometheus/-/healthy" \
  --region "$AWS_REGION" \
  --query "TargetGroups[0].TargetGroupArn" \
  --output text 2>/dev/null || true)

if [[ -z "$PROM_TG_ARN" || "$PROM_TG_ARN" == "None" ]]; then
  PROM_TG_ARN=$(aws elbv2 describe-target-groups \
    --names java-bench-prometheus-tg \
    --region "$AWS_REGION" \
    --query "TargetGroups[0].TargetGroupArn" \
    --output text)
fi

LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn "$ALB_ARN" \
  --region "$AWS_REGION" \
  --query "Listeners[?Port==\`80\`].ListenerArn" \
  --output text)

if [[ -z "$PROM_RULE_PRIORITY" ]]; then
  PRIORITIES=$(aws elbv2 describe-rules \
    --listener-arn "$LISTENER_ARN" \
    --region "$AWS_REGION" \
    --query 'Rules[?Priority!=`default`].Priority' \
    --output text)
  if [[ -z "$PRIORITIES" ]]; then
    PROM_RULE_PRIORITY=100
  else
    PROM_RULE_PRIORITY=$(echo "$PRIORITIES" | tr '\t' '\n' | sort -n | tail -1)
    PROM_RULE_PRIORITY=$((PROM_RULE_PRIORITY + 1))
  fi
fi

aws elbv2 create-rule \
  --listener-arn "$LISTENER_ARN" \
  --priority "$PROM_RULE_PRIORITY" \
  --conditions Field=path-pattern,Values="/prometheus*" \
  --actions Type=forward,TargetGroupArn="$PROM_TG_ARN" \
  --region "$AWS_REGION" 2>/dev/null || true

echo "Registering Prometheus task definition..."
cat > /tmp/prometheus-task-def.json <<EOF
{
  "family": "java-bench-prometheus",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "$ECS_TASK_EXEC_ROLE_ARN",
  "taskRoleArn": "$ECS_TASK_EXEC_ROLE_ARN",
  "containerDefinitions": [
    {
      "name": "prometheus",
      "image": "$PROM_IMAGE",
      "portMappings": [
        {
          "containerPort": 9090,
          "protocol": "tcp"
        }
      ],
      "entryPoint": [
        "/bin/sh",
        "-c"
      ],
      "command": [
        "mkdir -p /etc/prometheus && echo -e 'global:\\n  scrape_interval: 15s\\n  scrape_timeout: 10s\\n  evaluation_interval: 15s\\n\\nscrape_configs:\\n  - job_name: java-bench-service\\n    metrics_path: /actuator/prometheus\\n    scheme: http\\n    static_configs:\\n      - targets: [\"$ALB_DNS\"]' > /etc/prometheus/prometheus.yml && prometheus --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.retention.time=$PROM_RETENTION --web.route-prefix=/prometheus --web.external-url=http://$ALB_DNS/prometheus"
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/java-bench-prometheus",
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
  --cli-input-json file:///tmp/prometheus-task-def.json \
  --region "$AWS_REGION"

SERVICE_EXISTS=$(aws ecs describe-services \
  --cluster "$ECS_CLUSTER_NAME" \
  --services "$ECS_PROM_SERVICE_NAME" \
  --region "$AWS_REGION" \
  --query 'services[0].status' \
  --output text 2>/dev/null || echo "")

if [[ "$SERVICE_EXISTS" == "ACTIVE" ]]; then
  echo "Service exists, updating with new task definition..."
  aws ecs update-service \
    --cluster "$ECS_CLUSTER_NAME" \
    --service "$ECS_PROM_SERVICE_NAME" \
    --task-definition java-bench-prometheus \
    --force-new-deployment \
    --region "$AWS_REGION"
elif [[ "$SERVICE_EXISTS" == "DRAINING" ]]; then
  echo "Service is draining, waiting for it to become inactive..."
  aws ecs wait services-inactive \
    --cluster "$ECS_CLUSTER_NAME" \
    --services "$ECS_PROM_SERVICE_NAME" \
    --region "$AWS_REGION"
  echo "Creating new Prometheus service..."
  aws ecs create-service \
    --cluster "$ECS_CLUSTER_NAME" \
    --service-name "$ECS_PROM_SERVICE_NAME" \
    --task-definition java-bench-prometheus \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2${SUBNET_3:+,$SUBNET_3}],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$PROM_TG_ARN,containerName=prometheus,containerPort=9090" \
    --region "$AWS_REGION"
else
  echo "Creating new Prometheus service..."
  aws ecs create-service \
    --cluster "$ECS_CLUSTER_NAME" \
    --service-name "$ECS_PROM_SERVICE_NAME" \
    --task-definition java-bench-prometheus \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2${SUBNET_3:+,$SUBNET_3}],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$PROM_TG_ARN,containerName=prometheus,containerPort=9090" \
    --region "$AWS_REGION"
fi

echo "Waiting for Prometheus service to stabilize..."
aws ecs wait services-stable \
  --cluster "$ECS_CLUSTER_NAME" \
  --services "$ECS_PROM_SERVICE_NAME" \
  --region "$AWS_REGION"

echo "Prometheus is available at: http://$ALB_DNS/prometheus"
