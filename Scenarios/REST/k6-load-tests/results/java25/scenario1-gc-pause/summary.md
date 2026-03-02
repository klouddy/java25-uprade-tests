# Java 25 Scenario 1 Summary

- **Start Time**: 2026-02-25T21:00:38.240Z
- **End Time**: 2026-02-25T21:14:40.288Z
- **ALB URL**: http://java-bench-alb-1936020596.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m -XX:MaxGCPauseMillis=100

## K6 Load Results

- **Requests**: 128984
- **Throughput (RPS)**: 153.16182
- **Error Rate (%)**: 99.45 (128285/128984)
- **Latency (avg/p90/p95/p99)**: 45.22 / 49.2 / 50.93 / 59.33 ms

## Container Insights

- **CpuUtilized Average**: min 2.205647473335266, max 176.00294629414876, avg 33.98506113699505
- **CpuUtilized Maximum**: min 2.934146169026693, max 420.44354817708336, avg 88.44798930940172
- **MemoryUtilized Average**: min 154.25, max 313.5, avg 290.5
- **MemoryUtilized Maximum**: min 294, max 366, avg 345.14285714285717
- **NetworkRxBytes Sum**: min 34, max 1171542, avg 91345.92857142857
- **NetworkTxBytes Sum**: min 73, max 1753914, avg 133909.2142857143

## JVM / GC (Prometheus)

- **heap used bytes**: min 7145008, max 77594624, avg 34156986.666666664
- **non heap used bytes**: min 2038784, max 90617592, avg 24053690.4
- **gc pause rate 5m**: min 0.00043796296296296297, max 0.0009610833333333335, avg 0.0008498092592592593
- **gc pause max**: min 0.108, max 0.108, avg 0.108
- **process cpu usage**: min 0.003003003003003003, max 0.10414560161779575, avg 0.05357430231039938
- **system cpu usage**: min 0.008341675008341674, max 0.10178631614425346, avg 0.05506399557629757
- **heap committed bytes**: min 8388608, max 85983232, avg 53127850.666666664
- **gc count rate 5m**: min 0.026277777777777782, max 0.037083333333333336, avg 0.03492222222222222

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 2/2
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:46
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java25-rest-gc-pause-01, cpu 0, memory n/a, reservation n/a

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/Scenarios/REST/k6-load-tests/results/java25/scenario1-gc-pause/k6-summary.txt
