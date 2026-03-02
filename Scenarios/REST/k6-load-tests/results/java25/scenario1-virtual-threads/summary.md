# Java 25 Scenario 1 Summary

- **Start Time**: 2026-02-26T13:20:24.670Z
- **End Time**: 2026-02-26T13:34:26.394Z
- **ALB URL**: http://java-bench-alb-157900972.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: virtual threads

## K6 Load Results

- **Requests**: 123986
- **Throughput (RPS)**: 147.282909
- **Error Rate (%)**: 1.35 (1676/123986)
- **Latency (avg/p90/p95/p99)**: 103.32 / 222.77 / 361.64 / 684.83 ms

## Container Insights

- **CpuUtilized Average**: min 38.55553957621257, max 404.2672005208333, avg 228.29911330631802
- **CpuUtilized Maximum**: min 39.68228286743164, max 412.30707031249995, avg 236.5548749760219
- **MemoryUtilized Average**: min 360.5, max 478.5, avg 415.9642857142857
- **MemoryUtilized Maximum**: min 361, max 487, avg 418.2857142857143
- **NetworkRxBytes Sum**: min 1943, max 11717722, avg 3735425.714285714
- **NetworkTxBytes Sum**: min 13216, max 17364800, avg 5527943.285714285

## JVM / GC (Prometheus)

- **heap used bytes**: min 338032, max 100663296, avg 35410599.11111111
- **non heap used bytes**: min 2042752, max 93818048, avg 28083279.04
- **gc pause rate 5m**: min 0.00005555555555555557, max 0.005633333333333335, avg 0.0015880058121613947
- **gc pause max**: min 0, max 0.188, avg 0.059933333333333325
- **process cpu usage**: min 0.0018419290020093772, max 0.22207792207792207, avg 0.11063322936492513
- **system cpu usage**: min 0.007870060281312792, max 0.23427935447968837, avg 0.11727780592740798
- **heap committed bytes**: min 2097152, max 127926272, avg 61423251.91111111
- **gc count rate 5m**: min 0.003703703703703704, max 0.5263157894736842, avg 0.1632888306621674

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 2/2
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:49
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java25-rest-virtual-threads-01, cpu 0, memory n/a, reservation n/a

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/Scenarios/REST/k6-load-tests/results/java25/scenario1-virtual-threads/k6-summary.txt
