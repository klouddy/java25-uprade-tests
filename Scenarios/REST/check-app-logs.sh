#!/bin/bash

# Script to analyze application logs for errors and issues
# Usage: ./check-app-logs.sh <start-time> <end-time>
# Example: ./check-app-logs.sh "2026-02-19 21:00" "2026-02-19 21:15"

set -e

# Check if timestamps provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 <start-time> <end-time>"
    echo "Example: $0 '2026-02-19 21:00' '2026-02-19 21:15'"
    exit 1
fi

START_TIME="$1"
END_TIME="$2"

# Convert to epoch milliseconds for CloudWatch Logs
START_EPOCH=$(date -u -j -f "%Y-%m-%d %H:%M" "$START_TIME" +%s)000
END_EPOCH=$(date -u -j -f "%Y-%m-%d %H:%M" "$END_TIME" +%s)000

LOG_GROUP="/ecs/java-bench-app"
OUTPUT_FILE="app-logs-$(date +%Y%m%d-%H%M%S).txt"

echo "=========================================="
echo "Application Log Analysis"
echo "=========================================="
echo "Time Range: $START_TIME to $END_TIME"
echo "Log Group: $LOG_GROUP"
echo "Output File: $OUTPUT_FILE"
echo ""

# Download logs
echo "Downloading logs..."
aws logs filter-log-events \
  --log-group-name "$LOG_GROUP" \
  --start-time "$START_EPOCH" \
  --end-time "$END_EPOCH" \
  --region us-east-1 \
  --query 'events[*].message' \
  --output text > "$OUTPUT_FILE"

TOTAL_LINES=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')
echo "Downloaded $TOTAL_LINES log lines"
echo ""

# 1. Error and Exception Summary
echo "=========================================="
echo "1. ERROR SUMMARY"
echo "=========================================="

ERROR_COUNT=$(grep -ci "error" "$OUTPUT_FILE" 2>/dev/null || echo "0")
EXCEPTION_COUNT=$(grep -ci "exception" "$OUTPUT_FILE" 2>/dev/null || echo "0")
WARN_COUNT=$(grep -ci "warn" "$OUTPUT_FILE" 2>/dev/null || echo "0")

echo "Total ERROR mentions: $ERROR_COUNT"
echo "Total EXCEPTION mentions: $EXCEPTION_COUNT"
echo "Total WARN mentions: $WARN_COUNT"
echo ""

if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "Sample ERROR lines (first 10):"
    grep -i "error" "$OUTPUT_FILE" | head -10
    echo ""
fi

if [ "$EXCEPTION_COUNT" -gt 0 ]; then
    echo "Sample EXCEPTION lines (first 10):"
    grep -i "exception" "$OUTPUT_FILE" | head -10
    echo ""
fi

# 2. Database Connection Issues
echo "=========================================="
echo "2. DATABASE CONNECTION ANALYSIS"
echo "=========================================="

CONNECTION_ERRORS=$(grep -ic "connection\|hikari\|pool" "$OUTPUT_FILE" 2>/dev/null || echo "0")
TIMEOUT_ERRORS=$(grep -ic "timeout\|timed out" "$OUTPUT_FILE" 2>/dev/null || echo "0")
SQL_ERRORS=$(grep -ic "sql\|database\|jdbc" "$OUTPUT_FILE" 2>/dev/null || echo "0")

echo "Connection/Pool mentions: $CONNECTION_ERRORS"
echo "Timeout mentions: $TIMEOUT_ERRORS"
echo "SQL/Database mentions: $SQL_ERRORS"
echo ""

if [ "$CONNECTION_ERRORS" -gt 0 ]; then
    echo "Connection-related log entries:"
    grep -i "connection\|hikari\|pool" "$OUTPUT_FILE" | head -10
    echo ""
fi

if [ "$TIMEOUT_ERRORS" -gt 0 ]; then
    echo "Timeout-related log entries:"
    grep -i "timeout\|timed out" "$OUTPUT_FILE" | head -10
    echo ""
fi

# 3. HTTP Status Code Analysis
echo "=========================================="
echo "3. HTTP STATUS CODE ANALYSIS"
echo "=========================================="

HTTP_404=$(grep -c "404\|\"status\":404\|status=404" "$OUTPUT_FILE" 2>/dev/null || echo "0")
HTTP_500=$(grep -c "500\|\"status\":500\|status=500" "$OUTPUT_FILE" 2>/dev/null || echo "0")
HTTP_503=$(grep -c "503\|\"status\":503\|status=503" "$OUTPUT_FILE" 2>/dev/null || echo "0")

echo "HTTP 404 responses: $HTTP_404"
echo "HTTP 500 responses: $HTTP_500"
echo "HTTP 503 responses: $HTTP_503"
echo ""

# 4. Performance-related Warnings
echo "=========================================="
echo "4. PERFORMANCE WARNINGS"
echo "=========================================="

SLOW_QUERY=$(grep -ic "slow query\|took.*ms\|duration.*ms" "$OUTPUT_FILE" 2>/dev/null || echo "0")
OOM=$(grep -ic "out of memory\|outofmemory\|heap space" "$OUTPUT_FILE" 2>/dev/null || echo "0")
GC_OVERHEAD=$(grep -ic "gc overhead\|allocation failure" "$OUTPUT_FILE" 2>/dev/null || echo "0")

echo "Slow query mentions: $SLOW_QUERY"
echo "Out of Memory mentions: $OOM"
echo "GC overhead mentions: $GC_OVERHEAD"
echo ""

if [ "$SLOW_QUERY" -gt 0 ]; then
    echo "Sample slow query entries:"
    grep -i "slow query\|took.*ms\|duration.*ms" "$OUTPUT_FILE" | head -5
    echo ""
fi

# 5. Thread Pool Analysis
echo "=========================================="
echo "5. THREAD POOL ANALYSIS"
echo "=========================================="

THREAD_ISSUES=$(grep -ic "thread\|pool.*full\|rejected" "$OUTPUT_FILE" 2>/dev/null || echo "0")
DEADLOCK=$(grep -ic "deadlock\|blocked thread" "$OUTPUT_FILE" 2>/dev/null || echo "0")

echo "Thread pool mentions: $THREAD_ISSUES"
echo "Deadlock mentions: $DEADLOCK"
echo ""

if [ "$THREAD_ISSUES" -gt 0 ]; then
    echo "Sample thread-related entries:"
    grep -i "thread\|pool.*full\|rejected" "$OUTPUT_FILE" | head -5
    echo ""
fi

# 6. Specific Exception Types
echo "=========================================="
echo "6. EXCEPTION TYPE BREAKDOWN"
echo "=========================================="

NPE=$(grep -c "NullPointerException" "$OUTPUT_FILE" 2>/dev/null || echo "0")
ILLEGAL_STATE=$(grep -c "IllegalStateException" "$OUTPUT_FILE" 2>/dev/null || echo "0")
SQL_EXCEPTION=$(grep -c "SQLException" "$OUTPUT_FILE" 2>/dev/null || echo "0")
IO_EXCEPTION=$(grep -c "IOException" "$OUTPUT_FILE" 2>/dev/null || echo "0")
DATASOURCE_EXCEPTION=$(grep -c "DataSourceException\|CannotGetJdbcConnectionException" "$OUTPUT_FILE" 2>/dev/null || echo "0")

echo "NullPointerException: $NPE"
echo "IllegalStateException: $ILLEGAL_STATE"
echo "SQLException: $SQL_EXCEPTION"
echo "IOException: $IO_EXCEPTION"
echo "DataSource/Connection Exception: $DATASOURCE_EXCEPTION"
echo ""

# 7. Startup/Shutdown Events
echo "=========================================="
echo "7. APPLICATION LIFECYCLE EVENTS"
echo "=========================================="

STARTED=$(grep -c "Started.*Application\|Application started\|Started BenchmarkApplication" "$OUTPUT_FILE" 2>/dev/null || echo "0")
STOPPED=$(grep -c "Stopped\|Shutting down\|Application shutdown" "$OUTPUT_FILE" 2>/dev/null || echo "0")

echo "Application started events: $STARTED"
echo "Application stopped events: $STOPPED"
echo ""

if [ "$STARTED" -gt 0 ]; then
    echo "Startup entries:"
    grep -i "Started.*Application\|Application started\|Started BenchmarkApplication" "$OUTPUT_FILE"
    echo ""
fi

# 8. HikariCP Specific Details
echo "=========================================="
echo "8. HIKARICP CONNECTION POOL DETAILS"
echo "=========================================="

HIKARI_STATS=$(grep -i "HikariPool" "$OUTPUT_FILE" 2>/dev/null | head -10)
if [ -n "$HIKARI_STATS" ]; then
    echo "$HIKARI_STATS"
else
    echo "No HikariCP pool statistics found in logs"
fi
echo ""

# 9. Top Error Messages
echo "=========================================="
echo "9. TOP ERROR MESSAGES (Unique)"
echo "=========================================="

if [ "$ERROR_COUNT" -gt 0 ] || [ "$EXCEPTION_COUNT" -gt 0 ]; then
    grep -i "error\|exception" "$OUTPUT_FILE" 2>/dev/null | \
        sed 's/.*ERROR/ERROR/' | \
        sed 's/.*Exception/Exception/' | \
        sort | uniq -c | sort -rn | head -10
else
    echo "No errors or exceptions found"
fi
echo ""

# Summary
echo "=========================================="
echo "ANALYSIS SUMMARY"
echo "=========================================="
echo "Total log lines: $TOTAL_LINES"
echo "Errors: $ERROR_COUNT"
echo "Exceptions: $EXCEPTION_COUNT"
echo "Warnings: $WARN_COUNT"
echo "Connection issues: $CONNECTION_ERRORS"
echo "Timeouts: $TIMEOUT_ERRORS"
echo "HTTP 404s: $HTTP_404"
echo "HTTP 500s: $HTTP_500"
echo ""
echo "Full logs saved to: $OUTPUT_FILE"
echo ""

# Recommendations
echo "=========================================="
echo "RECOMMENDATIONS"
echo "=========================================="

if [ "$ERROR_COUNT" -gt 100 ]; then
    echo "⚠️  HIGH: Many errors detected ($ERROR_COUNT). Review error patterns above."
fi

if [ "$TIMEOUT_ERRORS" -gt 10 ]; then
    echo "⚠️  HIGH: Timeouts detected ($TIMEOUT_ERRORS). Check connection pool or query performance."
fi

if [ "$CONNECTION_ERRORS" -gt 50 ]; then
    echo "⚠️  MEDIUM: Connection pool activity detected. May indicate pool exhaustion."
fi

if [ "$OOM" -gt 0 ]; then
    echo "🔴 CRITICAL: Out of Memory errors detected. Increase heap size or fix memory leak."
fi

if [ "$DEADLOCK" -gt 0 ]; then
    echo "🔴 CRITICAL: Deadlock detected. Review application thread synchronization."
fi

if [ "$SQL_EXCEPTION" -gt 10 ]; then
    echo "⚠️  MEDIUM: SQL exceptions detected ($SQL_EXCEPTION). Review database interactions."
fi

if [ "$ERROR_COUNT" -eq 0 ] && [ "$EXCEPTION_COUNT" -eq 0 ]; then
    echo "✅ GOOD: No errors or exceptions found in application logs."
fi

echo ""
echo "To view full logs: cat $OUTPUT_FILE"
echo "To search for specific pattern: grep -i 'pattern' $OUTPUT_FILE"
echo ""
