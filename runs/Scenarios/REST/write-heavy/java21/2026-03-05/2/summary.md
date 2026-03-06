# Java 21 Scenario Write-Heavy Summary

- **Start Time**: 2026-03-05T14:22:11.564Z
- **End Time**: 2026-03-05T14:36:13.322Z
- **ALB URL**: http://java-bench-alb-2041695201.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 1024
- **JVM Settings**: -XX:+UseG1GC -Xmx512m virtual threads

## Goal of Test

Testing using virtual threads in java 21. Comparison will be using a smaller container and lower memory settings. How does that affect throughput compared to the same settings in 21 without virtual threads.

## K6 Load Results

- **Requests**: 39031
- **Throughput (RPS)**: 46.35834
- **Error Rate (%)**: 0.12 (48/39031)
- **Latency (avg/p90/p95/p99)**: undefined / undefined / undefined / 179.64 ms

## Container Insights

- **CpuUtilized Average**: min 83.29168782552084, max 209.33697591145832, avg 157.62438162667408
- **CpuUtilized Maximum**: min 83.29168782552084, max 209.33697591145832, avg 157.62438162667408
- **MemoryUtilized Average**: min 304, max 350, avg 340.5
- **MemoryUtilized Maximum**: min 304, max 350, avg 340.5
- **NetworkRxBytes Sum**: min 1910, max 2292559, avg 789137.4285714285
- **NetworkTxBytes Sum**: min 35649, max 3424104, avg 1205518.0714285714

## JVM / GC (Prometheus)

- **heap used bytes**: min 263160, max 58720256, avg 22510773.51111111
- **non heap used bytes**: min 2008448, max 96643752, avg 28329787.52
- **gc pause rate 5m**: min 0.00010124018181818186, max 0.003349152542372881, avg 0.0013984637570117156
- **gc pause max**: min 0.019, max 0.106, avg 0.06673333333333333
- **process cpu usage**: min 0.009027081243731194, max 0.127420998980632, avg 0.07244707671771164
- **system cpu usage**: min 0.011044176706827308, max 0.12562814070351758, avg 0.0726361708571102
- **heap committed bytes**: min 1048576, max 70254592, avg 37702132.62222222
- **gc count rate 5m**: min 0.007499272727272728, max 0.4983050847457627, avg 0.1938506362273459

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:107
- **Task CPU/Memory**: 512/1024

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java21-3-2026-03-05-2, cpu 512, memory 1024, reservation n/a

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

- **CPU Utilization Average**: min 4.88%, max 24.07%, avg 12.22%
- **CPU Utilization Maximum**: min 4.88%, max 24.07%, avg 12.22%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 14074 bytes/sec, avg 2551 bytes/sec
- **Write Throughput Average**: min 104451 bytes/sec, max 2657201 bytes/sec, avg 662675 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.7, avg 0.4
- **Write IOPS Average**: min 8.3, max 71.2, avg 40.1

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/write-heavy/java21/2026-03-05/2/k6-summary.txt
