#!/bin/bash
set -euo pipefail

# Fetch JVM metrics from Prometheus over a time range.

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <start-time> <end-time> [step]"
  echo "Example: $0 2026-02-24T21:58:13.104Z 2026-02-24T22:12:15.304Z 60s"
  exit 1
fi

if [[ -z "${PROM_URL:-}" ]]; then
  echo "Error: PROM_URL is not set."
  echo "Example: export PROM_URL=http://java-bench-alb-1220469541.us-east-1.elb.amazonaws.com/prometheus"
  exit 1
fi

START_TIME="$1"
END_TIME="$2"
STEP="${3:-60s}"

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required to format JSON output. Install jq and retry."
  exit 1
fi

query_range() {
  local query="$1"

  curl -sG "$PROM_URL/api/v1/query_range" \
    --data-urlencode "query=$query" \
    --data-urlencode "start=$START_TIME" \
    --data-urlencode "end=$END_TIME" \
    --data-urlencode "step=$STEP" \
    | jq -c '.data.result'
}

heap_used=$(query_range 'jvm_memory_used_bytes{area="heap"}')
nonheap_used=$(query_range 'jvm_memory_used_bytes{area="nonheap"}')
gc_pause_rate=$(query_range 'rate(jvm_gc_pause_seconds_sum[5m])')
gc_pause_max=$(query_range 'jvm_gc_pause_seconds_max')
live_threads=$(query_range 'jvm_threads_live')
process_cpu=$(query_range 'process_cpu_usage')
system_cpu=$(query_range 'system_cpu_usage')
heap_committed=$(query_range 'jvm_memory_committed_bytes{area="heap"}')
classes_loaded=$(query_range 'jvm_classes_loaded')
gc_count_rate=$(query_range 'rate(jvm_gc_pause_seconds_count[5m])')

jq -n \
  --arg prom_url "$PROM_URL" \
  --arg start_time "$START_TIME" \
  --arg end_time "$END_TIME" \
  --arg step "$STEP" \
  --arg generated_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --argjson heap_used_bytes "$heap_used" \
  --argjson non_heap_used_bytes "$nonheap_used" \
  --argjson gc_pause_rate_5m "$gc_pause_rate" \
  --argjson gc_pause_max "$gc_pause_max" \
  --argjson live_threads "$live_threads" \
  --argjson process_cpu_usage "$process_cpu" \
  --argjson system_cpu_usage "$system_cpu" \
  --argjson heap_committed_bytes "$heap_committed" \
  --argjson classes_loaded "$classes_loaded" \
  --argjson gc_count_rate_5m "$gc_count_rate" \
  '{
    metadata: {
      prom_url: $prom_url,
      start_time: $start_time,
      end_time: $end_time,
      step: $step,
      generated_at: $generated_at
    },
    metrics: {
      "heap-used-bytes": $heap_used_bytes,
      "non-heap-used-bytes": $non_heap_used_bytes,
      "gc-pause-rate-5m": $gc_pause_rate_5m,
      "gc-pause-max": $gc_pause_max,
      "live-threads": $live_threads,
      "process-cpu-usage": $process_cpu_usage,
      "system-cpu-usage": $system_cpu_usage,
      "heap-committed-bytes": $heap_committed_bytes,
      "classes-loaded": $classes_loaded,
      "gc-count-rate-5m": $gc_count_rate_5m
    }
  }'
