#!/bin/bash
export AWS_REGION=us-east-1
export VPC_ID=vpc-001ff5c7944c9a25e
export ALB_SG_ID=sg-0318815d453b5b6e2
export ECS_SG_ID=sg-0fe91cef79b3090ad
export RDS_SG_ID=sg-0b23afbb91beeab4b
export DB_INSTANCE_ID=java-bench-db
export ECS_CLUSTER_NAME=java-bench-cluster
export ECS_TASK_EXEC_ROLE_NAME=java-bench-ecs-execution-role
export ALB_ARN=arn:aws:elasticloadbalancing:us-east-1:913846010507:loadbalancer/app/java-bench-alb/82abe9937307dc59
export TG_ARN=arn:aws:elasticloadbalancing:us-east-1:913846010507:targetgroup/java-bench-tg/a5282738ad457991
export ALB_DNS=java-bench-alb-2103695825.us-east-1.elb.amazonaws.com
