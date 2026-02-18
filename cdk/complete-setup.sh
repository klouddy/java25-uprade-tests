#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse command line arguments
JAVA_VERSION=${1:-17}

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  Complete Setup and Deployment${NC}"
echo -e "${BLUE}  Java Version: $JAVA_VERSION${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check prerequisites
echo -e "${GREEN}Checking prerequisites...${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  echo -e "${RED}Error: AWS CLI not found. Please install it first.${NC}"
  exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Error: Docker not found. Please install it first.${NC}"
  exit 1
fi

# Check CDK CLI
if ! command -v cdk &> /dev/null; then
  echo -e "${RED}Error: CDK CLI not found. Installing...${NC}"
  npm install -g aws-cdk
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
  echo -e "${RED}Error: AWS credentials not configured.${NC}"
  echo "Please run: aws configure"
  exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Step 1: Setup ECR and build images
echo -e "${BLUE}=== Step 1: ECR Setup and Image Build ===${NC}"
echo ""

# Only build the requested Java version to save time
export JAVA_VERSIONS=$JAVA_VERSION
./setup-ecr-and-images.sh

echo ""

# Step 2: Deploy infrastructure
echo -e "${BLUE}=== Step 2: Deploy Infrastructure ===${NC}"
echo ""

./deploy.sh $JAVA_VERSION

echo ""

# Step 3: Wait for tasks to become healthy
echo -e "${YELLOW}Waiting 2 minutes for ECS tasks to become healthy...${NC}"
sleep 120

echo ""

# Step 4: Verify deployment
echo -e "${BLUE}=== Step 3: Verify Deployment ===${NC}"
echo ""

./verify-deployment.sh

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Load outputs
source .env.deployment

echo "Your benchmark environment is ready!"
echo ""
echo "Application URL: $ALB_URL"
echo ""
echo "Quick test commands:"
echo "  curl $ALB_URL/actuator/health"
echo "  curl $ALB_URL/actuator/metrics"
echo ""
echo "When done testing, destroy infrastructure with:"
echo "  ./destroy.sh"
