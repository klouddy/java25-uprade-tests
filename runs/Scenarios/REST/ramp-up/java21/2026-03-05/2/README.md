# Benchmark Run Configuration

**Generated**: 2026-03-05T21:13:06.485Z

## Scenario Settings

| Setting | Value |
|---------|-------|
| Scenario Type | REST |
| Load Test Scenario | Ramp Up |
| Java Version | 21 |
| Virtual Threads Enabled | true |
| DB Pool Size | 50 |

## Infrastructure Settings

| Setting | Value |
|---------|-------|
| CPU (units) | 512 |
| Memory (MB) | 1024 |

## JVM Options

```
-XX:+UseG1GC -Xmx512m
```

## Docker Image

- **Image Name**: 913846010507.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:rest-java21-4-2026-03-05-2
- **Dockerfile**: [Dockerfile](./Dockerfile)
- **Build Date**: 2026-03-05T21:13:06.485Z

## ECS Task Definition

- **Task Definition**: [task-definition.json](./task-definition.json)
- **Task CPU**: 512 units
- **Task Memory**: 1024 MB

## AWS Bootstrap

- **Status**: Pending
- **Command**: `npm run aws-bootstrap`
- **ECS Cluster**: java-bench-cluster
- **RDS Database**: java-bench-db (PostgreSQL)
- **ALB Endpoint**: [Check AWS Console]

## Results

### K6 Load Test Results

- **Status**: Pending
- **Total Requests**: -
- **Throughput (RPS)**: -
- **Error Rate (%)**: -
- **Avg Latency (ms)**: -
- **p90 Latency (ms)**: -
- **p95 Latency (ms)**: -
- **p99 Latency (ms)**: -

### Container Metrics (ECS Container Insights)

- **Avg CPU (units)**: -
- **Max CPU (units)**: -
- **Avg Memory (MB)**: -
- **Max Memory (MB)**: -

### Database Metrics (RDS CloudWatch)

- **Avg Connections**: -
- **Max Connections**: -
- **CPU Utilization (%)**: -
- **Read Latency (ms)**: -

### JVM Metrics (Prometheus)

- **Heap Used (avg/max)**: - / - MB
- **GC Pause Count**: -
- **GC Total Pause Time**: - ms

## Notes

Add observations and findings here.
