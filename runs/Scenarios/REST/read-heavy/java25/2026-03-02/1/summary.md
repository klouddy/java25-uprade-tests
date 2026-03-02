# Java 25 Scenario 1 Summary

- **Start Time**: 2026-03-02T17:16:03.641Z
- **End Time**: 2026-03-02T17:30:05.945Z
- **ALB URL**: http://java-bench-alb-1688584286.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 107896
- **Throughput (RPS)**: 128.081767
- **Error Rate (%)**: 1.44 (1561/107896)

## Container Insights

- **CpuUtilized Average**: min 50.82371297200521, max 511.5023958333333, avg 321.76923005603606
- **CpuUtilized Maximum**: min 50.82371297200521, max 511.5023958333333, avg 321.76923005603606
- **MemoryUtilized Average**: min 285, max 1067, avg 468.92857142857144
- **MemoryUtilized Maximum**: min 285, max 1067, avg 468.92857142857144
- **NetworkRxBytes Sum**: min 3230, max 7362502, avg 2943000
- **NetworkTxBytes Sum**: min 43417, max 10868688, avg 4379873.571428572

## JVM / GC (Prometheus)

- **heap used bytes**: min 648880, max 511180800, avg 40150502.57777778
- **non heap used bytes**: min 2059648, max 93553632, avg 25127555.413333334
- **gc pause rate 5m**: min 0.000030508474576271188, max 0.09799082702535956, avg 0.018562725257441442
- **gc pause max**: min 0, max 0.309, avg 0.13613333333333333
- **process cpu usage**: min 0.004020100502512563, max 0.28157589803012745, avg 0.15162216649948954
- **system cpu usage**: min 0.007035175879396985, max 0.2924634420697413, avg 0.15356711675832052
- **heap committed bytes**: min 1048576, max 985661440, avg 86076438.75555556
- **gc count rate 5m**: min 0.003389830508474576, max 0.8067714565614588, avg 0.3098312002511572

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:88
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java25-1-2026-03-02-1, cpu 512, memory 2048, reservation n/a

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

- **CPU Utilization Average**: min 4.45%, max 71.52%, avg 28.21%
- **CPU Utilization Maximum**: min 4.45%, max 71.52%, avg 28.21%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Write Latency Average**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 12223 bytes/sec, avg 1790 bytes/sec
- **Write Throughput Average**: min 3483 bytes/sec, max 2530107 bytes/sec, avg 703930 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.9, avg 0.3
- **Write IOPS Average**: min 0.4, max 52.9, avg 28.7

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/read-heavy/java25/2026-03-02/1/k6-summary.txt
