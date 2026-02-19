# Prometheus Deployment for Performance Metrics Collection

This guide explains how to deploy and configure Prometheus to scrape metrics from your Spring Boot application running on ECS, enabling real-time monitoring and long-term metric storage for performance comparison across Java versions.

## Overview

Prometheus is a time-series database and monitoring system that:
- Scrapes metrics from your application's `/actuator/prometheus` endpoint
- Stores metrics with timestamps for historical analysis
- Provides a query language (PromQL) for analyzing performance trends
- Can be visualized with Grafana (see `grafana-setup.md`)

### Key Metrics Captured
- **Application-level**: Request latency (percentiles), throughput, error rates
- **JVM**: Heap memory usage, GC activity, thread counts, class loading
- **Database**: Connection pool utilization, active connections
- **Infrastructure**: Container resource constraints

---

## Option 1: Prometheus as EC2-Hosted Container (Recommended for Persistent Testing)

This approach runs Prometheus on an EC2 instance where it will collect and store metrics throughout your test campaign (days/weeks of comparative testing).

### Prerequisites
- AWS account with EC2 and VPC access
- IAM permissions to create security groups
- Application already deployed to ECS (with ALB DNS available)

### Step 1: Create EC2 Instance for Prometheus

```bash
# Use AWS CLI to launch a small EC2 instance (t3.micro covers costs)
aws ec2 run-instances \
  --image-id ami-0c02fb55b4b7df83d \
  --instance-type t3.micro \
  --key-name your-key-pair-name \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=prometheus-monitor},{Key=Purpose,Value=Java-Benchmark}]'
```

Alternatively, use the AWS Console:
1. EC2 → Instances → Launch Instances
2. Select **Ubuntu 24.04 LTS** (ami-xxxx)
3. Instance type: `t3.micro` (1 vCPU, 1 GB RAM)
4. VPC: Same VPC as your ECS cluster
5. Security Group: Create new with:
   - Inbound: HTTP (80) from ALB security group
   - Inbound: SSH (22) from your IP
   - Inbound: Prometheus (9090) from your IP

### Step 2: Install Docker and Docker Compose

SSH into the EC2 instance:

```bash
ssh -i your-key.pem ubuntu@<ec2-instance-ip>

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

### Step 3: Create Prometheus Configuration

Create `prometheus.yml` on the EC2 instance:

```bash
mkdir -p /opt/prometheus
```

Create `/opt/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s        # Scrape metrics every 15 seconds (change to 10s for more detailed data)
  evaluation_interval: 15s
  external_labels:
    cluster: 'java-benchmark'
    environment: 'aws'

# Alerting rules (optional)
alerting:
  alertmanagers:
    - static_configs:
        - targets: []

rule_files: []

scrape_configs:
  - job_name: 'spring-boot-app'
    # ALB DNS name - replace with your actual ALB endpoint
    static_configs:
      - targets: ['java-bench-alb-1234567890.us-east-1.elb.amazonaws.com:8080']
    
    metrics_path: '/actuator/prometheus'
    
    # Relabel instance name to include Java version for better organization
    relabel_configs:
      - source_labels: [__address__]
        regex: '([^:]+)(?::\d+)?'
        replacement: '${1}'
        target_label: instance
    
    scrape_timeout: 10s
    scrape_interval: 15s
```

**Important:** Replace `java-bench-alb-1234567890.us-east-1.elb.amazonaws.com` with your actual ALB DNS name.

### Step 4: Create docker-compose.yml

Create `/opt/prometheus/docker-compose.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-storage:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'  # Retain metrics for 30 days
      - '--storage.tsdb.retention.size=50GB'  # Max storage: 50GB
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle'  # Allows hot-reload of config
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  prometheus-storage:
    driver: local
```

### Step 5: Start Prometheus

```bash
cd /opt/prometheus
docker-compose up -d

# Verify it's running
docker-compose logs prometheus

# Check health (from EC2 terminal)
curl http://localhost:9090/-/healthy
```

### Step 6: Verify Metrics Are Being Scraped

1. Open Prometheus UI in browser: `http://<ec2-instance-ip>:9090`
2. Navigate to Status → Targets
3. You should see your `spring-boot-app` job with state "UP"
4. If state is "DOWN", check:
   - ALB DNS is correct
   - ALB security group allows inbound on 8080 from EC2
   - Application is running and `/actuator/prometheus` is accessible

### Step 7: Query Sample Metrics

In Prometheus UI, go to Graph tab and try these queries:

```promql
# HTTP request latency (p95)
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))

# Request throughput (requests per second)
rate(http_server_requests_seconds_count[1m])

# JVM heap memory usage (bytes)
jvm_memory_usage_bytes{area="heap"}

# GC activity count per second
rate(jvm_gc_memory_allocated_bytes_total[1m])
```

---

## Option 2: Prometheus as Docker Service on ECS (Simpler, Less Persistent)

For simpler testing without long-term metric retention, you can run Prometheus as a containerized service within your ECS cluster.

### Prerequisites
- Same ECS cluster running your Spring Boot app
- ECR repository to store Prometheus image

### Steps

1. **Build Prometheus Docker image** (or use official `prom/prometheus:latest`)

2. **Register Prometheus as ECS task definition**:
   - Memory: 512 MB
   - CPU: 256
   - Port: 9090
   - Mount prometheus.yml config file

3. **Create ECS service** with desired count = 1

4. **Access via ALB** or EC2 public IP

**Limitation**: Metrics are lost if task is restarted. Use Option 1 for persistent testing campaigns.

---

## Configuration for Different Test Scenarios

### High-Frequency Scraping (Detailed Data)
For short, intense load tests (< 30 min), use:

```yaml
global:
  scrape_interval: 5s      # More frequent collection
  evaluation_interval: 5s
```

Storage needed: ~500 MB per hour per 100 metrics

### Normal Testing (Balanced)
For typical load tests (30 min - 2 hours):

```yaml
global:
  scrape_interval: 15s     # Default - good balance
```

Storage needed: ~150 MB per hour per 100 metrics

### Long-Duration Testing (Multi-hour Campaigns)
For sustained testing (4+ hours):

```yaml
global:
  scrape_interval: 30s     # Lower frequency to reduce disk IO
```

---

## Maintenance & Troubleshooting

### Check Prometheus Health
```bash
# From EC2 instance
docker ps
docker logs prometheus

# Or via API
curl http://localhost:9090/api/v1/status/buildinfo
```

### Reload Configuration (without restart)
```bash
# Update prometheus.yml, then:
curl -X POST http://localhost:9090/-/reload
```

### Backup Metrics
```bash
# Compress and download prometheus storage
cd /opt/prometheus && tar -czf prometheus-backup-$(date +%Y%m%d).tar.gz prometheus-storage/

# Use SCP to download
scp -i your-key.pem ubuntu@<ec2-ip>:/opt/prometheus/prometheus-backup-*.tar.gz ./
```

### Common Issues

**Issue: Targets show "DOWN"**
- Check ALB DNS name is correct in prometheus.yml
- Verify security group allows EC2 → ALB on 8080
- Confirm app is running: `curl http://<alb-dns>:8080/actuator/health`

**Issue: Storage filling up**
- Reduce `scrape_interval` in prometheus.yml
- Lower `storage.tsdb.retention.time` in docker-compose.yml
- Reduce number of metrics collected (filter in scrape_configs)

**Issue: High memory usage**
- Increase t3.micro to t3.small
- Reduce retention time from 30d to 7d
- Reduce scrape interval to 30s

---

## Connecting to Grafana

Once Prometheus is running, point Grafana to:
```
http://prometheus:9090
```

(If Grafana is in same Docker network) or

```
http://<ec2-instance-ip>:9090
```

(If Grafana is external)

See `grafana-setup.md` for dashboard setup.

---

## Cost Estimation

**Option 1 (EC2-hosted Prometheus)**
- t3.micro EC2: ~$0.01/hour (~$7-9/month)
- EBS storage (20 GB): ~$1.60/month
- **Total**: ~$10/month for continuous monitoring

**Cleanup after testing**:
```bash
# Terminate EC2 instance
aws ec2 terminate-instances --instance-ids i-xxxxxxxx

# Remove EBS volume
aws ec2 delete-volume --volume-id vol-xxxxxxxx
```

---

## Next Steps

1. ✅ Deploy Prometheus (this guide)
2. Set up Grafana for visualization (`grafana-setup.md`)
3. Configure load testing with k6 (see `k6-load-tests/`)
4. Run baseline test and collect metrics
5. Compare results across Java versions
