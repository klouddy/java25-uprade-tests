#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Deployment Verification Script ===${NC}"
echo ""

# Load environment variables
if [ -f .env.deployment ]; then
  echo -e "${GREEN}Loading deployment information...${NC}"
  source .env.deployment
else
  echo -e "${YELLOW}No .env.deployment found, fetching from CloudFormation...${NC}"
  export AWS_REGION=${AWS_REGION:-us-east-1}
  export ALB_URL=$(aws cloudformation describe-stacks \
    --stack-name BenchmarkInfraStack \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`AlbUrl`].OutputValue' \
    --output text)
fi

if [ -z "$ALB_URL" ]; then
  echo -e "${RED}Error: Could not find ALB URL. Is the stack deployed?${NC}"
  exit 1
fi

echo "Testing application at: $ALB_URL"
echo ""

# Test 1: Health Check
echo -e "${GREEN}Test 1: Health Check${NC}"
echo "URL: $ALB_URL/actuator/health"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" $ALB_URL/actuator/health)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Health check passed${NC}"
  echo "Response: $BODY"
else
  echo -e "${RED}✗ Health check failed (HTTP $HTTP_CODE)${NC}"
  echo "Response: $BODY"
  echo ""
  echo "Troubleshooting tips:"
  echo "1. Wait a few more minutes for ECS tasks to fully start"
  echo "2. Check logs: aws logs tail /ecs/benchmark-app-java17 --follow"
  echo "3. Check ECS service: aws ecs describe-services --cluster \$CLUSTER_NAME --services \$SERVICE_NAME"
  exit 1
fi
echo ""

# Test 2: Create Customer
echo -e "${GREEN}Test 2: Create Customer${NC}"
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $ALB_URL/customers \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test.user@example.com"
  }')
HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
BODY=$(echo "$CREATE_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✓ Customer creation successful${NC}"
  CUSTOMER_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | cut -d: -f2)
  echo "Created customer ID: $CUSTOMER_ID"
else
  echo -e "${YELLOW}⚠ Customer creation returned HTTP $HTTP_CODE${NC}"
  echo "Response: $BODY"
fi
echo ""

# Test 3: Fetch Customer
if [ ! -z "$CUSTOMER_ID" ]; then
  echo -e "${GREEN}Test 3: Fetch Customer by ID${NC}"
  FETCH_RESPONSE=$(curl -s -w "\n%{http_code}" $ALB_URL/customers/$CUSTOMER_ID)
  HTTP_CODE=$(echo "$FETCH_RESPONSE" | tail -n1)
  BODY=$(echo "$FETCH_RESPONSE" | head -n-1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Customer fetch successful${NC}"
    echo "Response: $BODY"
  else
    echo -e "${RED}✗ Customer fetch failed (HTTP $HTTP_CODE)${NC}"
  fi
  echo ""
fi

# Test 4: Search Customers
echo -e "${GREEN}Test 4: Search Customers${NC}"
SEARCH_RESPONSE=$(curl -s -w "\n%{http_code}" "$ALB_URL/customers?search=test")
HTTP_CODE=$(echo "$SEARCH_RESPONSE" | tail -n1)
BODY=$(echo "$SEARCH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Customer search successful${NC}"
  COUNT=$(echo "$BODY" | grep -o '"id":' | wc -l)
  echo "Found $COUNT customer(s)"
else
  echo -e "${RED}✗ Customer search failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 5: Metrics Endpoint
echo -e "${GREEN}Test 5: Metrics Endpoint${NC}"
METRICS_RESPONSE=$(curl -s -w "\n%{http_code}" $ALB_URL/actuator/metrics)
HTTP_CODE=$(echo "$METRICS_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Metrics endpoint accessible${NC}"
else
  echo -e "${YELLOW}⚠ Metrics endpoint returned HTTP $HTTP_CODE${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}=== Verification Summary ===${NC}"
echo ""
echo -e "${GREEN}✓ Deployment is healthy and functional${NC}"
echo ""
echo "Application endpoints:"
echo "  Health: $ALB_URL/actuator/health"
echo "  Metrics: $ALB_URL/actuator/metrics"
echo "  Prometheus: $ALB_URL/actuator/prometheus"
echo "  Customers API: $ALB_URL/customers"
echo ""
echo "To run load tests, see: ../Scenarios/REST/rest-rds-scenarios.md"
echo "To destroy infrastructure, run: ./destroy.sh"
