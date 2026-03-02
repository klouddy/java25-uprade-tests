# Java 21 Scenario 1 Summary

- **Start Time**: 2026-03-02T14:16:30.165Z
- **End Time**: 2026-03-02T14:30:31.387Z
- **ALB URL**: http://java-bench-alb-832402291.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 64517
- **Throughput (RPS)**: 76.685807
- **Error Rate (%)**: 0 (0/64517)

## Container Insights

- **CpuUtilized Average**: min 12.405528564453125, max 511.97462239583336, avg 307.45463521321614
- **CpuUtilized Maximum**: min 12.405528564453125, max 511.97462239583336, avg 319.78098461332775
- **MemoryUtilized Average**: min 547, max 1220, avg 1019.4642857142857
- **MemoryUtilized Maximum**: min 1042, max 1239, avg 1099.357142857143
- **NetworkRxBytes Sum**: min 171063, max 9038333, avg 4578020.571428572
- **NetworkTxBytes Sum**: min 339677, max 13512203, avg 6900086.142857143

## JVM / GC (Prometheus)


## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:84
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java17-1-2026-02-27-1, cpu 512, memory 2048, reservation n/a

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

- **CPU Utilization Average**: min 7.35%, max 74.88%, avg 41.32%
- **CPU Utilization Maximum**: min 7.35%, max 74.88%, avg 41.32%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.003 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.003 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.006 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.006 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 17063 bytes/sec, avg 1555 bytes/sec
- **Write Throughput Average**: min 956 bytes/sec, max 2497436 bytes/sec, avg 623153 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.3, avg 0.3
- **Write IOPS Average**: min 0.2, max 47.7, avg 19.2

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/read-heavy/java17/2026-02-27/1/k6-summary.txt
