# Java 25 Scenario 1 Summary

- **Start Time**: 2026-02-25T19:56:06.350Z
- **End Time**: 2026-02-25T20:10:07.223Z
- **ALB URL**: http://java-bench-alb-1936020596.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -Xmx512m -XX:+UseG1GC

## K6 Load Results

- **Requests**: 86206
- **Throughput (RPS)**: 102.508988
- **Error Rate (%)**: 78.63 (67787/86206)

## Container Insights

- **CpuUtilized Average**: min 1.7866173087226018, max 282.52628726535374, avg 120.42019545683785
- **CpuUtilized Maximum**: min 3.460757497151692, max 511.7163802083333, avg 332.64638043176564
- **MemoryUtilized Average**: min 179, max 753.6666666666666, avg 400.21428571428567
- **MemoryUtilized Maximum**: min 309, max 1843, avg 715.5
- **NetworkRxBytes Sum**: min 16, max 6868443, avg 2251816.1428571427
- **NetworkTxBytes Sum**: min 34, max 10254605, avg 3305292.5714285714

## JVM / GC (Prometheus)

- **heap used bytes**: min 2097152, max 727552712, avg 86710687.55555555
- **non heap used bytes**: min 2040320, max 92625840, avg 25247270.933333334
- **gc pause rate 5m**: min 0.0008398902777777778, max 0.035596794871794867, avg 0.017751509925854864
- **gc pause max**: min 0.02, max 0.344, avg 0.19616666666666668
- **process cpu usage**: min 0.0016784155756965425, max 0.27511078286558344, avg 0.1629655945897516
- **system cpu usage**: min 0.008380824673147838, max 0.27329420396184884, avg 0.16816405943636867
- **heap committed bytes**: min 4194304, max 2097152000, avg 257833187.55555555
- **gc count rate 5m**: min 0.03210444444444445, max 0.38068627450980397, avg 0.1530591924157211

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 2/2
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:43
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java25-rest-heap-szie512-01, cpu 0, memory n/a, reservation n/a

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/Scenarios/REST/k6-load-tests/results/java25/scenario1-512-heap/k6-summary.txt
