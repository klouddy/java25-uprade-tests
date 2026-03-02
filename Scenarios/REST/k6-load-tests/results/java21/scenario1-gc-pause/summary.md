# Java 21 Scenario 1 Summary

- **Start Time**: 2026-02-25T20:30:19.540Z
- **End Time**: 2026-02-25T20:44:20.930Z
- **ALB URL**: http://java-bench-alb-1936020596.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -XX:+UseG1GC -Xmx1024m -XX:MaxGCPauseMillis=100

## K6 Load Results

- **Requests**: 125452
- **Throughput (RPS)**: 149.085755
- **Error Rate (%)**: 91.63 (114963/125452)
- **Latency (avg/p90/p95/p99)**: 85.24 / 52.05 / 107.59 / undefined ms

## Container Insights

- **CpuUtilized Average**: min 1.1003269788953993, max 248.48389324612083, avg 53.55480123186868
- **CpuUtilized Maximum**: min 3.300980936686198, max 510.8053385416667, avg 160.20676128569104
- **MemoryUtilized Average**: min 94.33333333333333, max 487, avg 291.36904761904765
- **MemoryUtilized Maximum**: min 283, max 1073, avg 385.42857142857144
- **NetworkRxBytes Sum**: min 11, max 6377601, avg 1147367.2857142857
- **NetworkTxBytes Sum**: min 23, max 9501136, avg 1698705.357142857

## JVM / GC (Prometheus)

- **heap used bytes**: min 1244960, max 578790032, avg 78417966.4
- **non heap used bytes**: min 1993600, max 95950840, avg 27024704.96
- **gc pause rate 5m**: min 0, max 0.05499314814814815, avg 0.028294121592806688
- **gc pause max**: min 0.015, max 0.317, avg 0.14780000000000001
- **process cpu usage**: min 0.0020060180541624875, max 0.2529550827423168, avg 0.12976016424543066
- **system cpu usage**: min 0.005349381477766634, max 0.24949358541525996, avg 0.13395049823506872
- **heap committed bytes**: min 2097152, max 2281701376, avg 212371592.53333333
- **gc count rate 5m**: min 0, max 0.5076470588235295, avg 0.25543736739627765

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 0/0
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:44
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java21-rest-gc-pause-01, cpu 0, memory n/a, reservation n/a

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/Scenarios/REST/k6-load-tests/results/java21/scenario1-gc-pause/k6-summary.txt
