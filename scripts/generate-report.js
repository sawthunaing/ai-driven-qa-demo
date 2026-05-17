// scripts/generate-report.js
// Generates a visual HTML report from test-results.json
// Output: report.html

const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, '..', 'test-results.json');
const analysisPath = path.join(__dirname, '..', 'failure-analysis.md');
const reportPath = path.join(__dirname, '..', 'report.html');

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateReport() {
  if (!fs.existsSync(resultsPath)) {
    console.error('❌ test-results.json not found. Run tests first.');
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const errors = results.filter((r) => r.status === 'ERROR').length;
  const total = results.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  // Category breakdown
  const categories = {};
  for (const r of results) {
    const cat = r.category || 'uncategorized';
    if (!categories[cat]) categories[cat] = { pass: 0, fail: 0, error: 0 };
    if (r.status === 'PASS') categories[cat].pass++;
    else if (r.status === 'FAIL') categories[cat].fail++;
    else categories[cat].error++;
  }

  let analysisHtml = '';
  if (fs.existsSync(analysisPath)) {
    const md = fs.readFileSync(analysisPath, 'utf8');
    analysisHtml = `<section class="analysis"><h2>🤖 AI Failure Analysis</h2><pre>${escapeHtml(md)}</pre></section>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AI-Driven QA Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f7fa; color: #1a202c; padding: 24px; }
  .container { max-width: 1200px; margin: 0 auto; }
  header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 32px; border-radius: 12px; margin-bottom: 24px; }
  header h1 { font-size: 28px; margin-bottom: 8px; }
  header p { opacity: 0.9; font-size: 14px; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .stat .value { font-size: 36px; font-weight: bold; margin: 8px 0; }
  .stat .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #718096; }
  .stat.pass .value { color: #38a169; }
  .stat.fail .value { color: #e53e3e; }
  .stat.error .value { color: #d69e2e; }
  .stat.total .value { color: #3182ce; }
  section { background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  h2 { font-size: 20px; margin-bottom: 16px; color: #2d3748; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 12px; background: #f7fafc; font-weight: 600; color: #4a5568; border-bottom: 2px solid #e2e8f0; }
  td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
  tr:hover { background: #f7fafc; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .badge.pass { background: #c6f6d5; color: #22543d; }
  .badge.fail { background: #fed7d7; color: #742a2a; }
  .badge.error { background: #feebc8; color: #7b341e; }
  .category { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; background: #edf2f7; color: #4a5568; }
  details { margin: 8px 0; }
  summary { cursor: pointer; color: #3182ce; font-size: 12px; }
  pre { background: #1a202c; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; font-family: 'SF Mono', Monaco, Consolas, monospace; white-space: pre-wrap; word-wrap: break-word; }
  .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
  .cat-card { background: #f7fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #3182ce; }
  .cat-card h3 { font-size: 14px; text-transform: capitalize; margin-bottom: 8px; }
  .cat-card .nums { font-size: 12px; color: #718096; }
  .footer { text-align: center; padding: 24px; color: #718096; font-size: 12px; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>🤖 AI-Driven QA Report</h1>
    <p>Calculator API · Generated ${new Date().toISOString()}</p>
  </header>

  <div class="stats">
    <div class="stat total"><div class="label">Total Tests</div><div class="value">${total}</div></div>
    <div class="stat pass"><div class="label">Passed</div><div class="value">${passed}</div></div>
    <div class="stat fail"><div class="label">Failed</div><div class="value">${failed}</div></div>
    <div class="stat error"><div class="label">Errors</div><div class="value">${errors}</div></div>
    <div class="stat total"><div class="label">Pass Rate</div><div class="value">${passRate}%</div></div>
  </div>

  <section>
    <h2>Categories</h2>
    <div class="category-grid">
      ${Object.entries(categories).map(([cat, n]) => `
        <div class="cat-card">
          <h3>${cat}</h3>
          <div class="nums">✅ ${n.pass} · ❌ ${n.fail} · 💥 ${n.error}</div>
        </div>
      `).join('')}
    </div>
  </section>

  <section>
    <h2>Test Results</h2>
    <table>
      <thead>
        <tr><th>Status</th><th>Category</th><th>Test Name</th><th>Request</th><th>Details</th></tr>
      </thead>
      <tbody>
        ${results.map((r) => `
          <tr>
            <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
            <td><span class="category">${r.category || '-'}</span></td>
            <td>${escapeHtml(r.test_name)}</td>
            <td><code style="font-size:11px;">${escapeHtml(JSON.stringify(r.request))}</code></td>
            <td>
              <details>
                <summary>view</summary>
                <pre>${escapeHtml(JSON.stringify({ expected: r.expected, actual: r.actual, error: r.error }, null, 2))}</pre>
              </details>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </section>

  ${analysisHtml}

  <div class="footer">
    Generated by AI-Driven QA MVP · Built with Claude API + Node.js
  </div>
</div>
</body>
</html>`;

  fs.writeFileSync(reportPath, html);
  console.log(`✅ Report generated: ${reportPath}`);
}

generateReport();
