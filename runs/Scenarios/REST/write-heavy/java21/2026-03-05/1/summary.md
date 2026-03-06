# Java 21 Scenario Write-Heavy Summary

- **Start Time**: 2026-03-05T13:36:13.984Z
- **End Time**: 2026-03-05T13:50:14.388Z
- **ALB URL**: http://java-bench-alb-233313700.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## Goal of Test

Testing baseline of java 21 vs java 17 with no other changes.

## K6 Load Results

- **Requests**: 39151
- **Throughput (RPS)**: 46.578139
- **Error Rate (%)**: 0.15 (62/39151)
- **Latency (avg/p90/p95/p99)**: undefined / undefined / undefined / 170.79 ms

## Container Insights

- **CpuUtilized Average**: min 57.277082926432286, max 191.48053385416665, avg 132.29025596981958
- **CpuUtilized Maximum**: min 57.277082926432286, max 191.48053385416665, avg 132.29025596981958
- **MemoryUtilized Average**: min 357, max 397, avg 387.07142857142856
- **MemoryUtilized Maximum**: min 357, max 397, avg 387.07142857142856
- **NetworkRxBytes Sum**: min 1700, max 2478554, avg 788357.0714285715
- **NetworkTxBytes Sum**: min 36820, max 3721645, avg 1209388.7857142857

## JVM / GC (Prometheus)

- **heap used bytes**: min 404336, max 77594624, avg 29666763.377777778
- **non heap used bytes**: min 2018432, max 96892080, avg 30282670.293333333
- **gc pause rate 5m**: min 0, max 0.0021288135593220334, avg 0.0005380437977569121
- **gc pause max**: min 0, max 0.089, avg 0.03383333333333333
- **process cpu usage**: min 0.004016064257028112, max 0.13463514902363824, avg 0.061834708816430446
- **system cpu usage**: min 0.010040160642570281, max 0.13241106719367587, avg 0.06728548092869432
- **heap committed bytes**: min 1048576, max 98566144, avg 52219084.8
- **gc count rate 5m**: min 0, max 0.31525423728813556, avg 0.06724900647264848

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:106
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java21-3-2026-03-05-1, cpu 512, memory 2048, reservation n/a

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

- **CPU Utilization Average**: min 4.87%, max 26.21%, avg 12.51%
- **CPU Utilization Maximum**: min 4.87%, max 26.21%, avg 12.51%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 12975 bytes/sec, avg 1687 bytes/sec
- **Write Throughput Average**: min 93867 bytes/sec, max 2663971 bytes/sec, avg 663973 bytes/sec
- **Read IOPS Average**: min 0.0, max 2.6, avg 0.4
- **Write IOPS Average**: min 7.6, max 72.0, avg 40.2

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/write-heavy/java21/2026-03-05/1/k6-summary.txt
