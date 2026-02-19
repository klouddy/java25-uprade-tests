/**
 * Shared utilities for Java 25 upgrade k6 load tests
 * Provides common functions for all REST scenarios
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuration
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
export const RESULTS_DIR = __ENV.RESULTS_DIR || './results';

// Common customer data for test data generation
const FIRST_NAMES = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jennifer'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];

/**
 * Generate random customer data for POST requests
 * @returns {Object} Customer data object
 */
export function generateCustomerData() {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  
  return {
    firstName: firstName,
    lastName: lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    city: city,
    createdAt: new Date().toISOString()
  };
}

/**
 * Get a random search term
 * @returns {string} Random search term
 */
export function getRandomSearchTerm() {
  const searchTerms = ['John', 'Jane', 'Smith', 'New York', 'Chicago', 'Garcia'];
  return searchTerms[Math.floor(Math.random() * searchTerms.length)];
}

/**
 * Get a random customer ID (1-1000)
 * @returns {number} Random customer ID
 */
export function getRandomCustomerId() {
  return Math.floor(Math.random() * 1000) + 1;
}

/**
 * Make a GET request for a specific customer
 * @param {string} customerId - Customer ID to fetch
 * @returns {Object} HTTP response
 */
export function getCustomerById(customerId) {
  const path = `/customers/${customerId}`;
  const response = http.get(`${BASE_URL}${path}`);
  
  check(response, {
    'GET /customers/{id} status is 200': (r) => r.status === 200 || r.status === 404,
    'GET /customers/{id} response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  return response;
}

/**
 * Make a GET search request
 * @param {string} searchTerm - Search term
 * @returns {Object} HTTP response
 */
export function searchCustomers(searchTerm) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.get(`${BASE_URL}/customers?search=${encodeURIComponent(searchTerm)}`, params);
  
  check(response, {
    'GET /customers?search status is 200': (r) => r.status === 200,
    'GET /customers?search response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  return response;
}

/**
 * Make a POST request to create a customer
 * @returns {Object} HTTP response
 */
export function createCustomer() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const payload = JSON.stringify(generateCustomerData());
  const response = http.post(`${BASE_URL}/customers`, payload, params);
  
  check(response, {
    'POST /customers status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    'POST /customers response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  return response;
}

/**
 * Record test metrics and check application health
 * @returns {Object} HTTP response from health endpoint
 */
export function checkApplicationHealth() {
  const response = http.get(`${BASE_URL}/actuator/health`);
  
  check(response, {
    'Health check status is 200': (r) => r.status === 200,
  });
  
  return response;
}

/**
 * Get Prometheus metrics endpoint
 * @returns {Object} Prometheus metrics response
 */
export function getPrometheusMetrics() {
  const response = http.get(`${BASE_URL}/actuator/prometheus`);
  
  check(response, {
    'Prometheus endpoint status is 200': (r) => r.status === 200,
  });
  
  return response;
}

/**
 * Calculate operation mix weights
 * Returns the operation function and weight
 * Example: [{'fn': getCustomerById, 'weight': 0.6}, ...]
 */
export function getOperationMix(readPercent = 60, searchPercent = 20, writePercent = 20) {
  return [
    { fn: 'read', weight: readPercent / 100 },
    { fn: 'search', weight: searchPercent / 100 },
    { fn: 'write', weight: writePercent / 100 },
  ];
}

/**
 * Execute a random operation based on mix
 * @param {Array} operationMix - Array of {fn, weight} objects
 */
export function executeOperation(operationMix) {
  const rand = Math.random();
  let cumulative = 0;
  
  for (let op of operationMix) {
    cumulative += op.weight;
    if (rand <= cumulative) {
      switch(op.fn) {
        case 'read':
          return getCustomerById(getRandomCustomerId());
        case 'search':
          return searchCustomers(getRandomSearchTerm());
        case 'write':
          return createCustomer();
      }
    }
  }
  
  // Fallback (should not reach here)
  return getCustomerById(getRandomCustomerId());
}

/**
 * Sleep with optional jitter
 * @param {number} duration - Base sleep duration in seconds
 * @param {number} jitterPercent - Jitter as percentage of duration (default 10)
 */
export function sleepWithJitter(duration = 1, jitterPercent = 10) {
  const jitter = (Math.random() - 0.5) * (duration * jitterPercent / 100) * 2;
  sleep(Math.max(0.01, duration + jitter));
}

/**
 * Log scenario summary metrics
 * @param {string} scenarioName - Name of the scenario
 * @param {Object} metrics - Metrics object to log
 */
export function logScenarioMetrics(scenarioName, metrics) {
  console.log(`\n========== ${scenarioName} ==========`);
  console.log(`Start time: ${new Date(metrics.startTime).toISOString()}`);
  console.log(`End time: ${new Date(metrics.endTime).toISOString()}`);
  console.log(`Duration: ${(metrics.endTime - metrics.startTime) / 1000} seconds`);
  if (metrics.totalRequests) {
    console.log(`Total requests: ${metrics.totalRequests}`);
    console.log(`Avg RPS: ${(metrics.totalRequests / ((metrics.endTime - metrics.startTime) / 1000)).toFixed(2)}`);
  }
  console.log('=======================================\n');
}
