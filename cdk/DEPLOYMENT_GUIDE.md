# CDK Infrastructure Deployment Guide

This guide walks you through deploying the benchmark infrastructure for Java 17, 21, and 25 performance testing.

## Prerequisites

Before you begin, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Node.js 18+** and npm installed
4. **Docker** installed (for building application images)
5. **CDK CLI** installed globally: `npm install -g aws-cdk`

## Step 1: Configure AWS Credentials

```bash
# Configure AWS credentials
aws configure

# Verify credentials
aws sts get-caller-identity
```

## Step 2: Build and Push Application Images to ECR

### Create ECR Repository

```bash
# Set variables
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1

# Create repository
aws ecr create-repository \
  --repository-name benchmark-app \
  --region $AWS_REGION
```

### Build and Push Images

```bash
# Authenticate to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Set ECR repository URL
export ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/benchmark-app"

# Build and push Java 17 image
cd spring-boot-app
docker build -f Dockerfile.java17 -t benchmark-app:java17 .
docker tag benchmark-app:java17 $ECR_REPO:java17
docker push $ECR_REPO:java17

# Build and push Java 21 image
docker build -f Dockerfile.java21 -t benchmark-app:java21 .
docker tag benchmark-app:java21 $ECR_REPO:java21
docker push $ECR_REPO:java21

# Build and push Java 25 image
docker build -f Dockerfile.java25 -t benchmark-app:java25 .
docker tag benchmark-app:java25 $ECR_REPO:java25
docker push $ECR_REPO:java25

cd ..
```

## Step 3: Bootstrap CDK (First Time Only)

```bash
cd cdk

# Install dependencies
npm install

# Bootstrap CDK in your account/region
cdk bootstrap aws://${AWS_ACCOUNT_ID}/${AWS_REGION}
```

## Step 4: Deploy Infrastructure

### Option A: Deploy with Java 17 (Default)

```bash
cdk deploy -c containerImage=$ECR_REPO:java17
```

### Option B: Deploy with Java 21

```bash
cdk deploy \
  -c javaVersion=21 \
  -c containerImage=$ECR_REPO:java21
```

### Option C: Deploy with Java 25

```bash
cdk deploy \
  -c javaVersion=25 \
  -c containerImage=$ECR_REPO:java25
```

### Option D: Deploy with Custom Configuration

```bash
cdk deploy \
  -c javaVersion=21 \
  -c containerImage=$ECR_REPO:java21 \
  -c cpu=1024 \
  -c memoryLimitMiB=2048 \
  -c desiredCount=2 \
  -c dbEngine=postgres \
  -c dbInstanceClass=db.t4g.small
```

**Note**: Deployment takes approximately 10-15 minutes. The RDS database provisioning is the longest step.

## Step 5: Verify Deployment

After deployment completes, you'll see outputs including the ALB URL.

### Save the ALB URL

```bash
# Get ALB URL from CloudFormation outputs
export ALB_URL=$(aws cloudformation describe-stacks \
  --stack-name BenchmarkInfraStack \
  --query 'Stacks[0].Outputs[?OutputKey==`AlbUrl`].OutputValue' \
  --output text)

echo "Application URL: $ALB_URL"
```

### Test Health Check

```bash
# Wait for ECS tasks to become healthy (may take 2-3 minutes)
sleep 120

# Test health endpoint
curl $ALB_URL/actuator/health

# Expected output:
# {"status":"UP"}
```

### Test Application Endpoints

```bash
# Create a test customer
curl -X POST $ALB_URL/customers \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }'

# Fetch customer by ID
curl $ALB_URL/customers/1

# Search customers
curl "$ALB_URL/customers?search=doe"
```

## Step 6: Monitor Your Deployment

### View ECS Service

```bash
# Get cluster name
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name BenchmarkInfraStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ClusterName`].OutputValue' \
  --output text)

# List running tasks
aws ecs list-tasks --cluster $CLUSTER_NAME
```

### View Application Logs

```bash
# Stream logs from CloudWatch
aws logs tail /ecs/benchmark-app-java17 --follow
```

### View Metrics

```bash
# Application metrics endpoint
curl $ALB_URL/actuator/metrics

# Prometheus metrics endpoint
curl $ALB_URL/actuator/prometheus
```

## Step 7: Run Benchmark Tests

See [../Scenarios/REST/rest-rds-scenarios.md](../Scenarios/REST/rest-rds-scenarios.md) for comprehensive test scenarios.

### Quick Load Test Example

```bash
# Install k6 if not already installed
# macOS: brew install k6
# Linux: wget -qO- https://dl.k6.io/key.gpg | sudo apt-key add - && \
#        echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list && \
#        sudo apt-get update && sudo apt-get install k6

# Create simple load test
cat > /tmp/load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
};

export default function () {
  // Read customer
  let res1 = http.get(`${__ENV.ALB_URL}/customers/1`);
  check(res1, { 'status 200': (r) => r.status === 200 });
  
  sleep(1);
}
EOF

# Run load test
k6 run -e ALB_URL=$ALB_URL /tmp/load-test.js
```

## Step 8: Tear Down Infrastructure

**⚠️ Warning**: This will destroy all resources including the database. Make sure to save any important data first.

```bash
cd cdk

# Destroy all resources
cdk destroy

# Confirm when prompted
```

The teardown process takes approximately 5-10 minutes.

### Verify Deletion

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name BenchmarkInfraStack \
  --query 'Stacks[0].StackStatus' \
  --output text

# Should return: DELETE_COMPLETE or an error if stack doesn't exist
```

## Deploying Multiple Java Versions Simultaneously

To compare different Java versions side-by-side, you can deploy multiple stacks:

### Deploy Java 17

```bash
cdk deploy \
  --stack-name BenchmarkInfraStack-Java17 \
  -c javaVersion=17 \
  -c containerImage=$ECR_REPO:java17
```

### Deploy Java 21

```bash
cdk deploy \
  --stack-name BenchmarkInfraStack-Java21 \
  -c javaVersion=21 \
  -c containerImage=$ECR_REPO:java21
```

### Deploy Java 25

```bash
cdk deploy \
  --stack-name BenchmarkInfraStack-Java25 \
  -c javaVersion=25 \
  -c containerImage=$ECR_REPO:java25
```

**Note**: Each stack will have its own VPC, RDS instance, and other resources. This will increase costs proportionally.

## Troubleshooting

### Issue: Health Check Fails

**Symptoms**: ALB target group shows unhealthy targets

**Solutions**:
1. Wait 3-5 minutes for application to start and database migrations to complete
2. Check ECS task logs:
   ```bash
   aws logs tail /ecs/benchmark-app-java17 --follow
   ```
3. Verify database connectivity from ECS task
4. Ensure security groups allow traffic between ALB and ECS, and between ECS and RDS

### Issue: CDK Deploy Fails with "Need to perform AWS calls"

**Symptoms**: `cdk synth` or `cdk deploy` fails with credentials error

**Solution**: Ensure AWS credentials are configured:
```bash
aws configure
aws sts get-caller-identity
```

### Issue: Docker Push Fails

**Symptoms**: Cannot push image to ECR

**Solutions**:
1. Re-authenticate to ECR:
   ```bash
   aws ecr get-login-password --region $AWS_REGION | \
     docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
   ```
2. Verify ECR repository exists:
   ```bash
   aws ecr describe-repositories --repository-names benchmark-app
   ```

### Issue: High Costs

**Symptoms**: AWS bill higher than expected

**Solutions**:
1. Destroy infrastructure when not in use: `cdk destroy`
2. Use smaller RDS instance: `-c dbInstanceClass=db.t4g.micro`
3. Reduce ECS task count: `-c desiredCount=1`
4. Monitor NAT Gateway usage (largest cost component)

### Issue: Application Won't Start

**Symptoms**: ECS tasks keep restarting

**Solutions**:
1. Check ECS task logs for errors
2. Verify container image is valid and accessible
3. Ensure environment variables are configured correctly
4. Check database connectivity and credentials

## Cost Estimation

Approximate monthly costs for running this infrastructure 24/7:

| Component | Configuration | Monthly Cost (US East 1) |
|-----------|--------------|-------------------------|
| ECS Fargate | 1 task, 0.5 vCPU, 1 GB | ~$30 |
| RDS PostgreSQL | db.t4g.micro | ~$15 |
| ALB | Internet-facing | ~$16 |
| NAT Gateway | Single AZ | ~$32 |
| CloudWatch Logs | ~10 GB/month | ~$5 |
| **Total** | | **~$98/month** |

**Note**: These are estimates. Actual costs may vary based on:
- Data transfer
- Number of requests
- Storage usage
- CloudWatch metrics and alarms

**Cost Savings Tips**:
- Destroy infrastructure when not actively benchmarking
- Use smaller instance types for development/testing
- Consider using VPC endpoints instead of NAT Gateway for production

## Next Steps

1. **Run Benchmark Scenarios**: See [../Scenarios/REST/rest-rds-scenarios.md](../Scenarios/REST/rest-rds-scenarios.md)
2. **Collect Metrics**: Use CloudWatch, X-Ray, or application metrics
3. **Compare Performance**: Deploy multiple Java versions and compare results
4. **Document Results**: Update [../Comparison.md](../Comparison.md) with findings

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Amazon ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Amazon RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Application Load Balancer Documentation](https://docs.aws.amazon.com/elasticloadbalancing/)
