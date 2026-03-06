# Java 21 Scenario Burst-Spike Summary

- **Start Time**: 2026-03-06T13:25:44.894Z
- **End Time**: 2026-03-06T13:34:47.646Z
- **ALB URL**: http://java-bench-alb-1550355969.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 1024
- **JVM Settings**: -XX:+UseG1GC -Xmx512m virtual threads

## K6 Load Results

- **Requests**: 61282
- **Throughput (RPS)**: 112.879307
- **Error Rate (%)**: 2.46 (1509/61282)

## Container Insights

- **CpuUtilized Average**: min 27.925020751953127, max 511.92890624999995, avg 334.70018532081883
- **CpuUtilized Maximum**: min 27.925020751953127, max 511.92890624999995, avg 334.70018532081883
- **MemoryUtilized Average**: min 293, max 774, avg 527.3333333333334
- **MemoryUtilized Maximum**: min 293, max 774, avg 527.3333333333334
- **NetworkRxBytes Sum**: min 341, max 3818490, avg 1440314
- **NetworkTxBytes Sum**: min 26376, max 5648699, avg 2152246.3333333335

## JVM / GC (Prometheus)

- **heap used bytes**: min 1210464, max 329476880, avg 68978683.46666667
- **non heap used bytes**: min 2012928, max 96616416, avg 28295422.72
- **gc pause rate 5m**: min 0.000516225925925926, max 0.04767167123733461, avg 0.023321330135557084
- **gc pause max**: min 0.05, max 0.389, avg 0.19080000000000003
- **process cpu usage**: min 0.004, max 0.25538971807628524, avg 0.1473872810452308
- **system cpu usage**: min 0.01001001001001001, max 0.2552653748946925, avg 0.14816244852045124
- **heap committed bytes**: min 2097152, max 411041792, avg 97936998.4
- **gc count rate 5m**: min 0.01720753086419753, max 0.4881405573616002, avg 0.26309564196021085

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:113
- **Task CPU/Memory**: 512/1024

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java21-5-2026-03-05-2, cpu 512, memory 1024, reservation n/a

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

- **CPU Utilization Average**: min 5.02%, max 40.16%, avg 18.26%
- **CPU Utilization Maximum**: min 5.02%, max 40.16%, avg 18.26%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.003 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.003 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 12699 bytes/sec, avg 2586 bytes/sec
- **Write Throughput Average**: min 18562 bytes/sec, max 2599172 bytes/sec, avg 679935 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.7, avg 0.4
- **Write IOPS Average**: min 2.1, max 58.0, avg 24.2

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/burst-spike/java21/2026-03-05/2/k6-summary.txt
