# Java 21 Scenario Balanced Summary

- **Start Time**: 2026-03-04T19:03:58.904Z
- **End Time**: 2026-03-04T19:17:59.434Z
- **ALB URL**: http://java-bench-alb-1751931076.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 1024
- **JVM Settings**: -XX:+UseG1GC -Xmx512m VT

## K6 Load Results

- **Requests**: 76027
- **Throughput (RPS)**: 90.431851
- **Error Rate (%)**: 0.68 (520/76027)
- **Latency (avg/p90/p95/p99)**: 166.29 / 436.88 / 705.74 / undefined ms

## Container Insights

- **CpuUtilized Average**: min 19.1723681640625, max 477.2157291666667, avg 267.13146135602676
- **CpuUtilized Maximum**: min 19.1723681640625, max 477.2157291666667, avg 267.13146135602676
- **MemoryUtilized Average**: min 328, max 564, avg 405.7857142857143
- **MemoryUtilized Maximum**: min 328, max 564, avg 405.7857142857143
- **NetworkRxBytes Sum**: min 288, max 7565772, avg 2528427.4285714286
- **NetworkTxBytes Sum**: min 25894, max 11137273, avg 3767895.9285714286

## JVM / GC (Prometheus)

- **heap used bytes**: min 511360, max 171966464, avg 37032046.755555555
- **non heap used bytes**: min 2027648, max 96999504, avg 29665528
- **gc pause rate 5m**: min 0, max 0.02457627118644068, avg 0.003683071720043766
- **gc pause max**: min 0, max 0.188, avg 0.0493076923076923
- **process cpu usage**: min 0.0050251256281407045, max 0.2443298969072165, avg 0.12681470910650844
- **system cpu usage**: min 0.016080402010050253, max 0.2587628865979381, avg 0.13202503591558432
- **heap committed bytes**: min 1048576, max 222298112, avg 61563062.04444444
- **gc count rate 5m**: min 0, max 1.0169491525423728, avg 0.23331144956192507

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:101
- **Task CPU/Memory**: 512/1024

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java21-2-2026-03-04-2, cpu 512, memory 1024, reservation n/a

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

- **CPU Utilization Average**: min 5.56%, max 65.72%, avg 26.91%
- **CPU Utilization Maximum**: min 5.56%, max 65.72%, avg 26.91%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.010 ms, avg 0.001 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.010 ms, avg 0.001 ms
- **Write Latency Average**: min 0.000 ms, max 0.006 ms, avg 0.002 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.006 ms, avg 0.002 ms
- **Read Throughput Average**: min 0 bytes/sec, max 16517 bytes/sec, avg 3195 bytes/sec
- **Write Throughput Average**: min 66686 bytes/sec, max 2616640 bytes/sec, avg 729276 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.6, avg 0.5
- **Write IOPS Average**: min 6.2, max 65.8, avg 32.1

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/balanced/java21/2026-03-04/2/k6-summary.txt
