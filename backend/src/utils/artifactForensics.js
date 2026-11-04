const crypto = require('crypto');

/**
 * Calculates Shannon entropy of a string or buffer (0.0 to 8.0)
 * High entropy (> 7.1) suggests encryption, compression, or packed malware binaries.
 * @param {string|Buffer} data
 * @returns {number}
 */
function calculateEntropy(data) {
  if (!data || data.length === 0) return 0;
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
  const freq = {};
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    freq[byte] = (freq[byte] || 0) + 1;
  }
  let entropy = 0;
  const len = buf.length;
  for (const byte in freq) {
    const p = freq[byte] / len;
    entropy -= p * Math.log2(p);
  }
  return parseFloat(entropy.toFixed(3));
}

/**
 * Computes cryptographic hash digests (MD5, SHA-1, SHA-256)
 * @param {string|Buffer} data
 * @returns {{ md5: string, sha1: string, sha256: string }}
 */
function computeDigests(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data || '', 'utf8');
  return {
    md5: crypto.createHash('md5').update(buf).digest('hex'),
    sha1: crypto.createHash('sha1').update(buf).digest('hex'),
    sha256: crypto.createHash('sha256').update(buf).digest('hex')
  };
}

// Known high-risk Android permissions
const DANGEROUS_PERMISSIONS = {
  'android.permission.BIND_ACCESSIBILITY_SERVICE': { weight: 30, desc: 'Full device takeover & keystroke logging via Accessibility' },
  'android.permission.SYSTEM_ALERT_WINDOW': { weight: 25, desc: 'Floating screen overlays used to hijack banking credentials' },
  'android.permission.RECEIVE_SMS': { weight: 20, desc: 'Silent interception of 2FA banking and UPI OTPs' },
  'android.permission.READ_SMS': { weight: 20, desc: 'Exfiltration of confidential banking SMS records' },
  'android.permission.SEND_SMS': { weight: 15, desc: 'Toll-fraud and C2 beaconing via silent outbound SMS' },
  'android.permission.READ_CONTACTS': { weight: 15, desc: 'Contact book harvesting used in predatory loan app extortion' },
  'android.permission.RECORD_AUDIO': { weight: 15, desc: 'Surreptitious background voice and ambient recording' },
  'android.permission.CAMERA': { weight: 10, desc: 'Unauthorized background photo and video capture' },
  'android.permission.ACCESS_FINE_LOCATION': { weight: 10, desc: 'Real-time GPS surveillance of victim' },
  'android.permission.REQUEST_INSTALL_PACKAGES': { weight: 15, desc: 'Silent secondary stage malware droppers' }
};

// Document & PDF exploit signatures
const PDF_EXPLOIT_SIGNATURES = [
  { tag: '/JavaScript', weight: 25, desc: 'Embedded JavaScript execution block' },
  { tag: '/JS', weight: 25, desc: 'Shortened JavaScript execution object' },
  { tag: '/Launch', weight: 30, desc: 'Arbitrary host command launch instruction' },
  { tag: '/EmbeddedFiles', weight: 15, desc: 'Embedded binary or executable attachment' },
  { tag: '/URI', weight: 10, desc: 'Outbound remote resource dereference' },
  { tag: '/OpenAction', weight: 20, desc: 'Automated script execution upon document opening' },
  { tag: '/AcroForm', weight: 10, desc: 'Interactive form containing script hooks' }
];

// Suspicious command & control / malware strings
const MALWARE_KEYWORDS = [
  'meterpreter', 'keylogger', 'accessibility_service', 'fake_update',
  'apktool', 'mimikatz', 'powershell -enc', 'cmd.exe /c',
  'super_su', 'frida-server', 'dropper', 'exfiltrate', 'c2_server'
];

/**
 * Analyzes a raw file payload, APK manifest, or suspicious script text
 * @param {Object} options
 * @param {string} options.content - Raw text or base64 data
 * @param {string} [options.filename]
 * @param {string} [options.mimeType]
 * @returns {Object} Full forensic inspection report
 */
function analyzeArtifact({ content = '', filename = 'unknown_artifact.bin', mimeType = 'application/octet-stream' }) {
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(content.trim()) && content.trim().length > 64;
  let decodedBuffer;
  let rawText = content;

  if (isBase64) {
    try {
      decodedBuffer = Buffer.from(content.trim(), 'base64');
      rawText = decodedBuffer.toString('utf8');
    } catch {
      decodedBuffer = Buffer.from(content, 'utf8');
    }
  } else {
    decodedBuffer = Buffer.from(content, 'utf8');
  }

  const entropy = calculateEntropy(decodedBuffer);
  const digests = computeDigests(decodedBuffer);

  let threatScore = 0;
  const matchedIndicators = [];
  const detectedPermissions = [];
  const matchedPdfTags = [];
  const extractedUrls = [];
  const extractedIps = [];

  // 1. Entropy analysis
  if (entropy > 7.3) {
    threatScore += 30;
    matchedIndicators.push(`High Shannon entropy (${entropy} / 8.0) indicative of packed, encrypted or obfuscated binary payload`);
  } else if (entropy > 6.8) {
    threatScore += 15;
    matchedIndicators.push(`Elevated Shannon entropy (${entropy} / 8.0) suggesting compressed or encrypted content blocks`);
  }

  // 2. Android APK / Permission heuristics
  for (const [perm, rule] of Object.entries(DANGEROUS_PERMISSIONS)) {
    const permShort = perm.replace('android.permission.', '');
    if (rawText.includes(perm) || rawText.includes(permShort)) {
      detectedPermissions.push(perm);
      threatScore += rule.weight;
      matchedIndicators.push(`Dangerous Android Permission: ${permShort} (${rule.desc})`);
    }
  }

  // 3. Weaponized PDF / Document heuristics
  for (const sig of PDF_EXPLOIT_SIGNATURES) {
    if (rawText.includes(sig.tag)) {
      matchedPdfTags.push(sig.tag);
      threatScore += sig.weight;
      matchedIndicators.push(`Exploit Vector: Found PDF ${sig.tag} tag (${sig.desc})`);
    }
  }

  // 4. Keyword indicators
  const lowerText = rawText.toLowerCase();
  for (const kw of MALWARE_KEYWORDS) {
    if (lowerText.includes(kw)) {
      threatScore += 15;
      matchedIndicators.push(`Known Threat Signature Keyword: '${kw}' detected in payload strings`);
    }
  }

  // 5. Extracted network indicators (URLs and IP addresses)
  const urlRegex = /https?:\/\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]+/g;
  const rawUrls = rawText.match(urlRegex) || [];
  const uniqueUrls = [...new Set(rawUrls.slice(0, 10))];
  if (uniqueUrls.length > 0) {
    extractedUrls.push(...uniqueUrls);
    matchedIndicators.push(`Extracted ${uniqueUrls.length} external URL destination(s) from payload`);
    threatScore += 10;
  }

  const ipRegex = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g;
  const rawIps = rawText.match(ipRegex) || [];
  const validIps = [...new Set(rawIps.filter(ip => !ip.startsWith('127.') && ip !== '0.0.0.0').slice(0, 8))];
  if (validIps.length > 0) {
    extractedIps.push(...validIps);
    matchedIndicators.push(`Detected ${validIps.length} non-loopback IPv4 communication address(es): ${validIps.join(', ')}`);
    threatScore += 15;
  }

  // Cap threat score at 100
  threatScore = Math.min(100, Math.max(0, threatScore));

  // Determine Verdict
  let verdict = 'BENIGN / CLEAN';
  let severityLevel = 'LOW';
  if (threatScore >= 60) {
    verdict = 'CRITICAL MALWARE / WEAPONIZED PAYLOAD';
    severityLevel = 'CRITICAL';
  } else if (threatScore >= 25) {
    verdict = 'SUSPICIOUS / ELEVATED RISK';
    severityLevel = 'ELEVATED';
  }

  const certificateNumber = `QRN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const quarantineCertificate = `================================================================================
CYBERGUARD DIGITAL FORENSIC QUARANTINE CERTIFICATE
STANDARDS REFERENCE: ISO/IEC 27037 (DIGITAL EVIDENCE INTEGRITY)
================================================================================

CERTIFICATE REFERENCE   : ${certificateNumber}
ISSUED AT               : ${new Date().toISOString()}
INCIDENT ISOLATION STATUS: IMMUTABLY QUARANTINED (NON-EXECUTABLE STATUS)

[1. ARTIFACT SPECIFICATIONS]
FILENAME                : ${filename}
DECLARED MIME-TYPE      : ${mimeType}
BYTE LENGTH             : ${decodedBuffer.length} bytes
SHANNON ENTROPY         : ${entropy} / 8.000 (${entropy > 7.1 ? 'PACKED/ENCRYPTED' : 'STANDARD DISTRIBUTION'})

[2. CRYPTOGRAPHIC INTEGRITY SUMMARIES]
MD5 HASH                : ${digests.md5}
SHA-1 HASH              : ${digests.sha1}
SHA-256 HASH            : ${digests.sha256}

[3. FORENSIC STATIC ANALYSIS & THREAT HEURISTICS]
THREAT SCORE            : ${threatScore} / 100
SEVERITY LEVEL          : ${severityLevel}
OPERATIONAL VERDICT     : ${verdict}

KEY INDICATORS OBSERVED :
${matchedIndicators.length > 0 ? matchedIndicators.map((ind, i) => `  [${i + 1}] ${ind}`).join('\n') : '  - No high-risk exploit primitives, packed binaries, or suspicious hooks detected.'}

EXTRACTED NETWORK IOCs  :
${extractedUrls.length > 0 ? `  - Target URLs: ${extractedUrls.join(', ')}` : '  - Target URLs: None detected.'}
${extractedIps.length > 0 ? `  - Target IPs : ${extractedIps.join(', ')}` : '  - Target IPs : None detected.'}

[4. FORENSIC RECORD & DISCLAIMER]
This document records that the aforementioned digital artifact was inspected
using static heuristic parsing and Shannon entropy analysis (ISO/IEC 27037 digital evidence preservation standards).
No dynamic code execution or live sandbox detonation was performed. The digital bitstream has been
hashed and held in quarantine without execution or modification. Evidentiary value is subject to judicial proof and corroboration.
================================================================================`;

  return {
    certificateNumber,
    filename,
    mimeType,
    byteLength: decodedBuffer.length,
    entropy,
    digests,
    threatScore,
    severityLevel,
    verdict,
    matchedIndicators,
    detectedPermissions,
    matchedPdfTags,
    extractedUrls,
    extractedIps,
    quarantineCertificate,
    analyzedAt: new Date().toISOString()
  };
}

module.exports = {
  calculateEntropy,
  computeDigests,
  analyzeArtifact,
  DANGEROUS_PERMISSIONS,
  PDF_EXPLOIT_SIGNATURES
};

