/**
 * Scenario 2: Balanced CRUD Load Test
 * 
 * Traffic Mix:
 * - 40% GET /customers/{id}
 * - 20% GET /customers?search=...
 * - 40% POST /customers (balanced writes)
 * 
 * Load Profile:
 * - Warm-up: 2 min at 50 VUs
 * - Main load: 10 min at 300 VUs
 * - Cool-down: 2 min ramp down
 * 
 * Total duration: ~14 minutes
 */

import { BASE_URL, getOperationMix, executeOperation, checkApplicationHealth, logScenarioMetrics, sleepWithJitter } from './utils.js';

export const options = {
  stages: [
    // Warm-up phase: 2 minutes at low load
    { duration: '2m', target: 50 },
    // Main load phase: 10 minutes at moderate-high load (balanced read/write)
    { duration: '10m', target: 300 },
    // Cool-down phase: 2 minutes ramp down
    { duration: '2m', target: 0 },
  ],
  
  // Thresholds for acceptable performance
  thresholds: {
    'http_req_duration': ['p(99)<1500', 'p(95)<750', 'p(50)<150'],
    'http_req_failed': ['rate<0.05'],
    'http_reqs': ['count>0'],
  },
};

const operationMix = getOperationMix(
  40,   // 40% read (GET by ID)
  20,   // 20% search (GET with query)
  40    // 40% write (POST) - heavier than read-heavy scenario
);

export default function() {
  // Execute read, search, or write operation based on mix
  executeOperation(operationMix);
  
  // Small delay between requests to simulate realistic user think-time
  // Using jitter to avoid thundering herd
  const thinkTime = Math.random() * 2 + 0.5; // 0.5-2.5 seconds
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
    testName: 'Balanced',
  };
}

export function teardown(data) {
  // Verify application is still healthy after test
  console.log('Running teardown - checking application health...');
  const health = checkApplicationHealth();
  
  data.endTime = Date.now();
  logScenarioMetrics('Balanced Scenario', data);
  
  if (health.status !== 200) {
    console.warn(`Application health check failed after test: ${health.status}`);
  }
}
