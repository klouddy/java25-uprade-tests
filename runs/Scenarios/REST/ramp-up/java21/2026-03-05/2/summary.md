# Java 21 Scenario Ramp-Up Summary

- **Start Time**: 2026-03-05T21:36:50.227Z
- **End Time**: 2026-03-05T21:50:50.679Z
- **ALB URL**: http://java-bench-alb-1235476100.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 1024
- **JVM Settings**: -XX:+UseG1GC -Xmx512m virtual threads

## K6 Load Results

- **Requests**: 139952
- **Throughput (RPS)**: 166.498552
- **Error Rate (%)**: 4.78 (6693/139952)

## Container Insights

- **CpuUtilized Average**: min 10.383160400390624, max 511.8199739583333, avg 438.59027394430984
- **CpuUtilized Maximum**: min 10.383160400390624, max 511.8199739583333, avg 473.9103159586589
- **MemoryUtilized Average**: min 324, max 795, avg 559.4642857142857
- **MemoryUtilized Maximum**: min 324, max 796, avg 619.3571428571429
- **NetworkRxBytes Sum**: min 441, max 7208506, avg 4375891
- **NetworkTxBytes Sum**: min 28153, max 10703894, avg 6471618.5

## JVM / GC (Prometheus)

- **heap used bytes**: min 575056, max 296721968, avg 84491483.02222222
- **non heap used bytes**: min 1998080, max 97122952, avg 26666350.613333333
- **gc pause rate 5m**: min 0, max 0.09730000000000003, avg 0.022092266631404827
- **gc pause max**: min 0, max 0.29, avg 0.10476666666666669
- **process cpu usage**: min 0, max 0.25749741468459153, avg 0.2203540910806093
- **system cpu usage**: min 0, max 0.259927797833935, avg 0.21964115274982132
- **heap committed bytes**: min 1048576, max 370147328, avg 118722104.8888889
- **gc count rate 5m**: min 0, max 0.8172413793103449, avg 0.24205990222919205

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:112
- **Task CPU/Memory**: 512/1024

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java21-4-2026-03-05-2, cpu 512, memory 1024, reservation n/a

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

- **CPU Utilization Average**: min 5.05%, max 62.41%, avg 41.26%
- **CPU Utilization Maximum**: min 5.05%, max 62.41%, avg 41.26%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Write Latency Average**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.003 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 84943 bytes/sec, avg 14076 bytes/sec
- **Write Throughput Average**: min 1025 bytes/sec, max 2470653 bytes/sec, avg 702197 bytes/sec
- **Read IOPS Average**: min 0.0, max 5.6, avg 1.1
- **Write IOPS Average**: min 0.2, max 49.5, avg 27.9

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/ramp-up/java21/2026-03-05/2/k6-summary.txt
