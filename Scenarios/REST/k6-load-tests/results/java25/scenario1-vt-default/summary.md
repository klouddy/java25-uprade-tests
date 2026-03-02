# Java 25 Scenario 1 Summary

- **Start Time**: 2026-02-26T18:59:05.304Z
- **End Time**: 2026-02-26T19:13:07.313Z
- **ALB URL**: http://java-bench-alb-1738197142.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: virtual threads default

## K6 Load Results

- **Requests**: 60837
- **Throughput (RPS)**: 72.244612
- **Error Rate (%)**: 3.19 (1941/60837)

## Container Insights

- **CpuUtilized Average**: min 45.08203913370768, max 368.56119140625, avg 242.90380064048466
- **CpuUtilized Maximum**: min 108.04944661458335, max 505.88277343749996, avg 315.375052780878
- **MemoryUtilized Average**: min 323.5, max 731.5, avg 548.1547619047619
- **MemoryUtilized Maximum**: min 351, max 984, avg 640.6428571428571
- **NetworkRxBytes Sum**: min 545614, max 12887659, avg 9295652.92857143
- **NetworkTxBytes Sum**: min 787707, max 19157306, avg 13823029.642857144

## JVM / GC (Prometheus)

- **heap used bytes**: min 6291456, max 329252864, avg 76709754.85714285
- **non heap used bytes**: min 2041344, max 93313664, avg 27482217.257142857
- **gc pause rate 5m**: min 0, max 0.013374074074074076, avg 0.006987054322082469
- **gc pause max**: min 0.044, max 0.203, avg 0.12028571428571429
- **process cpu usage**: min 0.0016672224074691564, max 0.2212121212121212, avg 0.1363702861875893
- **system cpu usage**: min 0.006501083513918987, max 0.23535353535353537, avg 0.1441703642547471
- **heap committed bytes**: min 6291456, max 362807296, avg 126178645.33333333
- **gc count rate 5m**: min 0, max 0.35438596491228064, avg 0.19332724370717333

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 2/2
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:53
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java25-rest-vt-default, cpu 0, memory n/a, reservation n/a

## RDS Database

- **Instance ID**: java-bench-db
- **Instance Class**: db.t4g.medium
- **Engine**: postgres 17.6
- **Allocated Storage**: 20 GB
- **Max Allocated Storage**: n/a GB
- **Status**: available
- **Multi-AZ**: No
- **Database**: benchmarkdb

## RDS Metrics

- **CPU Utilization Average**: min 3.60%, max 99.19%, avg 72.91%
- **CPU Utilization Maximum**: min 3.60%, max 99.19%, avg 72.91%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.002 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.002 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 683 bytes/sec, avg 146 bytes/sec
- **Write Throughput Average**: min 4912 bytes/sec, max 1252363 bytes/sec, avg 383652 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.3, avg 0.3
- **Write IOPS Average**: min 0.5, max 29.2, avg 17.0

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/Scenarios/REST/k6-load-tests/results/java25/scenario1-vt-default/k6-summary.txt
