# 🛠️ Setup Guide — Step by Step

This guide walks you through setting up and running the MVP from a clean machine.

## Step 1: Install Node.js (if you don't have it)

Check if Node is installed:

```bash
node --version
```

You should see `v18.x.x` or higher. If not:

- **macOS**: `brew install node` (or download from https://nodejs.org/)
- **Linux (Ubuntu/Debian)**: `sudo apt install nodejs npm`
- **Windows**: Download installer from https://nodejs.org/

## Step 2: Get an Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up (you get $5 free credit on signup — enough for ~100 full runs)
3. Click "API Keys" in the sidebar
4. Create a new key, copy it (starts with `sk-ant-...`)
5. Save it somewhere safe — you can't view it again

## Step 3: Clone or Download the Project

If you have the project as a folder already, skip this. Otherwise:

```bash
git clone <your-repo-url> ai-qa-mvp
cd ai-qa-mvp
```

## Step 4: Install Dependencies

```bash
npm install
```

This installs:

- `express` — for the Calculator API
- `axios` — for the test runner
- `@anthropic-ai/sdk` — for calling Claude
- `js-yaml` — for parsing the OpenAPI spec

You should see a `node_modules/` folder appear. Takes ~30 seconds.

## Step 5: Set Your API Key

### Option A: Export in your shell (temporary, per-session)

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Option B: Use a `.env` file (recommended for development)

Create a file called `.env` in the project root:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Then prefix commands with `dotenv -e .env --` or use a tool like `direnv`.

⚠️ **Never commit your API key to git.** The `.gitignore` already excludes `.env`.

## Step 6: Start the Calculator API

In Terminal 1:

```bash
npm start
```

You should see:

```
Calculator API running on port 3000
```

Test it:

```bash
curl -X POST http://localhost:3000/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"a": 5, "b": 3, "operation": "add"}'
```

Should return:

```json
{"result":8,"operation":"add","inputs":{"a":5,"b":3}}
```

## Step 7: Run the QA Pipeline

In Terminal 2 (with API still running in Terminal 1):

```bash
npm run qa
```

This is the full pipeline:

1. **Generate tests** — Claude reads `calculator-spec.yaml` and produces 25 test cases (~15s)
2. **Run tests** — Each test is executed against the API
3. **Analyze failures** — Any failures get sent back to Claude for root-cause analysis
4. **Generate report** — Beautiful HTML dashboard

You'll see something like:

```
🤖 Asking Claude to generate 25 test cases...
⏱️  AI responded in 12.3s
✅ Generated 25 test cases → generated-tests.json

Breakdown by category:
  positive   8
  boundary   5
  edge       4
  negative   5
  security   3

💰 Tokens used: 1,847 input + 5,234 output

🔍 Checking API health at http://localhost:3000/health ...
✅ API is healthy

📋 Loaded 25 test cases

Running tests...

✅ Add two positive integers
✅ Add zero to positive number
❌ Floating-point precision: 0.1 + 0.2
✅ Subtract larger from smaller (negative result)
...

📊 SUMMARY: 22 passed, 3 failed, 0 errors  (total: 25)
```

## Step 8: View the Report

Open `report.html` in your browser:

```bash
# macOS
open report.html

# Linux
xdg-open report.html

# Windows
start report.html
```

You'll see a clean dashboard with:

- Total / passed / failed / pass rate
- Category breakdown
- Each test case with expandable details
- AI's failure analysis at the bottom

## Step 9: (Optional) Push to GitHub for CI

If you want the GitHub Actions workflow to run:

1. Create a new GitHub repo
2. Push the code:

```bash
git init
git add .
git commit -m "Initial commit: AI-Driven QA MVP"
git remote add origin https://github.com/YOURUSER/ai-qa-mvp.git
git push -u origin main
```

3. Add the secret in GitHub:
   - Go to **Settings → Secrets and variables → Actions**
   - Click **New repository secret**
   - Name: `ANTHROPIC_API_KEY`
   - Value: your API key
   - Save

4. Trigger the workflow:
   - Make any change, commit, push
   - Go to **Actions** tab
   - Watch the workflow run
   - When complete, download the `qa-results` artifact

## Troubleshooting

### "❌ ANTHROPIC_API_KEY environment variable is required"

You forgot to set the key. Run `export ANTHROPIC_API_KEY="sk-ant-..."` first.

### "❌ API not responding at http://localhost:3000"

You forgot to start the API. Run `npm start` in another terminal.

### "❌ Failed to parse AI response as JSON"

Occasionally Claude returns malformed JSON (rare). Just rerun `npm run generate`.

### Tests are all passing — where's the famous bug?

You're using a non-IEEE-754 environment somehow, or Claude generated a test that used a tolerant comparison. Try running again — it usually catches it.

### "Cannot find module '@anthropic-ai/sdk'"

You forgot `npm install`. Run it now.

## Time Estimates

| Task | Time |
|------|------|
| Install Node + clone repo | 5 min |
| `npm install` | 1 min |
| Get API key | 3 min |
| First successful run | 2 min |
| **Total to working demo** | **~10 min** |

## Cost Estimates

Per full `npm run qa`:

- Generate: ~$0.03
- Analyze: ~$0.02
- **Total: ~$0.05**

The free $5 credit on signup gives you ~100 full runs.

## Next Steps

Once it's working:

1. Try modifying `calculator-api.js` to introduce a bug — see if the AI catches it
2. Modify `calculator-spec.yaml` to add a new operation (e.g., `power`) — see the AI generate new tests
3. Try with a more complex API (your own work project!)
4. Build a Loom demo video walking through it for your interview
