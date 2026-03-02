# AWS Bootstrap Module

This module (`aws-bootstrap.js`) handles automated AWS infrastructure creation for the Java benchmark application using the AWS SDK for Node.js.

## Overview

The `AwsBootstrap` class manages the following AWS resources:

### Components

1. **VPC & Networking**
   - Automatically discovers the default VPC
   - Retrieves available subnets
   - Sets up security groups for ALB, ECS, and RDS

2. **RDS Database**
   - Creates a PostgreSQL database instance (db.t4g.micro)
   - Sets up DB subnet groups
   - Configures security group rules for database access
   - Takes approximately 10-15 minutes to fully initialize

3. **ECS Fargate Cluster**
   - Creates an ECS cluster with Container Insights enabled
   - Ready to accept task definitions and services
   - Integrated with ALB for traffic distribution

4. **Application Load Balancer (ALB)**
   - Creates an internet-facing ALB
   - Routes traffic to ECS tasks on port 8080
   - Supports Prometheus endpoint exposure

5. **Security Groups**
   - `java-bench-alb-sg`: Allows HTTP/HTTPS inbound traffic
   - `java-bench-ecs-sg`: Allows ECS tasks to receive traffic from ALB
   - `java-bench-rds-sg`: Allows RDS database access from ECS tasks

### Prometheus Monitoring (Optional)

When enabled, prepares Prometheus monitoring configuration. This typically requires manual deployment after the infrastructure is ready.

## Usage

The module is imported and used by `setup-run.js`:

```javascript
const AwsBootstrap = require('./aws-bootstrap');

// Note: .bind(this) is required to maintain the log function context
const awsBootstrap = new AwsBootstrap(this.log.bind(this), chalk);
await awsBootstrap.setupInfrastructure(bootstrapConfig, imageFullPath, projectRoot);
```

## Prerequisites

1. **AWS Credentials**: Configured via AWS CLI or environment variables
   ```bash
   aws configure
   ```

2. **Node.js AWS SDK**: Installed via npm (auto-installed with dependencies)
   ```bash
   npm install
   ```

3. **Default VPC**: AWS account must have a default VPC in the target region

## Configuration

The `bootstrapConfig` object passed to `setupInfrastructure()` includes:

```javascript
{
  enabled: true,
  components: ['ecs', 'rds', 'alb', 'prometheus'],  // Selected components
  awsRegion: 'us-east-1',                            // Target AWS region
  dbPassword: 'BenchUserStrongPass123!'             // RDS master password
}
```

## Error Handling

The module handles common AWS SDK errors:
- Resource already exists (idempotent operations)
- Missing VPC or subnets (validation)
- Security group rule conflicts (duplicate detection)

## Workflow

1. Initialize AWS SDK clients for EC2, RDS, ECS, and ALB
2. Discover default VPC and available subnets
3. Create security groups (or reuse existing)
4. Create RDS database instance
5. Create ECS cluster with Container Insights
6. Create ALB
7. Return created resource information

## Output

The module provides console output through the `chalk` library:
- ✓ Success messages in green
- ⚠️ Warnings in yellow
- 🔧 Section headers with emoji indicators

## Next Steps

After AWS infrastructure setup:

1. **Monitor RDS Creation**: Check AWS Console → RDS → Databases
2. **Deploy Application**: Push Docker image to ECR and create ECS task
3. **Configure Monitoring**: Set up Prometheus scraping from ALB endpoint
4. **Start Load Testing**: Use k6 load test scripts with ALB endpoint

## Limitations

- Currently requires manual Prometheus deployment
- No CloudFormation template generation (could be added)
- Assumes default VPC setup (could be enhanced for custom VPC)

## Future Enhancements

- [ ] Prometheus service auto-deployment
- [ ] CloudFormation integration for easier rollback
- [ ] Custom VPC support
- [ ] Auto-scaling group configuration
- [ ] CloudWatch monitoring pre-configuration
