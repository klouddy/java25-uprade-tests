# Java 25 Scenario Ramp-Up Summary

- **Start Time**: 2026-03-06T14:16:06.005Z
- **End Time**: 2026-03-06T14:30:06.397Z
- **ALB URL**: http://java-bench-alb-1528976283.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 163336
- **Throughput (RPS)**: 194.317361
- **Error Rate (%)**: 2.39 (3918/163336)

## Container Insights

- **CpuUtilized Average**: min 301.3098046875, max 511.82916666666665, avg 453.247337704613
- **CpuUtilized Maximum**: min 301.3098046875, max 512, avg 471.82318359375
- **MemoryUtilized Average**: min 313, max 1288, avg 681.2142857142857
- **MemoryUtilized Maximum**: min 313, max 1288, avg 736.3571428571429
- **NetworkRxBytes Sum**: min 66154, max 10412982, avg 6431521.285714285
- **NetworkTxBytes Sum**: min 135503, max 15408811, avg 9497535.214285715

## JVM / GC (Prometheus)

- **heap used bytes**: min 1206216, max 154140672, avg 45377451.85185185
- **non heap used bytes**: min 2051456, max 93639128, avg 26290484.622222222
- **gc pause rate 5m**: min 0, max 0.21458644067796606, avg 0.05571046589124336
- **gc pause max**: min 0.011, max 0.816, avg 0.22080000000000002
- **process cpu usage**: min 0.002002002002002002, max 0.23814655172413793, avg 0.1841187976812863
- **system cpu usage**: min 0.012012012012012012, max 0.24826216484607747, avg 0.1921527989989877
- **heap committed bytes**: min 2097152, max 213909504, avg 79536431.4074074
- **gc count rate 5m**: min 0, max 1.2135593220338983, avg 0.5525786613434294

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:114
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java25-4-2026-03-06-3, cpu 512, memory 2048, reservation n/a

## RDS Database

- **Instance ID**: java-bench-db
- **Instance Class**: db.t4g.micro
- **Engine**: postgres 17.6
- **Allocated Storage**: 20 GB
- **Max Allocated Storage**: n/a GB
- **Status**: available
- **Multi-AZ**: No
- **Database**: benchmarkdb

## RDS Metrics

- **CPU Utilization Average**: min 7.72%, max 92.98%, avg 59.71%
- **CPU Utilization Maximum**: min 7.72%, max 92.98%, avg 59.71%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.001 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.001 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 13521 bytes/sec, avg 1926 bytes/sec
- **Write Throughput Average**: min 71386 bytes/sec, max 2573555 bytes/sec, avg 796223 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.7, avg 0.3
- **Write IOPS Average**: min 8.0, max 67.1, avg 38.7

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/ramp-up/java25/2026-03-06/3/k6-summary.txt
