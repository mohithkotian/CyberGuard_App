const crypto = require('crypto');

/**
 * Telecom Requisition Engine (Sanchar Saathi / TAFCOP / CEIR)
 * Statutory Framework & Regulatory Authorities:
 * - Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 [Production of Documents/Electronic Records]
 * - Section 67C Information Technology Act, 2000 [Intermediary Preservation & Retention of Information]
 * - Department of Telecommunications (DoT) Unified License Condition 39.20 [Mandatory 2-Year CDR/IPDR Retention]
 * - Section 20 Telecommunications Act, 2023 [Public Safety & Emergency Framework Reference]
 * - Central Equipment Identity Register (CEIR) / TAFCOP Operating Framework
 */

// Common Indian Mobile Switching Center (MSC) series prefixes for carrier resolution
const CARRIER_PATTERNS = [
  { prefix: ['981', '982', '983', '984', '985', '986', '987', '988', '989', '991', '992', '993', '994', '995', '996', '997', '998', '999', '910', '911'], carrier: 'Bharti Airtel Limited' },
  { prefix: ['620', '621', '622', '623', '626', '628', '629', '630', '635', '636', '637', '638', '639', '700', '701', '702', '703', '704', '705', '706', '707', '708', '709', '797', '798', '799'], carrier: 'Reliance Jio Infocomm Limited' },
  { prefix: ['900', '901', '902', '903', '904', '905', '906', '907', '908', '909', '920', '921', '922', '923', '924', '925', '926', '927', '928', '929', '970', '971', '972', '973', '974', '975', '976', '977', '978', '979'], carrier: 'Vodafone Idea Limited (Vi)' },
  { prefix: ['940', '941', '942', '943', '944', '945', '946', '947', '948', '949', '950', '951', '952', '953', '954', '955', '956', '957', '958', '959'], carrier: 'Bharat Sanchar Nigam Limited (BSNL)' }
];

function resolveCarrier(phone) {
  if (!phone) return 'Unknown / Ported Carrier (Verify via TAFCOP)';
  const clean = String(phone).replace(/\D/g, '').slice(-10);
  const prefix3 = clean.slice(0, 3);
  for (const item of CARRIER_PATTERNS) {
    if (item.prefix.includes(prefix3)) {
      return item.carrier;
    }
  }
  return 'National Telecommunications Operator (Verify via DoT MNP Gateway)';
}

function normalizeIndianPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return null;
}

/**
 * Compiles a formal Statutory Emergency Telecom Disconnection & CEIR IMEI Barring Directive
 */
function compileTelecomRequisition({
  phone,
  imei = null,
  complaintIds = [],
  officerName = 'Investigating Officer, Cyber Crime Division',
  officerBadge = 'CYBER-LEA-NODAL',
  carrier = null,
  reason = 'Active involvement in organized cross-jurisdiction cyber fraud campaigns',
  requestedAction = 'IMMEDIATE_DISCONNECTION_AND_CEIR_BLOCK'
}) {
  const normPhone = normalizeIndianPhone(phone);
  if (!normPhone) {
    throw new Error('Valid 10-digit Indian mobile number (MSISDN) is required for telecom requisition.');
  }

  const generatedAt = new Date();
  const year = generatedAt.getFullYear();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const requisitionId = `DOT-TAFCOP-${year}-${randomSuffix}`;
  const resolvedCarrier = carrier || resolveCarrier(normPhone);

  const cleanImei = imei ? String(imei).replace(/\D/g, '') : null;
  const imeiDirective = cleanImei
    ? `IMMEDIATE CENTRAL EQUIPMENT IDENTITY REGISTER (CEIR) HARDWARE BLACKLISTING FOR IMEI: ${cleanImei}`
    : 'AUTOMATIC CEIR RETRIEVAL & BLACKLISTING: Interrogate HLR/VLR logs for latest associated handset IMEI and bar across all Indian mobile network operators';

  const directiveText = [
    `PROPOSED TELECOM REQUISITION DRAFT UNDER SECTION 94 BNSS 2023 & SECTION 67C IT ACT 2000`,
    `READ WITH SECTION 20 OF THE TELECOMMUNICATIONS ACT, 2023 OPERATIONAL FRAMEWORK`,
    `================================================================================`,
    `REQUISITION DRAFT REF: ${requisitionId}`,
    `DATE OF GENERATION   : ${generatedAt.toISOString()}`,
    `OPERATIONAL PRIORITY : P0 LAW ENFORCEMENT INTERVENTION REQUEST`,
    `STATUS               : PROPOSED REQUISITION DRAFT (SUBJECT TO OFFICER EXECUTION)`,
    `================================================================================`,
    `[LEGAL DISCLAIMER & NOTICE: This document is a computer-assisted operational requisition`,
    ` draft compiled for the review and formal transmission by an authorized Investigating Officer`,
    ` or Designated Nodal Officer. Automated line disconnection, subscriber data disclosure, or`,
    ` hardware blacklisting is executed through sanctioned government portals (Sanchar Saathi / TAFCOP / CEIR).]`,
    ``,
    `TO:`,
    `  1. Nodal Officer (Law Enforcement Coordination), ${resolvedCarrier}`,
    `  2. Director General, Telecom Analytics for Fraud management and Consumer Protection (TAFCOP / Sanchar Saathi)`,
    `  3. Central Equipment Identity Register (CEIR) Administrator, Department of Telecommunications (DoT), New Delhi`,
    ``,
    `SUBJECT: STATUTORY MANDATE FOR IMMEDIATE DISCONNECTION OF MSISDN +91 ${normPhone} AND HARDWARE IMEI BARRING`,
    ``,
    `1. PREAMBLE & SUBSTANTIVE ALLEGATION:`,
    `   Digital forensic analysis and cross-jurisdictional threat intelligence on the CyberGuard National Response Platform`,
    `   has established that MSISDN +91 ${normPhone} is actively utilized as an operational instrument in recurring financial cyber fraud`,
    `   and criminal impersonation across ${complaintIds.length || 1} verified police complaints:`,
    `   Connected Incident Reference(s): ${(complaintIds.length > 0 ? complaintIds.join(', ') : 'CMP-INTELLIGENCE-CLUSTER')}`,
    ``,
    `2. STATUTORY DIRECTIVES ORDERED UNDER SECTION 20 TELECOMMUNICATIONS ACT, 2023:`,
    `   a) MSISDN SUSPENSION: Immediately terminate all originating and terminating Voice, SMS, and Mobile Data services for MSISDN +91 ${normPhone}.`,
    `   b) CEIR HARDWARE BLACKLISTING: ${imeiDirective}.`,
    `   c) CALL DETAIL RECORD (CDR) PRESERVATION: Pursuant to DoT Unified License Condition 39.20 read with Section 67C of the Information Technology Act, 2000, preserve complete Call Detail Records (CDR), IP Detail Records (IPDR), SMS logs, and Cell Tower / Cell ID location dumps for the mandatory period of 24 months in tamper-evident cryptographic custody.`,
    `   d) SUBSCRIBER ACQUISITION FORM (SAF) SUBMISSION: Furnish certified copies of Customer Application Form (CAF), e-KYC biometric audit logs, Point of Sale (PoS) merchant credentials, and Aadhaar/PAN authentication tokens used at SIM activation within 24 hours.`,
    ``,
    `3. PENAL WARNING:`,
    `   Failure or delay in executing this statutory requisition within the stipulated 4-hour window constitutes an offense`,
    `   punishable under Section 223 of Bharatiya Nyaya Sanhita, 2023 (Disobedience to order duly promulgated by public servant)`,
    `   and Section 42 of the Telecommunications Act, 2023.`,
    `================================================================================`,
    `ISSUED UNDER SEAL BY:`,
    `  Name: ${officerName}`,
    `  Badge / Warrant ID: ${officerBadge}`,
    `  Desk: National Cybercrime Operations & Telecommunications Liaison Cell`
  ].join('\n');

  const contentToHash = JSON.stringify({
    requisitionId,
    phone: normPhone,
    carrier: resolvedCarrier,
    imei: cleanImei,
    complaintIds,
    officerBadge,
    timestamp: generatedAt.toISOString()
  });

  const sha256Seal = crypto.createHash('sha256').update(contentToHash).digest('hex');

  return {
    requisitionId,
    phone: normPhone,
    displayPhone: `+91 ${normPhone}`,
    carrier: resolvedCarrier,
    imei: cleanImei || 'AUTO_CEIR_DISCOVERY',
    complaintIds,
    officerName,
    officerBadge,
    generatedAt: generatedAt.toISOString(),
    status: 'ACTIVE_TAFCOP_REQUISITION',
    requestedAction,
    reason,
    directiveText,
    sha256Seal,
    complianceWindowHours: 4,
    legalActs: [
      'Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023',
      'Section 67C Information Technology Act, 2000',
      'DoT Unified License Condition 39.20 (Mandatory 24-Month CDR/IPDR Preservation)',
      'Section 20 Telecommunications Act, 2023',
      'Central Equipment Identity Register (CEIR) National Blacklist'
    ]
  };
}

module.exports = {
  compileTelecomRequisition,
  resolveCarrier,
  normalizeIndianPhone
};

