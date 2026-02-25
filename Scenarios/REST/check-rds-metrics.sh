#!/bin/bash

# Script to check RDS metrics during load test
# Usage: ./check-rds-metrics.sh <start-time> <end-time>
# Example: ./check-rds-metrics.sh "2026-02-19 21:00" "2026-02-19 21:15"

set -e

# Check if timestamps provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 <start-time> <end-time>"
    echo "Example: $0 '2026-02-19 21:00' '2026-02-19 21:15'"
    exit 1
fi

START_TIME="$1"
END_TIME="$2"

# Convert to ISO 8601 format for CloudWatch
START_ISO=$(date -u -j -f "%Y-%m-%d %H:%M" "$START_TIME" "+%Y-%m-%dT%H:%M:%SZ")
END_ISO=$(date -u -j -f "%Y-%m-%d %H:%M" "$END_TIME" "+%Y-%m-%dT%H:%M:%SZ")

echo "=========================================="
echo "RDS Metrics Analysis"
echo "=========================================="
echo "Time Range: $START_ISO to $END_ISO"
echo ""

# Get RDS instance identifier
echo "Finding RDS instance..."
DB_IDENTIFIER=$(aws rds describe-db-instances --region us-east-1 --query 'DBInstances[0].DBInstanceIdentifier' --output text)

if [ -z "$DB_IDENTIFIER" ] || [ "$DB_IDENTIFIER" == "None" ]; then
    echo "ERROR: No RDS instance found"
    exit 1
fi

echo "RDS Instance: $DB_IDENTIFIER"
echo ""

# CPU Utilization
echo "=========================================="
echo "1. CPU Utilization"
echo "=========================================="
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=$DB_IDENTIFIER \
  --start-time "$START_ISO" \
  --end-time "$END_ISO" \
  --period 60 \
  --statistics Average Maximum \
  --region us-east-1 \
  --query 'Datapoints | sort_by(@, &Timestamp)' \
  --output table

echo ""
echo "Summary:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=$DB_IDENTIFIER \
  --start-time "$START_ISO" \
  --end-time "$END_ISO" \
  --period 900 \
  --statistics Average Maximum \
  --region us-east-1 \
  --query 'Datapoints[0].[Average, Maximum]' \
  --output text | awk '{printf "Average: %.2f%%, Peak: %.2f%%\n", $1, $2}'

echo ""

# Database Connections
echo "=========================================="
echo "2. Database Connections"
echo "=========================================="
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=$DB_IDENTIFIER \
  --start-time "$START_ISO" \
  --end-time "$END_ISO" \
  --period 60 \
  --statistics Average Maximum \
  --region us-east-1 \
  --query 'Datapoints | sort_by(@, &Timestamp)' \
  --output table

echo ""
echo "Summary:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=$DB_IDENTIFIER \
  --start-time "$START_ISO" \
  --end-time "$END_ISO" \
  --period 900 \
  --statistics Average Maximum \
  --region us-east-1 \
  --query 'Datapoints[0].[Average, Maximum]' \
  --output text | awk '{printf "Average: %.0f connections, Peak: %.0f connections\n", $1, $2}'

echo ""

# Read Latency
echo "=========================================="
echo "3. Read Latency"
echo "=========================================="
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name ReadLatency \
  --dimensions Name=DBInstanceIdentifier,Value=$DB_IDENTIFIER \
  --start-time "$START_ISO" \
  --end-time "$END_ISO" \
  --period 60 \
  --statistics Average Maximum \
  --region us-east-1 \
  --query 'Datapoints | sort_by(@, &Timestamp)' \
  --output table

echo ""
echo "Summary:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name ReadLatency \
  --dimensions Name=DBInstanceIdentifier,Value=$DB_IDENTIFIER \
  --start-time "$START_ISO" \
  --end-time "$END_ISO" \
  --period 900 \
  --statistics Average Maximum \
  --region us-east-1 \
  --query 'Datapoints[0].[Average, Maximum]' \
  --output text | awk '{printf "Average: %.4f seconds, Peak: %.4f seconds\n", $1, $2}'

echo ""

# Write Latency
echo "=========================================="
echo "4. Write Latency"
echo "=========================================="
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name WriteLatency \
  --dimensions Name=DBInstanceIdentifier,Value=$DB_IDENTIFIER \
  --start-time "$START_ISO" \
  --end-time "$END_ISO" \
  --period 60 \
  --statistics Average Maximum \
  --region us-east-1 \
  --query 'Datapoints | sort_by(@, &Timestamp)' \
  --output table

echo ""
echo "Summary:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name WriteLatency \
  --dimensions Name=DBInstanceIdentifier,Value=$DB_IDENTIFIER \
  --start-time "$START_ISO" \
  --end-time "$END_ISO" \
  --period 900 \
  --statistics Average Maximum \
  --region us-east-1 \
  --query 'Datapoints[0].[Average, Maximum]' \
  --output text | awk '{printf "Average: %.4f seconds, Peak: %.4f seconds\n", $1, $2}'

echo ""

# Read IOPS
echo "=========================================="
echo "5. Read IOPS"
echo "=========================================="
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name ReadIOPS \
  --dimensions Name=DBInstanceIdentifier,Value=$DB_IDENTIFIER \
  --start-time "$START_ISO" \
  --end-time "$END_ISO" \
  --period 900 \
  --statistics Average Maximum \
  --region us-east-1 \
  --query 'Datapoints[0].[Average, Maximum]' \
  --output text | awk '{printf "Average: %.2f IOPS, Peak: %.2f IOPS\n", $1, $2}'

echo ""

# Write IOPS
echo "=========================================="
echo "6. Write IOPS"
echo "=========================================="
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name WriteIOPS \
  --dimensions Name=DBInstanceIdentifier,Value=$DB_IDENTIFIER \
  --start-time "$START_ISO" \
  --end-time "$END_ISO" \
  --period 900 \
  --statistics Average Maximum \
  --region us-east-1 \
  --query 'Datapoints[0].[Average, Maximum]' \
  --output text | awk '{printf "Average: %.2f IOPS, Peak: %.2f IOPS\n", $1, $2}'

echo ""

echo "=========================================="
echo "Analysis Complete"
echo "=========================================="
echo ""
echo "Key things to look for:"
echo "  - CPU > 80%: Database is CPU-bound"
echo "  - Connections near max_connections: Connection pool exhaustion"
echo "  - Read/Write Latency > 0.010s (10ms): Slow queries or IOPS throttling"
echo "  - IOPS near burst limit: Storage performance bottleneck"
echo ""
