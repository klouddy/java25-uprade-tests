# Java 25 Scenario Ramp-Up Summary

- **Start Time**: 2026-03-06T16:22:27.970Z
- **End Time**: 2026-03-06T16:36:28.654Z
- **ALB URL**: http://java-bench-alb-2121413823.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 1024
- **JVM Settings**: -XX:+UseG1GC -Xmx512m

## K6 Load Results

- **Requests**: 128195
- **Throughput (RPS)**: 152.454849
- **Error Rate (%)**: 4.22 (5421/128195)

## Container Insights

- **CpuUtilized Average**: min 219.68968851725262, max 511.9598046875, avg 456.2622264353435
- **CpuUtilized Maximum**: min 219.68968851725262, max 511.9598046875, avg 490.49562228248243
- **MemoryUtilized Average**: min 289, max 699, avg 507.35714285714283
- **MemoryUtilized Maximum**: min 289, max 705, avg 550.4285714285714
- **NetworkRxBytes Sum**: min 18631, max 5963106, avg 3783332.5714285714
- **NetworkTxBytes Sum**: min 53688, max 8768351, avg 5570047.071428572

## JVM / GC (Prometheus)

- **heap used bytes**: min 1710912, max 219676672, avg 34037883.666666664
- **non heap used bytes**: min 2051840, max 93775360, avg 25122652.2
- **gc pause rate 5m**: min 0, max 0.23559979054240784, avg 0.042553796449947626
- **gc pause max**: min 0, max 0.902, avg 0.2522222222222223
- **process cpu usage**: min 0.0020060180541624875, max 0.25326633165829143, avg 0.2184949917389249
- **system cpu usage**: min 0.0160481444332999, max 0.26030150753768844, avg 0.2250742383585057
- **heap committed bytes**: min 2097152, max 448790528, avg 67065173.333333336
- **gc count rate 5m**: min 0, max 1.5454770251203653, avg 0.34076704078033937

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:115
- **Task CPU/Memory**: 512/1024

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java25-4-2026-03-06-4, cpu 512, memory 1024, reservation n/a

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

- **CPU Utilization Average**: min 4.80%, max 53.47%, avg 36.63%
- **CPU Utilization Maximum**: min 4.80%, max 53.47%, avg 36.63%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.004 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.004 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 10444 bytes/sec, avg 995 bytes/sec
- **Write Throughput Average**: min 7097 bytes/sec, max 2640684 bytes/sec, avg 728448 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.3, avg 0.3
- **Write IOPS Average**: min 0.9, max 63.4, avg 31.2

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/ramp-up/java25/2026-03-06/4/k6-summary.txt
