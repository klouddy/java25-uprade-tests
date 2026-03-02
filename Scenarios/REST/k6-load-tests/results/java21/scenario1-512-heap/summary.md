# Java 21 Scenario 1 Summary

- **Start Time**: 2026-02-25T19:15:48.078Z
- **End Time**: 2026-02-25T19:29:49.606Z
- **ALB URL**: http://java-bench-alb-1936020596.us-east-1.elb.amazonaws.com
- **Task CPU**: 512
- **Task Memory**: 2048
- **JVM Settings**: -Xmx512m -XX:+UseG1GC

## K6 Load Results

- **Requests**: 84783
- **Throughput (RPS)**: 100.737429
- **Error Rate (%)**: 0 (0/84783)

## Container Insights

- **CpuUtilized Average**: min 4.084494514465332, max 237.81275323232015, avg 110.7454867141209
- **CpuUtilized Maximum**: min 6.18842041015625, max 492.1670703125, avg 354.5946500069755
- **MemoryUtilized Average**: min 296.75, max 530, avg 391.79166666666663
- **MemoryUtilized Maximum**: min 334, max 1003, avg 701.9285714285714
- **NetworkRxBytes Sum**: min 164, max 10517831, avg 6505638.928571428
- **NetworkTxBytes Sum**: min 7323, max 15673777, avg 9660588.357142856

## JVM / GC (Prometheus)

- **heap used bytes**: min 1765680, max 440401920, avg 71915651.91111112
- **non heap used bytes**: min 1995008, max 96305680, avg 29334874.88
- **gc pause rate 5m**: min 0, max 0.02443157894736842, avg 0.012203305272905477
- **gc pause max**: min 0.078, max 0.203, avg 0.17079999999999998
- **process cpu usage**: min 0.0030060120240480966, max 0.24663072776280326, avg 0.16001013553783602
- **system cpu usage**: min 0.006680026720106881, max 0.24233232221098755, avg 0.15985000482889658
- **heap committed bytes**: min 2097152, max 536870912, avg 175321907.2
- **gc count rate 5m**: min 0, max 0.4771929824561403, avg 0.30974219909454875

## ECS Service & Task

- **Cluster**: java-bench-cluster
- **Service**: java-bench-service
- **Desired/Running Count**: 2/2
- **Task Definition**: arn:aws:ecs:us-east-1:913846010507:task-definition/java-bench-task:42
- **Task CPU/Memory**: 512/2048

### Container Definitions
- **java-bench-app**: image 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java21-rest-heap-szie512-01, cpu 0, memory n/a, reservation n/a

## Files Used

- /Users/jromero/dev/src/tech-writing/java25-uprade-tests/Scenarios/REST/k6-load-tests/results/java21/scenario1-512-heap/k6-summary.txt
