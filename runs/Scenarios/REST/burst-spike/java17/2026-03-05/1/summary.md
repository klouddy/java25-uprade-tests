# Java 17 Scenario Burst-Spike Summary

- **Start Time**: 2026-03-05T19:00:11.262Z
- **End Time**: 2026-03-05T19:09:14.219Z
- **ALB URL**: http://java-bench-alb-115903653.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 27385
- **Throughput (RPS)**: 50.419099
- **Error Rate (%)**: 6.86 (1881/27385)

## Container Insights

- **CpuUtilized Average**: min 4.161721903483073, max 511.9174609375, avg 298.0229569442184
- **CpuUtilized Maximum**: min 4.161721903483073, max 511.9536588541667, avg 342.7749807513202
- **MemoryUtilized Average**: min 523.5, max 1196, avg 802.3333333333334
- **MemoryUtilized Maximum**: min 553, max 1196, avg 900.6666666666666
- **NetworkRxBytes Sum**: min 27, max 4521151, avg 2650536.4444444445
- **NetworkTxBytes Sum**: min 57, max 6868916, avg 3936787.3333333335

## JVM / GC (Prometheus)

- **heap used bytes**: min 498344, max 446236528, avg 79521267.42857143
- **non heap used bytes**: min 1439616, max 94087728, avg 28304243.65714286
- **gc pause rate 5m**: min 0, max 0.2073864406779661, avg 0.021505381979132817
- **gc pause max**: min 0, max 0.909, avg 0.29717647058823515
- **process cpu usage**: min 0.0010030090270812437, max 0.25523349436392917, avg 0.13503722327726342
- **system cpu usage**: min 0.001859478335005015, max 0.2551268239935588, avg 0.13529970145742723
- **heap committed bytes**: min 1048576, max 1016070144, avg 167872024.3809524
- **gc count rate 5m**: min 0, max 1.0915254237288134, avg 0.14600086250629707

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:110
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java17-4-2026-03-05-1, cpu 512, memory 2048, reservation n/a

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

- **CPU Utilization Average**: min 4.87%, max 41.45%, avg 27.00%
- **CPU Utilization Maximum**: min 4.87%, max 41.45%, avg 27.00%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Write Latency Average**: min 0.000 ms, max 0.016 ms, avg 0.003 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.016 ms, avg 0.003 ms
- **Read Throughput Average**: min 0 bytes/sec, max 14181 bytes/sec, avg 5367 bytes/sec
- **Write Throughput Average**: min 3685 bytes/sec, max 2363528 bytes/sec, avg 592121 bytes/sec
- **Read IOPS Average**: min 0.0, max 2.0, avg 0.6
- **Write IOPS Average**: min 0.5, max 32.0, avg 13.9

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/burst-spike/java17/2026-03-05/1/k6-summary.txt
