import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTimeP95 = new Trend('response_time_p95');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 }, // Stay at 10 users
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 }, // Stay at 20 users
    { duration: '30s', target: 0 } // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests must complete below 200ms
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
    error_rate: ['rate<0.05'] // Custom error rate must be below 5%
  }
};

// Base URL - can be overridden with environment variable
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function() {
  // Test health endpoint
  const healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100
  });
  errorRate.add(healthResponse.status !== 200);
  responseTimeP95.add(healthResponse.timings.duration);

  sleep(0.1);

  // Test tasks endpoint
  const tasksResponse = http.get(`${BASE_URL}/tasks`);
  check(tasksResponse, {
    'tasks endpoint status is 200': (r) => r.status === 200,
    'tasks endpoint response time < 200ms': (r) => r.timings.duration < 200,
    'tasks response has tasks array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.tasks !== undefined;
      } catch (e) {
        return false;
      }
    }
  });
  errorRate.add(tasksResponse.status !== 200);
  responseTimeP95.add(tasksResponse.timings.duration);

  sleep(0.1);

  // Test creating a task
  const taskPayload = JSON.stringify({
    title: `Performance Test Task ${__VU}-${__ITER}`,
    description: 'This is a task created during performance testing',
    priority: 'medium',
    completed: false
  });

  const createResponse = http.post(`${BASE_URL}/tasks`, taskPayload, {
    headers: { 'Content-Type': 'application/json' }
  });

  check(createResponse, {
    'create task status is 201': (r) => r.status === 201,
    'create task response time < 300ms': (r) => r.timings.duration < 300,
    'create task returns task object': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.task !== undefined && body.task.id !== undefined;
      } catch (e) {
        return false;
      }
    }
  });
  errorRate.add(createResponse.status !== 201);
  responseTimeP95.add(createResponse.timings.duration);

  sleep(0.1);

  // If task was created successfully, test updating it
  if (createResponse.status === 201) {
    try {
      const createdTask = JSON.parse(createResponse.body);
      const taskId = createdTask.task.id;

      const updatePayload = JSON.stringify({
        title: `Updated Performance Test Task ${__VU}-${__ITER}`,
        completed: true
      });

      const updateResponse = http.put(`${BASE_URL}/tasks/${taskId}`, updatePayload, {
        headers: { 'Content-Type': 'application/json' }
      });

      check(updateResponse, {
        'update task status is 200': (r) => r.status === 200,
        'update task response time < 300ms': (r) => r.timings.duration < 300
      });
      errorRate.add(updateResponse.status !== 200);
      responseTimeP95.add(updateResponse.timings.duration);

      sleep(0.1);

      // Test deleting the task
      const deleteResponse = http.del(`${BASE_URL}/tasks/${taskId}`);
      check(deleteResponse, {
        'delete task status is 204': (r) => r.status === 204,
        'delete task response time < 200ms': (r) => r.timings.duration < 200
      });
      errorRate.add(deleteResponse.status !== 204);
      responseTimeP95.add(deleteResponse.timings.duration);
    } catch (e) {
      console.error('Error in task update/delete operations:', e);
    }
  }

  sleep(0.1);
}

export function handleSummary(data) {
  const p95ResponseTime = data.metrics.http_req_duration.values.p95;
  const errorRateValue = data.metrics.http_req_failed.values.rate;

  console.log(`P95 Response Time: ${p95ResponseTime}ms`);
  console.log(`Error Rate: ${(errorRateValue * 100).toFixed(2)}%`);

  // Check if performance thresholds are met
  const performanceThreshold = 200; // 200ms
  const errorThreshold = 0.1; // 10%

  if (p95ResponseTime > performanceThreshold) {
    console.error(`❌ Performance test FAILED: P95 response time ${p95ResponseTime}ms exceeds threshold ${performanceThreshold}ms`);
    process.exit(1);
  }

  if (errorRateValue > errorThreshold) {
    console.error(`❌ Performance test FAILED: Error rate ${(errorRateValue * 100).toFixed(2)}% exceeds threshold ${(errorThreshold * 100).toFixed(2)}%`);
    process.exit(1);
  }

  console.log(`✅ Performance test PASSED: P95 response time ${p95ResponseTime}ms, Error rate ${(errorRateValue * 100).toFixed(2)}%`);

  return {
    'performance-results.json': JSON.stringify(data, null, 2)
  };
}
