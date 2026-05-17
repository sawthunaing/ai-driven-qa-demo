# 🎤 Interview Demo Script

This document is your script for demoing the MVP during an interview. Use it as a guide — adapt the wording to feel natural for you.

## When to bring this up

**Don't bring it up first.** Let the conversation flow naturally. The right moments are:

1. When the interviewer asks: *"What are your thoughts on AI in QA?"*
2. When asked: *"Tell me about a project you're proud of."*
3. When asked: *"How would you approach automation for our platform?"*
4. At the end, when asked: *"Do you have anything else to show us?"*

## The pitch (90 seconds)

> *"In preparation for this interview, I built a working MVP that demonstrates how I'd approach AI-augmented QA in practice. Let me show you.*
>
> *It's a simple Node.js Calculator API — but the QA framework around it is what's interesting. I have an OpenAPI specification of the API, and I built a pipeline that does four things automatically:*
>
> *First, it sends the spec to Claude and asks for comprehensive test cases — positive flows, boundary values, edge cases, security tests. That generates 25 test cases in about 15 seconds. Designing those manually would take 2-3 hours.*
>
> *Second, a Node.js runner executes those test cases against the API and records results.*
>
> *Third, any failures get sent back to Claude for root-cause analysis. The AI suggests probable causes, severity, and recommended fixes.*
>
> *Fourth, everything runs in GitHub Actions on every PR, with results posted as a comment.*
>
> *The interesting thing is what happens when you run it. The AI consistently catches the floating-point precision bug — `0.1 + 0.2` doesn't equal `0.3` in JavaScript — which most human-written tests miss. That's the kind of edge case that distinguishes good QA from great QA, and AI makes great QA cheap.*
>
> *I'd happily share the GitHub repo, and I built this in about 8 hours of focused work over a weekend. The principles scale to a real platform like ThitsaWorks' — though for fintech you'd layer in domain-specific concerns like signature validation, mTLS, and reconciliation that AI doesn't handle alone."*

## If they want a live demo (2 minutes)

Open your terminal and walk through:

### Show the structure

```bash
ls -la
```

Point to: `calculator-api.js`, `calculator-spec.yaml`, `scripts/`, `.github/workflows/qa.yml`

### Show the spec

```bash
cat calculator-spec.yaml
```

Say: *"This is the OpenAPI spec. The AI reads this to understand what to test."*

### Show the generator code briefly

```bash
cat scripts/generate-tests.js | head -50
```

Say: *"The prompt is the key part. I'm telling Claude to generate test cases across five specific categories with a strict JSON schema."*

### Run the pipeline live

```bash
# Terminal 1
npm start
```

```bash
# Terminal 2
npm run qa
```

Narrate as it runs: *"AI is generating tests now... and now they're running against the API... that one failure is the floating-point bug I mentioned... now the AI is analyzing it..."*

### Show the HTML report

```bash
open report.html
```

Walk through: stats at top, category breakdown, individual results, AI analysis at the bottom.

### Show the GitHub Actions workflow

Open `.github/workflows/qa.yml` and point out: *"This same flow runs on every PR. The AI regenerates tests from the latest spec automatically, so spec changes don't break the test suite — they produce new tests."*

## Anticipated questions

### "How long did this take you?"

> *"About 8 hours over a weekend. Most of that was iterating on the prompt to get reliable JSON output — the actual code is straightforward. The first version worked in about 3 hours; the rest was polish — error handling, reporting, CI integration."*

### "What about test maintenance? When the API changes?"

> *"That's the elegant part. Tests are regenerated from the spec on every CI run. If the spec changes — say, a new operation is added — the next run produces new test cases automatically. No manual maintenance. The traditional test maintenance problem largely goes away."*

### "But what if the AI generates bad tests?"

> *"Real concern. Two safeguards. First, the AI works from a structured prompt with explicit schema requirements — that constrains output. Second, human review is still part of the workflow. I treat the AI as a senior pair-programmer, not a senior author. In this MVP I auto-merge generated tests; in production I'd have a human approve generated tests before they become part of the regression suite."*

### "What about business logic that's not in the spec?"

> *"That's the right question, and it's the main limitation. AI generates tests for what the spec says. If your business rule is 'VIP customers get 0% FX fee' and that's not in the API spec, the AI won't test it. So you still need a human-authored test suite for business logic. AI handles the boring 80% — input validation, boundaries, common edge cases — and humans focus on the interesting 20% where domain knowledge matters."*

### "How would you scale this for our payment platform?"

> *"Three additions. First, multi-tenant config — you have multiple client deployments with slight variations, so I'd add per-client config files and run the same test suite in a CI matrix across all of them. Second, fintech-specific test categories the AI doesn't know — JWS signing, mTLS handshake, certificate rotation, reconciliation. Those need human-authored test packs. Third, performance and resilience testing with k6 or JMeter — AI can help generate scenarios from production telemetry, but the harness is more specialized. I'd build all of this in roughly the same shape: AI generates where it can, humans author where domain depth matters, CI orchestrates."*

### "What's the cost?"

> *"For this MVP, about 5 cents per full run. At a team doing 50 PRs a week, that's roughly $10 a month in API costs. Compared to QA engineer time saved, that's not even a rounding error."*

### "What didn't work? Show me where it broke."

> *"Two real issues. First, JSON parsing — Claude occasionally returns markdown-wrapped JSON despite explicit instructions not to. I added defensive stripping of markdown fences. Second, prompt engineering — my first version generated boring tests. The output got dramatically better when I explicitly asked for 'tests across these five categories' rather than just 'comprehensive tests.' Specificity in the prompt drives quality."*

### "Could you build something like this for us?"

> *"Yes. The core pattern transfers directly. For ThitsaWorks specifically, I'd start with one of your existing APIs as a pilot, run a 90-day measurement period — productivity, defect leakage, team adoption — and then expand based on results. I wouldn't recommend rolling this out to all your APIs day one. Incremental adoption with measurement is how you avoid the failure modes."*

## Closing line

If the demo went well, end with:

> *"Building this was genuinely fun. It clarified for me that QA leadership in the AI era is the work I want to be doing — not because AI replaces the QA function, but because it dramatically expands what a small team can accomplish. I think ThitsaWorks is at exactly the right size and stage for this approach to compound quickly."*

## Backup plan if demo fails

If the demo breaks live (network issue, API key issue, anything):

> *"It's running smoothly on my own machine — let me share the GitHub link and you can see the most recent successful run as an artifact in the Actions tab. Live demos are always a risk, but the artifacts on GitHub show exactly what the pipeline produces."*

Then move on. Don't waste interview time debugging.

## The most important thing

**Don't over-rehearse this.** The goal is to *show your thinking and your work*, not to recite a script. Adapt the words. Pause naturally. If they interrupt with questions, follow their interest rather than completing your script. The demo is a conversation, not a performance.

Good luck. 🚀
