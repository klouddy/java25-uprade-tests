# k6 Load Test Scenarios for Java 25 Upgrade Comparison

This directory contains comprehensive k6 load test scripts for comparing REST API performance across Java versions (17, 21, 25).

## Prerequisites

- k6 installed: https://k6.io/docs/getting-started/installation/
- Application running and accessible at deployment endpoint
- Metrics collection enabled (Prometheus recommended - see `../AWS/prometheus-setup.md`)

## Project Structure

```
k6-load-tests/
├── utils.js                          # Shared utilities for all scenarios
├── scenario-1-read-heavy.js          # 60% read, 20% search, 20% write
├── scenario-2-balanced.js            # 40% read, 20% search, 40% write  
├── scenario-3-write-heavy.js         # 10% read, 10% search, 80% write
├── scenario-4-ramp-up.js             # Gradual load increase to find max capacity
├── scenario-5-burst-spike.js         # Sudden traffic spike simulation
├── scenario-6-cold-start.js          # Measure JVM startup time
├── scenario-7-warm-start.js          # Measure deployment restart impact
└── README.md                         # This file
```

## Running Tests

### Basic Syntax

```bash
# Run a single scenario
k6 run scenario-1-read-heavy.js

# Run with custom target URL
k6 run --env BASE_URL=http://your-alb-dns:8080 scenario-1-read-heavy.js

# Run with output to JSON for later analysis
k6 run scenario-1-read-heavy.js --out json=results-java17.json

# Run with custom summary
k6 run scenario-1-read-heavy.js --summary-export=summary-java17.json
```

### Running All Scenarios Sequentially (Full Test Campaign)

```bash
#!/bin/bash
# save as run-all-scenarios.sh

BASE_URL="http://your-alb-dns:8080"
RESULTS_DIR="./results-java17"
mkdir -p $RESULTS_DIR

echo "Running all 7 scenarios for Java 17..."

k6 run --env BASE_URL=$BASE_URL --out json=results-java17/scenario-1-read-heavy.json \
  scenario-1-read-heavy.js

k6 run --env BASE_URL=$BASE_URL --out json=results-java17/scenario-2-balanced.json \
  scenario-2-balanced.js

k6 run --env BASE_URL=$BASE_URL --out json=results-java17/scenario-3-write-heavy.json \
  scenario-3-write-heavy.js

k6 run --env BASE_URL=$BASE_URL --out json=results-java17/scenario-4-ramp-up.json \
  scenario-4-ramp-up.js

k6 run --env BASE_URL=$BASE_URL --out json=results-java17/scenario-5-burst-spike.json \
  scenario-5-burst-spike.js

k6 run --env BASE_URL=$BASE_URL --out json=results-java17/scenario-6-cold-start.json \
  scenario-6-cold-start.js

k6 run --env BASE_URL=$BASE_URL --out json=results-java17/scenario-7-warm-start.json \
  scenario-7-warm-start.js

echo "All scenarios completed. Results saved to $RESULTS_DIR"
```

## Scenario Descriptions

### Scenario 1: Read-Heavy  
**Duration**: ~14 minutes  
**VU Profile**: 0→50 (2 min) → 500 (10 min) → 0 (2 min)  
**Traffic Mix**: 60% reads, 20% search, 20% writes  
**Purpose**: Measure sustained throughput and latency under read-dominated loads  
**Expected Impact**: Java 21/25 shows 10-20% better p95/p99 latency

```bash
k6 run scenario-1-read-heavy.js
```

### Scenario 2: Balanced  
**Duration**: ~14 minutes  
**VU Profile**: 0→50 (2 min) → 300 (10 min) → 0 (2 min)  
**Traffic Mix**: 40% reads, 20% search, 40% writes  
**Purpose**: Evaluate performance with balanced CRUD operations  
**Expected Impact**: Java 21/25 handles connection pooling more efficiently

```bash
k6 run scenario-2-balanced.js
```

### Scenario 3: Write-Heavy  
**Duration**: ~14 minutes  
**VU Profile**: 0→50 (2 min) → 200 (10 min) → 0 (2 min)  
**Traffic Mix**: 10% reads, 10% search, 80% writes  
**Purpose**: Stress test with heavy allocation pressure (JSON deserialization)  
**Expected Impact**: Java 25 shows most improvement (30-50% reduction in GC pause times)

```bash
k6 run scenario-3-write-heavy.js
```

### Scenario 4: Ramp-Up Scalability  
**Duration**: ~14 minutes  
**VU Profile**: 0→1000 (10 min) → hold (2 min) → cool-down (2 min)  
**Traffic Mix**: 60% reads, 20% search, 20% writes  
**Purpose**: Find system saturation point and max throughput  
**Expected Impact**: Java 21/25 reaches saturation at higher throughput

```bash
k6 run scenario-4-ramp-up.js
```

### Scenario 5: Burst/Spike Test  
**Duration**: ~11 minutes  
**VU Profile**: 50 → 800 spike (3 min hold) → recover (2 min) → idle (2 min)  
**Traffic Mix**: 60% reads, 20% search, 20% writes  
**Purpose**: Test response to sudden traffic spikes (campaigns, promotions)  
**Expected Impact**: Java 21/25 recovers faster from GC-induced latency spikes

```bash
k6 run scenario-5-burst-spike.js
```

### Scenario 6: Cold Start  
**Duration**: ~5-30 seconds (depends on Java version)  
**VU Profile**: Single VU polling health endpoint  
**Purpose**: Measure JVM startup time and Spring Boot initialization  
**Expected Impact**: Java 25 may be 5-15% faster with improved startup optimizations

```bash
k6 run scenario-6-cold-start.js
```

### Scenario 7: Warm Start / Rolling Deployment  
**Duration**: ~8 minutes  
**VU Profile**: 100 VUs (baseline 2 min) → 200 VUs (deploy 3 min) → 100 VUs (recovery 3 min)  
**Purpose**: Measure deployment impact with ECS rolling update behavior  
**Tutorial**:
  1. Start test: `k6 run scenario-7-warm-start.js`
  2. During "Deploy Phase", restart the ECS task:
     ```bash
     aws ecs update-service --cluster java-bench-cluster \
       --service java-bench-service --force-new-deployment
     ```
  3. Watch k6 console for latency spikes
  4. Observe JIT warm-up curve in metrics

```bash
k6 run scenario-7-warm-start.js
```

## Configuration Options

### Custom Base URL
```bash
k6 run --env BASE_URL=http://your-alb.amazonaws.com:8080 scenario-1-read-heavy.js
```

### Custom Results Directory
```bash
k6 run --env RESULTS_DIR=./my-results scenario-1-read-heavy.js
```

### Running with Tags (filter results)
```bash
k6 run scenario-1-read-heavy.js --include-only-tags name:read-heavy
```

## Output and Results

### Console Output
- Real-time metrics dashboard
- Pass/fail summary for thresholds
- p50/p95/p99 latencies
- Request count and error rates

### JSON Export
```bash
k6 run scenario-1-read-heavy.js --out json=results.json
```

Analyze with tools:
```bash
# Check error rate
jq '.data.metrics.http_req_failed' results.json

# Export latencies
jq '.data.samples[] | select(.metric=="http_req_duration") | .value' results.json > latencies.txt
```

### Summary Export
```bash
k6 run scenario-1-read-heavy.js --summary-export=summary.json
```

## Comparing Results Across Java Versions

### 1. Collect Results for Each Version

```bash
# Java 17
k6 run --env BASE_URL=http://java17-alb:8080 \
  --out json=results-java17.json scenario-1-read-heavy.js

# Java 21  
k6 run --env BASE_URL=http://java21-alb:8080 \
  --out json=results-java21.json scenario-1-read-heavy.js

# Java 25
k6 run --env BASE_URL=http://java25-alb:8080 \
  --out json=results-java25.json scenario-1-read-heavy.js
```

### 2. Extract Key Metrics

```bash
# Extract p95 latency for each version
for file in results-*.json; do
  echo "$file:"
  jq '.data.metrics.http_req_duration | select(.type=="histogram") | .values.p95' $file
done
```

### 3. Create Comparison Spreadsheet

Copy metrics into [../../../Comparison.md](../../../Comparison.md):
- Throughput (requests/sec)
- Latency (p50, p95, p99)
- Error rate
- Resource utilization (from CloudWatch/Prometheus)

## Troubleshooting

### Connection Refused
```
Error: tcp Dial() error: dial tcp: lookup: no such host
```
- Verify `BASE_URL` is correct
- Check ALB is accessible from your network
- Verify security groups allow inbound traffic

### High Error Rates
```
http_req_failed is above 5%
```
- Reduce VU count in scenario
- Verify RDS database is healthy
- Check application logs for errors

### k6 Installation Issues
```bash
# macOS
brew install k6

# Linux
apt-get install k6

# Or download from https://k6.io/docs/getting-started/installation/
```

## Performance Expectations

Based on a t4g.micro RDS instance and 512 CPU / 1024 MB ECS tasks:

| Scenario | Java 17 | Java 21 | Java 25 |
|----------|---------|---------|---------|
| Read-Heavy (p95) | 120ms | 95ms | 90ms |
| Write-Heavy (p95) | 250ms | 180ms | 150ms |
| Max RPS | 800 | 1000 | 1050 |
| Cold start | 8-10s | 8-10s | 7-8s |

Your actual results may vary based on:
- Instance types and sizes
- Network latency to RDS
- Database query complexity
- Concurrent request patterns

## Advanced Usage

### Grafana Integration

View k6 metrics in real-time in Grafana:
```bash
k6 run scenario-1-read-heavy.js \
  --out grafana \
  --summary-export=summary.json
```

(Requires Grafana Cloud or Prometheus data source configured)

### Custom Thresholds

Modify scenario thresholds based on your requirements:
```javascript
export const options = {
  thresholds: {
    'http_req_duration': [
      'p(95)<200',      // 95% of requests must be < 200ms
      'p(99)<500',      // 99% must be < 500ms
      'p(99.9)<1000',   // 99.9% must be < 1s
    ],
    'http_req_failed': ['rate<0.01'],  // Less than 1% failure rate
  },
};
```

## Next Steps

1. ✅ Create k6 scenarios (this file)
2. Run scenarios for Java 17 baseline
3. Run scenarios for Java 21 and Java 25
4. Export results to JSON
5. Add metrics to [../../../Comparison.md](../../../Comparison.md)
6. Compare throughput, latency, GC behavior
7. Document findings

---

See also:
- [REST Scenario Documentation](../rest-rds-scenarios.md)
- [Prometheus Setup](../AWS/prometheus-setup.md)
- [Grafana Dashboard Setup](../AWS/grafana-setup.md)
- [k6 Documentation](https://k6.io/docs/)
