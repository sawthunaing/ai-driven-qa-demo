// scripts/analyze-failures.js
// Takes test failures from test-results.json and asks Claude to analyze them.
// Writes: failure-analysis.md
//
// Usage:
//   ANTHROPIC_API_KEY=sk-ant-... node scripts/analyze-failures.js

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY environment variable is required.');
  process.exit(1);
}

const client = new Anthropic({ apiKey });
const resultsPath = path.join(__dirname, '..', 'test-results.json');
const analysisPath = path.join(__dirname, '..', 'failure-analysis.md');

async function analyzeFailures() {
  if (!fs.existsSync(resultsPath)) {
    console.error(`❌ Results file not found: ${resultsPath}`);
    console.error('   Run: node scripts/run-tests.js');
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const failures = results.filter((r) => r.status === 'FAIL' || r.status === 'ERROR');

  if (failures.length === 0) {
    console.log('🎉 All tests passed! No failures to analyze.');
    const ok = `# Test Failure Analysis\n\n✅ All tests passed. No failures to analyze.\n\nGenerated: ${new Date().toISOString()}\n`;
    fs.writeFileSync(analysisPath, ok);
    return;
  }

  console.log(`🔍 Analyzing ${failures.length} failure(s) with Claude...\n`);

  const prompt = `You are a senior QA engineer doing root-cause analysis for a Calculator API.

Below are ${failures.length} failed test cases. For EACH failure, provide:

1. **Probable Root Cause** — what's actually going wrong (be specific, reference the actual values)
2. **Severity** — P1 (release blocker), P2 (high), P3 (medium), or P4 (low)
3. **Recommended Fix** — actionable, with code snippet if applicable
4. **Release Decision** — should this block release? Why or why not?

Test failures:

\`\`\`json
${JSON.stringify(failures, null, 2)}
\`\`\`

Output format:

# Test Failure Analysis

Generated: ${new Date().toISOString()}
Total failures: ${failures.length}

## 1. <Test name>

**Root Cause:** ...

**Severity:** P1/P2/P3/P4

**Recommended Fix:**
\`\`\`javascript
// code snippet
\`\`\`

**Release Decision:** Block / Allow with monitoring / Allow

---

(repeat for each failure)

At the end, add an Executive Summary section with:
- Number of blockers
- Recommended action (ship / hold / partial ship)
- Top 3 themes across all failures`;

  const startTime = Date.now();
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  const analysis = response.content[0].text;
  fs.writeFileSync(analysisPath, analysis);

  console.log(`✅ Analysis saved to ${analysisPath} (${elapsed}s)\n`);
  console.log('--- AI ANALYSIS PREVIEW ---\n');
  console.log(analysis.slice(0, 1500));
  if (analysis.length > 1500) {
    console.log('\n... (see failure-analysis.md for full report)');
  }
}

analyzeFailures().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
