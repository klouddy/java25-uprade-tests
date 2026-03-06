# Java 25 Scenario Write-Heavy Summary

- **Start Time**: 2026-03-05T15:18:52.154Z
- **End Time**: 2026-03-05T15:32:55.795Z
- **ALB URL**: http://java-bench-alb-1750117799.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 39137
- **Throughput (RPS)**: 46.380788
- **Error Rate (%)**: 0.16 (66/39137)
- **Latency (avg/p90/p95/p99)**: 54.98 / 70.34 / 96.23 / 149.72 ms

## Container Insights

- **CpuUtilized Average**: min 6.1634197998046885, max 141.06462565104167, avg 95.86806517101469
- **CpuUtilized Maximum**: min 6.1634197998046885, max 141.06462565104167, avg 95.86806517101469
- **MemoryUtilized Average**: min 293, max 340, avg 326.35714285714283
- **MemoryUtilized Maximum**: min 293, max 340, avg 326.35714285714283
- **NetworkRxBytes Sum**: min 275, max 2124661, avg 699606.9285714285
- **NetworkTxBytes Sum**: min 21775, max 3194213, avg 1077378.5714285714

## JVM / GC (Prometheus)

- **heap used bytes**: min 142392, max 53477376, avg 25796907.911111113
- **non heap used bytes**: min 2053888, max 93335192, avg 24848388.906666666
- **gc pause rate 5m**: min 0, max 0.0016915254237288133, avg 0.0007541242937853108
- **gc pause max**: min 0, max 0.049, avg 0.022466666666666676
- **process cpu usage**: min 0.001001001001001001, max 0.09456740442655936, avg 0.04666360393205666
- **system cpu usage**: min 0.006, max 0.09198813056379822, avg 0.049688105891664176
- **heap committed bytes**: min 1048576, max 62914560, avg 36001109.333333336
- **gc count rate 5m**: min 0, max 0.3525423728813559, avg 0.13129943502824856

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:108
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java25-3-2026-03-05-1, cpu 512, memory 2048, reservation n/a

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

- **CPU Utilization Average**: min 3.27%, max 22.68%, avg 10.04%
- **CPU Utilization Maximum**: min 3.27%, max 22.68%, avg 10.04%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.002 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.002 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 750 bytes/sec, avg 195 bytes/sec
- **Write Throughput Average**: min 4643 bytes/sec, max 2638887 bytes/sec, avg 650677 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.3, avg 0.3
- **Write IOPS Average**: min 0.6, max 68.2, avg 39.1

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/write-heavy/java25/2026-03-05/1/k6-summary.txt
