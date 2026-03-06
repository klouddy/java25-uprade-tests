# Java 17 Scenario Ramp-Up Summary

- **Start Time**: 2026-03-05T18:29:42.516Z
- **End Time**: 2026-03-05T18:43:43.909Z
- **ALB URL**: http://java-bench-alb-115903653.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m

## K6 Load Results

- **Requests**: 150008
- **Throughput (RPS)**: 178.256692
- **Error Rate (%)**: 3.7 (5553/150008)

## Container Insights

- **CpuUtilized Average**: min 48.26808380126953, max 511.86389322916665, avg 435.33394797915514
- **CpuUtilized Maximum**: min 48.26808380126953, max 511.86389322916665, avg 465.8035164024717
- **MemoryUtilized Average**: min 362, max 1309, avg 665.3928571428571
- **MemoryUtilized Maximum**: min 362, max 1309, avg 762.4285714285714
- **NetworkRxBytes Sum**: min 528, max 9079699, avg 5356360.071428572
- **NetworkTxBytes Sum**: min 23561, max 13378722, avg 7890125.714285715

## JVM / GC (Prometheus)

- **heap used bytes**: min 3077376, max 430813184, avg 58943836.266666666
- **non heap used bytes**: min 1433472, max 94361576, avg 27703484
- **gc pause rate 5m**: min 0, max 0.22264210526315786, avg 0.024285258756832507
- **gc pause max**: min 0, max 0.299, avg 0.17439999999999997
- **process cpu usage**: min 0.003006012024048096, max 0.25468577728776187, avg 0.22121921450864282
- **system cpu usage**: min 0.005446292885771543, max 0.25540331813627254, avg 0.22279555362081385
- **heap committed bytes**: min 3145728, max 823132160, avg 129324373.33333333
- **gc count rate 5m**: min 0, max 1.3473684210526313, avg 0.3041795423561627

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

- **CPU Utilization Average**: min 4.11%, max 79.19%, avg 48.31%
- **CPU Utilization Maximum**: min 4.11%, max 79.19%, avg 48.31%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.001 ms, avg 0.000 ms
- **Write Latency Average**: min 0.001 ms, max 0.003 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.001 ms, max 0.003 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 24163 bytes/sec, avg 2077 bytes/sec
- **Write Throughput Average**: min 10720 bytes/sec, max 2760458 bytes/sec, avg 765549 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.3, avg 0.4
- **Write IOPS Average**: min 1.2, max 75.9, avg 35.4

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/ramp-up/java17/2026-03-05/1/k6-summary.txt
