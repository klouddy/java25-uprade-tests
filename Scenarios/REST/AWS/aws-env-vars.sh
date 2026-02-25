#!/bin/bash
export AWS_REGION=us-east-1
export VPC_ID=vpc-001ff5c7944c9a25e
export ALB_SG_ID=sg-0318815d453b5b6e2
export ECS_SG_ID=sg-0fe91cef79b3090ad
export RDS_SG_ID=sg-0b23afbb91beeab4b
export DB_INSTANCE_ID=java-bench-db
export ECS_CLUSTER_NAME=java-bench-cluster
export ECS_TASK_EXEC_ROLE_NAME=java-bench-ecs-execution-role
export ALB_ARN=arn:aws:elasticloadbalancing:us-east-1:913846010507:loadbalancer/app/java-bench-alb/1eec201e7bad20ac
export TG_ARN=arn:aws:elasticloadbalancing:us-east-1:913846010507:targetgroup/java-bench-tg/53ad78f2fa0b41f4
export ALB_DNS=java-bench-alb-1220469541.us-east-1.elb.amazonaws.com
