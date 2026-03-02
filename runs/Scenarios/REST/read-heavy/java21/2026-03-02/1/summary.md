# Java 21 Scenario 1 Summary

- **Start Time**: 2026-03-02T16:20:27.967Z
- **End Time**: 2026-03-02T16:34:29.435Z
- **ALB URL**: http://java-bench-alb-757678382.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 120612
- **Throughput (RPS)**: 143.319123
- **Error Rate (%)**: 1.37 (1653/120612)
- **Latency (avg/p90/p95/p99)**: 152.65 / 416.58 / 598.65 / undefined ms

## Container Insights

- **CpuUtilized Average**: min 54.09717814127604, max 478.1712109375, avg 230.21581348237538
- **CpuUtilized Maximum**: min 54.09717814127604, max 478.1712109375, avg 230.21581348237538
- **MemoryUtilized Average**: min 306, max 697, avg 432.92857142857144
- **MemoryUtilized Maximum**: min 306, max 697, avg 432.92857142857144
- **NetworkRxBytes Sum**: min 1790, max 10074538, avg 3495535.5
- **NetworkTxBytes Sum**: min 37855, max 14967486, avg 5225233.285714285

## JVM / GC (Prometheus)

- **heap used bytes**: min 0, max 193986560, avg 32927662.044444446
- **non heap used bytes**: min 2022016, max 96797856, avg 26213722.666666668
- **gc pause rate 5m**: min 0.0000576271186440678, max 0.017328989786336808, avg 0.004796405685913331
- **gc pause max**: min 0.011, max 0.204, avg 0.10559999999999999
- **process cpu usage**: min 0.003003003003003003, max 0.244817374136229, avg 0.10193467904273298
- **system cpu usage**: min 0.006006006006006006, max 0.23198420533070088, avg 0.10279754035965497
- **heap committed bytes**: min 1048576, max 283115520, avg 67761311.28888889
- **gc count rate 5m**: min 0.003389830508474576, max 0.9016949152542373, avg 0.38689381979365767

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:87
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java21-1-2026-03-02-1, cpu 512, memory 2048, reservation n/a

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

- **CPU Utilization Average**: min 4.83%, max 83.83%, avg 33.36%
- **CPU Utilization Maximum**: min 4.83%, max 83.83%, avg 33.36%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 3139 bytes/sec, avg 375 bytes/sec
- **Write Throughput Average**: min 3687 bytes/sec, max 2598478 bytes/sec, avg 565268 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.5, avg 0.3
- **Write IOPS Average**: min 0.5, max 61.2, avg 29.6

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/read-heavy/java21/2026-03-02/1/k6-summary.txt
