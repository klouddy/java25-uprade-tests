# Java 25 Scenario 1 Summary

- **Start Time**: 2026-02-26T15:35:48.456Z
- **End Time**: 2026-02-26T15:49:49.470Z
- **ALB URL**: http://java-bench-alb-1738197142.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: virtual threads

## K6 Load Results

- **Requests**: 119972
- **Throughput (RPS)**: 142.634372
- **Error Rate (%)**: 0 (11/119972)
- **Latency (avg/p90/p95/p99)**: 156.09 / 418.79 / 622 / undefined ms

## Container Insights

- **CpuUtilized Average**: min 4.133948860168457, max 382.23439453125, avg 193.7662835611616
- **CpuUtilized Maximum**: min 5.106154301961262, max 439.4603776041667, avg 211.42258012499127
- **MemoryUtilized Average**: min 376.5, max 441.5, avg 409.25
- **MemoryUtilized Maximum**: min 404, max 445, avg 432.42857142857144
- **NetworkRxBytes Sum**: min 539, max 10928624, avg 3594539.214285714
- **NetworkTxBytes Sum**: min 19299, max 16163020, avg 5333305

## JVM / GC (Prometheus)

- **heap used bytes**: min 190784, max 102760448, avg 35537244.8
- **non heap used bytes**: min 2056320, max 93917960, avg 27048859.2
- **gc pause rate 5m**: min 0.00009926470588235303, max 0.006152941176470588, avg 0.0012724093125015107
- **gc pause max**: min 0, max 0.104, avg 0.03766666666666666
- **process cpu usage**: min 0.0016747613465081226, max 0.17551020408163265, avg 0.0879888971278645
- **system cpu usage**: min 0.008206330597889801, max 0.17708685366677931, avg 0.0913099439374102
- **heap committed bytes**: min 2097152, max 115343360, avg 57694981.68888889
- **gc count rate 5m**: min 0.010526315789473682, max 0.5490196078431373, avg 0.17470322819748

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 2/2
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:51
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java25-rest-virtual-threads-02, cpu 0, memory n/a, reservation n/a

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/Scenarios/REST/k6-load-tests/results/java25/scenario1-virtual-threads-02/k6-summary.txt
