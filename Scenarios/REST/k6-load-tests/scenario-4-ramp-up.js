/**
 * Scenario 4: Ramp-Up Scalability Test
 * 
 * Tests the system as traffic gradually increases to find maximum safe capacity.
 * 
 * Traffic Mix:
 * - 60% GET /customers/{id}
 * - 20% GET /customers?search=...
 * - 20% POST /customers
 * 
 * Load Profile:
 * - Ramp-up: Start at 0 and gradually increase to 1000 VUs over 10 minutes
 * - Hold: Sustain at 1000 VUs for 2 minutes
 * - Cool-down: Ramp down to 0 over 2 minutes
 * 
 * Total duration: ~14 minutes
 */

import { BASE_URL, getOperationMix, executeOperation, checkApplicationHealth, logScenarioMetrics, sleepWithJitter } from './utils.js';

export const options = {
  stages: [
    // Ramp-up phase: Gradually increase load from 0 to 1000 VUs over 10 minutes
    // This tests system behavior as capacity is approached
    { duration: '10m', target: 1000 },
    // Hold phase: Maintain peak load for 2 minutes
    // Identifies saturation points and stability
    { duration: '2m', target: 1000 },
    // Cool-down phase: Gradually decrease load
    { duration: '2m', target: 0 },
  ],
  
  // More lenient thresholds for ramp-up test (will show degradation)
  thresholds: {
    'http_req_duration': ['p(99)<3000'],
    'http_req_failed': ['rate<0.10'],
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
  
  // Simple think-time without jitter for more consistent load
  const thinkTime = 0.5;
  __VU > 0 && __ITER > 0 ? sleepWithJitter(thinkTime, 0) : null;
}

export function setup() {
  // Check application health before test
  console.log('Running setup - checking application health before ramp-up test...');
  const health = checkApplicationHealth();
  
  if (health.status !== 200) {
    throw new Error(`Application health check failed: ${health.status}`);
  }
  
  return {
    startTime: Date.now(),
    testName: 'Ramp-Up Scalability',
  };
}

export function teardown(data) {
  // Verify application is still healthy after test
  console.log('Running teardown - checking application health after ramp-up test...');
  const health = checkApplicationHealth();
  
  data.endTime = Date.now();
  logScenarioMetrics('Ramp-Up Scalability Scenario', data);
  
  if (health.status !== 200) {
    console.warn(`Application health check failed after test: ${health.status}`);
  }
}
