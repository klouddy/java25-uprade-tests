# Java 21 Scenario Balanced Summary

- **Start Time**: 2026-03-04T17:32:39.861Z
- **End Time**: 2026-03-04T17:46:41.362Z
- **ALB URL**: http://java-bench-alb-846027440.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 73046
- **Throughput (RPS)**: 86.79065
- **Error Rate (%)**: 0.79 (580/73046)

## Container Insights

- **CpuUtilized Average**: min 15.621476847330728, max 511.8321875, avg 216.8511750575474
- **CpuUtilized Maximum**: min 15.621476847330728, max 511.8321875, avg 216.8511750575474
- **MemoryUtilized Average**: min 394, max 1289, avg 519.2142857142857
- **MemoryUtilized Maximum**: min 394, max 1289, avg 519.2142857142857
- **NetworkRxBytes Sum**: min 968, max 6167834, avg 2591440.785714286
- **NetworkTxBytes Sum**: min 32513, max 9135693, avg 3884005

## JVM / GC (Prometheus)

- **heap used bytes**: min 0, max 726638128, avg 55186018.666666664
- **non heap used bytes**: min 2020096, max 97031544, avg 30009965.973333333
- **gc pause rate 5m**: min 0, max 0.12094915254237287, avg 0.0135293157564344
- **gc pause max**: min 0, max 0.389, avg 0.06985185185185186
- **process cpu usage**: min 0.001001001001001001, max 0.25316455696202533, avg 0.09932063927195856
- **system cpu usage**: min 0.005005005005005005, max 0.2508630609896433, avg 0.10308726433136953
- **heap committed bytes**: min 1048576, max 1017118720, avg 94301934.93333334
- **gc count rate 5m**: min 0, max 1.2203389830508473, avg 0.21531701192718142

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:100
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java21-2-2026-03-04-1, cpu 512, memory 2048, reservation n/a

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

- **CPU Utilization Average**: min 4.38%, max 57.50%, avg 23.22%
- **CPU Utilization Maximum**: min 4.38%, max 57.50%, avg 23.22%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.010 ms, avg 0.001 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.010 ms, avg 0.001 ms
- **Write Latency Average**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 13457 bytes/sec, avg 2863 bytes/sec
- **Write Throughput Average**: min 1639 bytes/sec, max 2602040 bytes/sec, avg 776704 bytes/sec
- **Read IOPS Average**: min 0.0, max 2.5, avg 0.5
- **Write IOPS Average**: min 0.3, max 67.2, avg 36.6

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/balanced/java21/2026-03-04/1/k6-summary.txt
