# REST + RDS Performance Test Scenarios  

*Java 17 vs Java 21 vs Java 25 Benchmark Suite*

This document defines all test scenarios used to evaluate performance, scalability, GC efficiency, and operational behavior of a Spring Boot REST API running on AWS ECS Fargate with Amazon RDS.  All scenarios are executed with the same application code and AWS infrastructure, varying only the Java runtime version.

---

# 📘 Table of Contents

- [1. Overview](#1-overview)
- [2. Performance / Throughput Scenarios](#2-performance--throughput-scenarios)
  - [Scenario 1: Read-Heavy](#scenario-1-read-heavy)
  - [Scenario 2: Balanced](#scenario-2-balanced)
  - [Scenario 3: Write-Heavy](#scenario-3-write-heavy)
- [3. Scalability / Stress Scenarios](#3-scalability--stress-scenarios)
  - [Scenario 4: Ramp-Up Scalability](#scenario-4-ramp-up-scalability)
  - [Scenario 5: Burst / Spike Test](#scenario-5-burst--spike-test)
- [4. Operational Scenarios](#4-operational-scenarios)
  - [Scenario 6: Cold Start](#scenario-6-cold-start)
  - [Scenario 7: Warm Start / Rolling Deployment](#scenario-7-warm-start--rolling-deployment)
- [5. Standard Endpoint Mix](#5-standard-endpoint-mix)

---


# 1. Overview

This benchmark suite covers three categories of scenarios:

| Scenario Group | Goal |
|----------------|------|
| **Performance** | Compare sustained throughput, latency, CPU, GC, and heap usage |
| **Scalability** | Identify saturation points and resilience under sudden load |
| **Operational** | Measure startup time and behavior during deployments |

All scenarios are executed for **Java 17**, **Java 21**, and **Java 25**.

---

 2. Performance / Throughput Scenarios

## Scenario 1: Read-Heavy  
Simulates typical production REST workloads where reads dominate writes.

### Traffic Mix
- 60% `GET /customers/{id}`
- 20% `GET /customers?search=...`
- 20% `POST /customers`

### Load Levels
- **Low:** 50 VUs (~100 rps)  
- **Medium:** 200 VUs (~400–700 rps)  
- **High:** 500 VUs (~1200–2000 rps)

### Goals
- Compare latency (p50/p95/p99)  
- Evaluate GC behavior under light allocation pressure  
- Measure JVM efficiency and heap usage  
- Compare CPU utilization across Java versions  

### Memory Requirements / Metrics
- **Expected Peak Heap**: 480–520MB (Java 17), 410–450MB (Java 21/25)
- **Container Sizes**: ECS task allocated 1024MB (safe margin)
- **How to Collect**:
  - CloudWatch Container Insights: ECS task memory % over time
  - Prometheus (if deployed): `jvm_memory_usage_bytes` metric
  - GC Logs: Heap usage in MaxHeapSize and UsedHeapSize fields
- **What to Watch**: Peak memory typically occurs at sustained 500 VU load; minor improvements (5–15%) vs Java 17

---

## Scenario 2: Balanced  
Models CRUD-style applications with an even mix of reads and writes.

### Traffic Mix
- 40% `GET /customers/{id}`
- 20% `GET /customers?search=...`
- 40% `POST /customers`

### Goals
- Show GC impact during mixed read/write patterns  
- Identify thread pool vs virtual thread behavior  
- Compare throughput and latency consistency  
- Observe CPU intensity during moderate write load  

### Memory Requirements / Metrics
- **Expected Peak Heap**: 500–560MB (Java 17), 420–480MB (Java 21/25)
- **Container Sizes**: ECS task allocated 1024MB (adequate)
- **How to Collect**:
  - CloudWatch Container Insights: Monitor memory ramp during write phase
  - Prometheus: Track `jvm_memory_committed_bytes` and `jvm_memory_used_bytes`
  - GC Logs: Analyze heap free vs allocated after each collection cycle
- **What to Watch**: Memory stabilizes during load ramp; look for memory leak patterns (continuously rising curve)

---

## Scenario 3: Write-Heavy  
Stresses the system with insert-heavy workloads typical for ingestion or order systems.

### Traffic Mix
- 10% Reads  
- 10% Searches  
- 80% Writes  

### Goals
- Reveal GC pressure from JSON deserialization + ORM allocations  
- Identify DB write bottlenecks  
- Show Java 25 heap efficiency improvements  
- Evaluate connection pool saturation behavior  

This scenario often highlights **the most dramatic improvements** in newer Java versions.

### Memory Requirements / Metrics
- **Expected Peak Heap**: 620–680MB (Java 17), 500–560MB (Java 21/25) = **18–20% reduction**
- **Container Sizes**: Monitor peak memory; may need 1536MB+ if Java 17 shows 680MB+
- **How to Collect**:
  - CloudWatch Container Insights: Peak memory % during sustained 200 VU write load
  - Prometheus: `jvm_memory_usage_bytes{area="heap"}` during spike phase
  - GC Logs: Count young gen collections (most allocations are short-lived)
- **What to Watch**: This scenario shows **biggest heap differences**; Java 25 typically uses 15–20% less peak heap

---

# 3. Scalability / Stress Scenarios

## Scenario 4: Ramp-Up Scalability  
Tests the system as traffic gradually increases to find maximum safe capacity.

### Profile
1. Start at 0 rps  
2. Ramp evenly to peak over 10 minutes  
3. Hold for 2 minutes  
4. Drop to baseline  

### Goals
- Identify saturation points  
- Compare max throughput across Java versions  
- Observe GC pause spikes as load increases  
- Measure CPU and heap exhaustion thresholds  

### Memory Requirements / Metrics
- **Expected Peak Heap**: 700MB+ (Java 17 at saturation), 550–600MB (Java 21/25)
- **Container Sizes**: Critical test for determining minimum container size under peak load
- **How to Collect**:
  - CloudWatch Container Insights: Memory % during ramp phase; watch for cliff or plateau
  - Prometheus: Sample `jvm_memory_used_bytes` every 10 seconds during 10-min ramp
  - GC Logs: Record when heap reaches 90%+ utilization
- **What to Watch**: Memory curve should be smooth ramp-up; sharp spikes indicate GC storms or memory leak

---

## Scenario 5: Burst / Spike Test  
Simulates real-world traffic spikes such as promotions, campaign launches, or cron jobs.

### Profile
- Idle or baseline load at ~50 rps  
- Instant spike to 500–1000 rps  
- Hold for 2–3 minutes  
- Return to baseline  

### Goals
- Assess stability under sudden load  
- Compare thread pool vs virtual thread responsiveness  
- Measure recovery time after overload  
- Identify GC storms or latency cliffs  

### Memory Requirements / Metrics
- **Expected Peak Heap**: Spike to 650–700MB (Java 17), 500–550MB (Java 21/25)
- **Container Sizes**: Spike phase typically allocates 100–150MB more than steady state
- **How to Collect**:
  - CloudWatch Container Insights: Record max memory % during 3-min spike phase
  - Prometheus: `jvm_memory_used_bytes` delta between baseline and spike
  - GC Logs: Count full GC events (should be rare; 0–1 during spike)
- **What to Watch**: Memory should drop back to baseline within 1–2 min after spike ends; lingering high memory suggests memory leak

---

# 4. Operational Scenarios

## Scenario 6: Cold Start  
Measures startup time for new ECS tasks.

### Metrics
- JVM initialization time  
- Spring Boot startup time  
- Time to `/actuator/health` returning `UP`  

### Goals
- Evaluate Java 25 startup improvements  
- Measure CDS (Class Data Sharing) impact  
- Predict scaling responsiveness during peak periods  

### Memory Requirements / Metrics
- **Expected Peak Heap During Startup**: 350–420MB (Java 17), 300–360MB (Java 21/25)
- **Container Sizes**: Startup is not memory-constrained; startup speed is primary metric
- **How to Collect**:
  - CloudWatch Container Insights: Memory usage from task launch to health check passing
  - Prometheus (if available): Memory growth curve during JVM initialization
  - Task Logs: Grep for "Started" in Spring Boot logs to correlate memory state
- **What to Watch**: Memory grows during startup then plateaus; final steady-state is ~50MB lower than runtime peak

---

## Scenario 7: Warm Start / Rolling Deployment  
Measures behavior when replacing a container during a rolling deployment.

### Metrics
- Time from `RUNNING` → healthy  
- Latency impact during deploy  
- Request failures or timeouts  
- JIT warm-up behavior  

### Goals
- Compare predictable rollout behavior across Java versions  
- Evaluate warm heap reuse  
- Analyze deployment smoothness on Fargate  

### Memory Requirements / Metrics
- **Expected Peak Heap During Restart**: 450–500MB (Java 17), 380–430MB (Java 21/25)
- **Container Sizes**: Old task releases memory before new task starts; no doubling needed
- **How to Collect**:
  - CloudWatch Container Insights: Memory graph during rolling deployment (watch two tasks overlap temporarily)
  - Prometheus: Monitor `jvm_memory_used_bytes` on old vs new task during transition
  - Task Logs: Compare memory growth rate between cold start (Scenario 6) and warm restart
- **What to Watch**: New task should reach steady-state heap within 2–3 min; spikes indicate slow JIT warm-up or garbage collection storms

---


# 5. Standard Endpoint Mix

These endpoints are used consistently across all scenarios:

| Endpoint | Method | Type | Description |
|----------|--------|------|-------------|
| `/customers/{id}` | GET | Read | Primary key lookup |
| `/customers?search=query` | GET | Read | Indexed search |
| `/customers` | POST | Write | Customer creation |
| `/orders` *(optional)* | POST | Write | Transactional insert |

Consistent endpoints ensure results reflect **JVM differences**, not test design differences.

---

# 6. How to Run the Scenarios

See [k6-load-tests/README.md](k6-load-tests/README.md) for complete instructions:
- Installation & configuration
- Running individual or all scenarios
- Collecting metrics from k6 and Prometheus
- Interpreting results and generating reports

---

# 7. Expected Performance Improvements

Based on typical Java 17 → Java 25 upgrade patterns:

## Garbage Collection Improvements (Most Dramatic)
- **GC Pause Count**: ~45/10min (J17) → ~6/10min (J25) = **87% reduction**
- **Max GC Pause**: ~200ms (J17) → ~10ms (J25) = **95% reduction**
- **Use Case**: Applications with real-time SLA requirements (p99 < 100ms)

## Latency Improvements
- **p95 Latency**: 120ms (J17) → 75ms (J25) = **37% reduction** (read-heavy scenario)
- **p95 Latency**: 250ms (J17) → 130ms (J25) = **48% reduction** (write-heavy scenario)
- **Most benefit**: Write-heavy workloads where memory allocation pressure is highest

## Memory Improvements
- **Peak Heap**: 580MB (J17) → 485MB (J25) = **16% reduction**
- **Cost Impact**: Can deploy with smaller container sizes or higher task densities

## Throughput Improvements
- **Write-Heavy Scenario**: 400 RPS (J17) → 520 RPS (J25) = **30% improvement**
- **Read-Heavy Scenario**: 1200 RPS (J17) → 1300 RPS (J25) = **8% improvement**
- **Cost Impact**: Fewer tasks needed to handle same load

## Startup Time
- **Cold Start**: 9.2s (J17) → 8.1s (J25) = **12% faster**
- **Warm Start (deployment)**: 4.5s (J17) → 3.8s (J25) = **15% faster**
- **Use Case**: Faster auto-scaling and blue-green deployments

---

# 8. What to Record

After running all 7 scenarios for each Java version, document:

1. **Standard Results** (fill in [../../Comparison.md](../../Comparison.md)):
   - Latency percentiles (p50, p95, p99)
   - Peak memory usage
   - Max throughput (RPS)
   - Cost per request

2. **GC Metrics** (from logs):
   - Pause count per 10-minute window
   - Max pause duration
   - Total pause time

3. **Cost Analysis** (see [AWS/cost-tracking.md](AWS/cost-tracking.md)):
   - Compute costs per scenario
   - Cost per request
   - Projected annual savings

4. **Observations**:
   - Any errors or anomalies
   - Environmental issues
   - Improvements vs baseline

---

# 9. Success Criteria for Production Upgrade

✅ **At least ONE of these should be true**:
- [ ] **Latency**: p95 latency < -10% across all scenarios
- [ ] **Memory**: Peak heap < 500MB (vs current 580MB)
- [ ] **GC**: Pause time < 50ms (vs current ~200ms spikes)
- [ ] **Cost**: Cost per request reduced by 10%+
- [ ] **Throughput**: Max RPS increased by 15%+

🚨 **STOP if ANY of these occur**:
- [ ] Error rate exceeds 5% in sustained load phases
- [ ] Application health endpoint fails during test
- [ ] Memory usage increases vs Java 17
- [ ] GC pauses exceed 500ms (indicates configuration issue)

---

# 10. References

- **Load Test Scripts**: [k6-load-tests/README.md](k6-load-tests/README.md)
- **Metrics Collection**: [AWS/prometheus-setup.md](AWS/prometheus-setup.md)
- **Visualization**: [AWS/grafana-setup.md](AWS/grafana-setup.md)
- **Cost Analysis**: [AWS/cost-tracking.md](AWS/cost-tracking.md)
- **Comparison Results**: [../../Comparison.md](../../Comparison.md)
- **AWS Fargate Docs**: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/
- **RDS Monitoring**: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/
