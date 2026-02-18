# Automation Scripts Documentation

This directory contains automation scripts to simplify the deployment and management of the benchmark infrastructure.

## 📋 Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `complete-setup.sh` | One-command full setup | `./complete-setup.sh <java-version>` |
| `setup-ecr-and-images.sh` | Setup ECR and build images | `./setup-ecr-and-images.sh` |
| `deploy.sh` | Deploy CDK infrastructure | `./deploy.sh <java-version> [cpu] [memory] [count]` |
| `verify-deployment.sh` | Verify deployment health | `./verify-deployment.sh` |
| `destroy.sh` | Tear down infrastructure | `./destroy.sh` |

## 🚀 complete-setup.sh

**Purpose**: One-command setup that runs the entire deployment pipeline.

**Usage**:
```bash
./complete-setup.sh <java-version>
```

**Arguments**:
- `java-version` (required): Java version to deploy (17, 21, or 25)

**Example**:
```bash
# Deploy Java 17 environment
./complete-setup.sh 17

# Deploy Java 21 environment
./complete-setup.sh 21
```

**What it does**:
1. Checks prerequisites (AWS CLI, Docker, CDK)
2. Validates AWS credentials
3. Runs `setup-ecr-and-images.sh` (for specified Java version only)
4. Runs `deploy.sh`
5. Waits 2 minutes for tasks to become healthy
6. Runs `verify-deployment.sh`
7. Displays application URL and next steps

**Output Files**:
- `.env.local` - Environment variables (AWS account, region, ECR repo)
- `.env.deployment` - Deployment outputs (ALB URL, cluster name, etc.)

## 🐳 setup-ecr-and-images.sh

**Purpose**: Creates ECR repository and builds/pushes Docker images.

**Usage**:
```bash
./setup-ecr-and-images.sh
```

**Environment Variables**:
- `JAVA_VERSIONS` (optional): Space-separated list of versions to build (default: "17 21 25")
- `AWS_REGION` (optional): AWS region (default: us-east-1)

**Example**:
```bash
# Build all Java versions
./setup-ecr-and-images.sh

# Build only Java 21
JAVA_VERSIONS="21" ./setup-ecr-and-images.sh

# Build Java 17 and 25 in a different region
AWS_REGION=eu-west-1 JAVA_VERSIONS="17 25" ./setup-ecr-and-images.sh
```

**What it does**:
1. Gets AWS account ID and region
2. Creates ECR repository (if doesn't exist)
3. Authenticates to ECR
4. Builds Docker images for specified Java versions
5. Tags and pushes images to ECR
6. Saves environment variables to `.env.local`

**Requirements**:
- Docker daemon running
- AWS CLI configured
- Run from `cdk/` directory

## ☁️ deploy.sh

**Purpose**: Deploy the CDK infrastructure stack.

**Usage**:
```bash
./deploy.sh <java-version> [cpu] [memory] [count]
```

**Arguments**:
- `java-version` (required): Java version to deploy (17, 21, or 25)
- `cpu` (optional): Fargate CPU units (256, 512, 1024, 2048, 4096)
- `memory` (optional): Fargate memory in MB (512-8192)
- `count` (optional): Number of ECS tasks (1-N)

**Examples**:
```bash
# Deploy Java 17 with defaults (512 CPU, 1024 MB, 1 task)
./deploy.sh 17

# Deploy Java 21 with custom sizing
./deploy.sh 21 1024 2048

# Deploy Java 25 with multiple tasks
./deploy.sh 25 1024 2048 2
```

**What it does**:
1. Loads environment variables from `.env.local` (or fetches from AWS)
2. Installs npm dependencies (if needed)
3. Checks/bootstraps CDK (if needed)
4. Deploys the BenchmarkInfraStack with specified parameters
5. Retrieves and saves stack outputs to `.env.deployment`
6. Displays deployment information

**Output**:
- Stack deployed to AWS
- `.env.deployment` file with ALB URL and other outputs

## ✅ verify-deployment.sh

**Purpose**: Verify that the deployed application is healthy and functional.

**Usage**:
```bash
./verify-deployment.sh
```

**What it does**:
1. Loads ALB URL from `.env.deployment`
2. Tests health check endpoint
3. Creates a test customer
4. Fetches customer by ID
5. Searches customers
6. Tests metrics endpoint
7. Displays summary and available endpoints

**Requirements**:
- Stack must be deployed (`.env.deployment` exists or stack exists in CloudFormation)
- ECS tasks must be running and healthy

**Expected Output**:
```
✓ Health check passed
✓ Customer creation successful
✓ Customer fetch successful
✓ Customer search successful
✓ Metrics endpoint accessible
```

## 🧹 destroy.sh

**Purpose**: Destroy all infrastructure resources.

**Usage**:
```bash
./destroy.sh
```

**What it does**:
1. Checks if stack exists
2. Shows current stack status
3. Prompts for confirmation (requires typing "yes")
4. Destroys the stack with `cdk destroy --force`
5. Cleans up local `.env.deployment` file

**Safety Features**:
- Requires explicit "yes" confirmation
- Shows warning about data loss
- Lists all resources that will be deleted

**Note**: Destruction takes approximately 5-10 minutes.

## 🔄 Common Workflows

### Deploy a Single Java Version

```bash
# Setup and deploy Java 17
./complete-setup.sh 17

# Run benchmarks...

# Tear down
./destroy.sh
```

### Compare Multiple Java Versions

```bash
# Build all images once
./setup-ecr-and-images.sh

# Deploy Java 17
./deploy.sh 17
# Run benchmarks, collect metrics
./destroy.sh

# Deploy Java 21
./deploy.sh 21
# Run benchmarks, collect metrics
./destroy.sh

# Deploy Java 25
./deploy.sh 25
# Run benchmarks, collect metrics
./destroy.sh
```

### Custom Configuration

```bash
# Deploy with custom CPU/memory
./deploy.sh 21 1024 2048

# Deploy with multiple tasks
./deploy.sh 21 1024 2048 2
```

### Rebuild and Redeploy

```bash
# Rebuild images
./setup-ecr-and-images.sh

# Redeploy (CDK will update the ECS service)
./deploy.sh 17
```

## 📁 Generated Files

The scripts generate these files (automatically added to .gitignore):

- `.env.local` - Environment variables (AWS account, region, ECR repo)
- `.env.deployment` - Deployment outputs (ALB URL, cluster name, DB endpoint)

These files are safe to delete; they will be regenerated when needed.

## 🛠️ Troubleshooting

### Script fails with "Permission denied"

```bash
chmod +x *.sh
```

### Script fails with "AWS credentials not configured"

```bash
aws configure
aws sts get-caller-identity
```

### Docker build fails

Ensure Docker daemon is running:
```bash
docker ps
```

### CDK bootstrap fails

Ensure you have sufficient AWS permissions:
- CloudFormation
- S3
- IAM
- ECR

### Deployment verification fails

Wait a few more minutes for ECS tasks to fully start:
```bash
# Check task status
aws ecs list-tasks --cluster benchmark-cluster-java17
```

## 🔐 Security Notes

- Scripts automatically handle ECR authentication
- Database credentials are auto-generated and stored in Secrets Manager
- No hardcoded credentials in scripts or configuration files
- `.env.local` and `.env.deployment` are gitignored

## 📝 Script Requirements

All scripts:
- Use `set -e` to exit on errors
- Are idempotent where possible
- Provide colored output for readability
- Include error handling and validation
- Work from the `cdk/` directory

## 💡 Tips

1. **Use complete-setup.sh** for first-time deployment
2. **Use individual scripts** for iterative development
3. **Always run verify-deployment.sh** after deploy
4. **Always run destroy.sh** when done to avoid costs
5. **Keep .env.* files** for easy redeployment

## 🔗 Related Documentation

- [README.md](README.md) - CDK infrastructure overview
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Manual deployment steps
- [../spring-boot-app/README.md](../spring-boot-app/README.md) - Application documentation
