/**
 * @file bankNodalDirectory.js
 * @description Curated, authoritative directory of verified Cyber Crime Nodal Officers,
 * Fraud Desks, Escalation Matrices, and IFSC Prefix Mappings for major Indian banks,
 * payment service providers (PSPs), payment gateways, telecom operators, and statutory agencies.
 *
 * Used for instant dispatch of Section 106 BNSS / Section 91 CrPC statutory debit-freeze notices
 * and RBI Zero-Liability customer dispute filings.
 */

const NODAL_DIRECTORY = [
  // ── PUBLIC SECTOR BANKS ──
  {
    id: 'sbi',
    name: 'State Bank of India',
    shortName: 'SBI',
    category: 'bank',
    nodalEmail: 'nodal.officer@sbi.co.in',
    secondaryEmail: 'report.phishing@sbi.co.in',
    helpline: '1800 1234 / 1800 2100',
    emergencyLiaisonHours: '24x7 Emergency Fraud Mitigation Desk',
    turnaroundTime: '< 2 Hours (Golden Hour priority)',
    ifscPrefixes: ['SBIN'],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC debit freeze directives',
    escalationContact: 'Chief General Manager, Cyber Security Operations Centre (C-SOC), Navi Mumbai'
  },
  {
    id: 'pnb',
    name: 'Punjab National Bank',
    shortName: 'PNB',
    category: 'bank',
    nodalEmail: 'nodalofficer@pnb.co.in',
    secondaryEmail: 'cybercrimecell@pnb.co.in',
    helpline: '1800 180 2222 / 1800 103 2222',
    emergencyLiaisonHours: '24x7 Cyber Redressal Desk',
    turnaroundTime: '< 3 Hours',
    ifscPrefixes: ['PUNB'],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC debit freeze directives',
    escalationContact: 'Principal Nodal Officer, Head Office, Dwarka, New Delhi'
  },
  {
    id: 'bob',
    name: 'Bank of Baroda',
    shortName: 'BOB',
    category: 'bank',
    nodalEmail: 'nodal.officer@bankofbaroda.com',
    secondaryEmail: 'fraudreporting@bankofbaroda.com',
    helpline: '1800 5700',
    emergencyLiaisonHours: '24x7 Incident Management Team',
    turnaroundTime: '< 3 Hours',
    ifscPrefixes: ['BARB'],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC debit freeze directives',
    escalationContact: 'General Manager, Operational Risk Management & Fraud Prevention, Mumbai'
  },
  {
    id: 'canara',
    name: 'Canara Bank',
    shortName: 'Canara',
    category: 'bank',
    nodalEmail: 'nodalofficer@canarabank.com',
    secondaryEmail: 'cybercrime@canarabank.com',
    helpline: '1800 425 0018',
    emergencyLiaisonHours: '09:00 - 20:00 IST (Emergency helpline 24x7)',
    turnaroundTime: '< 4 Hours',
    ifscPrefixes: ['CNRB'],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC debit freeze directives',
    escalationContact: 'Nodal Officer, Head Office, JC Road, Bengaluru'
  },
  {
    id: 'union',
    name: 'Union Bank of India',
    shortName: 'Union Bank',
    category: 'bank',
    nodalEmail: 'pno@unionbankofindia.bank',
    secondaryEmail: 'cybersecurity@unionbankofindia.bank',
    helpline: '1800 22 2244',
    emergencyLiaisonHours: '24x7 SOC Cell',
    turnaroundTime: '< 3 Hours',
    ifscPrefixes: ['UBIN'],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC debit freeze directives',
    escalationContact: 'Chief Nodal Officer, Central Office, Nariman Point, Mumbai'
  },

  // ── PRIVATE SECTOR BANKS ──
  {
    id: 'hdfc',
    name: 'HDFC Bank Ltd',
    shortName: 'HDFC',
    category: 'bank',
    nodalEmail: 'cybercrime.nodal@hdfcbank.com',
    secondaryEmail: 'incidentreporting@hdfcbank.com',
    helpline: '1800 1600 / 1800 266 4060',
    emergencyLiaisonHours: '24x7 Dedicated Cyber Response Team',
    turnaroundTime: '< 1 Hour (Golden Hour accelerated response)',
    ifscPrefixes: ['HDFC'],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC debit freeze directives',
    escalationContact: 'Senior Vice President & Principal Nodal Officer, Kanjurmarg, Mumbai'
  },
  {
    id: 'icici',
    name: 'ICICI Bank Ltd',
    shortName: 'ICICI',
    category: 'bank',
    nodalEmail: 'headservicequality@icicibank.com',
    secondaryEmail: 'antiphishing@icicibank.com',
    helpline: '1800 1080',
    emergencyLiaisonHours: '24x7 Law Enforcement Liaison Cell',
    turnaroundTime: '< 1.5 Hours',
    ifscPrefixes: ['ICIC'],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC debit freeze directives',
    escalationContact: 'Principal Nodal Officer, ICICI Bank Towers, Bandra Kurla Complex, Mumbai'
  },
  {
    id: 'axis',
    name: 'Axis Bank Ltd',
    shortName: 'Axis',
    category: 'bank',
    nodalEmail: 'nodal.officer@axisbank.com',
    secondaryEmail: 'lawenforcementliaison@axisbank.com',
    helpline: '1800 419 5959',
    emergencyLiaisonHours: '24x7 Fraud Operations Command Center',
    turnaroundTime: '< 2 Hours',
    ifscPrefixes: ['UTIB'],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC debit freeze directives',
    escalationContact: 'Executive Vice President & Principal Nodal Officer, Axis House, Worli, Mumbai'
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortName: 'Kotak',
    category: 'bank',
    nodalEmail: 'nodalofficer@kotak.com',
    secondaryEmail: 'cybercell.liaison@kotak.com',
    helpline: '1860 266 2666',
    emergencyLiaisonHours: '24x7 Operations Support',
    turnaroundTime: '< 2 Hours',
    ifscPrefixes: ['KKBK'],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC debit freeze directives',
    escalationContact: 'Chief Nodal Officer, BKC, Bandra (E), Mumbai'
  },
  {
    id: 'indusind',
    name: 'IndusInd Bank',
    shortName: 'IndusInd',
    category: 'bank',
    nodalEmail: 'nodal.officer@indusind.com',
    secondaryEmail: 'fraudprevention@indusind.com',
    helpline: '1860 267 7777',
    emergencyLiaisonHours: '09:00 - 21:00 IST (Helpline 24x7)',
    turnaroundTime: '< 3 Hours',
    ifscPrefixes: ['INDB'],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC debit freeze directives',
    escalationContact: 'Executive Vice President, Fraud Risk & Cyber Crime, Mumbai'
  },
  {
    id: 'idfc',
    name: 'IDFC FIRST Bank',
    shortName: 'IDFC FIRST',
    category: 'bank',
    nodalEmail: 'pno@idfcfirstbank.com',
    secondaryEmail: 'cybercrime@idfcfirstbank.com',
    helpline: '1800 10 888',
    emergencyLiaisonHours: '24x7 Incident Desk',
    turnaroundTime: '< 2 Hours',
    ifscPrefixes: ['IDFB'],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC debit freeze directives',
    escalationContact: 'Principal Nodal Officer, Naman Chambers, BKC, Mumbai'
  },
  {
    id: 'federal',
    name: 'Federal Bank',
    shortName: 'Federal',
    category: 'bank',
    nodalEmail: 'support@federalbank.co.in',
    secondaryEmail: 'contact@federalbank.co.in',
    helpline: '1800 425 1199',
    emergencyLiaisonHours: '24x7 Fraud Operations Desk',
    turnaroundTime: '< 3 Hours',
    ifscPrefixes: ['FDRL'],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC debit freeze directives',
    escalationContact: 'General Manager, Operational Risk, Aluva, Kochi'
  },

  // ── PAYMENT SERVICE PROVIDERS, GATEWAYS & WALLETS ──
  {
    id: 'paytm',
    name: 'Paytm / One97 Communications / Paytm Payments Bank',
    shortName: 'Paytm',
    category: 'payment_gateway',
    nodalEmail: 'nodal@paytm.com',
    secondaryEmail: 'cybercell@paytm.com',
    helpline: '0120 4456 456 / 0120 3888 388',
    emergencyLiaisonHours: '24x7 Dedicated Law Enforcement Liaison Cell',
    turnaroundTime: '< 1 Hour (Real-time wallet and VPA freeze)',
    ifscPrefixes: ['PYTM'],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC notices for wallet hold & VPA blocking',
    escalationContact: 'Head, Law Enforcement Relations, One97 Communications, Noida'
  },
  {
    id: 'phonepe',
    name: 'PhonePe Private Limited',
    shortName: 'PhonePe',
    category: 'payment_gateway',
    nodalEmail: 'grievance@phonepe.com',
    secondaryEmail: 'lawenforcement@phonepe.com',
    helpline: '080 6872 7374 / 022 6872 7374',
    emergencyLiaisonHours: '24x7 LEA Liaison Desk',
    turnaroundTime: '< 1 Hour (Automated VPA delinking & beneficiary lien)',
    ifscPrefixes: [],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC statutory directives',
    escalationContact: 'Grievance Officer & Head of Regulatory Compliance, Bengaluru'
  },
  {
    id: 'gpay',
    name: 'Google Pay India (Google India Digital Services)',
    shortName: 'Google Pay / GPay',
    category: 'payment_gateway',
    nodalEmail: 'support-in@google.com',
    secondaryEmail: 'googlepay-grievance-officer@google.com',
    helpline: '1800 419 0157',
    emergencyLiaisonHours: '24x7 Digital Trust & Safety Desk',
    turnaroundTime: '< 2 Hours',
    ifscPrefixes: [],
    statutoryNoticeAccepted: 'Accepts LEA statutory inquiry and transaction audit notices',
    escalationContact: 'Nodal Officer, Google India Digital Services Pvt Ltd, Hyderabad'
  },
  {
    id: 'razorpay',
    name: 'Razorpay Software Private Limited',
    shortName: 'Razorpay',
    category: 'payment_gateway',
    nodalEmail: 'lawenforcement@razorpay.com',
    secondaryEmail: 'disputes@razorpay.com',
    helpline: '1800 123 1272',
    emergencyLiaisonHours: '24x7 Dedicated Merchant Risk & LEA Command Center',
    turnaroundTime: '< 1 Hour (Real-time merchant settlement freeze)',
    ifscPrefixes: [],
    statutoryNoticeAccepted: 'Accepts Sec 106 BNSS / Sec 91 CrPC merchant payout freeze orders',
    escalationContact: 'Head of Trust & Safety, Razorpay, Bengaluru'
  },
  {
    id: 'cashfree',
    name: 'Cashfree Payments India Private Limited',
    shortName: 'Cashfree',
    category: 'payment_gateway',
    nodalEmail: 'lawenforcement@cashfree.com',
    secondaryEmail: 'grievance@cashfree.com',
    helpline: '080 4716 6699',
    emergencyLiaisonHours: '24x7 LEA Operations Team',
    turnaroundTime: '< 1.5 Hours',
    ifscPrefixes: [],
    statutoryNoticeAccepted: 'Accepts statutory settlement lien and account hold notices',
    escalationContact: 'Nodal Grievance Officer, Cashfree Payments, Bengaluru'
  },
  {
    id: 'cred',
    name: 'CRED (Dreamplug Technologies)',
    shortName: 'CRED',
    category: 'payment_gateway',
    nodalEmail: 'grievanceofficer@cred.club',
    secondaryEmail: 'support@cred.club',
    helpline: '080 4567 8900',
    emergencyLiaisonHours: '09:00 - 21:00 IST',
    turnaroundTime: '< 3 Hours',
    ifscPrefixes: [],
    statutoryNoticeAccepted: 'Accepts Section 91 CrPC notices for transaction details',
    escalationContact: 'Nodal Officer, Indiranagar, Bengaluru'
  },
  {
    id: 'npci',
    name: 'National Payments Corporation of India (NPCI / BHIM)',
    shortName: 'NPCI / BHIM',
    category: 'agency',
    nodalEmail: 'grievance.officer@npci.org.in',
    secondaryEmail: 'ciso@npci.org.in',
    helpline: '1800 120 1740',
    emergencyLiaisonHours: '24x7 UPI Clearing & Incident Command Center',
    turnaroundTime: '< 1 Hour',
    ifscPrefixes: [],
    statutoryNoticeAccepted: 'Coordinates inter-bank UPI switch lien protocols with RBI/I4C',
    escalationContact: 'Chief of Products & Operations, NPCI, BKC, Mumbai'
  },

  // ── TELECOM SERVICE PROVIDERS ──
  {
    id: 'airtel',
    name: 'Bharti Airtel Limited',
    shortName: 'Airtel',
    category: 'telecom',
    nodalEmail: 'nodal.officer@airtel.com',
    secondaryEmail: 'lea.support@airtel.com',
    helpline: '198 / 121',
    emergencyLiaisonHours: '24x7 LEA Coordination Cell (All Circles)',
    turnaroundTime: '< 2 Hours (SIM swap / IMEI block / CAF)',
    ifscPrefixes: ['AIRP'],
    statutoryNoticeAccepted: 'Accepts Sec 91 CrPC for CDR, SDR, IPDR, and emergency MSISDN suspension',
    escalationContact: 'Chief Regulatory Officer, Bharti Crescent, Nelson Mandela Road, New Delhi'
  },
  {
    id: 'jio',
    name: 'Reliance Jio Infocomm Limited',
    shortName: 'Jio',
    category: 'telecom',
    nodalEmail: 'nodal.officer@ril.com',
    secondaryEmail: 'lea.nodal@jio.com',
    helpline: '198 / 199',
    emergencyLiaisonHours: '24x7 National LEA Desk',
    turnaroundTime: '< 2 Hours (Emergency MSISDN deactivation / CDR)',
    ifscPrefixes: ['JIOP'],
    statutoryNoticeAccepted: 'Accepts Sec 91 CrPC for Call Detail Records and subscriber verification',
    escalationContact: 'Vice President - Regulatory & Law Enforcement Liaison, Navi Mumbai'
  },
  {
    id: 'vi',
    name: 'Vodafone Idea Limited (Vi)',
    shortName: 'Vi',
    category: 'telecom',
    nodalEmail: 'nodal.officer@vodafoneidea.com',
    secondaryEmail: 'leasupport@vodafoneidea.com',
    helpline: '198 / 199',
    emergencyLiaisonHours: '24x7 LEA Operations Desk',
    turnaroundTime: '< 3 Hours',
    ifscPrefixes: [],
    statutoryNoticeAccepted: 'Accepts Section 91 CrPC notices for mobile interception & CDR',
    escalationContact: 'Chief Regulatory Affairs Officer, Gandhinagar / Mumbai'
  },
  {
    id: 'bsnl',
    name: 'Bharat Sanchar Nigam Limited (BSNL)',
    shortName: 'BSNL',
    category: 'telecom',
    nodalEmail: 'nodalofficer@bsnl.co.in',
    secondaryEmail: 'cybercell@bsnl.co.in',
    helpline: '1800 180 1503',
    emergencyLiaisonHours: '10:00 - 18:00 IST (Emergency duty roster)',
    turnaroundTime: '< 4 Hours',
    ifscPrefixes: [],
    statutoryNoticeAccepted: 'Accepts Section 91 CrPC statutory directives',
    escalationContact: 'General Manager (Security Operations), BSNL Corporate Office, New Delhi'
  },

  // ── STATUTORY & COORDINATION AGENCIES ──
  {
    id: 'i4c',
    name: 'Indian Cyber Crime Coordination Centre (I4C) / MHA 1930',
    shortName: 'I4C / 1930',
    category: 'agency',
    nodalEmail: 'cybercrime-nodal@gov.in',
    secondaryEmail: 'i4c-support@mha.gov.in',
    helpline: '1930 (National Cyber Crime Helpline)',
    emergencyLiaisonHours: '24x7 Citizen Financial Fraud Reporting & Automated Freeze Switch',
    turnaroundTime: 'Real-time routing across 250+ banks via Citizen Financial Cyber Fraud Management System (CFCFRMS)',
    ifscPrefixes: [],
    statutoryNoticeAccepted: 'National nodal coordinating authority under Ministry of Home Affairs',
    escalationContact: 'Director, Indian Cyber Crime Coordination Centre (I4C), MHA, New Delhi'
  },
  {
    id: 'cert_in',
    name: 'Indian Computer Emergency Response Team (CERT-In)',
    shortName: 'CERT-In',
    category: 'agency',
    nodalEmail: 'incident@cert-in.org.in',
    secondaryEmail: 'info@cert-in.org.in',
    helpline: '1800 11 4949',
    emergencyLiaisonHours: '24x7 National Cyber Security Incident Response Desk',
    turnaroundTime: '< 2 Hours for critical infrastructure and financial sector incidents',
    ifscPrefixes: [],
    statutoryNoticeAccepted: 'Statutory incident response agency under Section 70B of Information Technology Act',
    escalationContact: 'Director General, CERT-In, Electronics Niketan, CGO Complex, New Delhi'
  }
];

/**
 * Lookup financial institution by an IFSC code prefix (e.g. "SBIN0001234" -> SBI).
 * @param {string} ifsc
 * @returns {object|null}
 */
function lookupByIFSC(ifsc) {
  if (!ifsc || typeof ifsc !== 'string') return null;
  const clean = ifsc.trim().toUpperCase();
  if (clean.length < 4) return null;
  const prefix = clean.slice(0, 4);

  return NODAL_DIRECTORY.find(entry => entry.ifscPrefixes && entry.ifscPrefixes.includes(prefix)) || null;
}

/**
 * Search the directory by query (matches name, shortName, IFSC prefix, or emails).
 * Optionally filters by category ("bank", "payment_gateway", "telecom", "agency").
 * @param {string} [query]
 * @param {string} [category]
 * @returns {Array<object>}
 */
function searchDirectory(query = '', category = '') {
  let list = NODAL_DIRECTORY;

  if (category && category !== 'all') {
    list = list.filter(entry => entry.category === category);
  }

  if (!query || typeof query !== 'string' || !query.trim()) {
    return list;
  }

  const q = query.trim().toLowerCase();
  const qUpper = query.trim().toUpperCase();

  return list.filter(entry => {
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.shortName.toLowerCase().includes(q) ||
      entry.nodalEmail.toLowerCase().includes(q) ||
      (entry.secondaryEmail && entry.secondaryEmail.toLowerCase().includes(q)) ||
      (entry.ifscPrefixes && entry.ifscPrefixes.some(p => p.includes(qUpper) || qUpper.startsWith(p))) ||
      (entry.helpline && entry.helpline.includes(q))
    );
  });
}

/**
 * Get all directory entries.
 * @returns {Array<object>}
 */
function getAllEntries() {
  return NODAL_DIRECTORY;
}

module.exports = {
  NODAL_DIRECTORY,
  lookupByIFSC,
  searchDirectory,
  getAllEntries
};

