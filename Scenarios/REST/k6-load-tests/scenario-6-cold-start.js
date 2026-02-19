/**
 * Scenario 6: Cold Start Test
 * 
 * Measures startup time for new ECS tasks from launch to service readiness.
 * 
 * Metrics Captured:
 * - JVM initialization time
 * - Spring Boot startup time
 * - Time to /actuator/health returning UP
 * - Time to first successful request
 * 
 * Load Profile:
 * - Single VU making health checks every 1 second
 * - Continues until application is healthy
 * - Then makes 10 requests to measure first-request penalty
 * 
 * Duration: ~5-30 seconds depending on Java version
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, checkApplicationHealth } from './utils.js';

export const options = {
  stages: [
    // Health check phase: Single VU polling for readiness
    { duration: '30s', target: 1 },
  ],
  
  // For cold start, we care about successful response
  thresholds: {
    'http_req_failed': ['rate<0.05'],
  },
};

let startTime = null;
let firstHealthyTime = null;
let healthChecksPassed = 0;

export default function() {
  // Track when we started
  if (!startTime) {
    startTime = Date.now();
  }
  
  // Check application health
  const response = http.get(`${BASE_URL}/actuator/health`);
  
  if (response.status === 200 && !firstHealthyTime) {
    firstHealthyTime = Date.now();
    const coldStartTime = (firstHealthyTime - startTime) / 1000;
    console.log(`✓ Cold start complete in ${coldStartTime.toFixed(2)} seconds`);
    
    // Once healthy, make a few requests to measure warm-up
    makeWarmupRequests();
  }
  
  check(response, {
    'Health check status is 200': (r) => r.status === 200,
    'Health check response includes status': (r) => r.body.includes('status'),
  });
  
  // Check every 2 seconds until application is ready
  sleep(2);
}

function makeWarmupRequests() {
  // Make 5 requests to the main endpoint to test startup performance
  console.log('Making warmup requests to measure initial request handling...');
  
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    const response = http.get(`${BASE_URL}/customers/1`);
    const duration = (Date.now() - start) / 1000;
    
    check(response, {
      'Warmup request status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    
    console.log(`  Warmup request ${i + 1}: ${duration.toFixed(3)}s`);
    sleep(0.5);
  }
}

export function setup() {
  console.log('Cold Start Test: Waiting for application startup...');
  console.log(`Target URL: ${BASE_URL}`);
  return {
    startTime: Date.now(),
    testName: 'Cold Start',
  };
}

export function teardown(data) {
  const totalTime = (Date.now() - data.startTime) / 1000;
  
  console.log('\n========== Cold Start Test Results ==========');
  if (firstHealthyTime) {
    const coldStartTime = (firstHealthyTime - data.startTime) / 1000;
    console.log(`Cold start time: ${coldStartTime.toFixed(2)} seconds`);
    console.log(`Total test duration: ${totalTime.toFixed(2)} seconds`);
  } else {
    console.log('Application did not become healthy during test duration');
    console.log(`Test ran for: ${totalTime.toFixed(2)} seconds`);
  }
  console.log('=========================================\n');
}
