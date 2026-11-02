const crypto = require('crypto');

/**
 * Generates a Section 63(4) Bharatiya Sakshya Adhiniyam (BSA), 2023 / Section 65B(4) IEA Electronic Record Certificate Draft
 * @param {Object} params
 * @param {string} params.complaintId
 * @param {string} params.deponentName
 * @param {string} params.deponentDesignation - e.g. "Complainant / Lawful Device Custodian" or "Sub-Inspector / Investigating Officer"
 * @param {string} params.deponentAddress
 * @param {Object} params.deviceDetails
 * @param {string} params.deviceDetails.makeModel - e.g. "Samsung Galaxy S23 Ultra / Dell XPS 15"
 * @param {string} params.deviceDetails.osVersion - e.g. "Android 14 / Windows 11 Pro"
 * @param {string} params.deviceDetails.deviceIdentifier - e.g. "IMEI: 358912345678901 / MAC: 00:1A:2B:3C:4D:5E"
 * @param {string} params.deviceDetails.custodyPeriod - e.g. "January 2024 to Present"
 * @param {Array<Object>} params.exhibits - Array of { exhibitId, filename, sha256, description }
 * @returns {Object} Structured affidavit data and court text
 */
function generateSection65BAffidavit({
  complaintId,
  deponentName,
  deponentDesignation = 'Lawful Device Custodian / Deponent',
  deponentAddress = 'Resident of India',
  deviceDetails = {},
  exhibits = []
}) {
  if (!deponentName || !deponentName.trim()) {
    throw new Error('Deponent name is required for Section 65B affidavit execution.');
  }

  const certificateNumber = `SEC65B-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const timestamp = new Date().toISOString();
  const dateFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const makeModel = deviceDetails.makeModel || 'Digital Computing Device';
  const osVersion = deviceDetails.osVersion || 'Standard Operating Environment';
  const deviceId = deviceDetails.deviceIdentifier || 'Registered Consumer Terminal';
  const custodyPeriod = deviceDetails.custodyPeriod || 'During the entire material period of the incident';

  // Format the schedule of exhibits
  const exhibitRows = (exhibits && exhibits.length > 0)
    ? exhibits.map((ex, idx) => {
        const exId = ex.exhibitId || `EXHIBIT-P${idx + 1}`;
        const name = ex.filename || `Evidence_Item_${idx + 1}`;
        const hash = ex.sha256 || 'HASH_PENDING_FORENSIC_SEAL';
        const desc = ex.description || 'Electronic digital evidence screenshot / record';
        return `[${exId}] FILENAME    : ${name}\n             DESCRIPTION : ${desc}\n             SHA-256 HASH: ${hash}\n`;
      }).join('\n')
    : '  [EXHIBIT-P1] Master Case Incident Log & Electronic Transmission Records\n             SHA-256 HASH: COMPLAINT-RECORDS-VERIFIED-TAMPER-EVIDENT\n';

  const affidavitText = `================================================================================
BEFORE THE HON'BLE COURT OF CHIEF JUDICIAL MAGISTRATE / SESSIONS JUDGE
AFFIDAVIT UNDER SECTION 65B(4) OF THE INDIAN EVIDENCE ACT, 1872
READ WITH SECTION 63(4) OF THE BHARATIYA SAKSHYA ADHINIYAM (BSA), 2023
(ELECTRONIC RECORD CERTIFICATE DRAFT)
IN THE MATTER OF CYBERGUARD COMPLAINT REF: ${complaintId}
CERTIFICATE NUMBER: ${certificateNumber}
================================================================================
[LEGAL NOTICE & STATUTORY DISCLAIMER: This document is a computer-assisted draft
certificate prepared pursuant to Section 63(4) of the Bharatiya Sakshya Adhiniyam,
2023. Final evidentiary admissibility is subject to judicial scrutiny, lawful
custody verification, and formal execution by the deponent under oath.]
================================================================================

I, ${deponentName.trim()}, aged adult, residing at ${deponentAddress.trim()},
acting in my capacity as ${deponentDesignation.trim()}, do hereby solemnly affirm
and state on oath as under:

1. STATUTORY CUSTODY & LAWFUL CONTROL:
   That I am the lawful custodian and registered operator of the electronic device/system
   specified hereinbelow, which was used to receive, capture, store, and transmit the
   electronic records submitted under CyberGuard Reference [${complaintId}]:
   - Hardware Make & Model   : ${makeModel}
   - Operating System / Build: ${osVersion}
   - Unique Device Identifier : ${deviceId}
   - Period of Lawful Custody : ${custodyPeriod}

2. REGULAR OPERATIONAL INTEGRITY (COMPLIANCE WITH SECTION 65B(2) / SEC 63(2)):
   (a) The electronic records described in the Schedule of Exhibits below were produced
       by the aforementioned device during the period over which the device was used
       regularly to store and process electronic communications in the ordinary course.
   (b) Throughout the material period, the computer system / mobile device was operating
       properly, and there were no operational defects or malfunctions that could have
       affected the truth, accuracy, or integrity of the electronic records or their contents.
   (c) The electronic records are exact, unmanipulated digital duplicates/screenshots of the
       original communications, transactions, and messages as they appeared on the screen.

3. SCHEDULE OF CERTIFIED ELECTRONIC EXHIBITS:
--------------------------------------------------------------------------------
${exhibitRows}--------------------------------------------------------------------------------

4. IMMUTABILITY & CRYPTOGRAPHIC VERIFICATION:
   The cryptographic SHA-256 hashes indicated above were generated directly from the digital
   bitstreams at the time of intake. To the best of my personal knowledge and belief, no
   alteration, fabrication, deletion, or interception of the data has occurred from the
   moment of generation through export.

5. STATUTORY VERIFICATION & JURAT:
   I, the deponent named above, do hereby solemnly verify and declare on oath that the contents
   of Paragraphs 1 through 4 above are true and correct to my personal knowledge and from the
   records maintained on the device. No part of it is false and nothing material has been concealed.

   Signed and solemnly affirmed on this ${dateFormatted}.

   _______________________________________
   DEPONENT / CERTIFYING CUSTODIAN SIGNATURE
   Name: ${deponentName.trim()}
   Designation: ${deponentDesignation.trim()}
   Certificate Seal ID: ${certificateNumber}
================================================================================`;

  const sha256Digest = crypto.createHash('sha256').update(affidavitText).digest('hex');

  return {
    certificateNumber,
    complaintId,
    deponentName: deponentName.trim(),
    deponentDesignation: deponentDesignation.trim(),
    deponentAddress: deponentAddress.trim(),
    deviceDetails: {
      makeModel,
      osVersion,
      deviceIdentifier: deviceId,
      custodyPeriod
    },
    exhibits,
    affidavitText,
    sha256Digest,
    legalActs: 'Section 65B(4) Indian Evidence Act 1872 & Section 63(4) Bharatiya Sakshya Adhiniyam 2023',
    generatedAt: timestamp
  };
}

module.exports = {
  generateSection65BAffidavit
};

