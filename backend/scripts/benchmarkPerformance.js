/**
 * benchmarkPerformance.js
 * Measures actual execution latencies (p50, p95, mean, min, max)
 * across core backend algorithms and writes authentic empirical evidence
 * to research-evidence/performance/benchmark-results.csv
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');
const { maskPII } = require('../src/utils/privacyShield');
const { extractFinancialIdentifiers } = require('../src/services/ocrService');
const { lookupThreatClient, isAuthorityDomain } = require('../../web-app/src/data/threatIntel');
const { computeFileSha256 } = require('../src/utils/evidenceSecurity');

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'research-evidence', 'performance');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

async function runBenchmarks() {
  console.log('Running Authentic Latency Benchmarks (50 iterations per operation)...');

  const iterations = 50;
  const results = [];

  // 1. Privacy Shield PII Masking Latency
  const sampleComplaint = `Victim Rajesh Sharma (Aadhaar: 5489 1234 5678, Phone: 9845012345) reported unauthorized fund transfer of INR 45,000 to fraudster@okaxis. Suspect bank account was 10023456789012 and transaction reference UTR was 412345678901. Phishing link received was https://secure-bank-update.xyz/login.`;
  const piiTimes = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    maskPII(sampleComplaint);
    const t1 = performance.now();
    piiTimes.push(t1 - t0);
  }
  results.push({
    operation: 'Privacy Shield PII Masking',
    category: 'Privacy / Sanitization',
    iterations,
    min_ms: Math.min(...piiTimes).toFixed(3),
    p50_ms: percentile(piiTimes, 50).toFixed(3),
    p95_ms: percentile(piiTimes, 95).toFixed(3),
    max_ms: Math.max(...piiTimes).toFixed(3),
    avg_ms: (piiTimes.reduce((a, b) => a + b, 0) / iterations).toFixed(3)
  });

  // 2. OCR Text Analysis & Identifier Extraction
  const sampleOcrText = `Google Pay\nPayment Successful\nPaid to Sharma Enterprises\n₹24,500.00\nUPI transaction ID: 412345678901\nTo: sharma.ent@okaxis\nFrom: Pruthvi Shetty\nState Bank of India Account 918273645012`;
  const ocrTimes = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    extractFinancialIdentifiers(sampleOcrText);
    const t1 = performance.now();
    ocrTimes.push(t1 - t0);
  }
  results.push({
    operation: 'OCR Financial Field Parsing & Forgery Check',
    category: 'Forensic OCR',
    iterations,
    min_ms: Math.min(...ocrTimes).toFixed(3),
    p50_ms: percentile(ocrTimes, 50).toFixed(3),
    p95_ms: percentile(ocrTimes, 95).toFixed(3),
    max_ms: Math.max(...ocrTimes).toFixed(3),
    avg_ms: (ocrTimes.reduce((a, b) => a + b, 0) / iterations).toFixed(3)
  });

  // 3. Cryptographic SHA-256 Hashing of Evidence Buffer
  const dummyEvidenceBuffer = Buffer.alloc(1024 * 1024 * 2); // 2 MB digital evidence
  crypto.randomFillSync(dummyEvidenceBuffer);
  const hashTimes = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    const hash = crypto.createHash('sha256').update(dummyEvidenceBuffer).digest('hex');
    const t1 = performance.now();
    hashTimes.push(t1 - t0);
  }
  results.push({
    operation: 'Evidence Cryptographic Intake (2MB SHA-256)',
    category: 'Forensic Integrity',
    iterations,
    min_ms: Math.min(...hashTimes).toFixed(3),
    p50_ms: percentile(hashTimes, 50).toFixed(3),
    p95_ms: percentile(hashTimes, 95).toFixed(3),
    max_ms: Math.max(...hashTimes).toFixed(3),
    avg_ms: (hashTimes.reduce((a, b) => a + b, 0) / iterations).toFixed(3)
  });

  // 4. Threat Intelligence Engine Match & Boundary Check
  const threatQueries = [
    'https://www.google.com/search?q=cybercrime',
    'paytm-kyc-update.com',
    '+91 98000 00001',
    'fast.loan.approval@paytm',
    'unknown-clean-domain-portal.edu'
  ];
  const threatTimes = [];
  for (let i = 0; i < iterations; i++) {
    const q = threatQueries[i % threatQueries.length];
    const t0 = performance.now();
    lookupThreatClient(q);
    const t1 = performance.now();
    threatTimes.push(t1 - t0);
  }
  results.push({
    operation: 'Threat Intelligence Lookup & Matching',
    category: 'Threat Intelligence',
    iterations,
    min_ms: Math.min(...threatTimes).toFixed(3),
    p50_ms: percentile(threatTimes, 50).toFixed(3),
    p95_ms: percentile(threatTimes, 95).toFixed(3),
    max_ms: Math.max(...threatTimes).toFixed(3),
    avg_ms: (threatTimes.reduce((a, b) => a + b, 0) / iterations).toFixed(3)
  });

  // Output CSV
  const header = 'operation,category,iterations,min_ms,p50_ms,p95_ms,max_ms,avg_ms\n';
  const rows = results.map(r => `"${r.operation}","${r.category}",${r.iterations},${r.min_ms},${r.p50_ms},${r.p95_ms},${r.max_ms},${r.avg_ms}`).join('\n');
  const csvPath = path.join(OUTPUT_DIR, 'benchmark-results.csv');
  fs.writeFileSync(csvPath, header + rows + '\n');

  console.log(`[+] Saved performance benchmark results to ${csvPath}`);
  console.table(results);
}

runBenchmarks().catch(console.error);
