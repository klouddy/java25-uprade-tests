# Balanced Scenario Summary

Scenario script: `Scenarios/REST/k6-load-tests/scenario-2-balanced.js`

## Test Overview
- **Workload**: Balanced read/write operations (50/50 mix)
- **Duration**: ~14 minutes per run
- **Max VUs**: 300 virtual users
- **All runs**: 5 total executions across Java 17, 21, and 25

## All Runs

### Run Setup Comparison

| Run | Java | Memory (MB) | CPU | DB Pool | Virtual Threads | Date |
|---|---|---:|---|---:|---|---|
| 1 | 17 | 2048 | 512 | 20 | No | 2026-03-04 |
| 2 | 21 | 2048 | 512 | 20 | No | 2026-03-04 |
| 3 | 21 | 1024 | 512 | 50 | **Yes** | 2026-03-04 |
| 4 | 25 | 2048 | 512 | 20 | No | 2026-03-04 |
| 5 | 25 | 1024 | 512 | 20 | No | 2026-03-04 |

### Performance Comparison

| Run | Java | p50 (ms) | p95 (ms) | p99 (ms) | Throughput (req/s) | Failed % | Check Success % |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 | 17 | 57.35 | 1230 | 1980 | 86.77 | 0.68% | 93.29% |
| 2 | 21 | 52.48 | 1240 | 1910 | 86.79 | 0.79% | 92.57% |
| 3 | 21 | **58.84** | **705.74** | **1330** | **90.43** | 0.68% | **95.76%** |
| 4 | 25 | 59.22 | 1610 | 2790 | 83.17 | 0.70% | 91.60% |
| 5 | 25 | 57.9 | 1990 | 3230 | 81.16 | 0.71% | 91.16% |

## Key Observations

### Virtual Threads Win (Java 21 Run 3)
- **Best performer overall**: Java 21 with virtual threads, smaller memory (1024 MB), and larger DB pool (50)
- **Tail latency improvement**: p95 reduced by 43% (705ms vs 1230ms baseline), p99 by 33% (1330ms vs 1980ms)
- **Throughput gain**: 4.2% higher than baseline (90.43 vs 86.77 req/s)
- **Only run to pass all thresholds**: p99 < 1500ms, p95 < 750ms, p50 < 150ms
- **Check success rate**: Best at 95.76%

### Baseline Runs (2048 MB, Pool 20, No VT)
Runs 1, 2, and 4 all use identical configuration:
- **Similar performance**: Java 17 (86.77 req/s) ≈ Java 21 (86.79 req/s) > Java 25 (83.17 req/s)
- **Java 21 slight edge**: Marginally better p99 (1910ms vs 1980ms) than Java 17
- **Java 25 regression**: Worse p95/p99 latency (1610ms/2790ms) vs Java 17/21

### Memory Reduction Test (Java 25 Run 5)
- **Further degradation**: Reducing memory to 1024 MB without other optimizations hurt performance
- **Worst results**: p95=1990ms, p99=3230ms (highest across all runs)
- **Throughput drop**: 81.16 req/s (lowest of all runs, 6.5% below baseline)
- **Needs investigation**: Java 25 may require tuning for lower memory configurations

## Confirmed Experiment Intent

### Run 3 (Java 21 with 1024 MB)
**Primary test goal**: Evaluate virtual threads performance on smaller container (1024 MB vs 2048 MB)
- **Secondary change**: Increased DB pool from 20 to 50 connections to maximize virtual thread throughput potential
- **Result**: Multi-variable improvement - 50% memory savings with better performance than 2048 MB baseline
- **Attribution**: Cannot isolate virtual threads vs DB pool impact, but combined effect is clearly positive

### Run 5 (Java 25 with 1024 MB)  
**Primary test goal**: Assess Java 25 JDK improvements alone on smaller container (1024 MB vs 2048 MB)
- **Single variable**: Memory reduction only (DB pool=20, no virtual threads)
- **Result**: Performance regression - both latency and throughput degraded
- **Attribution**: Clear - Java 25 alone insufficient to maintain performance with 50% memory reduction in balanced workload

## Confidence Limits

### High Confidence Findings
- **Virtual threads combined with larger DB pool** (run 3) delivers measurable improvements in balanced workload
- **Java 25 on reduced memory alone** (run 5) shows performance degradation vs baseline
- **Baseline configs** (runs 1, 2, 4) show Java versions perform similarly at 2048 MB

### Limited Confidence
- **Virtual threads isolated impact**: Cannot separate from DB pool increase in run 3
- **Java 25 potential**: May have headroom with different tuning, but untested in this scenario

## Interpretation

### For Balanced Workloads
1. **Java 21 with virtual threads is the clear winner** when properly configured (larger DB pool)
2. **Baseline configs show minimal version differences** at 2048 MB
3. **Memory optimization requires careful tuning** - Java 25 shows this isn't automatic

### Recommendations
- **Production deployment**: Use Java 21 with virtual threads + larger DB pool for balanced workloads
- **Container sizing**: 1024 MB sufficient with virtual threads, provides 50% cost savings
- **Java 25 investigation**: Profile memory pressure and GC behavior at 1024 MB before production use
- **DB pool tuning**: Virtual threads benefit from higher connection pool sizes (50 vs 20)
