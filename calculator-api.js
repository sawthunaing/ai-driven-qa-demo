// calculator-api.js (FIXED VERSION 2.0 - field-specific errors)

const express = require('express');
const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;

// Helper: round to avoid floating-point precision issues
function roundToPrecision(num, decimals = 12) {
  if (!Number.isFinite(num)) return num;
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Helper: check if value is a valid finite number
function isValidNumber(val) {
  return typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val);
}

// Helper: validate a single field (a or b)
function validateNumericField(value, fieldName) {
  if (value === undefined) {
    return { valid: false, error: `Field '${fieldName}' is missing` };
  }
  if (value === null) {
    return { valid: false, error: `Field '${fieldName}' cannot be null` };
  }
  if (typeof value !== 'number') {
    return { valid: false, error: `Field '${fieldName}' must be a number, got ${typeof value}` };
  }
  if (!Number.isFinite(value)) {
    return { valid: false, error: `Field '${fieldName}' must be a finite number` };
  }
  // Check unsafe integers (precision loss beyond Number.MAX_SAFE_INTEGER)
  if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    return { valid: false, error: `Field '${fieldName}' exceeds safe integer range (could cause Infinity overflow)` };
  }
  return { valid: true };
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/v1/calculate', (req, res) => {
  const { a, b, operation } = req.body;

  // ===== Field-specific validation =====
  
  // Validate 'a'
  const aValidation = validateNumericField(a, 'a');
  if (!aValidation.valid) {
    return res.status(400).json({ error: aValidation.error });
  }

  // Validate 'b'
  const bValidation = validateNumericField(b, 'b');
  if (!bValidation.valid) {
    return res.status(400).json({ error: bValidation.error });
  }

  // Validate 'operation'
  if (operation === undefined) {
    return res.status(400).json({ error: "Field 'operation' is missing" });
  }
  if (operation === null) {
    return res.status(400).json({ error: "Field 'operation' cannot be null" });
  }
  if (typeof operation !== 'string') {
    return res.status(400).json({ error: "Field 'operation' must be a string" });
  }

  // ===== Calculation =====
  let result;
  switch (operation) {
    case 'add':
      result = a + b;
      break;
    case 'subtract':
      result = a - b;
      break;
    case 'multiply':
      result = a * b;
      break;
    case 'divide':
      if (b === 0) {
         return res.status(400).json({ error: 'Cannot divide by zero' });
      }
      result = a / b;
      break;
    default:
      return res.status(400).json({ error: `Invalid operation '${operation}'. Allowed: add, subtract, multiply, divide` });
  }

  // ===== Precision Fix =====
  result = roundToPrecision(result);

  // ===== Result Validation =====
  if (!isValidNumber(result)) {
    return res.status(400).json({ error: 'Result is not a valid number (overflow or invalid)' });
  }

  res.json({ result, operation, inputs: { a, b } });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Calculator API running on port ${PORT}`);
  });
}

module.exports = app;