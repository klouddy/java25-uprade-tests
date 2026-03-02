# Java Performance Comparison: Scenario 1 Load Test

## Overview

This document compares the performance of different Java versions (17, 21, 25) running the same Spring Boot REST API application on AWS ECS Fargate. All tests used identical:
- **Infrastructure**: ECS Fargate (512 CPU units, 2048 MB memory)
- **Database**: RDS PostgreSQL (db.t4g.micro)
- **JVM Settings**: See Test Details (varies by run)
- **Load Test**: Scenario 1 - Read-heavy workload (~14 minutes)
- **Task Count**: 2 ECS tasks

## Performance Results

| Metric | Java 17 | Java 21 | Java 25 | Winner |
|--------|---------|---------|---------|--------|
| **Throughput** |
| Total Requests | 122,274 | 124,290 | 124,220 | ✅ Java 21 |
| Requests/Second | 145.32 | 147.63 | 147.48 | ✅ Java 21 |
| **Latency** |
| Average (ms) | 125.74 | 99.88 | 102.30 | ✅ Java 21 |
| P50 (ms) | 55.53 | 53.67 | 53.89 | ✅ Java 21 |
| P90 (ms) | 327.11 | 212.95 | 215.96 | ✅ Java 21 |
| P95 (ms) | 512.00 | 372.66 | 386.01 | ✅ Java 21 |
| P99 (ms) | 869.74 | 668.54 | 715.89 | ✅ Java 21 |
| **Error Rate** |
| Error % | 1.20% | 1.11% | 1.19% | ✅ Java 21 |
| Error Count | 1,478 | 1,387 | 1,485 | ✅ Java 21 |
| **CPU Usage (AWS Container Insights)** |
| Average CPU Units | 197.09 | 202.90 | 172.82 | ✅ Java 25 |
| Max CPU Units | 331.75 | 352.27 | 315.05 | ✅ Java 25 |
| **Memory Usage (AWS Container Insights)** |
| Average (MB) | 381.21 | 409.14 | 378.39 | ✅ Java 25 |
| Max (MB) | 447.50 | 481.00 | 475.50 | ✅ Java 17 |
| **Garbage Collection (Prometheus)** |
| GC Pause Rate (/s) | 0.00192 | 0.00109 | 0.00164 | ✅ Java 21 |
| GC Count Rate (/s) | 0.255 | 0.138 | 0.197 | ✅ Java 21 |
| Max GC Pause (ms) | 67.47 | 42.36 | 66.67 | ✅ Java 21 |
| **Heap Memory (Prometheus)** |
| Avg Heap Used (MB) | 28.79 | 29.48 | 27.59 | ✅ Java 25 |
| Avg Heap Committed (MB) | 49.87 | 54.42 | 48.14 | ✅ Java 25 |
| **Process CPU (Prometheus)** |
| Avg Process CPU % | 9.59% | 9.09% | 8.32% | ✅ Java 25 |

## Key Findings: Java 25 vs Java 17

### Performance Improvements
- **Throughput**: Java 25 delivered **1.5% more requests** (147.48 RPS vs 145.32 RPS)
- **Average Latency**: Java 25 was **18.6% faster** (102.3ms vs 125.74ms)
- **P90 Latency**: Java 25 was **34% faster** (215.96ms vs 327.11ms)
- **P95 Latency**: Java 25 was **24.6% faster** (386ms vs 512ms)
- **P99 Latency**: Java 25 was **17.7% faster** (716ms vs 870ms)

### Resource Efficiency
- **CPU Usage**: Java 25 used **12.3% less CPU** on average (172.82 vs 197.09 CPU units)
- **Memory Usage**: Essentially equivalent (378.39 MB vs 381.21 MB)
- **GC Efficiency**: 
  - **14.3% fewer GC pauses** (0.00164/s vs 0.00192/s)
  - **22.7% fewer GC cycles** (0.197/s vs 0.255/s)
  - Similar max pause times (~67ms)

### Why Java 25 Performed Better

1. **Modern JVM Optimizations**: 8 years of JVM improvements between Java 17 and 25
   - Enhanced JIT compiler optimizations
   - Better memory management algorithms
   - Improved thread scheduling

2. **Garbage Collection Efficiency**: Fewer GC cycles and pauses translate to:
   - Less CPU overhead from GC operations
   - Fewer application pause times
   - More consistent response latency

3. **Lower CPU Consumption**: 12% reduction in CPU usage demonstrates:
   - More efficient bytecode execution
   - Better utilization of modern CPU features
   - Reduced per-request processing cost

4. **Latency Consistency**: Improvements across all percentiles (P90/P95/P99) indicate:
   - More predictable performance under load
   - Better handling of tail latency scenarios
   - Improved behavior during garbage collection

## Key Findings: Java 21 vs Java 17

### Performance Improvements
- **Throughput**: Java 21 delivered **1.6% more requests** (147.63 RPS vs 145.32 RPS)
- **Average Latency**: Java 21 was **20.6% faster** (99.88ms vs 125.74ms)
- **P90 Latency**: Java 21 was **34.9% faster** (212.95ms vs 327.11ms)
- **P95 Latency**: Java 21 was **27.2% faster** (372.66ms vs 512ms)
- **P99 Latency**: Java 21 was **23.1% faster** (668.54ms vs 869.74ms)

### Resource Efficiency
- **CPU Usage**: Java 21 used **3.0% more CPU** on average (202.90 vs 197.09 CPU units)
- **Memory Usage**: Java 21 used **7.3% more memory** on average (409.14 MB vs 381.21 MB)
- **GC Efficiency**:
   - **43.2% fewer GC pauses** (0.00109/s vs 0.00192/s)
   - **45.9% fewer GC cycles** (0.138/s vs 0.255/s)
   - Lower max pause times (42.36ms vs 67.47ms)

## Key Findings: Java 21 vs Java 25

### Performance Improvements
- **Throughput**: Java 21 delivered **0.1% more requests** (147.63 RPS vs 147.48 RPS)
- **Average Latency**: Java 21 was **2.4% faster** (99.88ms vs 102.30ms)
- **P99 Latency**: Java 21 was **6.6% faster** (668.54ms vs 715.89ms)

### Resource Efficiency
- **CPU Usage**: Java 21 used **17.4% more CPU** on average (202.90 vs 172.82 CPU units)
- **Memory Usage**: Java 21 used **8.2% more memory** on average (409.14 MB vs 378.39 MB)
- **GC Efficiency**: Java 21 had fewer GC pauses and cycles, but Java 25 used less CPU overall

## Experiment Matrix (Scenario 1)

These experiments are intended to isolate JVM and runtime changes that could improve latency, throughput, or resource efficiency. Results columns are placeholders so you can record outcomes for both Java 21 and Java 25.

| Experiment | JVM/Runtime Changes | Why It Matters | Java 21 Result | Java 25 Result |
|-----------|----------------------|----------------|---------------|---------------|
| Baseline | G1, `-Xmx1024m` | Control run for comparison against all other changes | TBD | TBD |
| Heap Size Sensitivity | G1, `-Xmx512m` | Shows whether a smaller heap improves tail latency or increases GC churn | TBD | TBD |
| G1 Pause Target | G1, `-Xmx1024m`, `-XX:MaxGCPauseMillis=100` | Tests whether tighter pause goals improve P95/P99 latency | TBD | TBD |
| ZGC | ZGC, `-Xmx1024m` | Low-pause collector; often improves tail latency at higher CPU cost | TBD | TBD |
| Virtual Threads | G1, `-Xmx1024m`, app uses virtual threads | May increase throughput for IO-bound workloads with less thread tuning | TBD | TBD |

## Java 21 Experiment Results (Scenario 1)

| Metric | Baseline | Heap Size | G1 Pause Target | ZGC | Virtual Threads |
|--------|----------|----------|-----------------|-----|-----------------|
| **Throughput** |
| Total Requests | TBD | TBD | TBD | TBD | TBD |
| Requests/Second | TBD | TBD | TBD | TBD | TBD |
| **Latency** |
| Average (ms) | TBD | TBD | TBD | TBD | TBD |
| P50 (ms) | TBD | TBD | TBD | TBD | TBD |
| P90 (ms) | TBD | TBD | TBD | TBD | TBD |
| P95 (ms) | TBD | TBD | TBD | TBD | TBD |
| P99 (ms) | TBD | TBD | TBD | TBD | TBD |
| **Error Rate** |
| Error % | TBD | TBD | TBD | TBD | TBD |
| Error Count | TBD | TBD | TBD | TBD | TBD |
| **CPU Usage (AWS Container Insights)** |
| Average CPU Units | TBD | TBD | TBD | TBD | TBD |
| Max CPU Units | TBD | TBD | TBD | TBD | TBD |
| **Memory Usage (AWS Container Insights)** |
| Average (MB) | TBD | TBD | TBD | TBD | TBD |
| Max (MB) | TBD | TBD | TBD | TBD | TBD |
| **Garbage Collection (Prometheus)** |
| GC Pause Rate (/s) | TBD | TBD | TBD | TBD | TBD |
| GC Count Rate (/s) | TBD | TBD | TBD | TBD | TBD |
| Max GC Pause (ms) | TBD | TBD | TBD | TBD | TBD |
| **Heap Memory (Prometheus)** |
| Avg Heap Used (MB) | TBD | TBD | TBD | TBD | TBD |
| Avg Heap Committed (MB) | TBD | TBD | TBD | TBD | TBD |
| **Process CPU (Prometheus)** |
| Avg Process CPU % | TBD | TBD | TBD | TBD | TBD |

## Java 25 Experiment Results (Scenario 1)

| Metric | Baseline | Heap Size | G1 Pause Target | ZGC | Virtual Threads |
|--------|----------|----------|-----------------|-----|-----------------|
| **Throughput** |
| Total Requests | TBD | TBD | TBD | TBD | TBD |
| Requests/Second | TBD | TBD | TBD | TBD | TBD |
| **Latency** |
| Average (ms) | TBD | TBD | TBD | TBD | TBD |
| P50 (ms) | TBD | TBD | TBD | TBD | TBD |
| P90 (ms) | TBD | TBD | TBD | TBD | TBD |
| P95 (ms) | TBD | TBD | TBD | TBD | TBD |
| P99 (ms) | TBD | TBD | TBD | TBD | TBD |
| **Error Rate** |
| Error % | TBD | TBD | TBD | TBD | TBD |
| Error Count | TBD | TBD | TBD | TBD | TBD |
| **CPU Usage (AWS Container Insights)** |
| Average CPU Units | TBD | TBD | TBD | TBD | TBD |
| Max CPU Units | TBD | TBD | TBD | TBD | TBD |
| **Memory Usage (AWS Container Insights)** |
| Average (MB) | TBD | TBD | TBD | TBD | TBD |
| Max (MB) | TBD | TBD | TBD | TBD | TBD |
| **Garbage Collection (Prometheus)** |
| GC Pause Rate (/s) | TBD | TBD | TBD | TBD | TBD |
| GC Count Rate (/s) | TBD | TBD | TBD | TBD | TBD |
| Max GC Pause (ms) | TBD | TBD | TBD | TBD | TBD |
| **Heap Memory (Prometheus)** |
| Avg Heap Used (MB) | TBD | TBD | TBD | TBD | TBD |
| Avg Heap Committed (MB) | TBD | TBD | TBD | TBD | TBD |
| **Process CPU (Prometheus)** |
| Avg Process CPU % | TBD | TBD | TBD | TBD | TBD |

## Summary

**Java 21 delivers the best latency and throughput**, while **Java 25 is more resource-efficient** (lower CPU, memory, heap, and process CPU usage). If you are optimizing for raw response times, Java 21 is the strongest option. If cost efficiency or tighter resource limits matter most, Java 25 provides better performance per CPU.

---

## Test Details

### Java 17
- **Version**: 17.0.18
- **Test Date**: 2026-02-25
- **Test Duration**: 841.34 seconds
- **Image**: `benchmark-app:java17-rest-20260225-01`

### Java 21
- **Version**: 21.0.10
- **Test Date**: 2026-02-25
- **Test Duration**: 841.79 seconds
- **Image**: `benchmark-app:java21-rest-20260225-01`

### Java 25
- **Version**: 25.0.2
- **Test Date**: 2026-02-24
- **Test Duration**: 842.20 seconds
- **Image**: `benchmark-app:java25-rest-20260224-04`

## Data Sources

Results are aggregated from:
- **k6 Load Test**: HTTP request metrics (throughput, latency, errors)
- **AWS Container Insights**: Container-level CPU and memory metrics
- **Prometheus**: JVM-specific metrics (GC, heap, threads)
- **ECS Task Definition**: Container configuration and resource limits

Raw data available in:
- Java 17: `k6-load-tests/results/java17/scenario1/`
- Java 21: `k6-load-tests/results/java21/scenario1/`
- Java 25: `k6-load-tests/results/java25/scenario1/`
