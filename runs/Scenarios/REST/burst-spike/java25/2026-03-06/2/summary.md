# Java 25 Scenario Burst-Spike Summary

- **Start Time**: 2026-03-06T16:48:02.205Z
- **End Time**: 2026-03-06T16:57:05.281Z
- **ALB URL**: http://java-bench-alb-2121413823.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 1024
- **JVM Settings**: -XX:+UseG1GC -Xmx512m

## K6 Load Results

- **Requests**: 32574
- **Throughput (RPS)**: 59.959938
- **Error Rate (%)**: 10.64 (3469/32574)

## Container Insights

- **CpuUtilized Average**: min 66.4742333984375, max 511.5581770833333, avg 286.8348448859321
- **CpuUtilized Maximum**: min 66.4742333984375, max 511.91713541666667, avg 335.74316297743053
- **MemoryUtilized Average**: min 351.5, max 662, avg 523.3888888888889
- **MemoryUtilized Maximum**: min 417, max 679, avg 599.4444444444445
- **NetworkRxBytes Sum**: min 516897, max 4991351, avg 3179459.3333333335
- **NetworkTxBytes Sum**: min 826693, max 7564580, avg 4729289.888888889

## JVM / GC (Prometheus)

- **heap used bytes**: min 490880, max 280967536, avg 47834859.047619045
- **non heap used bytes**: min 2073984, max 94117984, avg 25201920.22857143
- **gc pause rate 5m**: min 0, max 0.22510847457627123, avg 0.016720703489713825
- **gc pause max**: min 0, max 0.822, avg 0.1542857142857143
- **process cpu usage**: min 0.002008032128514056, max 0.303639846743295, avg 0.09664469282922268
- **system cpu usage**: min 0.006024096385542169, max 0.3055555555555556, avg 0.10213789292199645
- **heap committed bytes**: min 1048576, max 386924544, avg 73500184.38095239
- **gc count rate 5m**: min 0, max 1.4508474576271186, avg 0.11210587083421589

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

- **CPU Utilization Average**: min 7.19%, max 45.53%, avg 30.45%
- **CPU Utilization Maximum**: min 7.19%, max 45.53%, avg 30.45%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.002 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.002 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.006 ms, avg 0.002 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.006 ms, avg 0.002 ms
- **Read Throughput Average**: min 0 bytes/sec, max 12718 bytes/sec, avg 1868 bytes/sec
- **Write Throughput Average**: min 11199 bytes/sec, max 2388718 bytes/sec, avg 606179 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.3, avg 0.4
- **Write IOPS Average**: min 1.1, max 34.7, avg 15.4

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/burst-spike/java25/2026-03-06/2/k6-summary.txt
