# Java 21 Scenario Ramp-Up Summary

- **Start Time**: 2026-03-05T20:19:28.869Z
- **End Time**: 2026-03-05T20:33:29.192Z
- **ALB URL**: http://java-bench-alb-119442142.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 157352
- **Throughput (RPS)**: 187.217049
- **Error Rate (%)**: 3.77 (5942/157352)

## Container Insights

- **CpuUtilized Average**: min 58.229739023844395, max 511.9865234375, avg 445.7863723064605
- **CpuUtilized Maximum**: min 58.229739023844395, max 511.9865234375, avg 463.337811529977
- **MemoryUtilized Average**: min 312, max 1300, avg 708.4285714285714
- **MemoryUtilized Maximum**: min 312, max 1300, avg 769.3571428571429
- **NetworkRxBytes Sum**: min 3836, max 9789368, avg 5664755.928571428
- **NetworkTxBytes Sum**: min 34946, max 14398706, avg 8342803.5

## JVM / GC (Prometheus)

- **heap used bytes**: min 753952, max 973005400, avg 87506169.86666666
- **non heap used bytes**: min 2022656, max 97163840, avg 26147358.4
- **gc pause rate 5m**: min 0, max 0.24703905860791206, avg 0.05291010699109397
- **gc pause max**: min 0.006, max 0.688, avg 0.2320833333333333
- **process cpu usage**: min 0.003006012024048096, max 0.2564901349948079, avg 0.19646061419533292
- **system cpu usage**: min 0.006012024048096192, max 0.25750394944707744, avg 0.19301589744787492
- **heap committed bytes**: min 1048576, max 1015021568, avg 146311304.53333333
- **gc count rate 5m**: min 0, max 1.6172134963190292, avg 0.48262872475905233

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:111
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java21-4-2026-03-05-1, cpu 512, memory 2048, reservation n/a

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

- **CPU Utilization Average**: min 4.66%, max 80.15%, avg 49.23%
- **CPU Utilization Maximum**: min 4.66%, max 80.15%, avg 49.23%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.008 ms, avg 0.001 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.008 ms, avg 0.001 ms
- **Write Latency Average**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 11724 bytes/sec, avg 1350 bytes/sec
- **Write Throughput Average**: min 5599 bytes/sec, max 2734622 bytes/sec, avg 604872 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.8, avg 0.4
- **Write IOPS Average**: min 0.7, max 74.9, avg 33.8

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/ramp-up/java21/2026-03-05/1/k6-summary.txt
