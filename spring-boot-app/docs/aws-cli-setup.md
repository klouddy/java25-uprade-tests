
# 🏗️ AWS CLI Setup for Benchmark Environment (ECS Fargate + RDS + ALB)

This guide shows how to provision the minimal AWS infrastructure needed for the **Java 17 vs 21 vs 25** benchmarks using the **AWS CLI**, without CDK or CloudFormation.

> ⚠️ **Not production‑grade**  
> This setup is intentionally simplified for benchmarking and article reproducibility.  
> For production, you’d harden networking, IAM, secrets, and HA.

---

## 0. Prerequisites

- `aws` CLI installed and configured:

```bash
aws --version
aws sts get-caller-identit
```

- region setup

```bash
export AWS_REGION=us-east-1
aws configure set region $AWS_REGION
```

- docker image as pushed to ECR

```bash
export APP_IMAGE="<your-account-id>.dkr.ecr.${AWS_REGION}.amazonaws.com/java-bench:java21"
```

## 1. Get Default VPC and Subnets

To keep the setup simple, we’ll use the default VPC.

```bash
export VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --query "Vpcs[0].VpcId" \
  --output text)

echo "VPC_ID = $VPC_ID"
```

Get a couple of subnets (we’ll treat them as “public enough” for ECS Fargate & ALB in this simplified setup):

```bash
export SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query "Subnets[*].SubnetId" \
  --output text)

echo "SUBNET_IDS = $SUBNET_IDS"
```

You’ll typically see 2–3 subnets; that’s OK.

## 2. Create Security Groups

We’ll create two security groups:

One for the ALB
One for the ECS tasks (app containers)
RDS will get its own later

### 2.1 ALB Security Group (ingress from internet)

```bash
export ALB_SG_ID=$(aws ec2 create-security-group \
  --group-name java-bench-alb-sg \
  --description "ALB SG for Java benchmark" \
  --vpc-id $VPC_ID \
  --query "GroupId" \
  --output text)

echo "ALB_SG_ID = $ALB_SG_ID"
```

Allow HTTP from anywhere (for testing):

```bash
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0
```

### 2.2 ECS Task Security Group

```bash
export ECS_SG_ID=$(aws ec2 create-security-group \
  --group-name java-bench-ecs-sg \
  --description "ECS tasks SG for Java benchmark" \
  --vpc-id $VPC_ID \
  --query "GroupId" \
  --output text)

echo "ECS_SG_ID = $ECS_SG_ID"
```

Allow ingress from the ALB only (port 8080 for Spring Boot):

```bash
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 8080 \
  --source-group $ALB_SG_ID
```

We’ll wire these into ECS & ALB later.

## 3. Create RDS Instance (PostgreSQL Example)

For benchmarking, a small single‑AZ instance is fine.

### 3.1 RDS Security Group

```bash
export RDS_SG_ID=$(aws ec2 create-security-group \
  --group-name java-bench-rds-sg \
  --description "RDS SG for Java benchmark" \
  --vpc-id $VPC_ID \
  --query "GroupId" \
  --output text)

echo "RDS_SG_ID = $RDS_SG_ID"
```

Allow ingress from ECS tasks:

```bash
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $ECS_SG_ID
```

### 3.2 Create DB Subnet Group

Use the same subnets we discovered earlier:

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name java-bench-db-subnet-group \
  --db-subnet-group-description "DB subnet group for benchmark" \
  --subnet-ids $(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "Subnets[*].SubnetId" \
    --output text | tr '\n' ' ')
```

### 3.3 Create the RDS Instance

⚠️ Username/password here are for testing only. For article clarity you may want to show Secrets Manager in a later iteration.

```bash
export DB_INSTANCE_ID="java-bench-db"
export DB_NAME="benchmarkdb"
export DB_USER="benchuser"
export DB_PASSWORD="BenchUserStrongPass123!"   # change appropriately

aws rds create-db-instance \
  --db-instance-identifier $DB_INSTANCE_ID \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --allocated-storage 20 \
  --master-username $DB_USER \
  --master-user-password $DB_PASSWORD \
  --db-name $DB_NAME \
  --vpc-security-group-ids $RDS_SG_ID \
  --db-subnet-group-name java-bench-db-subnet-group \
  --no-publicly-accessible \
  --backup-retention-period 0
```

Wait for it to be available:

```bash
aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID
```

Get the endpoint:

```bash
export DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier $DB_INSTANCE_ID \
  --query "DBInstances[0].Endpoint.Address" \
  --output text)

echo "DB_ENDPOINT = $DB_ENDPOINT"
```

You’ll use this to configure your Spring Boot datasource.

## 4. Create ECS Cluster

```bash
export ECS_CLUSTER_NAME="java-bench-cluster"

aws ecs create-cluster \
  --cluster-name $ECS_CLUSTER_NAME
```

## 5. IAM Roles for ECS Task Execution

### 5.1 Task Execution Role (pull image, write logs)

Create role

```bash
export ECS_TASK_EXEC_ROLE_NAME="java-bench-ecs-execution-role"

aws iam create-role \
  --role-name $ECS_TASK_EXEC_ROLE_NAME \
  --assume-role-policy-document file://ecsTaskExecutionRoleTrust.json
```

Attach AWS-managed policies:


```bash
aws iam attach-role-policy \
  --role-name $ECS_TASK_EXEC_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam attach-role-policy \
  --role-name $ECS_TASK_EXEC_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
```

Get the ARN:

```bash
export ECS_TASK_EXEC_ROLE_ARN=$(aws iam get-role \
  --role-name $ECS_TASK_EXEC_ROLE_NAME \
  --query "Role.Arn" \
  --output text)

echo "ECS_TASK_EXEC_ROLE_ARN = $ECS_TASK_EXEC_ROLE_ARN"
```

For this simple setup, we can use the same role for execution and task role, or you can create a separate task role similarly.

## 6. Register ECS Task Definition (Fargate)

Replace placeholders in `task-def.json`:

- REPLACE_EXEC_ROLE_ARN → $ECS_TASK_EXEC_ROLE_ARN
- REPLACE_APP_IMAGE → $APP_IMAGE
- REPLACE_DB_ENDPOINT → $DB_ENDPOINT

then register:

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-def.json
```

## 7. Create ALB and Target Group

### 7.1 Create ALB

```bash
# Take just two subnets for the ALB
export ALB_SUBNET_1=$(echo $SUBNET_IDS | awk '{print $1}')
export ALB_SUBNET_2=$(echo $SUBNET_IDS | awk '{print $2}')

export ALB_ARN=$(aws elbv2 create-load-balancer \
  --name java-bench-alb \
  --subnets $ALB_SUBNET_1 $ALB_SUBNET_2 \
  --security-groups $ALB_SG_ID \
  --scheme internet-facing \
  --type application \
  --query "LoadBalancers[0].LoadBalancerArn" \
  --output text)

echo "ALB_ARN = $ALB_ARN"
```

Get its DNS name:

```bash
export ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query "LoadBalancers[0].DNSName" \
  --output text)

echo "ALB_DNS = http://$ALB_DNS"
```

### 7.2 Target Group

```bash
export TG_ARN=$(aws elbv2 create-target-group \
  --name java-bench-tg \
  --protocol HTTP \
  --port 8080 \
  --target-type ip \
  --vpc-id $VPC_ID \
  --health-check-path "/actuator/health" \
  --query "TargetGroups[0].TargetGroupArn" \
  --output text)

echo "TG_ARN = $TG_ARN"
```

### 7.3 Listener

```bash
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

## 8. Create ECS Service (Fargate + ALB)

We’ll run tasks in awsvpc mode with subnets + ECS SG.

Replace in create-service.json

- SUBNET_1,
- SUBNET_2
- SUBNET_3
- SECURITY_GROUP_ID > $ECS_SG_ID
- TARGET_GROUP_ARN > $TG_ARN

```bash
# Use all subnets for the ECS tasks
aws ecs create-service --cli-input-json file://create-service.json
```

Wait for the service to stabilize:

```bash
aws ecs wait services-stable \
  --cluster $ECS_CLUSTER_NAME \
  --services java-bench-service
```

Now you should be able to hit:

```bash
echo "Health URL: http://$ALB_DNS/actuator/health"
```

This is the URL your load tests will target.

## 9. Tearing Everything Down (Cleanup)

```bash
# 1. Delete ECS service
aws ecs update-service --cluster $ECS_CLUSTER_NAME --service java-bench-service --desired-count 0
aws ecs delete-service --cluster $ECS_CLUSTER_NAME --service java-bench-service --force

# 2. Delete ECS cluster
aws ecs delete-cluster --cluster $ECS_CLUSTER_NAME

# 3. Delete ALB listener + target group + ALB
# (listeners will be deleted automatically when deleting ALB in many cases)
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN
aws elbv2 delete-target-group --target-group-arn $TG_ARN

# 4. Delete RDS instance + subnet group
aws rds delete-db-instance --db-instance-identifier $DB_INSTANCE_ID --skip-final-snapshot
aws rds wait db-instance-deleted --db-instance-identifier $DB_INSTANCE_ID
aws rds delete-db-subnet-group --db-subnet-group-name java-bench-db-subnet-group

# 5. Delete security groups (order matters: RDS, ECS, ALB)
aws ec2 delete-security-group --group-id $RDS_SG_ID
aws ec2 delete-security-group --group-id $ECS_SG_ID
aws ec2 delete-security-group --group-id $ALB_SG_ID

# 6. (Optional) Delete IAM role
aws iam detach-role-policy --role-name $ECS_TASK_EXEC_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
aws iam detach-role-policy --role-name $ECS_TASK_EXEC_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
aws iam delete-role --role-name $ECS_TASK_EXEC_ROLE_NAME

```
