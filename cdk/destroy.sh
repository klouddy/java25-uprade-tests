#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== CDK Infrastructure Destroy Script ===${NC}"
echo ""

# Get AWS region
export AWS_REGION=${AWS_REGION:-us-east-1}

# Check if stack exists
echo -e "${GREEN}Checking if stack exists...${NC}"
if ! aws cloudformation describe-stacks --stack-name BenchmarkInfraStack --region $AWS_REGION 2>/dev/null > /dev/null; then
  echo -e "${YELLOW}Stack 'BenchmarkInfraStack' not found. Nothing to destroy.${NC}"
  exit 0
fi

# Show stack info
STACK_STATUS=$(aws cloudformation describe-stacks \
  --stack-name BenchmarkInfraStack \
  --region $AWS_REGION \
  --query 'Stacks[0].StackStatus' \
  --output text)

echo "Stack Status: $STACK_STATUS"
echo ""

# Confirm destruction
echo -e "${YELLOW}⚠️  WARNING: This will destroy all resources in the stack!${NC}"
echo "  - ECS Cluster and all running tasks"
echo "  - Application Load Balancer"
echo "  - RDS Database (all data will be lost)"
echo "  - VPC and all networking resources"
echo "  - Secrets in Secrets Manager"
echo ""

read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${BLUE}Destroy cancelled.${NC}"
  exit 0
fi

echo ""
echo -e "${GREEN}Destroying infrastructure...${NC}"
echo "This may take 5-10 minutes..."
echo ""

# Destroy the stack
cdk destroy --force

echo ""
echo -e "${GREEN}=== Destroy Complete! ===${NC}"
echo ""

# Clean up local files
if [ -f .env.deployment ]; then
  echo "Cleaning up local environment files..."
  rm -f .env.deployment
fi

echo "All resources have been removed."
echo ""
echo "To redeploy, run: ./deploy.sh <java-version>"
