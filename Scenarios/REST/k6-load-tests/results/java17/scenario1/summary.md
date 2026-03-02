# Java 17 Scenario 1 Summary

- **Start Time**: 2026-02-25T15:56:30.527Z
- **End Time**: 2026-02-25T16:10:31.869Z
- **ALB URL**: http://java-bench-alb-495214762.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -Xmx512m -XX:+UseG1GC

## K6 Load Results

- **Requests**: 122274
- **Throughput (RPS)**: 145.31611
- **Error Rate (%)**: 1.2 (1478/122274)
- **Latency (avg/p90/p95/p99)**: 125.74 / 327.11 / 512 / 869.74 ms

## Container Insights

- **CpuUtilized Average**: min 34.64197168986003, max 331.752958984375, avg 197.092910319737
- **CpuUtilized Maximum**: min 47.814356079101564, max 334.1720052083333, avg 208.48643559047156
- **MemoryUtilized Average**: min 329.5, max 447.5, avg 381.10714285714283
- **MemoryUtilized Maximum**: min 331, max 494, avg 394.7857142857143
- **NetworkRxBytes Sum**: min 913, max 10740040, avg 3600028.1428571427
- **NetworkTxBytes Sum**: min 20020, max 15978864, avg 5348220.928571428

## JVM / GC (Prometheus)

- **heap used bytes**: min 792960, max 96468992, avg 28788589.51111111
- **non heap used bytes**: min 1434240, max 94326480, avg 27792946.133333333
- **gc pause rate 5m**: min 0, max 0.007315840812917986, avg 0.0019173892273635627
- **gc pause max**: min 0, max 0.181, avg 0.06746666666666666
- **process cpu usage**: min 0.013818181818181818, max 0.18115438108484005, avg 0.09588019048161098
- **system cpu usage**: min 0.013633624872727273, max 0.18155252234005564, avg 0.09611369063924484
- **heap committed bytes**: min 1048576, max 158334976, avg 49865614.222222224
- **gc count rate 5m**: min 0, max 0.9228134934280241, avg 0.25478416209773624

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 2/2
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:37
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java17-rest-20260225-01, cpu 0, memory n/a, reservation n/a

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/Scenarios/REST/k6-load-tests/results/java17/scenario1/k6-summary.txt
