# Java 25 Scenario 1 Summary

- **Start Time**: 2026-03-02T20:24:22.520Z
- **End Time**: 2026-03-02T20:38:24.174Z
- **ALB URL**: http://java-bench-alb-1102733014.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 1024
- **JVM Settings**: -XX:+UseG1GC -Xmx512m

## K6 Load Results

- **Requests**: 111861
- **Throughput (RPS)**: 132.891343
- **Error Rate (%)**: 1.31 (1474/111861)

## Container Insights

- **CpuUtilized Average**: min 74.65359263102214, max 510.8087760416667, avg 327.0260401916504
- **CpuUtilized Maximum**: min 74.65359263102214, max 510.8087760416667, avg 327.0260401916504
- **MemoryUtilized Average**: min 307, max 662, avg 395.2142857142857
- **MemoryUtilized Maximum**: min 307, max 662, avg 395.2142857142857
- **NetworkRxBytes Sum**: min 2210, max 7281978, avg 3023121.214285714
- **NetworkTxBytes Sum**: min 37805, max 10736120, avg 4501571.285714285

## JVM / GC (Prometheus)

- **heap used bytes**: min 893880, max 128974848, avg 30261231.82222222
- **non heap used bytes**: min 2059264, max 93666696, avg 24426480.85333333
- **gc pause rate 5m**: min 0, max 0.06604023023572721, avg 0.013434230579356594
- **gc pause max**: min 0.009, max 0.597, avg 0.19499999999999995
- **process cpu usage**: min 0.000999000999000999, max 0.2579972183588317, avg 0.15437921977274285
- **system cpu usage**: min 0.011988011988011988, max 0.2736732570239334, avg 0.16935408258138868
- **heap committed bytes**: min 1048576, max 146800640, avg 45042164.62222222
- **gc count rate 5m**: min 0, max 0.9321970698503738, avg 0.3363897108805957

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:90
- **Task CPU/Memory**: 512/1024

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java25-1-2026-03-02-2, cpu 512, memory 1024, reservation n/a

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

- **CPU Utilization Average**: min 4.23%, max 62.81%, avg 28.10%
- **CPU Utilization Maximum**: min 4.23%, max 62.81%, avg 28.10%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.003 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.003 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 8392 bytes/sec, avg 1238 bytes/sec
- **Write Throughput Average**: min 4506 bytes/sec, max 2508308 bytes/sec, avg 708241 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.3, avg 0.4
- **Write IOPS Average**: min 0.6, max 53.1, avg 29.1

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/read-heavy/java25/2026-03-02/2/k6-summary.txt
