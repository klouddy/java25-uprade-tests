# Java 21 Scenario Burst-Spike Summary

- **Start Time**: 2026-03-05T20:42:43.628Z
- **End Time**: 2026-03-05T20:51:46.773Z
- **ALB URL**: http://java-bench-alb-119442142.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 29070
- **Throughput (RPS)**: 53.50889
- **Error Rate (%)**: 6.66 (1938/29070)

## Container Insights

- **CpuUtilized Average**: min 3.5244771321614583, max 511.86899739583333, avg 268.939003494404
- **CpuUtilized Maximum**: min 3.5244771321614583, max 511.86899739583333, avg 342.45430121527784
- **MemoryUtilized Average**: min 493, max 1128.5, avg 823.3888888888889
- **MemoryUtilized Maximum**: min 493, max 1245, avg 930.3333333333334
- **NetworkRxBytes Sum**: min 401, max 5608700, avg 3154922.3333333335
- **NetworkTxBytes Sum**: min 62942, max 8337988, avg 4686969.666666667

## JVM / GC (Prometheus)

- **heap used bytes**: min 1334488, max 825728560, avg 100110216
- **non heap used bytes**: min 2014464, max 97462008, avg 27641928.533333335
- **gc pause rate 5m**: min 0, max 0.011954993517208863, avg 0.002084455219921092
- **gc pause max**: min 0, max 0.285, avg 0.09666666666666665
- **process cpu usage**: min 0.001001001001001001, max 0.2529691211401425, avg 0.09207088778751311
- **system cpu usage**: min 0.004004004004004004, max 0.25415676959619954, avg 0.09611262944132092
- **heap committed bytes**: min 2097152, max 967835648, avg 182918257.7777778
- **gc count rate 5m**: min 0, max 0.12931675310388183, avg 0.031108822760559957

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:111
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java21-4-2026-03-05-1, cpu 512, memory 2048, reservation n/a

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

- **CPU Utilization Average**: min 5.17%, max 50.79%, avg 28.76%
- **CPU Utilization Maximum**: min 5.17%, max 50.79%, avg 28.76%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.000 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.000 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.004 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.004 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 819 bytes/sec, avg 129 bytes/sec
- **Write Throughput Average**: min 1297 bytes/sec, max 2419322 bytes/sec, avg 587812 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.3, avg 0.2
- **Write IOPS Average**: min 0.2, max 37.3, avg 13.6

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/burst-spike/java21/2026-03-05/1/k6-summary.txt
