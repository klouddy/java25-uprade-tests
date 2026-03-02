# Java 21 Scenario 1 Summary

- **Start Time**: 2026-02-26T02:44:07.507Z
- **End Time**: 2026-02-26T02:58:09.044Z
- **ALB URL**: http://java-bench-alb-105162474.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: virtual threads

## K6 Load Results

- **Requests**: 124411
- **Throughput (RPS)**: 147.821427
- **Error Rate (%)**: 1.16 (1452/124411)
- **Latency (avg/p90/p95/p99)**: 99.06 / 206.11 / 347.92 / 668.3 ms

## Container Insights

- **CpuUtilized Average**: min 40.99214144388834, max 352.3796712239583, avg 197.3314878282093
- **CpuUtilized Maximum**: min 44.88531316121419, max 403.98703125, avg 233.73309423900784
- **MemoryUtilized Average**: min 326.5, max 456.5, avg 376.7142857142857
- **MemoryUtilized Maximum**: min 361, max 472, avg 399.7142857142857
- **NetworkRxBytes Sum**: min 2812, max 11634353, avg 3826564.5
- **NetworkTxBytes Sum**: min 31935, max 17301565, avg 5677435.928571428

## JVM / GC (Prometheus)

- **heap used bytes**: min 224608, max 71303168, avg 27021640.533333335
- **non heap used bytes**: min 1999744, max 96838040, avg 29488773.866666667
- **gc pause rate 5m**: min 0, max 0.006305263157894736, avg 0.001357876256628697
- **gc pause max**: min 0, max 0.093, avg 0.0354
- **process cpu usage**: min 0.005934718100890208, max 0.17895637296834904, avg 0.09425617262157447
- **system cpu usage**: min 0.009891196834817014, max 0.16526946107784432, avg 0.09176692953596256
- **heap committed bytes**: min 2097152, max 134217728, avg 47582048.71111111
- **gc count rate 5m**: min 0, max 0.8070175438596491, avg 0.2155222816993239

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 2/2
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:48
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java21-rest-virtual-threads-01, cpu 0, memory n/a, reservation n/a

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/Scenarios/REST/k6-load-tests/results/java21/scenario1-virtual-threads/k6-summary.txt
