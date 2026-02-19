#!/bin/bash
export AWS_REGION=us-east-1
export VPC_ID=vpc-001ff5c7944c9a25e
export ALB_SG_ID=sg-06d31acea3d8b839e
export ECS_SG_ID=sg-09e472e9ea02f16ea
export RDS_SG_ID=sg-0d55f917e224f88fd
export DB_INSTANCE_ID=java-bench-db
export ECS_CLUSTER_NAME=java-bench-cluster
export ECS_TASK_EXEC_ROLE_NAME=java-bench-ecs-execution-role
export ALB_ARN=arn:aws:elasticloadbalancing:us-east-1:913846010507:loadbalancer/app/java-bench-alb/56d331d1209d7573
export TG_ARN=arn:aws:elasticloadbalancing:us-east-1:913846010507:targetgroup/java-bench-tg/5ee1fdf116af403b
export ALB_DNS=java-bench-alb-517195697.us-east-1.elb.amazonaws.com
