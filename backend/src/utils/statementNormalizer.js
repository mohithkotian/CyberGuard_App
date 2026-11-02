/**
 * Citizen Voice Statement Transcriber & Cyber-Forensic Entity Normalizer
 * Parses oral or typed citizen statements in English, Hinglish, or regional terms
 * and structures them into court-admissible forensic police reports.
 */

// Category detection dictionaries
const CRIME_PATTERNS = [
  {
    category: 'Digital Arrest & Law Enforcement Impersonation',
    terms: ['digital arrest', 'mumbai police', 'cbi', 'customs', 'narcotics', 'ncb', 'skype call', 'money laundering case', 'arrest warrant', 'fake officer'],
    penalSections: 'Section 319 (Cheating by personation), Section 204 (Impersonating a public servant) BNS 2023; Section 66D IT Act 2000'
  },
  {
    category: 'Electricity Bill & Utility Disconnection Fraud',
    terms: ['electricity', 'power cut', 'bijli', 'power supply will be disconnected', 'light bill', 'electricity officer', 'electricity board', 'quicksupport', 'anydesk'],
    penalSections: 'Section 318(4) (Cheating & dishonestly inducing delivery of property) BNS 2023; Section 66D IT Act 2000'
  },
  {
    category: 'Task-Based & Telegram Investment Scam',
    terms: ['part-time job', 'youtube like', 'hotel review', 'telegram task', 'vip investment', 'crypto trading bonus', 'daily profit', 'prepaid task'],
    penalSections: 'Section 318(4) (Cheating), Section 111 (Organized crime syndicate) BNS 2023; Section 66D IT Act 2000'
  },
  {
    category: 'Sextortion & Video Call Blackmail',
    terms: ['video call', 'nude', 'whatsapp call recording', 'compromised photo', 'blackmail', 'delete video', 'social media upload', 'sextortion'],
    penalSections: 'Section 308(2) (Extortion), Section 79 (Outraging modesty of women) BNS 2023; Section 66E, 67, 67A IT Act 2000'
  },
  {
    category: 'Predatory Instant Loan App Harassment',
    terms: ['loan app', 'instant loan', 'contacts leaked', 'morphed photos', 'loan agent', 'harassment call to relatives', 'recovery agent'],
    penalSections: 'Section 351 (Criminal intimidation), Section 308 (Extortion) BNS 2023; Section 66E IT Act 2000'
  },
  {
    category: 'Banking KYC & Phishing APK Fraud',
    terms: ['kyc update', 'pan card expired', 'sbi netbanking', 'sim block', 'download apk', 'remote app', 'card blocked', 'otp shared'],
    penalSections: 'Section 318(4) (Cheating), Section 336 (Forgery) BNS 2023; Section 43, 66, 66C, 66D IT Act 2000'
  }
];

/**
 * Extracts monetary amount lost from freeform text
 * Handles figures like 85,000, 85000, 1.5 lakh, 2 lakhs, 50k, ₹5000
 * @param {string} text
 * @returns {number|null}
 */
function extractLossAmount(text) {
  if (!text) return null;

  // Check for lakh/crore mentions (e.g., 2.5 lakh, 3 lakhs)
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lacs|lac|l)/i);
  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1]);
    return Math.round(val * 100000);
  }

  const croreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr)/i);
  if (croreMatch) {
    const val = parseFloat(croreMatch[1]);
    return Math.round(val * 10000000);
  }

  // Check for 'k' notation (e.g., 50k)
  const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000);
  }

  // Standard monetary numbers (e.g. ₹85,000, Rs. 50000, INR 120000, scammed for Rs. 40,000)
  const currRegex = /(?:₹|rs\.?|inr|amount\s+of|lost|transferred|debited|scammed\s+for)\s*[:=]?\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{3,9})(?:\.[0-9]+)?/i;
  const match = text.match(currRegex);
  if (match) {
    const cleanStr = match[1].replace(/,/g, '');
    const num = parseFloat(cleanStr);
    if (!isNaN(num) && num > 0) return Math.round(num);
  }

  // Fallback: look for 4-7 digit numbers surrounded by debit/transfer context
  const genericMatch = text.match(/\b([1-9][0-9]{3,7})\b/);
  if (genericMatch) {
    const num = parseInt(genericMatch[1], 10);
    // Ignore potential years (e.g. 2024, 2025, 2026) unless explicitly indicated
    if (num >= 2020 && num <= 2030) return null;
    return num;
  }

  return null;
}

/**
 * Extracts Indian phone numbers, UPI IDs, UTRs, and IFSC codes
 * @param {string} text
 * @returns {Object}
 */
function extractEntities(text) {
  const clean = text || '';

  // Phone numbers (Indian 10-digit mobile prefixed with 6-9)
  const phoneRegex = /(?:(?:\+|00)91[\s-]?)?([6-9]\d{9})/g;
  const phones = [];
  let pMatch;
  while ((pMatch = phoneRegex.exec(clean)) !== null) {
    if (!phones.includes(pMatch[1])) {
      phones.push(pMatch[1]);
    }
  }

  // UPI IDs
  const upiRegex = /([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})/g;
  const upis = [];
  let uMatch;
  while ((uMatch = upiRegex.exec(clean)) !== null) {
    const handle = uMatch[1].toLowerCase();
    if (!handle.includes('example.com') && !handle.includes('@gmail') && !handle.includes('@yahoo')) {
      if (!upis.includes(handle)) upis.push(handle);
    }
  }

  // 12-digit UPI / IMPS UTR transaction references
  const utrRegex = /\b(\d{12})\b/g;
  const utrs = [];
  let utrMatch;
  while ((utrMatch = utrRegex.exec(clean)) !== null) {
    // Exclude if it's identical to an extracted phone with '91' prefix
    const val = utrMatch[1];
    if (!phones.some(p => val.endsWith(p))) {
      if (!utrs.includes(val)) utrs.push(val);
    }
  }

  // Bank Accounts (9-18 digits)
  const accRegex = /\b\d{9,18}\b/g;
  const accounts = [];
  let accMatch;
  while ((accMatch = accRegex.exec(clean)) !== null) {
    const val = accMatch[1];
    if (!phones.includes(val) && !utrs.includes(val)) {
      if (!accounts.includes(val)) accounts.push(val);
    }
  }

  return { phones, upis, utrs, accounts };
}

/**
 * Categorizes narrative based on keywords
 * @param {string} text
 * @returns {{ category: string, penalSections: string }}
 */
function categorizeStatement(text) {
  const lower = (text || '').toLowerCase();

  for (const item of CRIME_PATTERNS) {
    for (const term of item.terms) {
      if (lower.includes(term.toLowerCase())) {
        return {
          category: item.category,
          penalSections: item.penalSections
        };
      }
    }
  }

  return {
    category: 'Financial Fraud & Unauthorized Electronic Remittance',
    penalSections: 'Section 318(4) (Cheating) BNS 2023; Section 66D IT Act 2000'
  };
}

/**
 * Normalizes an oral or unstructured citizen statement into a police dossier
 * @param {string} statement - The raw spoken or typed narrative
 * @param {Object} [metadata] - Optional complainant metadata
 * @returns {Object} Structured forensic incident representation
 */
function normalizeStatement(statement, metadata = {}) {
  const rawText = (statement || '').trim();
  if (!rawText) {
    throw new Error('Statement text is required for transcription normalization.');
  }

  const lossAmount = extractLossAmount(rawText);
  const entities = extractEntities(rawText);
  const categorization = categorizeStatement(rawText);

  const incidentRef = `ORAL-INTAKE-${Math.floor(100000 + Math.random() * 900000)}`;

  const normalizedDossier = `================================================================================
FIRST INFORMATION COMPLAINT NARRATIVE (STATEMENT UNDER SECTION 173 BNSS 2023)
INCIDENT INTAKE REFERENCE: ${incidentRef}
RECORDING TIMESTAMP      : ${new Date().toISOString()}
================================================================================

[1. PRIMARY INCIDENT CLASSIFICATION]
CRIME CATEGORY           : ${categorization.category}
STATUTORY PENAL SECTIONS : ${categorization.penalSections}
FINANCIAL QUANTUM LOST   : ${lossAmount ? `INR ${lossAmount.toLocaleString('en-IN')}/-` : 'Unspecified or non-financial coercion'}

[2. SUSPECT IDENTIFIERS EXTRACTED]
SUSPECT MOBILE NUMBER(S) : ${entities.phones.length > 0 ? entities.phones.join(', ') : 'None extracted from oral statement'}
SUSPECT UPI / VPA(S)     : ${entities.upis.length > 0 ? entities.upis.join(', ') : 'None extracted'}
TRANSACTION REF / UTR(S) : ${entities.utrs.length > 0 ? entities.utrs.join(', ') : 'None extracted'}
BENEFICIARY ACCOUNT(S)   : ${entities.accounts.length > 0 ? entities.accounts.join(', ') : 'None extracted'}

[3. FORMAL STATEMENT OF THE VICTIM]
"${rawText}"

[4. CHRONOLOGICAL POLICE ACTION RECOMMENDATION]
1. Immediate issuance of Section 106 BNSS debit freeze notice to the recipient financial institution(s).
2. Issuance of Section 94 BNSS preservation requisition to Telecom Service Provider for suspect mobile numbers: ${entities.phones.join(', ') || 'N/A'}.
3. Registration of formal First Information Report (FIR) under ${categorization.penalSections}.
================================================================================`;

  return {
    incidentRef,
    rawStatement: rawText,
    category: categorization.category,
    penalSections: categorization.penalSections,
    lossAmount,
    extractedEntities: entities,
    normalizedDossier,
    suggestedTitle: `${categorization.category} involving ${entities.phones[0] ? `caller ${entities.phones[0]}` : 'unauthorized fraudulent communication'}`
  };
}

module.exports = {
  extractLossAmount,
  extractEntities,
  categorizeStatement,
  normalizeStatement,
  CRIME_PATTERNS
};
