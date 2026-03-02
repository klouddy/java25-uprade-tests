# Java 25 Scenario 1 Summary

- **Start Time**: 2026-02-26T16:49:52.806Z
- **End Time**: 2026-02-26T17:03:54.628Z
- **ALB URL**: http://java-bench-alb-1738197142.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: virtual threads

## K6 Load Results

- **Requests**: 90665
- **Throughput (RPS)**: 107.688939
- **Error Rate (%)**: 0 (0/90665)

## Container Insights

- **CpuUtilized Average**: min 1.7995853826734756, max 386.46576171875, avg 189.81066366664945
- **CpuUtilized Maximum**: min 3.14526964823405, max 510.679912109375, avg 368.7170156951178
- **MemoryUtilized Average**: min 206.33333333333334, max 674, avg 386.6904761904762
- **MemoryUtilized Maximum**: min 442, max 709, avg 525.7857142857143
- **NetworkRxBytes Sum**: min 317, max 12778202, avg 7094731.142857143
- **NetworkTxBytes Sum**: min 20906, max 18993950, avg 10535259.714285715

## JVM / GC (Prometheus)

- **heap used bytes**: min 1376160, max 209715200, avg 42760083.02222222
- **non heap used bytes**: min 2048896, max 94215112, avg 26156760.85333333
- **gc pause rate 5m**: min 0.00008070175438596381, max 0.009877777777777779, avg 0.004984082463959043
- **gc pause max**: min 0.01, max 0.199, avg 0.09933333333333333
- **process cpu usage**: min 0.001002673796791444, max 0.22833467602716076, avg 0.1352889333393197
- **system cpu usage**: min 0.011029411764705883, max 0.2296006444930372, avg 0.1379014793141304
- **heap committed bytes**: min 2097152, max 278921216, avg 97074835.91111112
- **gc count rate 5m**: min 0.007017543859649122, max 0.4740740740740741, avg 0.2788333581491819

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 2/2
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:52
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java25-rest-vt-with-cache, cpu 0, memory n/a, reservation n/a

## RDS Database

- **RDS Lookup Error**: DBInstance benchmark-db not found.

## RDS Metrics

- **CPU Utilization Average**: min undefined%, max undefined%, avg undefined%
- **CPU Utilization Maximum**: min undefined%, max undefined%, avg undefined%
- **Connections Average**: min undefined, max undefined, avg undefined
- **Connections Maximum**: min undefined, max undefined, avg undefined
- **Read Latency Average**: min undefined ms, max undefined ms, avg undefined ms
- **Read Latency Maximum**: min undefined ms, max undefined ms, avg undefined ms
- **Write Latency Average**: min undefined ms, max undefined ms, avg undefined ms
- **Write Latency Maximum**: min undefined ms, max undefined ms, avg undefined ms
- **Read Throughput Average**: min undefined bytes/sec, max undefined bytes/sec, avg undefined bytes/sec
- **Write Throughput Average**: min undefined bytes/sec, max undefined bytes/sec, avg undefined bytes/sec
- **Read IOPS Average**: min undefined, max undefined, avg undefined
- **Write IOPS Average**: min undefined, max undefined, avg undefined

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/Scenarios/REST/k6-load-tests/results/java25/scenario1-virtual-threads-bigdb/k6-summary.txt
