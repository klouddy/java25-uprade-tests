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
