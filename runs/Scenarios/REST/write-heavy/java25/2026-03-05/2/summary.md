# Java 25 Scenario Write-Heavy Summary

- **Start Time**: 2026-03-05T17:40:43.362Z
- **End Time**: 2026-03-05T17:54:44.523Z
- **ALB URL**: http://java-bench-alb-366612641.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 1024
- **JVM Settings**: -XX:+UseG1GC -Xmx512m

## K6 Load Results

- **Requests**: 39212
- **Throughput (RPS)**: 46.605984
- **Error Rate (%)**: 0.11 (44/39212)
- **Latency (avg/p90/p95/p99)**: undefined / undefined / undefined / 172.04 ms

## Container Insights

- **CpuUtilized Average**: min 33.82309061686198, max 231.5557942708333, avg 134.09096189953033
- **CpuUtilized Maximum**: min 33.82309061686198, max 231.5557942708333, avg 134.09096189953033
- **MemoryUtilized Average**: min 313, max 366, avg 351.7142857142857
- **MemoryUtilized Maximum**: min 313, max 366, avg 351.7142857142857
- **NetworkRxBytes Sum**: min 465, max 2462080, avg 778729.5714285715
- **NetworkTxBytes Sum**: min 23106, max 3680314, avg 1189615

## JVM / GC (Prometheus)

- **heap used bytes**: min 0, max 63963136, avg 24991970.844444446
- **non heap used bytes**: min 2048256, max 93379392, avg 26978835.30666667
- **gc pause rate 5m**: min 0, max 0.0022779661016949157, avg 0.0011059887005649717
- **gc pause max**: min 0, max 0.091, avg 0.055866666666666655
- **process cpu usage**: min 0.003015075376884422, max 0.17404426559356137, avg 0.06699858080688045
- **system cpu usage**: min 0.008040201005025126, max 0.19014084507042253, avg 0.06960633517963312
- **heap committed bytes**: min 1048576, max 74448896, avg 42292565.333333336
- **gc count rate 5m**: min 0, max 0.31525423728813556, avg 0.11209039548022598

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:109
- **Task CPU/Memory**: 512/1024

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java25-3-2026-03-05-2, cpu 512, memory 1024, reservation n/a

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

- **CPU Utilization Average**: min 5.08%, max 24.52%, avg 12.57%
- **CPU Utilization Maximum**: min 5.08%, max 24.52%, avg 12.57%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 11786 bytes/sec, avg 1768 bytes/sec
- **Write Throughput Average**: min 1092 bytes/sec, max 2712825 bytes/sec, avg 802041 bytes/sec
- **Read IOPS Average**: min 0.0, max 2.5, avg 0.4
- **Write IOPS Average**: min 0.2, max 81.1, avg 39.5

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/write-heavy/java25/2026-03-05/2/k6-summary.txt
