# Java 17 Scenario Balanced Summary

- **Start Time**: 2026-03-04T14:23:27.327Z
- **End Time**: 2026-03-04T14:37:29.445Z
- **ALB URL**: http://java-bench-alb-1856837707.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 73090
- **Throughput (RPS)**: 86.77352
- **Error Rate (%)**: 0.68 (500/73090)

## Container Insights

- **CpuUtilized Average**: min 26.45463623046875, max 511.84782552083334, avg 262.3367764718192
- **CpuUtilized Maximum**: min 26.45463623046875, max 511.84782552083334, avg 262.3367764718192
- **MemoryUtilized Average**: min 331, max 1231, avg 545.2142857142857
- **MemoryUtilized Maximum**: min 331, max 1231, avg 545.2142857142857
- **NetworkRxBytes Sum**: min 1186, max 7442734, avg 2569641.714285714
- **NetworkTxBytes Sum**: min 32570, max 11008733, avg 3847927.785714286

## JVM / GC (Prometheus)

- **heap used bytes**: min 371568, max 830844928, avg 70146425.6
- **non heap used bytes**: min 1438464, max 94474440, avg 28190437.973333333
- **gc pause rate 5m**: min 0.00006440677966101696, max 0.09349830508474576, avg 0.017496948414062272
- **gc pause max**: min 0.012, max 0.299, avg 0.12846666666666665
- **process cpu usage**: min 0.0020100502512562816, max 0.2543478260869565, avg 0.12337825179431294
- **system cpu usage**: min 0.00165858202811245, max 0.2550908108695652, avg 0.12341585399238587
- **heap committed bytes**: min 1048576, max 1004535808, avg 118232769.42222223
- **gc count rate 5m**: min 0.003389830508474576, max 0.9661016949152542, avg 0.3527682129666304

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:99
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java17-2-2026-03-04-1, cpu 512, memory 2048, reservation n/a

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

- **CPU Utilization Average**: min 4.74%, max 58.11%, avg 25.70%
- **CPU Utilization Maximum**: min 4.74%, max 58.11%, avg 25.70%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 4978 bytes/sec, avg 999 bytes/sec
- **Write Throughput Average**: min 1024 bytes/sec, max 2627340 bytes/sec, avg 758391 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.5, avg 0.3
- **Write IOPS Average**: min 0.2, max 63.3, avg 35.2

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/balanced/java17/2026-03-04/1/k6-summary.txt
