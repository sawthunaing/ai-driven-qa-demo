// scripts/generate-tests.js
// Reads the OpenAPI spec and asks Claude to generate comprehensive test cases.
// Output: generated-tests.json
//
// Usage:
//   ANTHROPIC_API_KEY=sk-ant-... node scripts/generate-tests.js
//   Optionally: --count=30 to control number of cases

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY environment variable is required.');
  console.error('   Get a key at https://console.anthropic.com/');
  process.exit(1);
}

const client = new Anthropic({ apiKey });

// Parse simple --count=N argument
const args = process.argv.slice(2);
const countArg = args.find((a) => a.startsWith('--count='));
const count = countArg ? parseInt(countArg.split('=')[1], 10) : 25;

const specPath = path.join(__dirname, '..', 'calculator-spec.yaml');
const outputPath = path.join(__dirname, '..', 'generated-tests.json');

async function generateTestCases() {
  console.log(`📖 Reading API spec from ${specPath}`);
  const specYaml = fs.readFileSync(specPath, 'utf8');
  const spec = yaml.load(specYaml);

  const prompt = `You are a senior QA engineer specializing in API testing for financial systems.

Given this OpenAPI specification:

${JSON.stringify(spec, null, 2)}

Generate exactly ${count} comprehensive test cases covering ALL of these categories:

1. POSITIVE / HAPPY PATH (cases for each of add, subtract, multiply, divide)
2. BOUNDARY VALUES (zero, very large numbers, very small decimals, negative numbers)
3. EDGE CASES (floating-point precision like 0.1+0.2, division by zero, integer overflow)
4. NEGATIVE / VALIDATION (missing fields, wrong types, invalid operation name, null/undefined)
5. SECURITY (injection-like strings, oversized payloads, special characters)

CRITICAL REQUIREMENTS:
- Return ONLY a valid JSON array. NO markdown fences, NO explanation text.
- Each test case must follow this exact schema:

{
  "test_name": "Clear description of what's being tested",
  "category": "positive" | "boundary" | "edge" | "negative" | "security",
  "request_body": { "a": <value>, "b": <value>, "operation": "<op>" },
  "expected_status": 200 or 400,
  "expected_response_contains": "<substring>" or null,
  "expected_result": <number> or null
}

- For positive tests, set expected_result to the correct numeric answer.
- For error tests, set expected_response_contains to a substring of the error message.
- For floating-point precision tests, set expected_result to the mathematically correct value (e.g. 0.3 for 0.1+0.2). This will deliberately fail and demonstrate a real bug.
- Test names should be descriptive (e.g. "Add two positive integers", not "Test 1").

Return ONLY the JSON array, starting with [ and ending with ].`;

  console.log(`🤖 Asking Claude to generate ${count} test cases...`);
  const startTime = Date.now();

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`⏱️  AI responded in ${elapsed}s`);

  let text = response.content[0].text.trim();

  // Defensive: strip markdown fences if AI added them
  if (text.startsWith('```')) {
    text = text.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
  }

  let testCases;
  try {
    testCases = JSON.parse(text);
  } catch (err) {
    console.error('❌ Failed to parse AI response as JSON.');
    console.error('First 500 chars of response:', text.slice(0, 500));
    process.exit(1);
  }

  if (!Array.isArray(testCases)) {
    console.error('❌ AI response was not an array.');
    process.exit(1);
  }

  fs.writeFileSync(outputPath, JSON.stringify(testCases, null, 2));

  // Print breakdown by category
  const breakdown = testCases.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  console.log(`\n✅ Generated ${testCases.length} test cases → ${outputPath}\n`);
  console.log('Breakdown by category:');
  for (const [cat, n] of Object.entries(breakdown)) {
    console.log(`  ${cat.padEnd(10)} ${n}`);
  }

  // Token usage estimate
  if (response.usage) {
    const inTokens = response.usage.input_tokens || 0;
    const outTokens = response.usage.output_tokens || 0;
    console.log(`\n💰 Tokens used: ${inTokens} input + ${outTokens} output`);
  }
}

generateTestCases().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
