# Java Version Cost Comparison (Fargate)

| Metric Category | Measurement | Java 17 | Java 21 | Java 25 | Improvement Notes |
|-----------------|-------------|---------|---------|---------|-------------------|
| **Memory Usage** | Peak Heap Used (MB) |  |  |  |  |
|                 | Average Heap Used (MB) |  |  |  |  |
|                 | Required ECS Memory (GB) |  |  |  |  |
|                 | Memory Savings vs 17 (%) | N/A |  |  |  |
| **CPU Usage** | Avg CPU Utilization (%) |  |  |  |  |
|               | Peak CPU Utilization (%) |  |  |  |  |
|               | Required ECS vCPU |  |  |  |  |
|               | CPU Savings vs 17 (%) | N/A |  |  |  |
| **Throughput** | Max Sustainable RPS |  |  |  |  |
|                 | Throughput Increase vs 17 (%) | N/A |  |  |  |
| **Latency** | p95 Latency (ms) |  |  |  |  |
|               | p99 Latency (ms) |  |  |  |  |
| **GC Metrics** | GC Pause Count (per 10 min) |  |  |  |  |
|                | GC Total Pause Time (ms) |  |  |  |  |
|                | GC CPU Time (%) |  |  |  |  |
| **Startup Time** | Cold Start Duration (seconds) |  |  |  |  |
|                 | Warm Start Duration (seconds) |  |  |  |  |
| **Cost Per Task** | Fargate Memory Cost per Hour ($) |  |  |  |  |
|                  | Fargate CPU Cost per Hour ($) |  |  |  |  |
|                  | Total Cost per Task per Hour ($) |  |  |  |  |
| **Cluster Cost** | Tasks in Cluster |  |  |  |  |
|                 | Total Cluster Cost per Hour ($) |  |  |  |  |
|                 | Monthly Cost (730 hours) ($) |  |  |  |  |
| **Savings** | Monthly Savings vs Java 17 ($) | N/A |  |  |  |
|             | % Savings vs Java 17 | N/A |  |  |  |


# AWS Fargate Cost Inputs

| Category | Value |
|----------|--------|
| Fargate vCPU Price ($/vCPU-hour) |  |
| Fargate Memory Price ($/GB-hour) |  |
| Java 17 Task Size (vCPU / GB) |  |
| Java 21 Task Size (vCPU / GB) |  |
| Java 25 Task Size (vCPU / GB) |  |
| Number of ECS Tasks |  |
| Hours per Month | 730 |

