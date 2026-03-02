# Java 21 Scenario 1 Summary

- **Start Time**: 2026-03-02T18:37:36.436Z
- **End Time**: 2026-03-02T18:51:39.174Z
- **ALB URL**: http://java-bench-alb-292060561.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 1024
- **JVM Settings**: -XX:+UseG1GC -Xmx512m

## K6 Load Results

- **Requests**: 115665
- **Throughput (RPS)**: 137.233139
- **Error Rate (%)**: 1.27 (1473/115665)

## Container Insights

- **CpuUtilized Average**: min 40.72875671386719, max 503.22773437499995, avg 342.6494884817941
- **CpuUtilized Maximum**: min 40.72875671386719, max 503.22773437499995, avg 342.6494884817941
- **MemoryUtilized Average**: min 310, max 533, avg 393.14285714285717
- **MemoryUtilized Maximum**: min 310, max 533, avg 393.14285714285717
- **NetworkRxBytes Sum**: min 889, max 8419929, avg 3191910.5
- **NetworkTxBytes Sum**: min 31513, max 12466800, avg 4743633.142857143

## JVM / GC (Prometheus)

- **heap used bytes**: min 489088, max 116366896, avg 32804799.111111112
- **non heap used bytes**: min 2014848, max 96824696, avg 28593678.826666668
- **gc pause rate 5m**: min 0.00013188799999999998, max 0.022769491525423725, avg 0.00670171975542767
- **gc pause max**: min 0.013, max 0.102, avg 0.06906666666666667
- **process cpu usage**: min 0.02014098690835851, max 0.2518837459634015, avg 0.16236449331722896
- **system cpu usage**: min 0.02416918429003021, max 0.25103305785123964, avg 0.16009687914994952
- **heap committed bytes**: min 1048576, max 188743680, avg 60118357.333333336
- **gc count rate 5m**: min 0.010412210526315788, max 0.9864406779661017, avg 0.4201331598279766

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 1/1
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:89
- **Task CPU/Memory**: 512/1024

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java21-1-2026-03-02-2, cpu 512, memory 1024, reservation n/a

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

- **CPU Utilization Average**: min 4.89%, max 77.37%, avg 30.06%
- **CPU Utilization Maximum**: min 4.89%, max 77.37%, avg 30.06%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Read Latency Maximum**: min 0.000 ms, max 0.005 ms, avg 0.001 ms
- **Write Latency Average**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Write Latency Maximum**: min 0.000 ms, max 0.002 ms, avg 0.001 ms
- **Read Throughput Average**: min 0 bytes/sec, max 36409 bytes/sec, avg 3722 bytes/sec
- **Write Throughput Average**: min 18703 bytes/sec, max 2557119 bytes/sec, avg 695736 bytes/sec
- **Read IOPS Average**: min 0.0, max 4.1, avg 0.5
- **Write IOPS Average**: min 2.0, max 56.0, avg 28.1

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/runs/Scenarios/REST/read-heavy/java21/2026-03-02/2/k6-summary.txt
