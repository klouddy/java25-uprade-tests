# Data Collection Runbook: Java 25 Upgrade Comparison

Complete step-by-step guide for running the full performance comparison test campaign across Java 17, 21, and 25.

**Total Time Required**: ~2-3 hours per Java version (7 scenarios × ~15 min each + cooldown + analysis)

---

## Pre-Flight Checklist

Before starting ANY testing, verify:

- [ ] **AWS Infrastructure**
  - [ ] ECS cluster is running: `aws ecs describe-clusters --clusters java-bench-cluster`
  - [ ] RDS database is running: `aws rds describe-db-instances --db-instance-identifier java-bench-db`
  - [ ] ALB is healthy: Check AWS Console → ECS → Services → Targets (should be "healthy")
  - [ ] Security groups allow ALB → ECS on port 8080

- [ ] **Monitoring Stack**
  - [ ] Prometheus running and scraping metrics: `curl http://prometheus:9090/api/v1/targets`
  - [ ] Grafana accessible: `curl http://grafana:3000` (should return HTML)
  - [ ] CloudWatch Logs group exists: `/ecs/java-bench-app`

- [ ] **Application Ready**
  - [ ] Application health endpoint works: `curl http://alb-dns:8080/actuator/health`
  - [ ] Metrics endpoint accessible: `curl http://alb-dns:8080/actuator/prometheus` (should return metrics)
  - [ ] Database connected: Check app logs for "Hikari pool"
  - [ ] GC logs are being written: Check `/var/log/gc/` directory in container

- [ ] **Load Testing**
  - [ ] k6 installed: `k6 version`
  - [ ] k6 can reach ALB: `curl http://alb-dns:8080/actuator/health`
  - [ ] Enough disk space for results: `df -h` (at least 500MB free)

- [ ] **AWS Permissions**
  - [ ] Can list ECS tasks: `aws ecs list-tasks --cluster java-bench-cluster`
  - [ ] Can access RDS: `aws rds describe-db-instances`
  - [ ] Can query costs: `aws ce get-cost-and-usage`

---

## Phase 1: Deploy Java 17 (Baseline Reference)

### Step 1a: Build and Push Java 17 Docker Image

```bash
cd Scenarios/REST/spring-boot-app/

# Build Java 17 image
docker build -f Dockerfile.java17 \
  -t benchmark-app:java17 \
  .

# Tag for ECR
docker tag benchmark-app:java17 YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java17

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java17

echo "✓ Java 17 image pushed to ECR"
```

### Step 1b: Update ECS Task Definition

```bash
# Update the image reference in task-def.json
sed -i 's|"image": ".*benchmark-app:.*"|"image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java17"|g' AWS/task-def.json

# Register new task definition
aws ecs register-task-definition --cli-input-json file://AWS/task-def.json

# Get the new revision number (output will show it)
TASK_REVISION=$(aws ecs describe-task-definition \
  --task-definition java-bench-task \
  --query 'taskDefinition.revision' \
  --output text)

echo "✓ Task definition registered: java-bench-task:$TASK_REVISION"
```

### Step 1c: Deploy to ECS

```bash
# Update ECS service to use new task definition
aws ecs update-service \
  --cluster java-bench-cluster \
  --service java-bench-service \
  --task-definition java-bench-task:$TASK_REVISION \
  --force-new-deployment

# Wait for service to stabilize (2-3 minutes)
echo "Waiting for tasks to become healthy (2-3 minutes)..."
sleep 180

# Verify tasks are running
aws ecs describe-services \
  --cluster java-bench-cluster \
  --services java-bench-service \
  --query 'services[0].{DesiredC: desiredCount, RunningC: runningCount, DeploymentStatus: deployments[0].status}'

echo "✓ Java 17 deployed"
```

### Step 1d: Verify Application Health

```bash
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names java-bench-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

# Health check (should return 200)
curl -v http://$ALB_DNS:8080/actuator/health

# Verify metrics endpoint
curl http://$ALB_DNS:8080/actuator/prometheus | head -20

# Verify Prometheus is scraping
curl http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[0].health'

echo "✓ Application healthy and metrics flowing"
```

---

## Phase 2: Run Load Tests (Java 17 Baseline)

### Step 2a: Prepare

```bash
# Create results directory
mkdir -p results-java17
cd Scenarios/REST/k6-load-tests/

# Set environment variables
export BASE_URL="http://$ALB_DNS:8080"
export RESULTS_DIR="../../../results-java17"

echo "Target: $BASE_URL"
echo "Results will be saved to: $RESULTS_DIR"

# Wait 3 minutes for JIT warmup
echo "Waiting for JIT warmup (3 minutes)..."
sleep 180

# Verify still healthy
curl http://$BASE_URL/actuator/health
```

### Step 2b: Run All 7 Scenarios

**IMPORTANT**: Run scenarios sequentially, waiting for cooldown between each.

```bash
# Scenario 1: Read-Heavy (14 min)
echo "=== Starting Scenario 1: Read-Heavy ==="
k6 run --env BASE_URL=$BASE_URL \
  --out json=$RESULTS_DIR/scenario-1-read-heavy.json \
  scenario-1-read-heavy.js

echo "Cooldown... waiting 5 minutes before next scenario"
sleep 300

# Scenario 2: Balanced (14 min)
echo "=== Starting Scenario 2: Balanced ==="
k6 run --env BASE_URL=$BASE_URL \
  --out json=$RESULTS_DIR/scenario-2-balanced.json \
  scenario-2-balanced.js

sleep 300

# Scenario 3: Write-Heavy (14 min)
echo "=== Starting Scenario 3: Write-Heavy ==="
k6 run --env BASE_URL=$BASE_URL \
  --out json=$RESULTS_DIR/scenario-3-write-heavy.json \
  scenario-3-write-heavy.js

sleep 300

# Scenario 4: Ramp-Up (14 min)
echo "=== Starting Scenario 4: Ramp-Up ==="
k6 run --env BASE_URL=$BASE_URL \
  --out json=$RESULTS_DIR/scenario-4-ramp-up.json \
  scenario-4-ramp-up.js

sleep 300

# Scenario 5: Burst/Spike (11 min)
echo "=== Starting Scenario 5: Burst/Spike ==="
k6 run --env BASE_URL=$BASE_URL \
  --out json=$RESULTS_DIR/scenario-5-burst-spike.json \
  scenario-5-burst-spike.js

sleep 300

# Scenario 6: Cold Start (5-30 sec - will be much faster)
echo "=== Starting Scenario 6: Cold Start ==="
# First, restart the ECS task to get a fresh cold start
aws ecs update-service --cluster java-bench-cluster --service java-bench-service --force-new-deployment
echo "Waiting for task to restart..."
sleep 60

k6 run --env BASE_URL=$BASE_URL \
  --out json=$RESULTS_DIR/scenario-6-cold-start.json \
  scenario-6-cold-start.js

sleep 300

# Scenario 7: Warm Start (8 min)
echo "=== Starting Scenario 7: Warm Start ==="
echo "Instructions:"
echo "1. k6 will run baseline + deploy window + recovery"
echo "2. During 'Deploy Phase' output (after 2 minutes), run:"
echo "   aws ecs update-service --cluster java-bench-cluster --service java-bench-service --force-new-deployment"
echo "3. Watch k6 console for latency spikes"
echo ""

k6 run --env BASE_URL=$BASE_URL \
  --out json=$RESULTS_DIR/scenario-7-warm-start.json \
  scenario-7-warm-start.js

echo "✓ All scenarios completed for Java 17"
```

### Step 2c: Collect GC Logs

```bash
# Get currently running task ID
TASK_ID=$(aws ecs list-tasks --cluster java-bench-cluster \
  --query 'taskArns[0]' \
  --output text | awk -F'/' '{print $NF}')

# Download GC logs from container
aws ecs execute-command \
  --cluster java-bench-cluster \
  --task $TASK_ID \
  --container java-bench-app \
  --command "cat /var/log/gc/gc.log" \
  --interactive > $RESULTS_DIR/gc.log

# Analyze GC log
echo "GC Pause Statistics:"
grep -oP '(?<=Pause )[\d.]+(?= ms)' $RESULTS_DIR/gc.log | \
  awk '{sum+=$1; count++; if($1>max) max=$1} END {print "Count: "count", Max: "max"ms, Avg: "sum/count"ms"}'

echo "✓ GC logs collected"
```

### Step 2d: Query Prometheus Metrics

```bash
# Define test time window (from start to end of all scenarios)
START_TIME=$(date -u -d "1 hour ago" +%s)
END_TIME=$(date -u +%s)

# Query p95 latency
echo "p95 Latency (Java 17):"
curl -s 'http://prometheus:9090/api/v1/query_range' \
  --data-urlencode "query=histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))" \
  --data-urlencode "start=$START_TIME" \
  --data-urlencode "end=$END_TIME" \
  --data-urlencode "step=300" | \
  jq '.data.result[0].values[-1][1]'

# Query heap memory
echo "Peak Heap Memory (Java 17):"
curl -s 'http://prometheus:9090/api/v1/query_range' \
  --data-urlencode "query=max(jvm_memory_usage_bytes{area=\"heap\"})" \
  --data-urlencode "start=$START_TIME" \
  --data-urlencode "end=$END_TIME" \
  --data-urlencode "step=300" | \
  jq '.data.result[0].values[-1][1] / 1024 / 1024'

echo "✓ Prometheus metrics collected"
```

---

## Phase 3: Deploy and Test Java 21

Repeat Phase 1 and 2 with Java 21:

```bash
# Update Dockerfile reference
sed -i 's/java17/java21/g' spring-boot-app/AWS/task-def.json

# Follow Phase 1 steps with "java21" instead of "java17"
# Follow Phase 2 steps, save results to results-java21/

# When done:
echo "✓ Java 21 testing completed"
```

---

## Phase 4: Deploy and Test Java 25

Repeat Phase 1 and 2 with Java 25:

```bash
# Update Dockerfile reference
sed -i 's/java21/java25/g' spring-boot-app/AWS/task-def.json

# Follow Phase 1 steps with "java25" instead of "java17"
# Follow Phase 2 steps, save results to results-java25/

# When done:
echo "✓ Java 25 testing completed"
```

---

## Phase 5: Analysis and Reporting

### Step 5a: Extract Key Metrics

```bash
# Create comparison CSV
cat > metrics-comparison.csv << EOF
Java Version,Scenario,p95 Latency (ms),p99 Latency (ms),Peak Memory (MB),GC Pause Count,Max Pause (ms),Cost
EOF

# For each results directory
for java_version in java17 java21 java25; do
  # Extract metrics from JSON
  # (Use jq to parse k6 JSON output)
  # Append to metrics-comparison.csv
done

echo "✓ Metrics extracted to metrics-comparison.csv"
```

### Step 5b: Fill in Comparison.md

```bash
# Open Comparison.md and fill in results
cd ../../../
cat > RESULTS-SUMMARY.md << 'EOF'
# Java 25 Upgrade Comparison Summary

## Test Date
$(date)

## Results
[Copy metrics from metrics-comparison.csv above]

## Key Findings
- GC improvement: [FROM GC LOGS]
- Latency improvement: [FROM PROMETHEUS]
- Memory improvement: [FROM JVM METRICS]
- Cost impact: [FROM AWS COST EXPLORER]

## Recommendation
[UPGRADE / DO NOT UPGRADE]
EOF

echo "✓ Results documented"
```

### Step 5c: Calculate Cost Savings

```bash
# Query AWS Billing Cost Explorer
aws ce get-cost-and-usage \
  --time-period Start=2024-02-19,End=2024-02-25 \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --group-by Type=TAG,Key=JavaVersion \
  --output json > costs.json

# Calculate annual savings
# (See AWS/cost-tracking.md for detailed calculation)

echo "✓ Cost analysis complete"
```

### Step 5d: Generate Executive Summary

```bash
cat > EXECUTIVE-SUMMARY.txt << 'EOF'
JAVA 25 UPGRADE ANALYSIS - EXECUTIVE SUMMARY
=============================================

PERFORMANCE METRICS:
- Latency improvement (p95): [%]
- GC pause time reduction: [%]
- Memory usage reduction: [%]
- Throughput improvement: [%]

COST ANALYSIS:
- Compute cost reduction: [%]
- Estimated annual savings: $[amount]
- ROI payback period: [months]

RECOMMENDATION: UPGRADE / DO NOT UPGRADE

Risk assessment: [LOW / MEDIUM / HIGH]
Next steps: [describe migration plan]
EOF

cat EXECUTIVE-SUMMARY.txt

echo "✓ Executive summary generated - ready for stakeholder review"
```

---

## Troubleshooting During Execution

### Application Not Healthy

```bash
# Check application logs
aws logs tail /ecs/java-bench-app --follow

# Check ECS task status
aws ecs describe-tasks --cluster java-bench-cluster \
  --tasks <task-arn> \
  --query 'tasks[0].[launchType, lastStatus, stopCode]'

# Restart if needed
aws ecs update-service --cluster java-bench-cluster \
  --service java-bench-service \
  --force-new-deployment
```

### High Error Rates in k6

```bash
# Check application response codes
curl -w "%{http_code}\n" http://$ALB_DNS:8080/customers/1

# Check RDS connection
aws rds describe-db-instances --db-instance-identifier java-bench-db \
  --query 'DBInstances[0].DBInstanceStatus'

# Reduce VUs if needed and retry
```

### Metrics Not Available in Prometheus

```bash
# Verify Prometheus scraping
curl http://prometheus:9090/api/v1/targets | jq .

# Check application metrics endpoint
curl http://$ALB_DNS:8080/actuator/prometheus | head -20

# Restart Prometheus if needed
docker restart prometheus
```

---

## Post-Test Cleanup

### Archive Results

```bash
# Compress all results directories
tar -czf java-25-upgrade-results.tar.gz results-java17 results-java21 results-java25 *.csv *.json

# Store in S3 for archival
aws s3 cp java-25-upgrade-results.tar.gz s3://your-bucket/java-upgrade-tests/
```

### Restore to Preferred Version

```bash
# Deploy best performing Java version
# (Or keep on Java 17 baseline if results don't warrant upgrade)
aws ecs update-service --cluster java-bench-cluster \
  --service java-bench-service \
  --task-definition java-bench-task:17 \
  --force-new-deployment
```

---

## Files Generated

After completing this runbook, you should have:

```
results-java17/
├── scenario-1-read-heavy.json
├── scenario-2-balanced.json
├── scenario-3-write-heavy.json
├── scenario-4-ramp-up.json
├── scenario-5-burst-spike.json
├── scenario-6-cold-start.json
├── scenario-7-warm-start.json
└── gc.log

results-java21/
├── ... (same as above)

results-java25/
├── ... (same as above)

metrics-comparison.csv          # Summary metrics across all versions
costs.json                      # AWS billing data
RESULTS-SUMMARY.md             # Detailed findings
EXECUTIVE-SUMMARY.txt          # Business-focused summary
java-25-upgrade-results.tar.gz # Archived results
```

---

## Success Criteria

✅ Test is complete when:
- [ ] All 7 scenarios ran for all 3 Java versions without errors
- [ ] Results saved to JSON
- [ ] GC logs collected and analyzed
- [ ] Prometheus metrics exported
- [ ] Comparison.md filled in with data
- [ ] Cost analysis completed
- [ ] Executive summary generated
- [ ] Results reviewed and approved by team

---

## Timeline Estimate

- Phase 1 (Setup Java 17): 20 minutes
- Phase 2 (Run tests): 2 hours
- Phase 3 (Setup Java 21): 20 minutes
- Phase 2 (Run tests): 2 hours
- Phase 4 (Setup Java 25): 20 minutes
- Phase 2 (Run tests): 2 hours
- Phase 5 (Analysis): 1 hour

**Total: ~8-10 hours** (can be spread over 2-3 days)

---

## References

- [REST Scenario Definitions](rest-rds-scenarios.md)
- [k6 Load Testing Guide](k6-load-tests/README.md)
- [Prometheus Setup](AWS/prometheus-setup.md)
- [Grafana Setup](AWS/grafana-setup.md)
- [Cost Analysis](AWS/cost-tracking.md)
- [Detailed Comparison Methodology](../../Comparison.md)
