# Benchmark Infrastructure CDK Stack

AWS CDK infrastructure for deploying the Java benchmark application on ECS Fargate with RDS.

## 📘 Overview

This CDK app provisions a complete, production-like environment for benchmarking Java 17, 21, and 25 applications:

- **VPC**: Public and private subnets across 2 availability zones
- **ECS Fargate**: Containerized application with configurable CPU/memory
- **Application Load Balancer**: Internet-facing ALB for HTTP traffic
- **RDS Database**: PostgreSQL or MySQL instance with automated credentials
- **Security Groups**: Minimal, explicit rules for network isolation
- **Secrets Manager**: Secure database credential storage

All resources are **fully disposable** via `cdk destroy` for reproducible benchmarking.

## 🚀 Quick Start

### Prerequisites

- AWS CLI configured with credentials
- Node.js 18+ and npm
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Docker (for building application images)

### Initial Setup

```bash
cd cdk

# Install dependencies
npm install

# Bootstrap CDK (only needed once per AWS account/region)
cdk bootstrap
```

### Deploy the Stack

```bash
# Deploy with default configuration (Java 17)
cdk deploy

# Or customize via context parameters
cdk deploy \
  -c javaVersion=21 \
  -c containerImage=YOUR_ECR_REPO/benchmark-app:java21 \
  -c cpu=1024 \
  -c memoryLimitMiB=2048 \
  -c desiredCount=2
```

After deployment completes, note the `AlbUrl` output - this is your application endpoint.

### Test the Deployment

```bash
# Get the ALB URL from stack outputs
ALB_URL=$(aws cloudformation describe-stacks \
  --stack-name BenchmarkInfraStack \
  --query 'Stacks[0].Outputs[?OutputKey==`AlbUrl`].OutputValue' \
  --output text)

# Check health endpoint
curl $ALB_URL/actuator/health

# Test the application
curl -X POST $ALB_URL/customers \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com"
  }'
```

### Tear Down

```bash
# Destroy all resources
cdk destroy

# Confirm when prompted
```

## ⚙️ Configuration

### Context Parameters

Configure the stack via CDK context (either in `cdk.json` or via `-c` flag):

| Parameter | Description | Default | Example Values |
|-----------|-------------|---------|----------------|
| `javaVersion` | Java version for tagging | `17` | `17`, `21`, `25` |
| `containerImage` | Docker image to deploy | `public.ecr.aws/amazonlinux/amazonlinux:2023` | `123456789012.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java21` |
| `cpu` | Fargate CPU units | `512` | `256`, `512`, `1024`, `2048`, `4096` |
| `memoryLimitMiB` | Fargate memory in MB | `1024` | `512`, `1024`, `2048`, `4096`, `8192` |
| `desiredCount` | Number of ECS tasks | `1` | `1`, `2`, `3` |
| `dbEngine` | Database engine | `postgres` | `postgres`, `mysql` |
| `dbInstanceClass` | RDS instance type (Note: currently defaults to db.t4g.micro) | `db.t4g.micro` | `db.t4g.micro`, `db.t4g.small`, `db.r6g.large` |

### CPU and Memory Combinations

Valid Fargate task sizes:

| CPU | Memory |
|-----|--------|
| 256 | 512 MB, 1 GB, 2 GB |
| 512 | 1 GB, 2 GB, 3 GB, 4 GB |
| 1024 | 2 GB, 3 GB, 4 GB, 5 GB, 6 GB, 7 GB, 8 GB |
| 2048 | 4 GB - 16 GB (1 GB increments) |
| 4096 | 8 GB - 30 GB (1 GB increments) |

### Environment Variables

The stack automatically configures these environment variables in the ECS task:

- `SPRING_PROFILES_ACTIVE=ecs`
- `DATABASE_URL` - JDBC connection string
- `SPRING_DATASOURCE_URL` - Same as DATABASE_URL
- `DATABASE_USER` - From Secrets Manager
- `DATABASE_PASSWORD` - From Secrets Manager
- `SPRING_DATASOURCE_USERNAME` - From Secrets Manager
- `SPRING_DATASOURCE_PASSWORD` - From Secrets Manager
- `DB_POOL_SIZE=50`
- `SERVER_PORT=8080`
- `TOMCAT_MAX_THREADS=200`

## 📦 Building and Pushing Docker Images

Before deploying, you need to build and push your application images to ECR:

### Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name benchmark-app \
  --region us-east-1
```

### Build and Push Images

```bash
# Set your AWS account ID and region
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1
export ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/benchmark-app"

# Authenticate to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPO

# Build and push Java 17 image
cd ../spring-boot-app
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
```

### Deploy with ECR Images

```bash
cd ../cdk

# Deploy Java 17 version
cdk deploy -c javaVersion=17 -c containerImage=$ECR_REPO:java17

# Deploy Java 21 version (in a separate stack or after destroying the first)
cdk deploy -c javaVersion=21 -c containerImage=$ECR_REPO:java21

# Deploy Java 25 version
cdk deploy -c javaVersion=25 -c containerImage=$ECR_REPO:java25
```

## 🏗️ Infrastructure Components

### VPC

- **CIDR**: Auto-assigned
- **Availability Zones**: 2
- **Public Subnets**: 2 (for ALB)
- **Private Subnets**: 2 (for ECS tasks and RDS)
- **NAT Gateways**: 1 (for cost optimization)
- **Internet Gateway**: 1

### Application Load Balancer (ALB)

- **Type**: Internet-facing
- **Scheme**: HTTP only (port 80)
- **Target**: ECS Fargate tasks on port 8080
- **Health Check**: `/actuator/health` endpoint
- **Intervals**: 30s check, 5s timeout
- **Thresholds**: 2 healthy, 3 unhealthy

### ECS Fargate

- **Cluster**: Dedicated cluster per deployment
- **Service**: Auto-scaling disabled (use desiredCount)
- **Task Definition**: Single container
- **Networking**: Private subnets with NAT gateway access
- **Logging**: CloudWatch Logs with 1-week retention

### RDS Database

- **Engine**: PostgreSQL 15 or MySQL 8.0
- **Instance**: db.t4g.micro (configurable)
- **Storage**: 20 GB, auto-scale to 50 GB
- **Backups**: Disabled (benchmark environment)
- **Encryption**: Enabled at rest
- **Multi-AZ**: Disabled (single instance)

### Security Groups

**ALB Security Group**:
- Inbound: TCP 80 from 0.0.0.0/0
- Outbound: TCP 8080 to ECS tasks

**ECS Security Group**:
- Inbound: TCP 8080 from ALB
- Outbound: TCP 5432/3306 to RDS, all traffic for internet

**RDS Security Group**:
- Inbound: TCP 5432/3306 from ECS tasks
- Outbound: None

## 📋 CDK Useful Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and compile
- `npm run test` - Run Jest unit tests
- `cdk deploy` - Deploy this stack to your AWS account/region
- `cdk diff` - Compare deployed stack with current state
- `cdk synth` - Emit the synthesized CloudFormation template
- `cdk destroy` - Remove all resources from AWS

## 🔒 Security Notes

### For Production Use

This stack is optimized for **benchmarking and testing**, not production:

- ❌ No HTTPS/SSL on ALB
- ❌ No database backups
- ❌ RemovalPolicy.DESTROY on data resources
- ❌ Single NAT Gateway (not HA)
- ❌ No auto-scaling configured
- ❌ Public ALB with open ingress

### Hardening for Production

If adapting for production:

1. Add ACM certificate and HTTPS listener
2. Enable RDS backups and Multi-AZ
3. Change RemovalPolicy to RETAIN
4. Add multiple NAT Gateways
5. Restrict ALB ingress to known IPs
6. Enable ECS service auto-scaling
7. Add WAF rules to ALB
8. Enable VPC flow logs
9. Use Secrets Manager rotation
10. Add CloudWatch alarms

## 📝 License

This is a benchmarking infrastructure for internal use.
