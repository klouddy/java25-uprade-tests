# Java 25 Scenario 1 Summary

- **Start Time**: 2026-02-24T21:58:13.104Z
- **End Time**: 2026-02-24T22:12:15.304Z
- **ALB URL**: http://java-bench-alb-1220469541.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -Xmx512m -XX:+UseG1GC

## K6 Load Results

- **Requests**: 124220
- **Throughput (RPS)**: 147.478535
- **Error Rate (%)**: 1.19 (1485/124220)
- **Latency (avg/p90/p95/p99)**: 102.3 / 215.96 / 386.01 / 715.89 ms

## Container Insights

- **CpuUtilized Average**: min 38.47730857849121, max 315.05445963541666, avg 172.81503294626873
- **CpuUtilized Maximum**: min 44.414983469645186, max 346.2528515625, avg 198.00391820635113
- **MemoryUtilized Average**: min 306.5, max 475.5, avg 378.39285714285717
- **MemoryUtilized Maximum**: min 308, max 515, avg 389.85714285714283
- **NetworkRxBytes Sum**: min 2138, max 11637453, avg 3754467.285714286
- **NetworkTxBytes Sum**: min 14451, max 17266538, avg 5572809.714285715

## JVM / GC (Prometheus)

- **heap used bytes**: min 396208, max 90177536, avg 27587364.8
- **non heap used bytes**: min 2036352, max 93349704, avg 26065082.453333333
- **gc pause rate 5m**: min 0, max 0.005314814814814815, avg 0.001644810200222401
- **gc pause max**: min 0, max 0.133, avg 0.06666666666666667
- **process cpu usage**: min 0.001002171371304493, max 0.17111130541225847, avg 0.08324490928026615
- **system cpu usage**: min 0.0041757140471020545, max 0.19902063658621894, avg 0.09487853247463508
- **heap committed bytes**: min 2097152, max 144703488, avg 48141289.244444445
- **gc count rate 5m**: min 0, max 0.6814814814814815, avg 0.19672400836317586

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 2/2
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:36
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java25-rest-20260224-04, cpu 0, memory n/a, reservation n/a

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/Scenarios/REST/k6-load-tests/results/java25/scenario1/k6-summary-java25-20260224.txt
