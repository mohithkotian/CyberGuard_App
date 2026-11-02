const Tesseract = require('tesseract.js');
const logger = require('../utils/logger');

/**
 * Pure helper function to extract financial identifiers, UTRs, amounts, and forgery flags from text
 * @param {string} text - Raw OCR text
 * @returns {object} - Extracted identifiers and forensic analysis
 */
function extractFinancialIdentifiers(text) {
  if (!text || typeof text !== 'string') {
    return {
      phones: [],
      upis: [],
      accounts: [],
      utrs: [],
      amounts: [],
      detectedApps: [],
      forgeryAnalysis: {
        isSuspect: false,
        integrityScore: 100,
        verdict: 'UNVERIFIED_FORMAT',
        flags: [],
        status: 'UNKNOWN'
      }
    };
  }

  // 1. Core identifiers
  const phoneRegex = /(?:\+91|91|0)?[6-9]\d{9}/g;
  const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
  const accountRegex = /\b\d{9,18}\b/g;

  const rawPhones = text.match(phoneRegex) || [];
  const rawUpis = text.match(upiRegex) || [];
  const rawAccounts = text.match(accountRegex) || [];

  const phones = [...new Set(rawPhones.map(p => p.replace(/\D/g, '').slice(-10)))];
  const upis = [...new Set(rawUpis.map(u => u.trim().toLowerCase()))];

  // 2. Extract UTR / RRN (12-digit transaction references)
  const utrs = [];
  // Explicit UTR / UPI Ref label patterns
  const utrLabeledRegex = /(?:UPI\s*(?:Ref|Reference|Txn|Transaction)?\s*(?:No|Num|Number|ID)?|UTR\s*(?:No|Number)?|Ref\s*No|RRN|Txn\s*ID)[:\s#]*([A-Za-z0-9]{10,22})/gi;
  let match;
  while ((match = utrLabeledRegex.exec(text)) !== null) {
    const val = match[1].trim();
    if (val.length >= 10 && val.length <= 22) {
      utrs.push(val);
    }
  }

  // Generic 12-digit numbers that appear in Indian payment screens (NPCI RRNs)
  const twelveDigitRegex = /\b[0-9]{12}\b/g;
  const twelveDigits = text.match(twelveDigitRegex) || [];
  twelveDigits.forEach(d => {
    // Avoid re-adding if it's already an account number or phone
    if (!phones.includes(d) && !utrs.includes(d)) {
      utrs.push(d);
    }
  });

  const uniqueUtrs = [...new Set(utrs)];

  // Filter accounts so they don't simply duplicate UTRs
  const accounts = [...new Set(rawAccounts.filter(acc => !uniqueUtrs.includes(acc)))];

  // 3. Extract Disputed Amounts
  const amounts = [];
  const amountRegex = /(?:₹|INR|Rs\.?|Paid|Total)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/gi;
  let amtMatch;
  while ((amtMatch = amountRegex.exec(text)) !== null) {
    const rawNum = amtMatch[1].replace(/,/g, '');
    const num = parseFloat(rawNum);
    if (!isNaN(num) && num > 0 && num < 10000000) {
      amounts.push(num);
    }
  }
  const uniqueAmounts = [...new Set(amounts)];

  // 4. Detect Payment Platforms
  const detectedApps = [];
  const lower = text.toLowerCase();
  if (lower.includes('google pay') || lower.includes('gpay') || lower.includes('tez') || lower.includes('google inc')) {
    detectedApps.push('Google Pay');
  }
  if (lower.includes('phonepe') || lower.includes('ybl') || lower.includes('ibl') || lower.includes('axl')) {
    detectedApps.push('PhonePe');
  }
  if (lower.includes('paytm') || lower.includes('one97') || lower.includes('pytm')) {
    detectedApps.push('Paytm');
  }
  if (lower.includes('bhim') || lower.includes('npci') || lower.includes('unified payments interface')) {
    detectedApps.push('BHIM / NPCI');
  }
  if (lower.includes('cred') || lower.includes('dreamplug')) {
    detectedApps.push('CRED');
  }
  if (lower.includes('amazon pay') || lower.includes('apl')) {
    detectedApps.push('Amazon Pay');
  }
  if (lower.includes('yono') || lower.includes('state bank of india')) {
    detectedApps.push('SBI Yono');
  }
  if (lower.includes('hdfc') || lower.includes('payzapp')) {
    detectedApps.push('HDFC Bank');
  }
  if (lower.includes('icici') || lower.includes('imobile')) {
    detectedApps.push('ICICI iMobile');
  }

  // 5. Automated Receipt Forgery & Anomaly Inspection
  const flags = [];
  let integrityScore = 95;
  let isSuspect = false;

  // Check for known fake screenshot generator signatures
  const fakeSignatures = [
    'fakepay', 'spoof paytm', 'prank payment', 'fake transaction',
    'dummy receipt', 'demo transaction', 'simulator'
  ];
  fakeSignatures.forEach(sig => {
    if (lower.includes(sig)) {
      flags.push({
        code: 'SPOOF_APK_SIGNATURE',
        severity: 'CRITICAL',
        description: `Receipt contains signature string matching known fake payment APK generator: "${sig}".`
      });
      integrityScore -= 60;
      isSuspect = true;
    }
  });

  // Check for missing banking UTR in supposed high-value success receipt
  const isClaimedSuccess = /successful|completed|paid successfully|payment done|transferred/i.test(lower);
  if (isClaimedSuccess && uniqueAmounts.some(a => a >= 5000) && uniqueUtrs.length === 0) {
    flags.push({
      code: 'MISSING_MANDATORY_RRN',
      severity: 'HIGH',
      description: 'Receipt asserts a completed high-value transfer but lacks standard 12-digit banking UTR/RRN reference.'
    });
    integrityScore -= 35;
    isSuspect = true;
  }

  // Check for suspicious zero-fee / irregular layout indicators
  if (/convenience fee\s*:\s*0\.00/i.test(lower) && lower.includes('instant loan')) {
    flags.push({
      code: 'PREDATORY_LOAN_RECEIPT',
      severity: 'MEDIUM',
      description: 'Format matches irregular micro-lending receipt layout.'
    });
    integrityScore -= 20;
  }

  let verdict = 'AUTHENTIC_RECEIPT';
  if (isSuspect || integrityScore < 60) {
    verdict = 'SUSPECT_TAMPERING';
  } else if (uniqueUtrs.length === 0 && uniqueAmounts.length === 0) {
    verdict = 'UNVERIFIED_FORMAT';
  }

  let status = 'UNKNOWN';
  if (/successful|completed|paid/i.test(lower)) status = 'SUCCESSFUL';
  else if (/failed|declined|reversed/i.test(lower)) status = 'FAILED';
  else if (/pending|processing/i.test(lower)) status = 'PENDING';

  return {
    phones,
    upis,
    accounts,
    utrs: uniqueUtrs,
    amounts: uniqueAmounts,
    detectedApps,
    forgeryAnalysis: {
      isSuspect,
      integrityScore: Math.max(0, integrityScore),
      verdict,
      flags,
      status
    }
  };
}

/**
 * Perform OCR on an image and extract suspect data
 * @param {string} imagePath - Local path to the uploaded image
 * @returns {Promise<Object>} - Extracted data (text, phones, upis, accounts, utrs, amounts, forgeryAnalysis)
 */
exports.extractDataFromImage = async (imagePath) => {
  try {
    logger.info(`Starting OCR on evidence: ${imagePath}`);

    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => logger.debug(m)
    });

    const parsed = extractFinancialIdentifiers(text);

    logger.info(`OCR Success: Found ${parsed.phones.length} phones, ${parsed.upis.length} UPIs, ${parsed.utrs.length} UTRs, ${parsed.amounts.length} amounts`);

    return {
      rawText: text,
      extracted: {
        phones: parsed.phones,
        upis: parsed.upis,
        accounts: parsed.accounts,
        utrs: parsed.utrs,
        amounts: parsed.amounts,
        detectedApps: parsed.detectedApps,
        forgeryAnalysis: parsed.forgeryAnalysis
      }
    };
  } catch (error) {
    logger.error(`OCR Error: ${error.message}`);
    return null;
  }
};

exports.extractFinancialIdentifiers = extractFinancialIdentifiers;
