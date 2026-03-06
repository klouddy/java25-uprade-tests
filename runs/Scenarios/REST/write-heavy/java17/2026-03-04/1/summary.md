# Java 17 Scenario Write-Heavy Summary

- **Start Time**: 2026-03-04T21:46:30.591Z
- **End Time**: 2026-03-04T22:00:32.090Z
- **ALB URL**: http://java-bench-alb-1100904234.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 39163
- **Throughput (RPS)**: 46.52852
- **Error Rate (%)**: 0.14 (55/39163)
- **Latency (avg/p90/p95/p99)**: 56.09 / 75.04 / 99.75 / 164.56 ms

## Container Insights

- **CpuUtilized Average**: min 44.190354512532544, max 227.64569661458333, avg 143.5641092136928
- **CpuUtilized Maximum**: min 44.190354512532544, max 227.64569661458333, avg 143.5641092136928
- **MemoryUtilized Average**: min 339, max 391, avg 380.5
- **MemoryUtilized Maximum**: min 339, max 391, avg 380.5
- **NetworkRxBytes Sum**: min 548, max 2323647, avg 750374.2142857143
- **NetworkTxBytes Sum**: min 29423, max 3488920, avg 1151284.9285714286

## JVM / GC (Prometheus)

- **heap used bytes**: min 451424, max 77594624, avg 28289806.222222224
- **non heap used bytes**: min 1438080, max 94504808, avg 28080965.653333332
- **gc pause rate 5m**: min 0, max 0.0017593220338983052, avg 0.0008202568682836099
- **gc pause max**: min 0, max 0.095, avg 0.045333333333333344
- **process cpu usage**: min 0.004008016032064128, max 0.15628192032686414, avg 0.06296557891431456
- **system cpu usage**: min 0.0032804720440881762, max 0.1559777895812053, avg 0.06284591309726553
- **heap committed bytes**: min 1048576, max 98566144, avg 53127850.666666664
- **gc count rate 5m**: min 0, max 0.3220338983050847, avg 0.11163975833190089

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:104
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java17-3-2026-03-04-1, cpu 512, memory 2048, reservation n/a

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

- **CPU Utilization Average**: min 5.29%, max 23.92%, avg 12.07%
- **CPU Utilization Maximum**: min 5.29%, max 23.92%, avg 12.07%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Write Latency Average**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 10781 bytes/sec, avg 1004 bytes/sec
- **Write Throughput Average**: min 2664 bytes/sec, max 2695787 bytes/sec, avg 796972 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.9, avg 0.3
- **Write IOPS Average**: min 0.4, max 77.1, avg 38.9

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/write-heavy/java17/2026-03-04/1/k6-summary.txt
