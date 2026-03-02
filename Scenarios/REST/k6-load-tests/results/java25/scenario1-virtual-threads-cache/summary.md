# Java 25 Scenario 1 Summary

- **Start Time**: 2026-02-26T18:05:47.386Z
- **End Time**: 2026-02-26T18:19:48.897Z
- **ALB URL**: http://java-bench-alb-1738197142.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: virtual threads with cache

## K6 Load Results

- **Requests**: 69509
- **Throughput (RPS)**: 82.591564
- **Error Rate (%)**: 0 (0/69509)

## Container Insights

- **CpuUtilized Average**: min 11.78005688349406, max 266.40284022013344, avg 158.69559934169527
- **CpuUtilized Maximum**: min 37.604001134236654, max 499.1295572916667, avg 335.83012722015377
- **MemoryUtilized Average**: min 309.5, max 789.5, avg 478.7738095238095
- **MemoryUtilized Maximum**: min 331, max 807, avg 634.8571428571429
- **NetworkRxBytes Sum**: min 298, max 12679734, avg 8159654.928571428
- **NetworkTxBytes Sum**: min 9198, max 18971228, avg 12156346.42857143

## JVM / GC (Prometheus)

- **heap used bytes**: min 1553424, max 308281344, avg 71170913.6
- **non heap used bytes**: min 2051072, max 95404776, avg 28456693.226666667
- **gc pause rate 5m**: min 0, max 0.012305263157894734, avg 0.005687417693081948
- **gc pause max**: min 0.015, max 0.199, avg 0.11326666666666665
- **process cpu usage**: min 0, max 0.22759795570698466, avg 0.12886914027607158
- **system cpu usage**: min 0, max 0.22479564032697547, avg 0.12815772283273935
- **heap committed bytes**: min 2097152, max 329252864, avg 129137959.82222222
- **gc count rate 5m**: min 0, max 0.43333333333333335, avg 0.1890181627871738

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 2/2
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:52
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java25-rest-vt-with-cache, cpu 0, memory n/a, reservation n/a

## RDS Database

- **Instance ID**: java-bench-db
- **Instance Class**: db.t4g.medium
- **Engine**: postgres 17.6
- **Allocated Storage**: 20 GB
- **Max Allocated Storage**: n/a GB
- **Status**: available
- **Multi-AZ**: No
- **Database**: benchmarkdb

## RDS Metrics

- **CPU Utilization Average**: min 3.40%, max 98.80%, avg 62.09%
- **CPU Utilization Maximum**: min 3.40%, max 98.80%, avg 62.09%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.002 ms, avg 0.000 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.002 ms, avg 0.000 ms
- **Write Latency Average**: min 0.000 ms, max 0.008 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.008 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 683 bytes/sec, avg 146 bytes/sec
- **Write Throughput Average**: min 10850 bytes/sec, max 2369813 bytes/sec, avg 470255 bytes/sec
- **Read IOPS Average**: min 0.0, max 1.3, avg 0.3
- **Write IOPS Average**: min 1.1, max 33.5, avg 18.5

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/Scenarios/REST/k6-load-tests/results/java25/scenario1-virtual-threads-cache/k6-summary.txt
