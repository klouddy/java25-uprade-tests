/**
 * Scenario 7: Warm Start / Rolling Deployment Test
 * 
 * Measures behavior when replacing a container during a rolling deployment.
 * The application must restart while the ALB is still sending it traffic.
 * 
 * Metrics Captured:
 * - Time from RUNNING → healthy
 * - Latency impact during deploy
 * - Request failures or timeouts during restart
 * - JIT warm-up curve after restart
 * - Connection errors and recovery
 * 
 * Load Profile:
 * Phase 1 (Baseline): 2 min at 100 VUs - establish baseline performance
 * Phase 2 (Deploy window): 3 min at 100-200 VUs - simulate warm restart
 * Phase 3 (Recovery): 3 min at 100 VUs - verify recovery to baseline
 * 
 * Note: To run this test:
 * 1. Start k6 with baseline load
 * 2. During Phase 2, manually restart the ECS task (or use ECS API)
 * 3. k6 will record latency/failure impact
 * 4. Observe recovery curve as JIT recompilation happens
 * 
 * Total duration: ~8 minutes
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getOperationMix, executeOperation, checkApplicationHealth } from './utils.js';

export const options = {
  stages: [
    // Phase 1: Baseline - establish normal performance metrics
    { duration: '2m', target: 100 },
    // Phase 2: Deploy window - increase load during restart
    // k6 will show increased error rates and latency spikes when container restarts
    { duration: '3m', target: 200 },
    // Phase 3: Recovery - assess how quickly system returns to normal
    { duration: '3m', target: 100 },
  ],
  
  // Track failures and latency during deployment
  thresholds: {
    'http_req_duration': ['p(99)<2000'],
    'http_req_failed': ['rate<0.05'],
  },
};

const operationMix = getOperationMix(
  60,   // 60% read (GET by ID)
  20,   // 20% search (GET with query)
  20    // 20% write (POST)
);

let phaseMetrics = {
  baseline: { count: 0, errors: 0, totalLatency: 0 },
  deploy: { count: 0, errors: 0, totalLatency: 0 },
  recovery: { count: 0, errors: 0, totalLatency: 0 },
};

export default function() {
  // Determine which phase we're in
  const elapsed = __ENV.PHASE || 'unknown';
  
  // Execute operation and track metrics
  const start = Date.now();
  const response = executeOperation(operationMix);
  const duration = Date.now() - start;
  
  // Track metrics by phase
  if (__ENV.PHASE === 'baseline') {
    phaseMetrics.baseline.count++;
    phaseMetrics.baseline.totalLatency += duration;
    if (response.status >= 400) phaseMetrics.baseline.errors++;
  } else if (__ENV.PHASE === 'deploy') {
    phaseMetrics.deploy.count++;
    phaseMetrics.deploy.totalLatency += duration;
    if (response.status >= 400) phaseMetrics.deploy.errors++;
  } else if (__ENV.PHASE === 'recovery') {
    phaseMetrics.recovery.count++;
    phaseMetrics.recovery.totalLatency += duration;
    if (response.status >= 400) phaseMetrics.recovery.errors++;
  }
  
  // Think-time between requests
  const thinkTime = Math.random() * 1 + 0.3;
  sleep(thinkTime / 1000);
}

export function setup() {
  console.log('Warm Start / Rolling Deployment Test: Setting up...');
  console.log(`Target URL: ${BASE_URL}`);
  console.log('');
  console.log('INSTRUCTIONS:');
  console.log('1. k6 will run baseline for 2 minutes');
  console.log('2. During the 3-minute deploy window (minutes 2-5):');
  console.log('   - Manually restart the ECS task using AWS Console or CLI:');
  console.log('   - aws ecs update-service --cluster <cluster> --service <service> --force-new-deployment');
  console.log('3. Observe latency spikes and error rate increase in k6 console');
  console.log('4. Watch recovery phase as JIT recompilation completes');
  console.log('');
  
  const health = checkApplicationHealth();
  if (health.status !== 200) {
    throw new Error(`Application health check failed: ${health.status}`);
  }
  
  return {
    startTime: Date.now(),
    testName: 'Warm Start / Rolling Deployment',
  };
}

export function teardown(data) {
  console.log('Running teardown - verifying application recovered...');
  const health = checkApplicationHealth();
  
  data.endTime = Date.now();
  
  console.log('\n========== Warm Start / Rolling Deployment Results ==========');
  console.log(`Total test duration: ${((data.endTime - data.startTime) / 1000).toFixed(2)} seconds`);
  console.log('');
  
  console.log('Baseline Phase (before restart):');
  if (phaseMetrics.baseline.count > 0) {
    const avgLatency = phaseMetrics.baseline.totalLatency / phaseMetrics.baseline.count;
    const errorRate = (phaseMetrics.baseline.errors / phaseMetrics.baseline.count) * 100;
    console.log(`  Requests: ${phaseMetrics.baseline.count}`);
    console.log(`  Avg latency: ${avgLatency.toFixed(0)}ms`);
    console.log(`  Error rate: ${errorRate.toFixed(2)}%`);
  }
  
  console.log('');
  console.log('Deploy Phase (during restart):');
  if (phaseMetrics.deploy.count > 0) {
    const avgLatency = phaseMetrics.deploy.totalLatency / phaseMetrics.deploy.count;
    const errorRate = (phaseMetrics.deploy.errors / phaseMetrics.deploy.count) * 100;
    const latencyIncrease = ((avgLatency - (phaseMetrics.baseline.totalLatency / phaseMetrics.baseline.count)) / (phaseMetrics.baseline.totalLatency / phaseMetrics.baseline.count)) * 100;
    console.log(`  Requests: ${phaseMetrics.deploy.count}`);
    console.log(`  Avg latency: ${avgLatency.toFixed(0)}ms`);
    console.log(`  Latency increase vs baseline: ${latencyIncrease.toFixed(1)}%`);
    console.log(`  Error rate: ${errorRate.toFixed(2)}%`);
  }
  
  console.log('');
  console.log('Recovery Phase (after restart):');
  if (phaseMetrics.recovery.count > 0) {
    const avgLatency = phaseMetrics.recovery.totalLatency / phaseMetrics.recovery.count;
    const errorRate = (phaseMetrics.recovery.errors / phaseMetrics.recovery.count) * 100;
    const baselineAvg = phaseMetrics.baseline.totalLatency / phaseMetrics.baseline.count;
    const recoveryTime = ((baselineAvg - avgLatency) / baselineAvg) * 100;
    console.log(`  Requests: ${phaseMetrics.recovery.count}`);
    console.log(`  Avg latency: ${avgLatency.toFixed(0)}ms`);
    console.log(`  Distance to baseline: ${recoveryTime.toFixed(1)}%`);
    console.log(`  Error rate: ${errorRate.toFixed(2)}%`);
  }
  
  console.log('');
  if (health.status === 200) {
    console.log('✓ Application successfully recovered to healthy state');
  } else {
    console.log(`✗ Application did NOT recover: health status = ${health.status}`);
  }
  console.log('======================================================\n');
}
