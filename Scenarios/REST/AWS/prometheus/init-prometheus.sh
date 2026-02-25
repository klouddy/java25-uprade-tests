#!/bin/sh
# Initialize Prometheus config with ALB DNS target

set -e

ALB_DNS="${ALB_DNS:-localhost:8080}"
CONFIG_FILE="/etc/prometheus/prometheus.yml"

mkdir -p /etc/prometheus

cat > "$CONFIG_FILE" <<EOF
global:
  scrape_interval: 15s
  scrape_timeout: 10s
  evaluation_interval: 15s

scrape_configs:
  - job_name: java-bench-service
    metrics_path: /actuator/prometheus
    scheme: http
    static_configs:
      - targets: ["$ALB_DNS"]
EOF

echo "Prometheus config initialized at $CONFIG_FILE"
echo "Scraping: $ALB_DNS/actuator/prometheus"

exec prometheus --config.file=$CONFIG_FILE "$@"
