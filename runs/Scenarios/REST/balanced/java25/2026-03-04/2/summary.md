# Java 25 Scenario Balanced Summary

- **Start Time**: 2026-03-04T21:00:58.717Z
- **End Time**: 2026-03-04T21:15:01.304Z
- **ALB URL**: http://java-bench-alb-1420811787.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 1024
- **JVM Settings**: -XX:+UseG1GC -Xmx512m

## K6 Load Results

- **Requests**: 68401
- **Throughput (RPS)**: 81.161775
- **Error Rate (%)**: 0.71 (492/68401)

## Container Insights

- **CpuUtilized Average**: min 7.135399169921875, max 511.895, avg 275.1542156304253
- **CpuUtilized Maximum**: min 7.135399169921875, max 511.895, avg 275.1542156304253
- **MemoryUtilized Average**: min 283, max 651, avg 407.73333333333335
- **MemoryUtilized Maximum**: min 283, max 651, avg 407.73333333333335
- **NetworkRxBytes Sum**: min 276, max 6124347, avg 2179298.2666666666
- **NetworkTxBytes Sum**: min 22006, max 9081628, avg 3262967.066666667

## JVM / GC (Prometheus)

- **heap used bytes**: min 523968, max 400858784, avg 42851371.55555555
- **non heap used bytes**: min 2050048, max 93545976, avg 26319301.44
- **gc pause rate 5m**: min 0.00005818828000000001, max 0.16577288135593218, avg 0.028357387356127077
- **gc pause max**: min 0.017, max 0.789, avg 0.25188888888888894
- **process cpu usage**: min 0.0030120481927710845, max 0.25409047160731474, avg 0.13507206985055917
- **system cpu usage**: min 0.006024096385542168, max 0.25280898876404495, avg 0.13307422545400854
- **heap committed bytes**: min 1048576, max 505413632, avg 67271975.82222222
- **gc count rate 5m**: min 0.0034228400000000003, max 1.2576271186440677, avg 0.33762210379357316

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:103
- **Task CPU/Memory**: 512/1024

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java25-2-2026-03-04-2, cpu 512, memory 1024, reservation n/a

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

- **CPU Utilization Average**: min 5.82%, max 54.36%, avg 23.30%
- **CPU Utilization Maximum**: min 5.82%, max 54.36%, avg 23.30%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Write Latency Average**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 11337 bytes/sec, avg 1658 bytes/sec
- **Write Throughput Average**: min 2047 bytes/sec, max 2570499 bytes/sec, avg 705154 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.3, avg 0.3
- **Write IOPS Average**: min 0.2, max 64.0, avg 32.1

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/balanced/java25/2026-03-04/2/k6-summary.txt
