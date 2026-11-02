const crypto = require('crypto');

/**
 * Syndicate Consolidation Service & Master Docket Generator
 * Statutory Framework & Legal Authority:
 * - Section 111 Bharatiya Nyaya Sanhita (BNS), 2023 [Organized Crime - Continuing Unlawful Activity / Multiple Chargesheets]
 * - Section 107 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 [Attachment & Restoration of Property / Proceeds of Crime]
 * - Section 242 & 246 BNSS, 2023 [Joint Trial & Clubbing of Serial Offences / Conspiracy]
 * - Section 31 & 45 BNSS, 2023 [Inter-Jurisdictional Police Powers & Pursuit]
 * - Section 318(4) & 319(2) BNS, 2023 [Cheating & Impersonation by Computer Resource]
 * - Section 66C & 66D Information Technology Act, 2000 [Identity Theft & Computer Personation]
 */

/**
 * Generates a structured Potential Syndicate Assessment Dossier Draft (Sec 111 BNS Lead Intelligence)
 * aggregating multiple victim complaints linked to common digital/banking identifiers.
 */
function compileSyndicateDocket({
  syndicateId,
  leadAgency = 'State Cyber Crime Command / CBI Cyber Crime Division',
  investigatingOfficer = { name: 'Superintendent of Police', badge: 'SP-CYBER-HQ' },
  complaints = [],
  notes = ''
}) {
  if (!complaints || complaints.length === 0) {
    throw new Error('At least one complaint is required to compile a syndicate consolidation docket.');
  }

  const generatedAt = new Date();
  const year = generatedAt.getFullYear();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const docketId = `SYN-BNS111-${year}-${randomSuffix}`;

  // Extract and aggregate identifiers across all complaints
  const phoneSet = new Set();
  const upiSet = new Set();
  const accountSet = new Set();
  const ifscSet = new Set();
  const jurisdictionSet = new Set();
  const categorySet = new Set();
  let totalFinancialLoss = 0;

  const victimRoster = complaints.map((c, index) => {
    const cid = c.complaintId || String(c._id);
    const amount = Number(c.amountLost) || (c.lostMoney ? 25000 : 0);
    totalFinancialLoss += amount;

    // Jurisdictions
    const city = c.location?.city || '';
    const state = c.location?.state || '';
    const jurisdiction = (city && state) ? `${city}, ${state}` : (city || state || 'State Cyber Jurisdiction');
    jurisdictionSet.add(jurisdiction);

    if (c.category) categorySet.add(c.category);

    // Extract phones
    (c.ocrData?.extracted?.phones || []).forEach(p => {
      const clean = String(p).replace(/\D/g, '').slice(-10);
      if (clean.length === 10) phoneSet.add(clean);
    });
    if (c.suspectInfo?.details) {
      const phones = String(c.suspectInfo.details).match(/(\+?\d{1,4}[\s-]?)?\d{10}/g);
      (phones || []).forEach(p => {
        const clean = String(p).replace(/\D/g, '').slice(-10);
        if (clean.length === 10) phoneSet.add(clean);
      });
    }

    // Extract UPIs
    (c.ocrData?.extracted?.upis || []).forEach(u => {
      if (typeof u === 'string' && u.includes('@')) upiSet.add(u.trim().toLowerCase());
    });

    // Extract Accounts
    (c.ocrData?.extracted?.accounts || []).forEach(a => {
      const clean = String(a).replace(/\s/g, '');
      if (clean.length >= 8) accountSet.add(clean);
    });

    // Extract IFSCs
    (c.ocrData?.extracted?.ifscs || []).forEach(i => {
      if (typeof i === 'string' && i.length >= 8) ifscSet.add(i.trim().toUpperCase());
    });

    return {
      index: index + 1,
      complaintId: cid,
      victimInitials: c.victimDetails?.name ? maskName(c.victimDetails.name) : `Complainant #${index + 1}`,
      incidentDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : 'Recorded in Custody',
      jurisdiction,
      category: c.category || 'Financial Cyber Fraud',
      amountLost: amount,
      status: c.status || 'investigating'
    };
  });

  const uniquePhones = Array.from(phoneSet);
  const uniqueUpis = Array.from(upiSet);
  const uniqueAccounts = Array.from(accountSet);
  const uniqueIfscs = Array.from(ifscSet);
  const uniqueJurisdictions = Array.from(jurisdictionSet);
  const uniqueCategories = Array.from(categorySet);

  // Determine Primary Syndicate Vector
  const primaryVector = uniquePhones.length > 0 
    ? `Telecommunication / WhatsApp Hub (+91 ${uniquePhones[0]})`
    : uniqueUpis.length > 0
    ? `UPI Financial Gateway (${uniqueUpis[0]})`
    : `Mule Banking Network (${uniqueAccounts[0] || 'Unknown Origin'})`;

  // Statutory Penal Sections & Procedural Framework
  const statutorySections = [
    {
      act: 'Bharatiya Nyaya Sanhita (BNS), 2023',
      section: 'Section 111',
      description: 'Organized Crime — Continuing unlawful activity committed by members of an organized crime syndicate. (Note: Statutory invocation requires formal proof of multiple charge-sheets filed within 10 years and court cognizance taken).'
    },
    {
      act: 'Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023',
      section: 'Section 107',
      description: 'Attachment, Forfeiture or Restoration of Property (Proceeds of Crime) — Procedure for tracking and judicial attachment of property derived from criminal activity.'
    },
    {
      act: 'Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023',
      section: 'Section 246',
      description: 'Joint Trial of Accused Persons — Statutory clubbing and joint prosecution of persons accused of the same offence or conspiracy committed in the same transaction.'
    },
    {
      act: 'Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023',
      section: 'Section 31 & Section 45',
      description: 'Inter-Jurisdictional Police Authority — Statutory power of police officers to pursue and arrest suspects outside local police station limits.'
    },
    {
      act: 'Bharatiya Nyaya Sanhita (BNS), 2023',
      section: 'Section 318(4) & Section 319(2)',
      description: 'Cheating, dishonestly inducing delivery of property, and cheating by personation.'
    },
    {
      act: 'Information Technology Act, 2000',
      section: 'Section 66C & Section 66D',
      description: 'Identity theft using electronic signature, password or unique identification feature, and cheating by personation by using computer device.'
    }
  ];

  // Statutory Narrative & Inter-LEA Directive Draft
  const executiveSummary = [
    `POTENTIAL SYNDICATE ASSESSMENT DOSSIER DRAFT (SECTION 111 BNS PRELIMINARY INTELLIGENCE)`,
    `[LEGAL NOTICE & DISCLAIMER: This document is an investigative lead brief and correlation dossier compiled for law enforcement evaluation under Sections 107, 242, and 246 BNSS 2023. It correlates recurring financial and digital identifiers across complaints. It does not constitute a final judicial determination of an organized crime syndicate under Section 111 BNS, which requires formal charge-sheeting and judicial cognizance.]`,
    `WHEREAS algorithmic correlation across digital incident records registered on the CyberGuard Platform has identified a recurring nexus operating across ${uniqueJurisdictions.length} law enforcement jurisdictions;`,
    `AND WHEREAS said suspected criminal syndicate has systematically targeted ${victimRoster.length} verified complainants, siphoning an estimated aggregate sum of INR ${totalFinancialLoss.toLocaleString('en-IN')};`,
    `AND WHEREAS identical beneficiary identifiers [Phones: ${uniquePhones.join(', ') || 'N/A'} | UPI: ${uniqueUpis.join(', ') || 'N/A'} | Mule Accounts: ${uniqueAccounts.join(', ') || 'N/A'}] provide reasonable investigative grounds of common conspiracy under Section 246 BNSS 2023;`,
    `NOW THEREFORE, pursuant to Sections 107, 246, and 31/45 BNSS 2023, this Potential Syndicate Assessment Dossier Draft is compiled for review and inter-jurisdictional coordination by ${leadAgency}.`
  ].join('\n\n');

  // Compute immutable SHA-256 seal of the docket content
  const contentToHash = JSON.stringify({
    docketId,
    syndicateId: syndicateId || docketId,
    totalFinancialLoss,
    victimCount: victimRoster.length,
    uniquePhones,
    uniqueUpis,
    uniqueAccounts,
    leadAgency,
    timestamp: generatedAt.toISOString()
  });

  const sha256Seal = crypto.createHash('sha256').update(contentToHash).digest('hex');

  return {
    docketId,
    syndicateId: syndicateId || `SYN-${randomSuffix}`,
    title: `Inter-Jurisdictional Organized Cyber Syndicate Master Docket (${docketId})`,
    leadAgency,
    investigatingOfficer: {
      name: investigatingOfficer.name || 'Superintendent of Police',
      badge: investigatingOfficer.badge || 'SP-CYBER-HQ',
      station: 'National Cyber Command Center / Central Liaison'
    },
    generatedAt: generatedAt.toISOString(),
    sha256Seal,
    primaryVector,
    metrics: {
      totalDefraudedAmount: totalFinancialLoss,
      victimCount: victimRoster.length,
      jurisdictionCount: uniqueJurisdictions.length,
      linkedPhoneCount: uniquePhones.length,
      linkedUpiCount: uniqueUpis.length,
      linkedAccountCount: uniqueAccounts.length
    },
    identifiers: {
      phones: uniquePhones,
      upis: uniqueUpis,
      accounts: uniqueAccounts,
      ifscs: uniqueIfscs
    },
    jurisdictions: uniqueJurisdictions,
    categories: uniqueCategories,
    statutorySections,
    victimRoster,
    executiveSummary,
    officerNotes: notes || 'Statutory consolidation recommended for joint trial under Section 242/244 BNSS 2023.'
  };
}

function maskName(name) {
  if (!name || typeof name !== 'string') return 'Protected Complainant';
  const parts = name.trim().split(/\s+/);
  return parts.map(p => p.length <= 2 ? p : `${p[0]}***${p[p.length - 1]}`).join(' ');
}

module.exports = {
  compileSyndicateDocket,
  maskName
};

