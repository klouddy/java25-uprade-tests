#!/bin/bash
set -euo pipefail

# Fetch JVM metrics from Spring Boot Actuator /actuator/prometheus.

if [[ -z "${BASE_URL:-}" ]]; then
	echo "Error: BASE_URL is not set."
	echo "Example: export BASE_URL=http://java-bench-alb-295090913.us-east-1.elb.amazonaws.com"
	exit 1
fi

echo "# BASE_URL: $BASE_URL"

ACTUATOR_URL="$BASE_URL/actuator/prometheus"

timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "# JVM metrics snapshot"
echo "# Timestamp: $timestamp"
echo "# Source: $ACTUATOR_URL"
curl -s "$ACTUATOR_URL" | grep '^jvm_'