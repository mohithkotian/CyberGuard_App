/**
 * @file messageThreatAnalyzer.js
 * @description Rapid forensic analyzer for citizen SMS and WhatsApp phishing messages.
 * Evaluates TRAI DLT header legitimacy, psychological coercion triggers,
 * malicious APK payloads, and cross-references embedded domains with CyberGuard threat intelligence.
 */

const { lookupThreat } = require('./threatIntelligence');

// Verified TRAI DLT 6-character Entity Header Whitelist for Essential Services
const OFFICIAL_DLT_HEADERS = new Set([
  'SBIINB', 'SBIPSG', 'SBICRD', 'SBISMS',
  'HDFCBK', 'HDFCCC', 'HDFCSM',
  'ICICIB', 'ICICIT', 'ICICIS',
  'AXISBK', 'AXISIT',
  'KOTAKB', 'KOTAKI',
  'PUNBNB', 'CANBNK', 'BOBTXN', 'UBINBK', 'INDBNK', 'IDFCFB',
  'PAYTMB', 'PAYTMS', 'PYTMBK',
  'PHONPE', 'BHIMUP', 'RZRPAY', 'CASHFR',
  'BESCOM', 'BESCMS', 'MAHAVD', 'TNEBPR', 'DHBVNL', 'PSPCLP', 'UPPCLP', 'WBSEDL',
  'AIRTEL', 'JIOINF', 'VIINFO', 'BSNLIN',
  'GOVTIN', 'CYBERC', 'NHAOTP', 'UIDAI'
]);

/**
 * Analyzes an SMS or instant messaging payload for phishing and financial scam markers.
 * @param {string} rawMessage
 * @returns {object}
 */
function analyzeMessageThreat(rawMessage) {
  if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
    return {
      verdict: 'NO_CONTENT',
      riskScore: 0,
      confidence: 0,
      senderHeaderAnalysis: { headerDetected: null, isTraiCompliant: false, isOfficialEntity: false, note: 'Empty message text' },
      coercionCategories: [],
      detectedUrgencyPhrases: [],
      extractedLinks: [],
      statutoryAdvisory: 'Please provide message text to audit.',
      suggestedComplaintDraft: null
    };
  }

  const message = rawMessage.trim();
  const lower = message.toLowerCase();

  let riskScore = 0;
  const flags = [];
  const coercionCategories = [];
  const detectedUrgencyPhrases = [];

  // ── 1. TRAI HEADER & SENDER IDENTITY INSPECTION ──
  let senderHeader = null;
  let isTraiCompliant = false;
  let isOfficialEntity = false;
  let headerNote = '';

  // Match TRAI standard header pattern e.g. "VK-BESCOM:", "AX-SBIINB", "MD-HDFCBK "
  const traiHeaderMatch = message.match(/^([A-Za-z]{2})[-_]([A-Za-z0-9]{4,8})(?:\s*[:\-–]\s*|\s+)/);
  // Match personal mobile number prefix e.g. "+91 98450 12345:", "9845012345", "+91-98450-12345:"
  const personalNumberMatch = message.match(/^(?:\+?91[\s-]?)?[6-9](?:[\s-]?\d){9}(?:\s*[:\-–]\s*|\s+)/);

  if (traiHeaderMatch) {
    senderHeader = `${traiHeaderMatch[1].toUpperCase()}-${traiHeaderMatch[2].toUpperCase()}`;
    const entityCode = traiHeaderMatch[2].toUpperCase();
    isTraiCompliant = true;

    if (OFFICIAL_DLT_HEADERS.has(entityCode)) {
      isOfficialEntity = true;
      headerNote = `Header "${senderHeader}" matches authorized principal entity registered on TRAI DLT network.`;
    } else {
      headerNote = `Header "${senderHeader}" is TRAI format but not in authorized banking/utility registry; verify entity authenticity.`;
      riskScore += 15;
    }
  } else if (personalNumberMatch) {
    senderHeader = personalNumberMatch[0].replace(/[:\-–\s]/g, '');
    isTraiCompliant = false;
    isOfficialEntity = false;
    headerNote = `CRITICAL ALERT: Message sent from a personal 10-digit mobile number (${senderHeader}). Under TRAI regulations, government, discoms, and banks NEVER dispatch service notices from personal numbers.`;
    riskScore += 40;
    flags.push('PERSONAL_NUMBER_IMPERSONATION');
  } else {
    senderHeader = 'UNKNOWN_SENDER';
    isTraiCompliant = false;
    headerNote = 'No standard TRAI sender header detected in message header.';
  }

  // ── 2. PSYCHOLOGICAL COERCION & SCAM TYPE TRIGGERS ──

  // Category A: Electricity / Discom Disconnection
  if (/electricity|power|power\s*cut|bescom|discom|power\s*supply|light\s*will\s*be\s*disconnected/i.test(lower)) {
    coercionCategories.push('UTILITY_POWER_DISCONNECTION');
    if (/disconnected\s*tonight|at\s*9[:.]30\s*pm|unpaid\s*bill|contact\s*officer/i.test(lower)) {
      detectedUrgencyPhrases.push('Power disconnection deadline at 9:30 PM');
      riskScore += 35;
    }
  }

  // Category B: Customs & "Digital Arrest" Extortion
  if (/customs|narcotics|parcel|drugs|mdma|fedex|dhl|mumbai\s*police|crime\s*branch|skype|digital\s*arrest/i.test(lower)) {
    coercionCategories.push('CUSTOMS_DIGITAL_ARREST_EXTORTION');
    if (/arrest\s*warrant|cbi|illegal\s*passport|bank\s*transfer\s*for\s*clearance/i.test(lower)) {
      detectedUrgencyPhrases.push('Threat of legal arrest / seizure of contraband');
      riskScore += 45;
    }
  }

  // Category C: Banking & YONO Account Block Panic
  if (/yono|sbi\s*account|blocked|debit\s*card\s*block|pan\s*update|kyc\s*expire/i.test(lower)) {
    coercionCategories.push('BANKING_KYC_ACCOUNT_SUSPENSION');
    if (/within\s*24\s*hours|immediately|otherwise\s*account\s*freeze/i.test(lower)) {
      detectedUrgencyPhrases.push('Immediate account suspension unless link opened');
      riskScore += 35;
    }
  }

  // Category D: Telegram / Work-from-Home Ponzi
  if (/part-time|work\s*from\s*home|daily\s*income|telegram|prepaid\s*task|like\s*youtube\s*videos/i.test(lower)) {
    coercionCategories.push('TELEGRAM_TASK_PONZI_SCAM');
    if (/earn\s*(?:rs|inr|₹)?\s*[0-9]{3,6}\s*daily|invest\s*small/i.test(lower)) {
      detectedUrgencyPhrases.push('Unrealistic high-yield daily income guarantee');
      riskScore += 30;
    }
  }

  // ── 3. EMBEDDED URLS & MALICIOUS APK DETECTION ──
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`\[\]]+/gi;
  const rawUrls = message.match(urlRegex) || [];
  const extractedLinks = [];

  rawUrls.forEach(u => {
    const threatCheck = lookupThreat(u);
    const isApk = /\.apk(\?|$)/i.test(u) || lower.includes('quicksupport') || lower.includes('anydesk') || lower.includes('rustdesk');

    if (isApk) {
      riskScore += 45;
      flags.push('MALICIOUS_REMOTE_APK_PAYLOAD');
    }

    if (threatCheck.threat) {
      riskScore += 40;
    }

    extractedLinks.push({
      url: u,
      isMaliciousOrSuspicious: threatCheck.threat || isApk,
      isAuthorityDomain: threatCheck.isAuthority,
      threatType: isApk ? 'MALICIOUS_APK_DOWNLOAD' : threatCheck.threatType || (threatCheck.threat ? 'PHISHING_INDICATOR' : 'UNCORROBORATED_URL'),
      details: threatCheck.details || (isApk ? 'Direct mobile installation payload detected' : 'Standard URL')
    });
  });

  // Shortlink obfuscation penalty
  if (/bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly|rb\.gy/i.test(lower)) {
    riskScore += 20;
    flags.push('OBFUSCATED_SHORT_URL');
  }

  // Phone number inside text prompting call
  const bodyPhoneMatch = message.match(/(?:call|contact|officer|dial)\s*(?:at\s*)?(?:\+91[\s-]?)?([6-9]\d{9})/i);
  let suspectContact = null;
  if (bodyPhoneMatch) {
    suspectContact = bodyPhoneMatch[1];
    riskScore += 15;
    flags.push('UNAUTHORIZED_CALL_CTA');
  }

  // ── 4. VERDICT & CONFIDENCE CALCULATION ──
  riskScore = Math.min(100, Math.max(0, riskScore));

  let verdict = 'AUTHENTIC_COMMUNICATION';
  if (riskScore >= 70) {
    verdict = 'CRITICAL_PHISHING_ATTACK';
  } else if (riskScore >= 45) {
    verdict = 'HIGH_RISK_SCAM';
  } else if (riskScore >= 20) {
    verdict = 'SUSPICIOUS_COMMUNICATION';
  }

  // Determine statutory advisory
  let statutoryAdvisory = 'Communication appears consistent with typical transactional patterns. Continue observing standard digital hygiene.';
  if (verdict === 'CRITICAL_PHISHING_ATTACK' || verdict === 'HIGH_RISK_SCAM') {
    if (coercionCategories.includes('UTILITY_POWER_DISCONNECTION')) {
      statutoryAdvisory = 'DO NOT DIAL NUMBERS IN THIS SMS OR INSTALL ANY APK. State electricity distribution companies never dispatch disconnection threats via personal mobile numbers or WhatsApp. Check official discom portal or dial 1912.';
    } else if (coercionCategories.includes('CUSTOMS_DIGITAL_ARREST_EXTORTION')) {
      statutoryAdvisory = 'DO NOT JOIN ANY VIDEO CALL. Indian Customs, Police, and CBI NEVER conduct arrests, narcotic seizures, or interrogations via Skype or WhatsApp. Hang up and dial National Cyber Helpline 1930 immediately.';
    } else if (coercionCategories.includes('BANKING_KYC_ACCOUNT_SUSPENSION')) {
      statutoryAdvisory = 'DO NOT CLICK THE LINK. Banks never ask you to update PAN or KYC via SMS shortlinks. Your account is not blocked. Access your account only through the official banking app downloaded from Google Play / Apple Store.';
    } else {
      statutoryAdvisory = 'High probability of fraudulent solicitation. Do not click links, send money, or share OTPs. File an incident report on CyberGuard.';
    }
  }

  // ── 5. SUGGESTED COMPLAINT DRAFT (FOR 1-CLICK FILING) ──
  let suggestedComplaintDraft = null;
  if (riskScore >= 35) {
    const primeCat = coercionCategories[0] || 'Phishing / Electronic Fraud';
    suggestedComplaintDraft = {
      title: `Unsolicited Phishing Message: ${primeCat.replace(/_/g, ' ')}`,
      category: primeCat.includes('UTILITY') ? 'Financial Fraud' : primeCat.includes('CUSTOMS') ? 'Identity Theft' : 'Phishing',
      description: `Citizen received deceptive communication containing coercion markers: "${message}". Extracted suspect sender: ${senderHeader}. Suspect contact: ${suspectContact || 'N/A'}.`,
      suspectInfo: {
        name: senderHeader !== 'UNKNOWN_SENDER' ? senderHeader : 'Unidentified Threat Actor',
        details: `Sender Header: ${senderHeader}. Phone: ${suspectContact || 'None'}. Links: ${extractedLinks.map(l => l.url).join(', ') || 'None'}`
      }
    };
  }

  return {
    verdict,
    riskScore,
    confidence: Math.min(0.98, 0.65 + (riskScore / 200)),
    senderHeaderAnalysis: {
      headerDetected: senderHeader,
      isTraiCompliant,
      isOfficialEntity,
      note: headerNote
    },
    coercionCategories,
    detectedUrgencyPhrases,
    extractedLinks,
    flags,
    suspectContact,
    statutoryAdvisory,
    suggestedComplaintDraft
  };
}

module.exports = {
  OFFICIAL_DLT_HEADERS,
  analyzeMessageThreat
};
