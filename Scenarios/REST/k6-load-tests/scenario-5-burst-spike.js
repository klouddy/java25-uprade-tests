/**
 * Scenario 5: Burst / Spike Test
 * 
 * Simulates real-world traffic spikes such as promotions, campaign launches, or cron jobs.
 * Tests system stability under sudden load increases.
 * 
 * Traffic Mix:
 * - 60% GET /customers/{id}
 * - 20% GET /customers?search=...
 * - 20% POST /customers
 * 
 * Load Profile:
 * - Idle phase: 2 min at baseline (50 VUs)
 * - Spike: Instant jump to 800 VUs (simulates campaign launch)
 * - Peak duration: Sustain spike for 3 minutes
 * - Recovery: Ramp back down to baseline over 2 minutes
 * - Idle phase: 2 min at baseline (assess full recovery)
 * 
 * Total duration: ~11 minutes
 */

import { BASE_URL, getOperationMix, executeOperation, checkApplicationHealth, logScenarioMetrics, sleepWithJitter } from './utils.js';

export const options = {
  stages: [
    // Baseline phase: Low load for stability
    { duration: '2m', target: 50 },
    // Spike: Sudden jump to peak load (step function)
    { duration: '1s', target: 800 },
    // Peak phase: Sustain spike load for 3 minutes
    { duration: '3m', target: 800 },
    // Recovery: Ramp back to baseline
    { duration: '2m', target: 50 },
    // Post-spike idle: Verify recovery
    { duration: '2m', target: 50 },
  ],
  
  // Track latency spikes and error rates during spike
  thresholds: {
    'http_req_duration': ['p(99)<2500'],
    'http_req_failed': ['rate<0.15'],  // Expect higher failure rate during spike
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
  
  // Moderate think-time to allow pool recovery between VU waves
  const thinkTime = Math.random() * 1.5 + 0.5; // 0.5-2 seconds
  __VU > 0 && __ITER > 0 ? sleepWithJitter(thinkTime) : null;
}

export function setup() {
  // Check application health before test
  console.log('Running setup - checking application health before spike test...');
  const health = checkApplicationHealth();
  
  if (health.status !== 200) {
    throw new Error(`Application health check failed: ${health.status}`);
  }
  
  return {
    startTime: Date.now(),
    testName: 'Burst/Spike',
  };
}

export function teardown(data) {
  // Verify application recovered from spike
  console.log('Running teardown - checking application recovery after spike...');
  const health = checkApplicationHealth();
  
  data.endTime = Date.now();
  logScenarioMetrics('Burst/Spike Scenario', data);
  
  if (health.status !== 200) {
    console.warn(`Application did NOT fully recover after spike: ${health.status}`);
  } else {
    console.log('Application successfully recovered from spike');
  }
}
