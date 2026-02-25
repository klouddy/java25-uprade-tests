# Simple Notes

## Building and deploying images

`aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 913846010507.dkr.ecr.us-east-1.amazonaws.com`

`docker build -f Dockerfile.java21 -t 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java21-rest-20260220-02`

`docker push 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java21-rest-20260220-02`


## Running AWS ECS Service Commands

Get ALB Hostname for running service:
```bash
aws elbv2 describe-load-balancers \
  --names java-bench-alb \
  --region us-east-1 \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

## k6

`export BASE_URL="http://java-bench-alb-1779184826.us-east-1.elb.amazonaws.com"`
`k6 run scenario-1-read-heavy.js --out json=results-java21.json`




# Info Found

## Gotchas

### Java 21 swithcing to `UseZGC` 

Both set -XX:MaxRAMPercentage=75.0 to use 750MB heap in your 1GB container, but ZGC has higher off-heap memory overhead. ZGC uses additional native memory for its metadata structures, which can push the total container memory usage beyond 1GB, causing the container to be killed by ECS.




