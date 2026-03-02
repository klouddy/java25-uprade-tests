# Java 21 Scenario 1 Summary

- **Start Time**: 2026-02-25T17:31:38.245Z
- **End Time**: 2026-02-25T17:45:40.030Z
- **ALB URL**: http://java-bench-alb-1936020596.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -Xmx1024m -XX:+UseG1GC

## K6 Load Results

- **Requests**: 124290
- **Throughput (RPS)**: 147.634787
- **Error Rate (%)**: 1.11 (1387/124290)
- **Latency (avg/p90/p95/p99)**: 99.88 / 212.95 / 372.66 / 668.54 ms

## Container Insights

- **CpuUtilized Average**: min 23.367079162597655, max 352.27030598958333, avg 202.90140263875327
- **CpuUtilized Maximum**: min 31.235321960449216, max 366.57070312499997, avg 214.6332141476586
- **MemoryUtilized Average**: min 363, max 481, avg 409.14285714285717
- **MemoryUtilized Maximum**: min 378, max 483, avg 418.7142857142857
- **NetworkRxBytes Sum**: min 814, max 11687003, avg 3773096.285714286
- **NetworkTxBytes Sum**: min 11332, max 17334428, avg 5593833.642857143

## JVM / GC (Prometheus)

- **heap used bytes**: min 0, max 104857600, avg 30904248.355555557
- **non heap used bytes**: min 1997440, max 97027440, avg 30776537.92
- **gc pause rate 5m**: min 0, max 0.007433333333333333, avg 0.001091269838208231
- **gc pause max**: min 0, max 0.102, avg 0.042359999999999995
- **process cpu usage**: min 0.0031900604432505038, max 0.1821173889193637, avg 0.09094485758494313
- **system cpu usage**: min 0.012090680100755667, max 0.18261455525606468, avg 0.0958172832925403
- **heap committed bytes**: min 2097152, max 140509184, avg 57042534.4
- **gc count rate 5m**: min 0, max 0.7875, avg 0.13797749963261288

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 2/2
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:39
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java21-rest-20260225-01, cpu 0, memory n/a, reservation n/a

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/Scenarios/REST/k6-load-tests/results/java21/scenario1/k6-summary.txt
