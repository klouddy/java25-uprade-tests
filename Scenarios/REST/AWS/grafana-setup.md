# Grafana Dashboard Setup for Java Performance Comparison

This guide explains how to deploy Grafana and create dashboards to visualize metrics collected by Prometheus, enabling side-by-side comparison of JVM and application performance across Java versions (17, 21, 25).

## Overview

Grafana provides:
- **Real-time visualization** of metrics during load tests
- **Historical comparison** of metrics across test runs
- **Pre-built dashboards** for common JVM metrics
- **Custom alerts** when performance degrades

---

## Prerequisites

- Prometheus running and scraping metrics (see `prometheus-setup.md`)
- Docker and Docker Compose (for containerized Grafana)
- Access to Prometheus API endpoint

---

## Option 1: Grafana as Docker Container (Recommended)

### Step 1: Create Grafana Directory Structure

```bash
mkdir -p /opt/grafana/provisioning/{datasources,dashboards}
cd /opt/grafana
```

### Step 2: Create Data Source Configuration

Create `/opt/grafana/provisioning/datasources/prometheus.yml`:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090      # If on same Docker network
    isDefault: true
    editable: true
    jsonData:
      timeInterval: 15s
```

**Note**: If Prometheus is on a different host/network, use:
```yaml
url: http://<prometheus-ec2-ip>:9090
```

### Step 3: Create docker-compose.yml

Extend your existing docker-compose setup or create `/opt/grafana/docker-compose.yml`:

```yaml
version: '3.8'

services:
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin  # Change to strong password!
      - GF_SECURITY_ADMIN_USER=admin
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - ./provisioning/datasources:/etc/grafana/provisioning/datasources:ro
      - ./provisioning/dashboards:/etc/grafana/provisioning/dashboards:ro
      - grafana-storage:/var/lib/grafana
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  grafana-storage:
    driver: local
```

### Step 4: Start Grafana

```bash
cd /opt/grafana
docker-compose up -d

# Verify
docker-compose logs grafana

# Check health
curl http://localhost:3000/api/health
```

### Step 5: Access Grafana UI

1. Open `http://<grafana-host>:3000`
2. Login: `admin` / `admin` (or your custom password)
3. You'll be prompted to change password - **do this for security**

---

## Creating Dashboards

### Dashboard 1: JVM Memory & Garbage Collection

**Purpose**: Track heap memory usage and GC behavior across Java versions.

**Queries**:

| Panel | Title | Query | Notes |
|-------|-------|-------|-------|
| Graph | Heap Memory Usage | `jvm_memory_usage_bytes{area="heap"}` | Shows memory in bytes |
| Graph | GC Pause Duration | `increase(jvm_gc_pause_seconds_sum[5m]) / increase(jvm_gc_pause_seconds_count[5m])` | Average GC pause time |
| Stat | Current Heap Size | `jvm_memory_usage_bytes{area="heap"}` | Gauge showing current value |
| Table | GC Events | `increase(jvm_gc_memory_allocated_bytes_total[1m])` | GC frequency |
| Graph | Memory Pools (Young Gen) | `jvm_memory_usage_bytes{area="heap", id="G1 Young Generation"}` | Track young generation |
| Graph | Memory Pools (Old Gen) | `jvm_memory_usage_bytes{area="heap", id="G1 Old Generation"}` | Track old generation |

**Thresholds for Java versions**:
- **Java 17 (G1GC)**: Expect more frequent GC pauses, older monitoring
- **Java 21 (ZGC)**: Ultra-low pause times (<10ms), more complex metrics
- **Java 25 (ZGC)**: Similar to 21 with potential improvements

---

### Dashboard 2: Application Performance & Throughput

**Purpose**: Compare request latency and throughput across Java versions.

**Queries**:

| Panel | Title | Query | Notes |
|-------|-------|-------|-------|
| Graph | Request Latency (p50) | `histogram_quantile(0.50, rate(http_server_requests_seconds_bucket[1m]))` | Median latency |
| Graph | Request Latency (p95) | `histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[1m]))` | 95th percentile |
| Graph | Request Latency (p99) | `histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[1m]))` | 99th percentile |
| Stat | Requests Per Second | `rate(http_server_requests_seconds_count[1m])` | Throughput metric |
| Graph | Error Rate | `rate(http_server_requests_seconds_count{status=~"5.."}[1m])` | 5xx errors/sec |
| Heatmap | Request Distribution | `http_server_requests_seconds_bucket` | Visual latency distribution |
| Table | Endpoint Breakdown | `topk(10, rate(http_server_requests_seconds_count[5m]))` | Top 10 endpoints |

**Performance targets** (baseline expectations, Java 17):
- p50 latency: < 50ms
- p95 latency: < 100ms
- p99 latency: < 200ms
- Throughput: 500-1000 req/sec (depends on hardware)

**Improvements to expect**:
- Java 21/25: 10-20% lower p95/p99 latency
- Java 21/25: Similar or slightly better throughput

---

### Dashboard 3: Database Connection Pool & Activity

**Purpose**: Monitor database connection utilization.

**Queries**:

| Panel | Title | Query | Notes |
|-------|-------|-------|-------|
| Graph | Active Connections | `hikaricp_connections_active` | Real-time connections |
| Graph | Pending Connection Requests | `hikaricp_connections_pending` | Queue depth |
| Stat | Max Pool Size | `hikaricp_connections_max` | Configured pool size |
| Graph | Connection Wait Time | `increase(hikaricp_connections_acquire_micros_sum[5m]) / increase(hikaricp_connections_acquire_micros_count[5m])` | Average wait in microseconds |

---

### Dashboard 4: CPU & Container Resource Utilization

**Purpose**: Track CPU usage and container limits (via CloudWatch Container Insights after enabling).

**Queries** (CloudWatch metrics require Container Insights enabled):

| Panel | Title | Data Source | Notes |
|-------|-------|-------------|-------|
| Graph | CPU Utilization % | CloudWatch | Shows % of allocated CPU |
| Graph | Memory Utilization % | CloudWatch | Shows % of allocated RAM |
| Stat | Task Crashes | CloudWatch | Count of failed task deployments |

**Manual correlation** (without Container Insights):
- Note CPU usage from `top` or CloudWatch when running tests
- Correlate with request latency from application metrics

---

### Dashboard 5: GC Logging Metrics (Manual Integration)

**Purpose**: Parse and display GC log data alongside application metrics.

Once you download GC logs from ECS tasks, parse them and import as custom metrics:

```bash
# Example: Parse GC log to extract pause times
grep "Pause" gc.log | awk '{print $7}' | sort -n | tail -c 20
```

**Manual steps**:
1. Download GC logs from ECS task after test run
2. Parse log with `jq` or GC log parsing tools
3. Create CSV with timestamps and pause times
4. Upload to Prometheus as custom metrics (advanced)

---

## How to Create a Dashboard in UI

1. **Create new dashboard**:
   - Click "+" → Dashboard
   - Click "Add panel"

2. **Configure data source**:
   - Select "Prometheus"
   - Enter PromQL query
   - Set visualization type (Graph, Stat, Table, etc.)

3. **Set title and legend**:
   - Title: e.g., "Request Latency P95"
   - Legend: Show series names

4. **Configure axes**:
   - Y-axis label: e.g., "Latency (seconds)"
   - Format: Time or Number

5. **Add alert threshold** (optional):
   - Click "Alert" tab
   - Set alert condition (e.g., "when p95 > 0.1s")

6. **Save**:
   - Click "Save" → Enter dashboard name
   - Use naming: `[JavaVersion]-Performance-[Scenario]`
   - Example: `Java25-Performance-REST-ReadHeavy`

---

## Organizing Dashboards by Scenario

Create separate dashboards for each REST scenario:

```
Dashboards/
├── Overview - All Java Versions
│   ├── Throughput Comparison
│   ├── Memory Usage Comparison
│   └── GC Behavior Comparison
│
├── Scenario 1: REST-ReadHeavy
│   ├── Java17-REST-ReadHeavy
│   ├── Java21-REST-ReadHeavy
│   └── Java25-REST-ReadHeavy
│
├── Scenario 2: REST-WriteHeavy
│   ├── Java17-REST-WriteHeavy
│   ├── Java21-REST-WriteHeavy
│   └── Java25-REST-WriteHeavy
│
... (continue for all 7 scenarios)
```

---

## Using Dashboard Variables for Comparison

Create **templated dashboard** to switch between Java versions:

1. Go to Dashboard settings (gear icon)
2. Add variable:
   - Name: `java_version`
   - Type: `Query`
   - Query: `label_values(http_server_requests_seconds_bucket, instance)`
   - Multi-select: Yes

3. Modify panel queries to use variable:
   ```promql
   # Before:
   histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))
   
   # After:
   histogram_quantile(0.95, rate(http_server_requests_seconds_bucket{instance=~"$java_version"}[5m]))
   ```

4. Now dropdown allows switching between java17, java21, java25

---

## Exporting Metrics for Analysis

### As CSV for Spreadsheet Analysis

In Grafana:
1. Click panel
2. "Inspect" → "Data" tab
3. Copy table → paste into Excel/Sheets

### As JSON via Prometheus API

```bash
# Query Prometheus directly
curl 'http://prometheus:9090/api/v1/query_range?query=up&start=1676894400&end=1676895300&step=60' | jq '.'

# Save to file
curl -s 'http://prometheus:9090/api/v1/query_range?query=http_server_requests_seconds_bucket&start=1676894400&end=1676895300&step=60' > metrics.json
```

---

## Sharing Results

### Publish Dashboard as Image
1. In Grafana, click Share button
2. "Public dashboard" or "Snapshot"
3. Copy link to share with team

### Export Full Dashboard JSON
1. Dashboard settings → JSON model
2. Copy all JSON
3. Share for reproducibility

---

## Troubleshooting

**Dashboard shows "No data"**:
- Verify Prometheus datasource is configured correctly
- Check Prometheus is scraping application metrics
- Verify time range in Grafana matches test duration

**Metrics lagging**:
- Reduce scrape interval in Prometheus (see prometheus-setup.md)
- Reduce dashboard refresh rate (top-right)

**Out of memory errors in Grafana**:
- Increase Docker container memory: `mem_limit: 1g` in docker-compose.yml
- Reduce dashboard refresh frequency
- Close unused dashboards/tabs

---

## Next Steps

1. ✅ Deploy Grafana (this guide)
2. ✅ Create JVM Memory & GC dashboard
3. ✅ Create Application Performance dashboard
4. Configure load testing with k6 (see `k6-load-tests/`)
5. Run baseline test and collect metrics
6. Compare across Java versions in Grafana

---

## References

- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [Prometheus Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [JVM Micrometer Metrics Reference](https://micrometer.io/docs/concepts)
