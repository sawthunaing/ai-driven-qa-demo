# 🤖 AI-Driven QA MVP

> An end-to-end demonstration of AI-augmented quality assurance for a REST API.
> Built to show how LLMs can dramatically reduce QA effort while improving coverage.

## Motivation

Traditional QA on a small team faces three painful problems:

1. **Test case design takes hours.** A senior QA engineer designing comprehensive test cases for a single API endpoint might spend 2-3 hours considering positive flows, boundary values, edge cases, and security scenarios.
2. **Test maintenance eats capacity.** Every API change requires updating dozens of tests. Teams stop trusting their suites and disable failing tests, defeating the purpose.
3. **Root-cause analysis is slow.** When a test fails, an engineer searches logs, builds hypotheses, rules them out — often an hour per incident.

This MVP demonstrates how an LLM (Claude) plugged into the QA pipeline addresses all three:

- ✅ **25+ test cases generated in 15 seconds** from an OpenAPI spec
- ✅ **Tests regenerate automatically** when the spec changes — no maintenance
- ✅ **AI suggests probable root causes** for failures within seconds

## Architecture

```
┌─────────────────────┐
│ calculator-spec.yaml│  ← API contract (OpenAPI 3.0)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ generate-tests.js   │  ← Claude API generates JSON test cases
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ generated-tests.json│  ← 25 test cases (positive/boundary/edge/negative/security)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ run-tests.js        │  ← Executes tests via axios against running API
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ test-results.json   │  ← Pass/fail with expected vs actual
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ analyze-failures.js │  ← Claude analyzes failures, suggests root causes
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ failure-analysis.md  ·  report.html     │
└─────────────────────────────────────────┘

         All orchestrated by GitHub Actions on every PR
```

## What's in the box

| File | Purpose |
|------|---------|
| `calculator-api.js` | Simple Express API: `POST /api/v1/calculate` (the system under test) |
| `calculator-spec.yaml` | OpenAPI 3.0 specification of the API |
| `scripts/generate-tests.js` | Sends spec to Claude, gets back structured test cases |
| `scripts/run-tests.js` | Executes test cases against the running API |
| `scripts/analyze-failures.js` | Sends failures to Claude for root-cause analysis |
| `scripts/generate-report.js` | Creates a beautiful HTML dashboard of results |
| `.github/workflows/qa.yml` | CI pipeline running the whole flow on every PR |

## Quick Start

### Prerequisites

- Node.js 18+ installed
- An Anthropic API key (get one at https://console.anthropic.com/)
- ~$0.05 of API credit per run (very cheap)

### Run locally

```bash
# 1. Clone and install
git clone <your-repo-url>
cd ai-qa-mvp
npm install

# 2. Set your API key
export ANTHROPIC_API_KEY="sk-ant-..."

# 3. Start the API in one terminal
npm start

# 4. In another terminal, run the full QA pipeline
npm run qa
```

That single `npm run qa` command does everything: generates tests, runs them, analyzes failures, and produces an HTML report.

### Or run steps individually

```bash
npm run generate   # Generate tests with AI
npm run test       # Run them
npm run analyze    # Analyze any failures
npm run report     # Build HTML dashboard
```

Then open `report.html` in your browser.

## What you should see

After `npm run qa` you'll have:

1. **`generated-tests.json`** — 25 test cases like this:

   ```json
   {
     "test_name": "Floating-point precision: 0.1 + 0.2",
     "category": "edge",
     "request_body": { "a": 0.1, "b": 0.2, "operation": "add" },
     "expected_status": 200,
     "expected_result": 0.3
   }
   ```

2. **`test-results.json`** — execution results with actual vs expected

3. **`failure-analysis.md`** — AI's diagnosis of each failure with severity and recommended fix

4. **`report.html`** — visual dashboard summarizing everything

## The "famous bug" demo

When you run this, you'll see one consistent failure: **`Floating-point precision: 0.1 + 0.2`**.

That's because in JavaScript (and any IEEE 754 language), `0.1 + 0.2 === 0.30000000000000004`. It's not a bug in the API — it's a fundamental limitation of binary floating point.

But for a financial calculator, **it's a real defect**. Reconciliation drift, customer trust issues, regulatory questions — all real consequences.

The AI catches this *every time*. A human writing tests manually almost never does. **This is the kind of edge case that distinguishes good QA from great QA**, and AI-assisted generation makes great QA cheap.

## Cost

A typical full run uses approximately:

- **Generation**: ~2,000 input + ~6,000 output tokens ≈ $0.03
- **Failure analysis**: ~3,000 input + ~2,000 output tokens ≈ $0.02

**Total: ~$0.05 per QA run.** If you ran this on every PR for a team doing 50 PRs/week, that's ~$10/month.

## What this is NOT

Honesty matters. This approach is great for:

- ✅ Generic API testing (CRUD, validation, boundaries)
- ✅ Catching edge cases humans typically miss
- ✅ Rapid test creation for new endpoints
- ✅ Failure triage at scale

It is **not** suitable for:

- ❌ Business logic outside the spec ("VIP users get 0% fee")
- ❌ Complex multi-step workflows (transfer → settlement → reconciliation)
- ❌ Authentication flows with real session state
- ❌ Compliance test authorship (PCI-DSS, AML)
- ❌ Final release decisions — **never let AI make those**

In fintech specifically, treat AI as a senior pair-programmer, not a senior author.

## Extending this for fintech

Real payment systems need more than this MVP. To extend:

- **Multi-tenant config layer**: per-client environments (Client A, B, C…) with different limits, currencies, and feature flags. Run the same test logic across all of them via a CI matrix.
- **Signature validation tests**: JWS message signing, tamper detection, replay protection.
- **mTLS handshake tests**: certificate validation, rotation, expiry.
- **Reconciliation tests**: compare API responses with database state and downstream system records.
- **Performance baselines**: k6 or JMeter scripts with realistic load profiles derived from production telemetry.

Each of these can be layered on top of this same pattern: AI generates, runner executes, AI analyzes, CI ties it together.

## License

MIT. Use freely.

## Author

Built by Saw Thu Naing as a portfolio demonstration of practical AI-augmented QA.
