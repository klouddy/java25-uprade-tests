# Read-Heavy Scenario Summary

Scenario script: `Scenarios/REST/k6-load-tests/scenario-1-read-heavy.js`

## Runs included
- Java 17: `runs/Scenarios/REST/read-heavy/java17/2026-02-27/1`
- Java 21: `runs/Scenarios/REST/read-heavy/java21/2026-03-02/1`
- Java 21: `runs/Scenarios/REST/read-heavy/java21/2026-03-02/2`
- Java 25: `runs/Scenarios/REST/read-heavy/java25/2026-03-02/1`
- Java 25: `runs/Scenarios/REST/read-heavy/java25/2026-03-02/2`

## Setup differences from task-definition.json

| Run | Task CPU | Task Memory | Container Memory | DB Pool | Virtual Threads |
|---|---:|---:|---:|---:|---|
| Java 17 / 2026-02-27 / 1 | 512 | 2048 | 2048 | 20 | false |
| Java 21 / 2026-03-02 / 1 | 512 | 2048 | 2048 | 20 | false |
| Java 21 / 2026-03-02 / 2 | 512 | 1024 | 1024 | 50 | true |
| Java 25 / 2026-03-02 / 1 | 512 | 2048 | 2048 | 20 | false |
| Java 25 / 2026-03-02 / 2 | 512 | 1024 | 1024 | 20 | false |

## Performance comparison (k6)

| Run | avg latency | p95 latency | p99 latency | req/s | http failed | checks succeeded |
|---|---:|---:|---:|---:|---:|---:|
| Java 17 / 2026-02-27 / 1 | 1.59s | 5.43s | 7.12s | 76.69 | 0.00% | 75.09% |
| Java 21 / 2026-03-02 / 1 | 152.65ms | 598.65ms | 1.19s | 143.32 | 1.37% | 96.37% |
| Java 21 / 2026-03-02 / 2 | 220.13ms | 1.02s | 1.52s | 137.23 | 1.27% | 92.91% |
| Java 25 / 2026-03-02 / 1 | 347.31ms | 1.82s | 2.75s | 128.08 | 1.44% | 90.51% |
| Java 25 / 2026-03-02 / 2 | 278.72ms | 1.24s | 2.25s | 132.89 | 1.31% | 91.40% |

## What changed and what happened

## Confirmed experiment intent
- **Java 21 / run 2**: primary goal was to test **virtual threads with smaller memory**, with `DB_POOL_SIZE` increased (`20 -> 50`) to try to raise throughput.
- **Java 25 / run 2**: primary goal was a **memory-only reduction test** to validate whether newer JDK improvements allow the same code to run well with less memory.

### Java 21 internal comparison (Run 1 -> Run 2)
- Setup change: memory reduced `2048 -> 1024`, virtual threads enabled `false -> true`, DB pool increased `20 -> 50`.
- Outcome: throughput decreased (`143.32 -> 137.23 req/s`) and latency worsened (`avg 152.65ms -> 220.13ms`, `p95 598.65ms -> 1.02s`).
- Interpretation: for this workload, the virtual-thread + smaller-memory configuration (even with larger DB pool) did not beat the Java 21 baseline.

### Java 25 internal comparison (Run 1 -> Run 2)
- Setup change: memory reduced `2048 -> 1024` (virtual threads remained `false`, DB pool remained `20`).
- Outcome: throughput improved (`128.08 -> 132.89 req/s`) and latency improved (`avg 347.31ms -> 278.72ms`, `p95 1.82s -> 1.24s`).
- Interpretation: Java 25 benefited from the smaller container setting in this pair of runs.

### Cross-version baseline view
- Best overall run in this folder is **Java 21 / 2026-03-02 / 1** (non-virtual, 2GB task/container memory).
- Java 17 is substantially slower than both Java 21 and Java 25 for read-heavy traffic.
- Java 25 improves with tuning (run 2 vs run 1) but still trails the strongest Java 21 run.

## Key takeaway for your goal

Your hypothesis is supported for Java 25 in this dataset: **lower memory can still deliver similar or better throughput** (Java 25 run 2 vs run 1). For Java 21, this specific virtual-thread + lower-memory test did **not** outperform Java 21 baseline run 1.

## Confidence limits

- Java 21 run 2 changed **three things at once** (virtual threads, memory, DB pool), so attribution across those three is limited.
- Java 25 run 2 is a cleaner memory-only comparison and gives stronger confidence for the "run with less memory" conclusion.
