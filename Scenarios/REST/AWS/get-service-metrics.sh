#!/bin/bash
set -euo pipefail

# Fetch ECS Container Insights metrics for a service within a time window.

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <start-time> <end-time> [region]"
  echo "Example: $0 2026-02-24T19:45:19Z 2026-02-24T19:59:20Z us-east-1"
  exit 1
fi

START_TIME="$1"
END_TIME="$2"
REGION="${3:-us-east-1}"

CLUSTER_NAME=${CLUSTER_NAME:-java-bench-cluster}
SERVICE_NAME=${SERVICE_NAME:-java-bench-service}
PERIOD=${PERIOD:-60}

run_metric() {
  local metric_name="$1"
  local stat="$2"

  aws cloudwatch get-metric-statistics \
    --namespace ECS/ContainerInsights \
    --metric-name "$metric_name" \
    --dimensions Name=ClusterName,Value="$CLUSTER_NAME" Name=ServiceName,Value="$SERVICE_NAME" \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period "$PERIOD" \
    --statistics "$stat" \
    --region "$REGION" \
    --output table
}

echo "Cluster: $CLUSTER_NAME"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "Start:  $START_TIME"
echo "End:    $END_TIME"
echo "Period: ${PERIOD}s"
echo ""

echo "== CpuUtilized (Average, Maximum) =="
run_metric "CpuUtilized" "Average" 
run_metric "CpuUtilized" "Maximum"

echo "== MemoryUtilized (Average, Maximum) =="
run_metric "MemoryUtilized" "Average"
run_metric "MemoryUtilized" "Maximum"

echo "== NetworkRxBytes (Sum) =="
run_metric "NetworkRxBytes" "Sum"

echo "== NetworkTxBytes (Sum) =="
run_metric "NetworkTxBytes" "Sum"
