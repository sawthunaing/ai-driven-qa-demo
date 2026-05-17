// scripts/run-tests.js
// Executes the AI-generated test cases against the running Calculator API.
// Reads: generated-tests.json
// Writes: test-results.json
//
// Usage:
//   node scripts/run-tests.js
//   Optional: API_URL=http://localhost:3000 (default)

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/v1/calculate`;

const testsPath = path.join(__dirname, '..', 'generated-tests.json');
const resultsPath = path.join(__dirname, '..', 'test-results.json');

async function checkApiHealth() {
  try {
    const res = await axios.get(`${API_BASE}/health`, { timeout: 3000 });
    return res.status === 200;
  } catch {
    return false;
  }
}

function deepEqual(actual, expected, tolerance = 1e-9) {
  if (typeof actual === 'number' && typeof expected === 'number') {
    return Math.abs(actual - expected) < tolerance;
  }
  return actual === expected;
}

async function runTests() {
  // Verify API is up
  console.log(`🔍 Checking API health at ${API_BASE}/health ...`);
  const healthy = await checkApiHealth();
  if (!healthy) {
    console.error(`❌ API not responding at ${API_BASE}. Start it first:`);
    console.error('   node calculator-api.js');
    process.exit(1);
  }
  console.log('✅ API is healthy\n');

  // Load test cases
  if (!fs.existsSync(testsPath)) {
    console.error(`❌ Test file not found: ${testsPath}`);
    console.error('   Run: node scripts/generate-tests.js');
    process.exit(1);
  }

  const testCases = JSON.parse(fs.readFileSync(testsPath, 'utf8'));
  console.log(`📋 Loaded ${testCases.length} test cases\n`);
  console.log('Running tests...\n');

  const results = [];
  let passed = 0;
  let failed = 0;
  let errors = 0;

  for (const test of testCases) {
    let result;
    try {
      const response = await axios.post(API_URL, test.request_body, {
        validateStatus: () => true, // accept all status codes
        timeout: 5000,
      });

      // Check status code
      const statusMatch = response.status === test.expected_status;

      // Check expected result (numeric)
      let resultMatch = true;
      if (test.expected_result !== undefined && test.expected_result !== null) {
        if (response.data && typeof response.data.result === 'number') {
          resultMatch = deepEqual(response.data.result, test.expected_result);
        } else {
          resultMatch = false;
        }
      }

      // Check error message substring
      let bodyMatch = true;
      if (test.expected_response_contains) {
        bodyMatch = JSON.stringify(response.data || {})
          .toLowerCase()
          .includes(String(test.expected_response_contains).toLowerCase());
      }

      const success = statusMatch && resultMatch && bodyMatch;

      result = {
        test_name: test.test_name,
        category: test.category,
        status: success ? 'PASS' : 'FAIL',
        request: test.request_body,
        expected: {
          status: test.expected_status,
          result: test.expected_result ?? null,
          response_contains: test.expected_response_contains ?? null,
        },
        actual: {
          status: response.status,
          body: response.data,
        },
      };

      if (success) {
        passed++;
        console.log(`✅ ${test.test_name}`);
      } else {
        failed++;
        console.log(`❌ ${test.test_name}`);
        if (!statusMatch) {
          console.log(`     expected status ${test.expected_status}, got ${response.status}`);
        }
        if (!resultMatch) {
          console.log(`     expected result ${test.expected_result}, got ${response.data?.result}`);
        }
        if (!bodyMatch) {
          console.log(`     expected response to contain "${test.expected_response_contains}"`);
        }
      }
    } catch (err) {
      errors++;
      result = {
        test_name: test.test_name,
        category: test.category,
        status: 'ERROR',
        request: test.request_body,
        error: err.message,
      };
      console.log(`💥 ${test.test_name} — ERROR: ${err.message}`);
    }

    results.push(result);
  }

  // Save full results
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Summary
  const total = testCases.length;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 SUMMARY: ${passed} passed, ${failed} failed, ${errors} errors  (total: ${total})`);
  console.log(`Results saved to ${resultsPath}`);
  console.log('='.repeat(60));

  // Exit with non-zero code if any tests failed (so CI can detect)
  if (failed + errors > 0) {
    process.exitCode = 1;
  }
}

runTests().catch((err) => {
  console.error('❌ Runner error:', err.message);
  process.exit(1);
});
