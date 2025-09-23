import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTimeP95 = new Trend('response_time_p95');

// Stress test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '2m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 } // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.2'], // Error rate must be below 20%
    error_rate: ['rate<0.15'] // Custom error rate must be below 15%
  }
};

// Base URL - can be overridden with environment variable
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function() {
  // Test health endpoint under stress
  const healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200
  });
  errorRate.add(healthResponse.status !== 200);
  responseTimeP95.add(healthResponse.timings.duration);

  sleep(0.05);

  // Test tasks endpoint under stress
  const tasksResponse = http.get(`${BASE_URL}/tasks`);
  check(tasksResponse, {
    'tasks endpoint status is 200': (r) => r.status === 200,
    'tasks endpoint response time < 500ms': (r) => r.timings.duration < 500
  });
  errorRate.add(tasksResponse.status !== 200);
  responseTimeP95.add(tasksResponse.timings.duration);

  sleep(0.05);

  // Test creating tasks under stress
  const taskPayload = JSON.stringify({
    title: `Stress Test Task ${__VU}-${__ITER}`,
    description: 'This is a task created during stress testing',
    priority: 'high',
    completed: false
  });

  const createResponse = http.post(`${BASE_URL}/tasks`, taskPayload, {
    headers: { 'Content-Type': 'application/json' }
  });

  check(createResponse, {
    'create task status is 201': (r) => r.status === 201,
    'create task response time < 1000ms': (r) => r.timings.duration < 1000
  });
  errorRate.add(createResponse.status !== 201);
  responseTimeP95.add(createResponse.timings.duration);

  sleep(0.05);
}

export function handleSummary(data) {
  const p95ResponseTime = data.metrics.http_req_duration.values.p95;
  const errorRateValue = data.metrics.http_req_failed.values.rate;

  console.log('Stress Test Results:');
  console.log(`P95 Response Time: ${p95ResponseTime}ms`);
  console.log(`Error Rate: ${(errorRateValue * 100).toFixed(2)}%`);

  // Check if stress test thresholds are met
  const performanceThreshold = 500; // 500ms for stress test
  const errorThreshold = 0.2; // 20% for stress test

  if (p95ResponseTime > performanceThreshold) {
    console.error(`❌ Stress test FAILED: P95 response time ${p95ResponseTime}ms exceeds threshold ${performanceThreshold}ms`);
    process.exit(1);
  }

  if (errorRateValue > errorThreshold) {
    console.error(`❌ Stress test FAILED: Error rate ${(errorRateValue * 100).toFixed(2)}% exceeds threshold ${(errorThreshold * 100).toFixed(2)}%`);
    process.exit(1);
  }

  console.log(`✅ Stress test PASSED: P95 response time ${p95ResponseTime}ms, Error rate ${(errorRateValue * 100).toFixed(2)}%`);

  return {
    'stress-test-results.json': JSON.stringify(data, null, 2)
  };
}
