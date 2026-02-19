/**
 * Scenario 3: Write-Heavy Load Test
 * 
 * Traffic Mix:
 * - 10% GET /customers/{id}
 * - 10% GET /customers?search=...
 * - 80% POST /customers (heavy write load)
 * 
 * Load Profile:
 * - Warm-up: 2 min at 50 VUs
 * - Main load: 10 min at 200 VUs (write-heavy = lower VU count for same stress)
 * - Cool-down: 2 min ramp down
 * 
 * Total duration: ~14 minutes
 */

import { BASE_URL, getOperationMix, executeOperation, checkApplicationHealth, logScenarioMetrics, sleepWithJitter } from './utils.js';

export const options = {
  stages: [
    // Warm-up phase: 2 minutes at low load
    { duration: '2m', target: 50 },
    // Main load phase: 10 minutes at write-heavy load
    { duration: '10m', target: 200 },
    // Cool-down phase: 2 minutes ramp down
    { duration: '2m', target: 0 },
  ],
  
  // Thresholds for acceptable performance (higher latency expected with writes)
  thresholds: {
    'http_req_duration': ['p(99)<2000', 'p(95)<1000', 'p(50)<200'],
    'http_req_failed': ['rate<0.05'],
    'http_reqs': ['count>0'],
  },
};

const operationMix = getOperationMix(
  10,   // 10% read (GET by ID)
  10,   // 10% search (GET with query)
  80    // 80% write (POST) - dominant workload
);

export default function() {
  // Execute read, search, or write operation based on mix
  executeOperation(operationMix);
  
  // Slightly longer think-time between writes to allow DB to keep up
  const thinkTime = Math.random() * 2.5 + 1; // 1-3.5 seconds
  __VU > 0 && __ITER > 0 ? sleepWithJitter(thinkTime) : null;
}

export function setup() {
  // Check application health before test
  console.log('Running setup - checking application health...');
  const health = checkApplicationHealth();
  
  if (health.status !== 200) {
    throw new Error(`Application health check failed: ${health.status}`);
  }
  
  return {
    startTime: Date.now(),
    testName: 'Write-Heavy',
  };
}

export function teardown(data) {
  // Verify application is still healthy after test
  console.log('Running teardown - checking application health...');
  const health = checkApplicationHealth();
  
  data.endTime = Date.now();
  logScenarioMetrics('Write-Heavy Scenario', data);
  
  if (health.status !== 200) {
    console.warn(`Application health check failed after test: ${health.status}`);
  }
}
