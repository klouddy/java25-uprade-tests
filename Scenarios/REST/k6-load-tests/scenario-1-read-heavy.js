/**
 * Scenario 1: Read-Heavy Load Test
 * 
 * Traffic Mix:
 * - 60% GET /customers/{id}
 * - 20% GET /customers?search=...
 * - 20% POST /customers
 * 
 * Load Profile:
 * - Warm-up: 2 min at 50 VUs
 * - Main load: 10 min at 500 VUs
 * - Cool-down: 2 min ramp down
 * 
 * Total duration: ~14 minutes
 */

import { BASE_URL, getOperationMix, executeOperation, checkApplicationHealth, logScenarioMetrics, sleepWithJitter } from './utils.js';

export const options = {
  stages: [
    // Warm-up phase: 2 minutes at low load
    { duration: '2m', target: 50 },
    // Main load phase: 10 minutes at high load
    { duration: '10m', target: 500 },
    // Cool-down phase: 2 minutes ramp down
    { duration: '2m', target: 0 },
  ],
  
  // Thresholds for acceptable performance
  thresholds: {
    'http_req_duration': ['p(99)<1000', 'p(95)<500', 'p(50)<100'],
    'http_req_failed': ['rate<0.05'],
    'http_reqs': ['count>0'],
  },
};

const operationMix = getOperationMix(
  60,   // 60% read (GET by ID)
  20,   // 20% search (GET with query)
  20    // 20% write (POST)
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
  const startDateTime = new Date().toISOString();
  const startEpoch = Date.now();
  
  console.log('========================================');
  console.log('TEST START TIME');
  console.log('========================================');
  console.log('ISO Format: ' + startDateTime);
  console.log('Epoch (ms): ' + startEpoch);
  console.log('Running setup - checking application health...');
  
  const health = checkApplicationHealth();
  
  if (health.status !== 200) {
    throw new Error(`Application health check failed: ${health.status}`);
  }
  
  return {
    startTime: startEpoch,
    startDateTime: startDateTime,
    testName: 'Read-Heavy',
  };
}

export function teardown(data) {
  // Verify application is still healthy after test
  const endDateTime = new Date().toISOString();
  const endEpoch = Date.now();
  
  console.log('========================================');
  console.log('TEST END TIME');
  console.log('========================================');
  console.log('ISO Format: ' + endDateTime);
  console.log('Epoch (ms): ' + endEpoch);
  console.log('Running teardown - checking application health...');
  
  data.endTime = endEpoch;
  data.endDateTime = endDateTime;
  
  const durationSec = (data.endTime - data.startTime) / 1000;
  console.log('========================================');
  console.log('TEST DURATION: ' + durationSec + ' seconds (' + (durationSec / 60).toFixed(2) + ' minutes)');
  console.log('========================================');
  
  logScenarioMetrics('Read-Heavy Scenario', data);
  
  const health = checkApplicationHealth();
  if (health.status !== 200) {
    console.warn(`Application health check failed after test: ${health.status}`);
  }
}
