# Java 25 Results of Runs

## Scenario 1

**Start Time**: 2026-02-24T21:58:13.104Z
**End Time**: 2026-02-24T22:12:15.304Z

## Script run

- `k6 run scenario-1-read-heavy.js --out json=results-java25.json`
- `./get-service-metrics.sh 2026-02-24T21:58:13.104Z 2026-02-24T22:12:15.304Z us-east-1`
- `./get-prometheus-jvm-metrics.sh 2026-02-24T21:58:13.104Z 2026-02-24T22:12:15.304Z 60s > ../k6-load-tests/results/java25/prom-stats-java25-20260224.json`

## Results

- **K6 output results**: `Scenarios/REST/k6-load-tests/results/java25/scenario1/k6-results-java25-20260224.json`
- **K6 summary output**; `Scenarios/REST/k6-load-tests/results/java25/scenario1/k6-summary-java25-20260224.txt`
- **Container Stats**: `Scenarios/REST/k6-load-tests/results/java25/scenario1/container-stats-java25-20260224.txt`
- **Prom Stats**: `Scenarios/REST/k6-load-tests/results/java25/scenario1/prom-stats-java25-20260224.json`

## Summary of results
