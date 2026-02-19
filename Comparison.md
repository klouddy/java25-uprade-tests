# Java 25 Upgrade Performance & Cost Comparison

## Executive Summary

This document tracks comprehensive performance and cost metrics for comparing Java versions (17, 21, 25) running the same Spring Boot REST API on AWS ECS Fargate with RDS.

---

## Methodology & Data Collection Guide

### Overview

This comparison uses a standardized test methodology across all three Java versions to ensure results are directly comparable. All tests run the exact same application code, infrastructure, and load patterns—only the Java runtime version differs.

### Prerequisites for Data Collection

Before filling in results:
1. **Infrastructure Setup**
   - ✅ ECS cluster with ALB configured
   - ✅ RDS PostgreSQL database
   - ✅ Prometheus metrics collection (see `Scenarios/REST/AWS/prometheus-setup.md`)
   - ✅ Grafana dashboards configured (see `Scenarios/REST/AWS/grafana-setup.md`)
   - ✅ GC logging enabled in Dockerfiles (see `Scenarios/REST/spring-boot-app/Dockerfile.*`)

2. **Load Testing Tools**
   - ✅ k6 installed locally (see `Scenarios/REST/k6-load-tests/README.md`)
   - ✅ AWS CLI configured for cost analysis

3. **Baseline Established**
   - Run all 7 scenarios on Java 17 first
   - Document results as baseline
   - Then repeat for Java 21 and Java 25

### Test Execution Procedure

#### Step 1: Deploy Application for Each Java Version

```bash
# Build and push Docker image for specific Java version
cd Scenarios/REST/spring-boot-app/
docker build -f Dockerfile.java25 -t benchmark-app:java25 .
docker tag benchmark-app:java25 YOUR_ECR_URI/benchmark-app:java25
docker push YOUR_ECR_URI/benchmark-app:java25

# Update ECS task definition
aws ecs register-task-definition --cli-input-json file://task-def.json

# Update ECS service to use new image
aws ecs update-service --cluster java-bench-cluster \
  --service java-bench-service \
  --force-new-deployment
```

#### Step 2: Warm Up Application

Before capturing metrics:
1. Wait 2-3 minutes for JIT compilation warmup
2. Run a quick health check: `curl http://alb-endpoint:8080/actuator/health`
3. Verify Prometheus is scraping metrics: `curl http://alb-endpoint:8080/actuator/prometheus` should return data

#### Step 3: Run All 7 Load Test Scenarios

Execute load tests in order (one at a time, wait 5 minutes between runs):

```bash
cd Scenarios/REST/k6-load-tests/

# Scenario 1: Read-Heavy (14 min)
k6 run --env BASE_URL=http://your-alb-endpoint:8080 \
  --out json=results-java25-scenario1.json \
  scenario-1-read-heavy.js

# Wait 5 minutes for cooldown

# Scenario 2: Balanced (14 min)
k6 run --env BASE_URL=http://your-alb-endpoint:8080 \
  --out json=results-java25-scenario2.json \
  scenario-2-balanced.js

# Continue for scenarios 3-7...
# See k6-load-tests/README.md for all scenarios
```

#### Step 4: Collect Metrics from Prometheus

After all load tests complete, query Prometheus for aggregated metrics:

```bash
# Query Prometheus for test period metrics
# Replace START_TIMESTAMP and END_TIMESTAMP with actual test window (Unix timestamps)

# Get p95 latency
curl 'http://prometheus:9090/api/v1/query_range?query=histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))&start=START_TIMESTAMP&end=END_TIMESTAMP&step=60s' | jq '.data.result[0].values'

# Get p99 latency
curl 'http://prometheus:9090/api/v1/query_range?query=histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m]))&start=START_TIMESTAMP&end=END_TIMESTAMP&step=60s' | jq '.data.result[0].values'

# Get avg throughput (RPS)
curl 'http://prometheus:9090/api/v1/query_range?query=rate(http_server_requests_seconds_count[5m])&start=START_TIMESTAMP&end=END_TIMESTAMP&step=60s' | jq '.data.result[0].values'

# Get avg heap usage
curl 'http://prometheus:9090/api/v1/query_range?query=jvm_memory_usage_bytes{area="heap"}&start=START_TIMESTAMP&end=END_TIMESTAMP&step=60s' | jq '.data.result[0].values'
```

Or use Grafana's built-in export feature:
1. Open relevant dashboard
2. Time period matching your test window
3. "Share" → "Export to CSV"

#### Step 5: Collect GC Metrics from Logs

```bash
# Download GC logs from ECS task
aws ecs describe-tasks --cluster java-bench-cluster --tasks <task-arn> \
  --query 'tasks[0].containerInstanceArn'

aws ssm start-session --document-name AWS-StartInteractiveCommand --target <ec2-id>
# Once connected to EC2 instance hosting the task:
docker logs <container-id> > gc.log

# Extract GC pause metrics
grep "Pause" gc.log | head -20 > gc-pauses.csv

# Calculate pause statistics
grep -oP 'Pause[^,]*(?==\d+)' gc.log | sort -n | tail -1  # Max pause
```

Or download via CloudWatch Logs Insights:

```
fields @timestamp, @message
| filter @message like /Pause/
| stats count() as pause_count, 
        max(duration_ms) as max_pause_ms,
        pct(@duration, 95) as p95_pause_ms
```

#### Step 6: Collect Cost Data

```bash
# Export costs for test period from AWS Billing Cost Explorer
aws ce get-cost-and-usage \
  --time-period Start=2024-02-19,End=2024-02-25 \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --filter '{
    "Tags": {
      "Key": "JavaVersion",
      "Values": ["Java25"]
    }
  }' \
  --query 'ResultsByTime[*].[TimePeriod.Start,UnblendedCost.Amount]' \
  --output json
```

See `Scenarios/REST/AWS/cost-tracking.md` for detailed cost analysis guide.

#### Step 7: Measure Startup Time

For Scenario 6 (Cold Start):

```bash
# Measure time from ECS task launch to health endpoint returning 200
# k6 script will log this automatically

# Extract from k6 output:
# ✓ Cold start complete in 8.52 seconds

# Or check ECS task events
aws ecs describe-tasks --cluster java-bench-cluster --tasks <task-arn> \
  --query 'tasks[0].{LaunchTime: launchTime, CreatedAt: createdAt}'
```

#### Step 8: Measure Database Performance

```bash
# Query RDS metrics from CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=java-bench-db \
  --start-time 2024-02-19T00:00:00Z \
  --end-time 2024-02-25T00:00:00Z \
  --period 300 \
  --statistics Maximum,Average
```

---

### Data Interpretation Guide

#### Memory Usage
- **Peak Heap**: Maximum heap size reached during test (from jvm_memory_usage_bytes)
- **Average Heap**: Mean heap size during sustained load
- **Required ECS Memory**: Add 25% buffer to peak heap for safe container limits
- **Example**: Peak 512MB → Container needs 640MB allocation

#### CPU Usage
- **Avg CPU %**: Average CPU utilization as % of allocated CPU (from CloudWatch Container Insights or ECS metrics)
- **Peak CPU %**: Maximum CPU spike (watch for spikes during GC)
- **Required ECS vCPU**: If hitting 90%+ consistently, may need to increase allocation

#### Throughput
- **Max Sustainable RPS**: Highest requested/min value before error rate exceeds 5%
- **Extract**: `max(rate(http_server_requests_seconds_count[5m]))` during main load phase

#### Latency
- **p95 Latency**: 95% of requests complete within this time
- **p99 Latency**: 99% of requests complete within this time
- **Why these matter**: Tail latency affects user experience for top 1-5% of users

#### GC Metrics
- **Pause Count**: Number of GC events in a 10-minute window
- **Total Pause Time**: Sum of all GC pause durations
- **GC CPU Time**: CPU time spent in GC activity (Goal: <5% of total CPU time)
- **Extract from GC logs**: Parse gc.log using GC log analyzer or grep

#### Startup Time
- **Cold Start**: Time from task launch to first /actuator/health returning 200
  - Includes JVM startup + Spring Boot initialization
  - Typically 8-15 seconds depending on Java version
- **Warm Start**: Time to restart during rolling deployment
  - Usually faster (5-10s) due to warm heap state

#### Cost Calculations
- **Fargate vCPU/GB pricing**: Updated quarterly, check [AWS Pricing](https://aws.amazon.com/fargate/pricing/)
  - As of Feb 2024: $0.04731 per vCPU-hour, $0.00520 per GB-hour (us-east-1)
- **Formula**: 
  ```
  Task hourly cost = (vCPU × $0.04731) + (GB × $0.00520)
  Monthly cost = Task hourly cost × 730 hours × Number of tasks
  ```

---

### Statistical Significance

When comparing Java versions, ensure results are statistically valid:

1. **Minimum Sample Size**
   - p95/p99 latency: Minimum 10,000 requests per scenario
   - CPU/memory: Minimum 10-minute sustained run
   - GC behavior: Minimum 1000 GC events

2. **Acceptable Variation**
   - **Performance improvement < 5%**: Not meaningful (likely measurement noise)
   - **Performance improvement 5-10%**: Measurable, note in analysis
   - **Performance improvement > 10%**: Significant, highlight as win

3. **Multiple Runs**
   - Run each scenario **twice** per Java version
   - Report **average** of two runs
   - If results differ >10%, investigate environment issues and rerun

---

### Quality Checklist Before Recording Results

- [ ] Application warmed up (JIT compiled) before main test phase
- [ ] All 7 scenarios completed without errors
- [ ] Prometheus metrics collected for entire test period
- [ ] Error rate <5% during main load phases
- [ ] No other processes competing for resources
- [ ] Network connectivity stable (no unexpected latency)
- [ ] RDS database responsive (<100ms query latency)
- [ ] Task definition includes GC logging enabled
- [ ] Cost tags applied and activated in AWS billing
- [ ] Results averaged over multiple runs for statistical validity

---

# Java Version Comparison Results



| Metric Category | Measurement | Java 17 (Baseline) | Java 21 | Java 25 | Notes |
|-----------------|-------------|---------|---------|---------|-------|
| **Memory Usage** | Peak Heap Used (MB) | 358 |  |  | From jvm_memory_usage_bytes max |
|                 | Average Heap Used (MB) | 307 |  |  | From jvm_memory_usage_bytes mean during load |
|                 | Required ECS Memory (MB) |  |  |  | Peak + 25% buffer |
|                 | Memory Savings vs Java 17 (%) | — |  |  | Calculated from average heap |
| **CPU Usage** | Avg CPU Utilization (%) | 37 |  |  | From CloudWatch Container Insights or ECS metrics |
|               | Peak CPU Utilization (%) | 43.1 |  |  | Maximum spike during test |
|               | CPU Savings vs Java 17 (%) | — |  |  | Calculated from average CPU |
| **Throughput & Latency** |  |  |  |  |  |
|  | Max Sustainable RPS (Scenario 1) | 213 |  |  | From k6 Scenario 1 (Read-Heavy) |
|  | Max Sustainable RPS (Scenario 3) |  |  |  | From k6 Scenario 3 (Write-Heavy) |
|  | Throughput Increase vs Java 17 (%) | — |  |  | Calculated from max RPS |
|  | p95 Latency - Scenario 1 (ms) | 49 |  |  | Read-Heavy workload |
|  | p95 Latency - Scenario 3 (ms) |  |  |  | Write-Heavy workload |
|  | p99 Latency - Scenario 1 (ms) | 101 |  |  | 99th percentile |
|  | p99 Latency - Scenario 3 (ms) |  |  |  | 99th percentile |
|  | Latency Improvement vs Java 17 (%) | — |  |  | Lower is better |
| **Garbage Collection** | GC Pause Count per 10 min | 1552 |  |  | From GC logs grep "Pause" |
|                        | GC Total Pause Time per 10 min (ms) | 7243.43 |  |  | Sum of all pauses in 10-min window |
|                        | GC CPU Time (% of total) |  |  |  | GC time / total CPU time |
|                        | Max GC Pause Duration (ms) | 100.479 |  |  | Worst-case single pause |
|                        | GC Efficiency Improvement vs Java 17 (%) | — |  |  | (Pause count reduction) |
| **Startup Time** | Cold Start Duration (seconds) |  |  |  | Scenario 6 - time to health check |
|                 | Warm Start Duration (seconds) |  |  |  | Scenario 7 - time to recovery |
|                 | Startup Time Improvement vs Java 17 (%) | — |  |  | Lower is better |
| **Cost Per Task/Month** | Total Monthly Cost per Task ($) |  |  |  | See cost calculation below |
|                        | Monthly Cost Savings vs Java 17 ($) | — |  |  | J17 cost - Jxx cost |
|                        | Monthly Cost Savings vs Java 17 (%) | — |  |  | (Savings / J17 cost) × 100 |
| **Cluster-Level Cost** | Number of Tasks in Cluster |  |  |  | Use consistent # across tests |
|                        | Total Monthly Cluster Cost ($) |  |  |  | Per-task cost × # tasks |
|                        | Quarterly Cost Savings vs Java 17 ($) | — |  |  | Monthly savings × 3 |
|                        | Annual Cost Savings vs Java 17 ($) | — |  |  | Monthly savings × 12 |


# Cost Calculation Inputs & Formulas

## AWS Fargate Pricing (Update Quarterly)

| Category | Value (us-east-1) | Notes |
|----------|--------|-------|
| Fargate vCPU Price ($/vCPU-hour) | $0.04731 | Check [AWS Pricing](https://aws.amazon.com/fargate/pricing/) for latest |
| Fargate Memory Price ($/GB-hour) | $0.00520 | Check [AWS Pricing](https://aws.amazon.com/fargate/pricing/) for latest |
| Hours per Month | 730 | 24 hours × 365 days / 12 months |

## Test Configuration

| Category | Value | Notes |
|----------|--------|-------|
| Java 17 Task Size (vCPU / GB) | 0.5 / 1.0 | Current ECS task definition |
| Java 21 Task Size (vCPU / GB) | 0.5 / 1.0 | Same as Java 17 for fair comparison |
| Java 25 Task Size (vCPU / GB) | 0.5 / 1.0 | Same as Java 17 for fair comparison |
| Number of ECS Tasks | 2 | Current prod configuration |

## Cost Calculation Formula

```
Monthly Task Cost = (vCPU × vCPU Price + Memory GB × Memory Price) × Hours per Month × Number of Tasks

Example for Java 17 with 0.5 vCPU, 1 GB memory, 2 tasks:
= ($0.04731 × 0.5 + $0.00520 × 1.0) × 730 × 2
= ($0.023655 + $0.00520) × 730 × 2
= $0.028855 × 730 × 2
= $42.17 per month

Note: This only includes ECS Fargate costs. Add RDS, ALB, and CloudWatch costs separately.
```

## Interpretation & Analysis

### When Filling in Results

1. **Metrics in comparison table**: Measure exactly as specified
   - Use k6 output for latency/throughput (not manual timing)
   - Use Prometheus for JVM metrics (not estimates)
   - Use GC logs for pause time data (not estimates)

2. **Cost calculations**: Use actual AWS billing costs when available
   - Preferred: Export from AWS Cost Explorer (most accurate)
   - Fallback: Use pricing formula above

3. **Comparing results**: Focus on these key indicators
   - Memory: 5-10% improvement typical, >15% is excellent
   - CPU: Usually similar, 2-5% improvement acceptable
   - GC: 20-50% improvement expected (especially Java 21→25)
   - Startup: 5-15% improvement possible
   - Cost: Usually scales with CPU/memory changes

### Performance Improvement Categories

| Metric | No Change | Minor (<5%) | Moderate (5-15%) | Significant (>15%) |
|--------|-----------|------------|-----------------|-------------------|
| Interpretation | Keep Java 17 | Not worth migration | Good reason to upgrade | Excellent ROI |
| Example | p95 latency | -2% | -8% | -25% |

---

## Example Completed Results (Reference)

Here's what filled-in results might look like:

```markdown
| Metric Category | Measurement | Java 17 (Baseline) | Java 21 | Java 25 | Notes |
|-----------------|-------------|---------|---------|---------|-------|
| **Memory Usage** | Peak Heap Used (MB) | 580 | 520 | 485 | ZGC uses less heap |
|                 | Average Heap Used (MB) | 410 | 380 | 350 | 15% reduction |
|                 | Memory Savings vs Java 17 (%) | — | 7% | 15% | J25 more efficient |
| **GC Metrics** | GC Pause Count per 10 min | 45 | 8 | 6 | G1GC → ZGC = fewer pauses |
|                | GC Total Pause Time per 10 min (ms) | 350 | 12 | 9 | 97% improvement (ZGC < 10ms) |
|                | GC Efficiency Improvement vs Java 17 (%) | — | 96% | 97% | Most significant improvement |
| **Throughput & Latency** | Max Sustainable RPS (Scenario 1) | 1200 | 1250 | 1300 | 8% improvement |
|  | p95 Latency - Scenario 1 (ms) | 120 | 95 | 85 | Write-heavy shows most gain |
|  | Latency Improvement vs Java 17 (%) | — | -21% | -29% | Consistent improvement |
| **Cost Per Task/Month** | Total Monthly Cost per Task ($) | 42.17 | 42.17 | 42.17 | Same task size for comparison |
|                        | Monthly Cost Savings vs Java 17 ($) | — | — | — | Compute cost same, but fewer tasks needed |
| **Cluster-Level Cost** | Total Monthly Cluster Cost ($) | 84.34 | 84.34 | 75 | Can reduce from 2→1.8 tasks with J25 throughput gain |
|                        | Annual Cost Savings vs Java 17 ($) | — | — | $111 | Modest compute savings, larger operational benefits |
```

This example shows:
- ✅ Dramatic GC improvements (97% reduction in pause time)
- ✅ Significant latency improvements (20-30%)
- ✅ Modest throughput improvements (8%)
- ✅ Conservative cost savings (compute cost same, but fewer tasks needed)
- ✅ Strong ROI case (better performance + lower operational overhead)

