# Java 25 Scenario Balanced Summary

- **Start Time**: 2026-03-04T19:59:49.813Z
- **End Time**: 2026-03-04T20:13:51.348Z
- **ALB URL**: http://java-bench-alb-1125659394.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 70002
- **Throughput (RPS)**: 83.173923
- **Error Rate (%)**: 0.7 (492/70002)

## Container Insights

- **CpuUtilized Average**: min 63.48961344401042, max 507.9522395833333, avg 294.7774615769159
- **CpuUtilized Maximum**: min 63.48961344401042, max 507.9522395833333, avg 294.7774615769159
- **MemoryUtilized Average**: min 313, max 1069, avg 491.35714285714283
- **MemoryUtilized Maximum**: min 313, max 1069, avg 491.35714285714283
- **NetworkRxBytes Sum**: min 1047, max 6056519, avg 2252292
- **NetworkTxBytes Sum**: min 42449, max 8988747, avg 3368148.714285714

## JVM / GC (Prometheus)

- **heap used bytes**: min 903800, max 520968800, avg 47406003.37777778
- **non heap used bytes**: min 2066560, max 93519344, avg 26477818.98666667
- **gc pause rate 5m**: min 0, max 0.14416271186440677, avg 0.02362771250272455
- **gc pause max**: min 0.016, max 0.826, avg 0.2851111111111111
- **process cpu usage**: min 0.006048387096774193, max 0.26352128883774456, avg 0.12483029208058137
- **system cpu usage**: min 0.00907258064516129, max 0.2658227848101266, avg 0.13519824363341587
- **heap committed bytes**: min 1048576, max 963641344, avg 90177536
- **gc count rate 5m**: min 0, max 0.9423728813559322, avg 0.25711660505844275

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:102
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java25-2-2026-03-04-1, cpu 512, memory 2048, reservation n/a

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

- **CPU Utilization Average**: min 4.47%, max 53.13%, avg 24.01%
- **CPU Utilization Maximum**: min 4.47%, max 53.13%, avg 24.01%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 9072 bytes/sec, avg 892 bytes/sec
- **Write Throughput Average**: min 11158 bytes/sec, max 2648114 bytes/sec, avg 594269 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.3, avg 0.3
- **Write IOPS Average**: min 1.3, max 67.4, avg 32.5

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/balanced/java25/2026-03-04/1/k6-summary.txt
