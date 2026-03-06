# Java 25 Scenario Burst-Spike Summary

- **Start Time**: 2026-03-06T15:15:46.994Z
- **End Time**: 2026-03-06T15:24:50.151Z
- **ALB URL**: http://java-bench-alb-1528976283.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 34527
- **Throughput (RPS)**: 63.54588
- **Error Rate (%)**: 8.1 (2798/34527)

## Container Insights

- **CpuUtilized Average**: min 2.5969148763020833, max 511.8154036458333, avg 254.41507005903455
- **CpuUtilized Maximum**: min 2.5969148763020833, max 511.8154036458333, avg 287.07412397314
- **MemoryUtilized Average**: min 443, max 1141, avg 721
- **MemoryUtilized Maximum**: min 443, max 1164, avg 871.7777777777778
- **NetworkRxBytes Sum**: min 425, max 6463958, avg 3987106
- **NetworkTxBytes Sum**: min 62807, max 9690886, avg 5917821.111111111

## JVM / GC (Prometheus)

- **heap used bytes**: min 477760, max 177209344, avg 43508644.88888889
- **non heap used bytes**: min 2073600, max 94252136, avg 25317060.266666666
- **gc pause rate 5m**: min 0, max 0.25633527929021427, avg 0.04120883984836494
- **gc pause max**: min 0, max 0.699, avg 0.19424999999999995
- **process cpu usage**: min 0, max 0.11557788944723618, avg 0.049266311680506915
- **system cpu usage**: min 0.003003003003003003, max 0.12160804020100502, avg 0.05362129651328107
- **heap committed bytes**: min 1048576, max 190840832, avg 69846812.44444445
- **gc count rate 5m**: min 0, max 1.355158394913156, avg 0.2343024660494503

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

- **CPU Utilization Average**: min 5.47%, max 59.93%, avg 38.37%
- **CPU Utilization Maximum**: min 5.47%, max 59.93%, avg 38.37%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.000 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.000 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Read Throughput Average**: min 341 bytes/sec, max 13842 bytes/sec, avg 4822 bytes/sec
- **Write Throughput Average**: min 2253 bytes/sec, max 2392425 bytes/sec, avg 606391 bytes/sec
- **Read IOPS Average**: min 0.1, max 1.4, avg 0.6
- **Write IOPS Average**: min 0.4, max 35.6, avg 15.4

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/burst-spike/java25/2026-03-06/1/k6-summary.txt
