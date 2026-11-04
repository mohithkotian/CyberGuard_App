# Phase 6 Implementation Report: Digital Artifact Detonation Sandbox, Judicial Section 65B Sworn Evidence Affidavit & Citizen Oral Statement Normalizer

## 1. Executive Summary

Phase 6 addresses the core evidentiary, forensic safety, and accessibility bottlenecks in cybercrime reporting and prosecution:
1. **Digital Evidence Quarantine & Threat Detonation Sandbox (`/api/security/detonate-artifact`)**:
   - Isolates suspicious binaries, weaponized documents, and predatory mobile APKs before investigating officers download or inspect them.
   - Evaluates Shannon entropy (detecting packed or encrypted malware payloads), computes full MD5/SHA-1/SHA-256 digests, and executes static heuristic rules for dangerous Android permissions (`BIND_ACCESSIBILITY_SERVICE`, `SYSTEM_ALERT_WINDOW`, `RECEIVE_SMS`, `READ_CONTACTS`).
   - Detects weaponized PDF exploit tags (`/JavaScript`, `/Launch`, `/OpenAction`, embedded actions) and extracts external command-and-control (C2) IP addresses and URLs.
   - Issues an ISO/IEC 27037-compliant **Digital Forensic Quarantine Certificate** (e.g. `QRN-2026-XXXXXX`) that permanently binds the artifact's non-executable bitstream into the complaint custody ledger without workstation risk.

2. **Section 65B(4) IEA 1872 / Section 63(4) BSA 2023 Sworn Electronic Evidence Affidavit Builder**:
   - Codifies the mandatory legal standards established by the Supreme Court of India in *Anvar P.V. v. P.K. Basheer (2014) 10 SCC 473* and *Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal (2020) 7 SCC 1*.
   - Enables complainants, device custodians, and investigating officers to select specific digital exhibits (screenshots, transaction receipts, chat transcripts), input device specifications (Make/Model, OS Version, IMEI/MAC, Custody Period), and generate a formal sworn legal affidavit with a Schedule of Certified Electronic Exhibits and SHA-256 cryptographic hashes.
   - Automatically seals the affidavit, generating a unique certificate (`SEC65B-2026-XXXXXX`), hashing the affidavit text, and appending the execution record to `affidavits65B`, `chainOfCustody`, and case `timeline`.

3. **Citizen Oral / Voice Statement Transcriber & Cyber-Forensic Entity Normalizer (`/api/complaints/transcribe-statement`)**:
   - Lowers intake friction for distressed citizens, tier-2/3 residents, and elderly victims reporting in colloquial Hindi, Hinglish, or plain conversational speech.
   - Intelligently extracts financial losses (handling formats like `₹85,000`, `1.5 lakh`, `50k`), suspect contact numbers, UPI VPAs, and 12-digit transaction UTR references.
   - Classifies the incident into recognized criminal modi operandi (Digital Arrest & Law Enforcement Impersonation, Electricity Bill Disconnection, Telegram Task Investment, Sextortion Coercion, Loan App Extortion, Banking KYC Phishing) and pre-populates the official complaint report with a court-ready First Information statement under Section 173 BNSS 2023.

---

## 2. Architecture & File Manifest

### A. Backend Core Services & Routes
- **`backend/src/models/Complaint.js`**:
  - Added `affidavits65B` schema: `certificateNumber`, `deponentName`, `deponentDesignation`, `deponentAddress`, `deviceDetails`, `exhibits`, `legalAct`, `sha256Digest`, `generatedAt`, `generatedBy`.
  - Added `forensicArtifacts` schema: `certificateNumber`, `artifactName`, `artifactType`, `md5`, `sha1`, `sha256`, `entropy`, `threatScore`, `verdict`, `indicators`, `extractedUrls`, `extractedIps`, `permissions`, `sanitizedSummary`, `quarantinedAt`.
- **`backend/src/utils/artifactForensics.js`**:
  - Shannon entropy calculator, cryptographic digest computer, static Android permission and PDF exploit heuristic engine, threat scoring engine (0-100), and ISO/IEC 27037 Quarantine Certificate generator.
- **`backend/src/utils/statementNormalizer.js`**:
  - Colloquial Indian currency extractor, mobile/UPI/UTR regex normalizer, cybercrime categorization dictionary mapped to BNS 2023 / IT Act sections, and Section 173 BNSS complaint narrative formatter.
- **`backend/src/utils/section65bGenerator.js`**:
  - Sworn legal affidavit compiler with statutory operating declarations under Section 65B(2)/(4) IEA 1872 & Section 63(2)/(4) BSA 2023, exhibit schedule table, jurat clause, and SHA-256 digest sealing.
- **`backend/src/controllers/complaintsController.js`**:
  - `generateSection65BAffidavit`: Validates authorization, filters exhibits, compiles sworn affidavit, saves to `affidavits65B`, commits to `chainOfCustody` and `timeline`.
  - `transcribeCitizenStatement`: Normalizes oral narrative, extracts entities, and outputs structured police summary.
- **`backend/src/routes/complaints.js`**:
  - Mounted `POST /api/complaints/transcribe-statement` (public/authenticated intake).
  - Mounted `POST /api/complaints/:id/section65b-affidavit` (complainant/officer restricted).
- **`backend/src/routes/security.js`**:
  - Mounted `POST /api/security/detonate-artifact` (sandbox detonation with optional complaint quarantine binding).
  - Updated `POST /api/security/verify-integrity` to index and verify `SEC65B-` affidavits and `QRN-` quarantine certificates by SHA-256 or certificate ID.

### B. Frontend Integration & CyberGuard Design System
- **`web-app/src/services/api.js`**:
  - Added `complaintsAPI.generateSection65B(id, payload)`
  - Added `complaintsAPI.transcribeStatement(statement, metadata)`
  - Added `securityAPI.detonateArtifact(payload)`
- **`web-app/src/pages/ComplaintDetails.js`**:
  - Added `SEC 65B AFFIDAVIT` button.
  - Added `P0 EMERGENCY TAKEDOWN` and `ZERO FIR TRANSFER` action buttons.
  - Added Modal 14: Interactive Section 65B Sworn Affidavit Builder with device specification inputs, exhibit checklist, affidavit view, and copy/print actions.
- **`web-app/src/pages/ForensicScanner.js`**:
  - Added third tab: `MALWARE & ARTIFACT DETONATION SANDBOX`.
  - Built interactive Detonation Workspace with sample threat presets (Spyware APK, Weaponized PDF, Benign Receipt), real-time entropy meter, threat score badge, cryptographic bitstream table, detected indicators, extracted C2 destinations, and ISO/IEC 27037 Quarantine Certificate viewer.
- **`web-app/src/components/CyberReport.js`**:
  - Added `ORAL / VOICE ASSISTANT` button in Incident Details section heading.
  - Built Oral Statement Transcription Modal with preset scenarios, statement normalizer, and one-click form auto-fill for title, description, category, financial loss, and UTR.

---

## 3. Automated Test Verification

Test file: `backend/src/utils/phase6Intelligence.test.js` (17 tests):
1. **Artifact Forensics & Detonation Sandbox**:
   - Accurate Shannon entropy computation for low vs random byte buffers.
   - Consistent generation of MD5, SHA-1, SHA-256 digests.
   - Identification of dangerous Android permissions (`RECEIVE_SMS`, `BIND_ACCESSIBILITY_SERVICE`, `SYSTEM_ALERT_WINDOW`) and threat score elevation (>=60).
   - Detection of weaponized PDF exploit tags (`/JavaScript`, `/OpenAction`) and C2 URLs.
   - Evaluation of clean text / benign logs as low-risk/benign.
2. **Citizen Statement Normalizer**:
   - Currency extraction across colloquial Indian formats (`85,000`, `120000`, `2.5 lakh`, `50k`).
   - Extraction of Indian mobile numbers, UPI IDs, and 12-digit UTR references.
   - Categorization and penal mapping (Digital Arrest, Electricity Bill, Task Scams, Sextortion).
   - Formal Section 173 BNSS police narrative dossier formatting.
   - Validation against empty/blank statement.
3. **Section 65B / Section 63 BSA Affidavit Builder**:
   - Mandatory deponent validation.
   - Comprehensive sworn affidavit text generation with device specifications, exhibit schedule, and SHA-256 hash digest.
4. **Complaints Controller Execution**:
   - 404 AppError on non-existent complaint.
   - 403 AppError on unauthorized access.
   - Successful affidavit execution, ledger and timeline persistence.
   - Successful oral narrative transcription response.
   - 400 AppError on blank statement input.

### Test Results
- **Backend Test Suite**: `133 passed, 133 total` across 9 test suites (`phase6Intelligence.test.js`, `phase5Intelligence.test.js`, `phase4Intelligence.test.js`, `phase3Intelligence.test.js`, `phase2Intelligence.test.js`, `securityAndLegalCompliance.test.js`, `threatIntelligence.test.js`, `evidenceSecurity.test.js`, `breachService.test.js`).

