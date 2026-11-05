/**
 * evaluatePrivacyAndOCR.js
 * Ground-truth evaluation of Privacy Shield PII Masking and OCR Financial Field Extraction
 * Outputs authentic empirical results to research-evidence/privacy-evaluation/ and research-evidence/ocr-evaluation/
 */

const fs = require('fs');
const path = require('path');
const { maskPII } = require('../src/utils/privacyShield');
const { extractFinancialIdentifiers } = require('../src/services/ocrService');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PRIVACY_DIR = path.join(ROOT_DIR, 'research-evidence', 'privacy-evaluation');
const OCR_DIR = path.join(ROOT_DIR, 'research-evidence', 'ocr-evaluation');

fs.mkdirSync(PRIVACY_DIR, { recursive: true });
fs.mkdirSync(OCR_DIR, { recursive: true });

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PRIVACY SHIELD PII EVALUATION DATASET (GROUND TRUTH)
// ─────────────────────────────────────────────────────────────────────────────
const PII_TEST_CASES = [
  // Phone numbers
  { id: 'PHONE_01', text: 'Call me on 9845012345 immediately for clarification.', type: 'PHONE', target: '9845012345' },
  { id: 'PHONE_02', text: 'Suspect reached out from +91 9123456789 on WhatsApp.', type: 'PHONE', target: '+91 9123456789' },
  { id: 'PHONE_03', text: 'Alternate contact provided was 08012345678.', type: 'PHONE', target: '08012345678' },
  { id: 'PHONE_04', text: 'My mobile number is 98765-43210.', type: 'PHONE', target: '98765-43210' },

  // Email addresses
  { id: 'EMAIL_01', text: 'Phishing notice sent from security-alert@customer-bank-update.com.', type: 'EMAIL', target: 'security-alert@customer-bank-update.com' },
  { id: 'EMAIL_02', text: 'Official correspondence copied to victim.john@enterprise.co.in.', type: 'EMAIL', target: 'victim.john@enterprise.co.in' },
  { id: 'EMAIL_03', text: 'Forward proof to dispute+fraud99@service.gov.in.', type: 'EMAIL', target: 'dispute+fraud99@service.gov.in' },

  // UPI IDs
  { id: 'UPI_01', text: 'Sent payment of Rs 15000 to merchant.quick@okaxis.', type: 'UPI_ID', target: 'merchant.quick@okaxis' },
  { id: 'UPI_02', text: 'Complainant transferred funds to cyberfraud99@ybl.', type: 'UPI_ID', target: 'cyberfraud99@ybl' },
  { id: 'UPI_03', text: 'UPI VPA listed was 9845012345@paytm.', type: 'UPI_ID', target: '9845012345@paytm' },

  // Bank Accounts
  { id: 'BANK_01', text: 'Transferred money to account number 10023456789012 at SBI.', type: 'BANK_ACCOUNT', target: '10023456789012' },
  { id: 'BANK_02', text: 'Beneficiary a/c no: 918273645012345 with HDFC.', type: 'BANK_ACCOUNT', target: '918273645012345' },
  { id: 'BANK_03', text: 'Deposited into bank account 50100293847561.', type: 'BANK_ACCOUNT', target: '50100293847561' },

  // Aadhaar
  { id: 'AADHAAR_01', text: 'Complainant verified identity with Aadhaar 5489 1234 5678.', type: 'AADHAAR', target: '5489 1234 5678' },
  { id: 'AADHAAR_02', text: 'Aadhaar number presented was 9876-5432-1098.', type: 'AADHAAR', target: '9876-5432-1098' },

  // PAN
  { id: 'PAN_01', text: 'Income tax refund claim referenced PAN ABCDE1234F.', type: 'PAN', target: 'ABCDE1234F' },
  { id: 'PAN_02', text: 'Suspect PAN card submitted as BKZPS9876Q.', type: 'PAN', target: 'BKZPS9876Q' },

  // Credit Cards
  { id: 'CC_01', text: 'Compromised Visa card 4532 1198 7654 3210 was debited.', type: 'CREDIT_CARD', target: '4532 1198 7654 3210' },

  // Person / Names
  { id: 'PERSON_01', text: 'Complainant: Rajesh Sharma reported unauthorized debit.', type: 'PERSON', target: 'Rajesh Sharma' },
  { id: 'PERSON_02', text: 'Caller introduced himself saying My name is Vikram Malhotra.', type: 'PERSON', target: 'Vikram Malhotra' },

  // URLs
  { id: 'URL_01', text: 'Victim was told to click https://secure-icici-update.com/login.html.', type: 'URL', target: 'https://secure-icici-update.com/login.html' },
  { id: 'URL_02', text: 'Phishing domain was www.verify-netbanking-alert.net/auth.', type: 'URL', target: 'www.verify-netbanking-alert.net/auth' },

  // Negative Controls (Texts without PII that must NOT produce false positives)
  { id: 'NEG_01', text: 'The incident occurred at around 14:30 hours in broad daylight.', type: 'NEGATIVE_CONTROL', target: null },
  { id: 'NEG_02', text: 'Website returned HTTP 404 error code and server error 502.', type: 'NEGATIVE_CONTROL', target: null },
  { id: 'NEG_03', text: 'The dispute was filed under section 66C and 66D of the IT Act 2000.', type: 'NEGATIVE_CONTROL', target: null },
  { id: 'NEG_04', text: 'Amount lost was approximately 45000 Indian Rupees in total.', type: 'NEGATIVE_CONTROL', target: null },
  { id: 'NEG_05', text: 'The application package version was release 2.4.15 build 908.', type: 'NEGATIVE_CONTROL', target: null },
];

function runPrivacyEvaluation() {
  console.log('\n--- EVALUATING PRIVACY SHIELD (PII MASKING) ---');

  const testCasesCsvRows = [
    'id,input_text,expected_pii_type,expected_target,detected_pii_types,is_masked,result'
  ];

  const typeMetrics = {};

  PII_TEST_CASES.forEach(tc => {
    const res = maskPII(tc.text);
    const detectedTypes = res.detected.map(d => d.type);
    const isMasked = res.masked !== tc.text;

    let success = false;
    if (tc.type === 'NEGATIVE_CONTROL') {
      success = res.detected.length === 0;
    } else {
      success = detectedTypes.includes(tc.type);
    }

    testCasesCsvRows.push([
      escapeCsv(tc.id),
      escapeCsv(tc.text),
      escapeCsv(tc.type),
      escapeCsv(tc.target || 'NONE'),
      escapeCsv(detectedTypes.join('|') || 'NONE'),
      escapeCsv(isMasked),
      escapeCsv(success ? 'PASS' : 'FAIL')
    ].join(','));

    // Track per-type ground-truth metrics
    const cat = tc.type;
    if (!typeMetrics[cat]) {
      typeMetrics[cat] = { total: 0, tp: 0, fp: 0, fn: 0 };
    }
    typeMetrics[cat].total += 1;
    if (tc.type === 'NEGATIVE_CONTROL') {
      if (res.detected.length > 0) {
        typeMetrics[cat].fp += res.detected.length;
      } else {
        typeMetrics[cat].tp += 1;
      }
    } else {
      if (detectedTypes.includes(tc.type)) {
        typeMetrics[cat].tp += 1;
      } else {
        typeMetrics[cat].fn += 1;
      }
    }
  });

  fs.writeFileSync(path.join(PRIVACY_DIR, 'test-cases.csv'), testCasesCsvRows.join('\n'));

  // Compile evaluation results table
  const resultsCsvRows = [
    'pii_type,total_samples,true_positives,false_negatives,false_positives,precision,recall,f1_score'
  ];

  let totalTP = 0;
  let totalFP = 0;
  let totalFN = 0;

  Object.keys(typeMetrics).forEach(cat => {
    const m = typeMetrics[cat];
    const precision = m.tp + m.fp > 0 ? (m.tp / (m.tp + m.fp)) : 1.0;
    const recall = m.tp + m.fn > 0 ? (m.tp / (m.tp + m.fn)) : 1.0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0.0;

    totalTP += m.tp;
    totalFP += m.fp;
    totalFN += m.fn;

    resultsCsvRows.push([
      escapeCsv(cat),
      m.total,
      m.tp,
      m.fn,
      m.fp,
      precision.toFixed(4),
      recall.toFixed(4),
      f1.toFixed(4)
    ].join(','));

    console.log(`  ${cat.padEnd(18)}: Precision=${precision.toFixed(4)} Recall=${recall.toFixed(4)} F1=${f1.toFixed(4)}`);
  });

  const overallPrecision = totalTP + totalFP > 0 ? totalTP / (totalTP + totalFP) : 1.0;
  const overallRecall = totalTP + totalFN > 0 ? totalTP / (totalTP + totalFN) : 1.0;
  const overallF1 = (2 * overallPrecision * overallRecall) / (overallPrecision + overallRecall);

  resultsCsvRows.push([
    escapeCsv('OVERALL_SUMMARY'),
    PII_TEST_CASES.length,
    totalTP,
    totalFN,
    totalFP,
    overallPrecision.toFixed(4),
    overallRecall.toFixed(4),
    overallF1.toFixed(4)
  ].join(','));

  fs.writeFileSync(path.join(PRIVACY_DIR, 'evaluation-results.csv'), resultsCsvRows.join('\n'));
  console.log(`[+] Saved privacy-evaluation/test-cases.csv and evaluation-results.csv`);
  console.log(`  Overall Privacy Shield F1-Score: ${overallF1.toFixed(4)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. OCR FINANCIAL IDENTIFIER & FORGERY EVALUATION DATASET
// ─────────────────────────────────────────────────────────────────────────────
const OCR_TEST_CASES = [
  {
    id: 'RECEIPT_GPAY_01',
    source: 'Google Pay Official Payment Confirmation Screenshot',
    text: `Google Pay
Payment to Sharma Enterprises
₹24,500.00
Paid successfully
UPI transaction ID: 412345678901
To: sharma.ent@okaxis
From: Pruthvi Shetty (State Bank of India)
Google transaction ID: CICAgODV_7y0Ww`,
    expected: {
      phones: [],
      upis: ['sharma.ent@okaxis'],
      utrs: ['412345678901'],
      amounts: [24500],
      app: 'Google Pay',
      verdict: 'AUTHENTIC_RECEIPT'
    }
  },
  {
    id: 'RECEIPT_PHONEPE_02',
    source: 'PhonePe Transaction Receipt Screenshot',
    text: `PhonePe
Transaction Successful
Paid to
+91 9845012345
₹5,200
Debit from Bank Account: 109283746501
UTR: 329182736450
Txn ID: T240815123456789
Powered by YES Bank (ybl)`,
    expected: {
      phones: ['9845012345'],
      upis: [],
      utrs: ['329182736450'],
      amounts: [5200],
      app: 'PhonePe',
      verdict: 'AUTHENTIC_RECEIPT'
    }
  },
  {
    id: 'RECEIPT_PAYTM_03',
    source: 'Paytm Money Transfer Screen',
    text: `Paytm Payments Bank
Money Sent Successfully
₹15,000
To: scammer.shop@paytm
UPI Ref No: 429384756102
Account: 918273645012
State Bank of India`,
    expected: {
      phones: [],
      upis: ['scammer.shop@paytm'],
      utrs: ['429384756102'],
      amounts: [15000],
      app: 'Paytm',
      verdict: 'AUTHENTIC_RECEIPT'
    }
  },
  {
    id: 'RECEIPT_SPOOF_04',
    source: 'Spoof FakePay APK Generated Fraudulent Receipt',
    text: `FakePay Simulator Receipt
Paid Successfully
To: Merchant Store
₹50,000.00
demo transaction
prank payment generator v2`,
    expected: {
      phones: [],
      upis: [],
      utrs: [],
      amounts: [50000],
      app: null,
      verdict: 'SUSPECT_TAMPERING'
    }
  },
  {
    id: 'RECEIPT_HIGH_VAL_MISSING_RRN_05',
    source: 'High-Value Claimed Payment without Bank UTR',
    text: `Payment Completed
₹75,000
Transferred to Rohit Verma
Payment Done Successfully
No RRN Provided`,
    expected: {
      phones: [],
      upis: [],
      utrs: [],
      amounts: [75000],
      app: null,
      verdict: 'SUSPECT_TAMPERING'
    }
  },
  {
    id: 'RECEIPT_BHIM_06',
    source: 'BHIM UPI Transfer Docket',
    text: `BHIM Unified Payments Interface
Transaction Status: Successful
₹1,500.00
Sent to: support@bhim
NPCI Reference ID: 498765432109
From Account: 201928374651`,
    expected: {
      phones: [],
      upis: ['support@bhim'],
      utrs: ['498765432109'],
      amounts: [1500],
      app: 'BHIM / NPCI',
      verdict: 'AUTHENTIC_RECEIPT'
    }
  }
];

function runOcrEvaluation() {
  console.log('\n--- EVALUATING OCR FINANCIAL EXTRACTION & FORGERY ANALYSIS ---');

  const datasetCsvRows = [
    'sample_id,source,raw_text,expected_phones,expected_upis,expected_utrs,expected_amounts,expected_app,expected_verdict'
  ];

  OCR_TEST_CASES.forEach(tc => {
    datasetCsvRows.push([
      escapeCsv(tc.id),
      escapeCsv(tc.source),
      escapeCsv(tc.text.replace(/\n/g, ' ')),
      escapeCsv(tc.expected.phones.join(';')),
      escapeCsv(tc.expected.upis.join(';')),
      escapeCsv(tc.expected.utrs.join(';')),
      escapeCsv(tc.expected.amounts.join(';')),
      escapeCsv(tc.expected.app || 'NONE'),
      escapeCsv(tc.expected.verdict)
    ].join(','));
  });

  fs.writeFileSync(path.join(OCR_DIR, 'evaluation-dataset.csv'), datasetCsvRows.join('\n'));

  // Evaluate extraction per field across test set
  const fieldStats = {
    phones: { ground_truth: 0, extracted_correct: 0, fp: 0, fn: 0 },
    upis: { ground_truth: 0, extracted_correct: 0, fp: 0, fn: 0 },
    utrs: { ground_truth: 0, extracted_correct: 0, fp: 0, fn: 0 },
    amounts: { ground_truth: 0, extracted_correct: 0, fp: 0, fn: 0 },
    detectedApps: { ground_truth: 0, extracted_correct: 0, fp: 0, fn: 0 },
    forgeryVerdict: { ground_truth: 0, extracted_correct: 0, fp: 0, fn: 0 }
  };

  OCR_TEST_CASES.forEach(tc => {
    const res = extractFinancialIdentifiers(tc.text);

    // Phones
    tc.expected.phones.forEach(p => {
      fieldStats.phones.ground_truth++;
      if (res.phones.includes(p)) fieldStats.phones.extracted_correct++;
      else fieldStats.phones.fn++;
    });
    res.phones.forEach(p => {
      if (!tc.expected.phones.includes(p)) fieldStats.phones.fp++;
    });

    // UPIs
    tc.expected.upis.forEach(u => {
      fieldStats.upis.ground_truth++;
      if (res.upis.includes(u.toLowerCase())) fieldStats.upis.extracted_correct++;
      else fieldStats.upis.fn++;
    });
    res.upis.forEach(u => {
      if (!tc.expected.upis.includes(u)) fieldStats.upis.fp++;
    });

    // UTRs
    tc.expected.utrs.forEach(u => {
      fieldStats.utrs.ground_truth++;
      if (res.utrs.includes(u)) fieldStats.utrs.extracted_correct++;
      else fieldStats.utrs.fn++;
    });
    res.utrs.forEach(u => {
      if (!tc.expected.utrs.includes(u)) fieldStats.utrs.fp++;
    });

    // Amounts
    tc.expected.amounts.forEach(a => {
      fieldStats.amounts.ground_truth++;
      if (res.amounts.includes(a)) fieldStats.amounts.extracted_correct++;
      else fieldStats.amounts.fn++;
    });
    res.amounts.forEach(a => {
      if (!tc.expected.amounts.includes(a)) fieldStats.amounts.fp++;
    });

    // App detection
    if (tc.expected.app) {
      fieldStats.detectedApps.ground_truth++;
      if (res.detectedApps.includes(tc.expected.app)) fieldStats.detectedApps.extracted_correct++;
      else fieldStats.detectedApps.fn++;
    }

    // Forgery verdict
    fieldStats.forgeryVerdict.ground_truth++;
    if (res.forgeryAnalysis.verdict === tc.expected.verdict) {
      fieldStats.forgeryVerdict.extracted_correct++;
    } else {
      fieldStats.forgeryVerdict.fn++;
    }
  });

  const ocrResultsCsv = [
    'field,total_ground_truth,correctly_extracted,false_positives,false_negatives,precision,recall,f1_score'
  ];

  Object.keys(fieldStats).forEach(field => {
    const s = fieldStats[field];
    const precision = (s.extracted_correct + s.fp) > 0 ? (s.extracted_correct / (s.extracted_correct + s.fp)) : 1.0;
    const recall = s.ground_truth > 0 ? (s.extracted_correct / s.ground_truth) : 1.0;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0.0;

    ocrResultsCsv.push([
      escapeCsv(field),
      s.ground_truth,
      s.extracted_correct,
      s.fp,
      s.fn,
      precision.toFixed(4),
      recall.toFixed(4),
      f1.toFixed(4)
    ].join(','));

    console.log(`  ${field.padEnd(16)}: Precision=${precision.toFixed(4)} Recall=${recall.toFixed(4)} F1=${f1.toFixed(4)}`);
  });

  fs.writeFileSync(path.join(OCR_DIR, 'evaluation-results.csv'), ocrResultsCsv.join('\n'));
  console.log(`[+] Saved ocr-evaluation/evaluation-dataset.csv and evaluation-results.csv`);
}

runPrivacyEvaluation();
runOcrEvaluation();
console.log('\n[SUCCESS] Privacy and OCR Empirical Validation Finished.');
