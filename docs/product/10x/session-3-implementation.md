# Phase 3 Implementation Report: Forensic OCR, Scam Sandbox & Court Docket Engine

## 1. Executive Summary

Phase 3 introduces high-confidence financial and investigative tooling to CyberGuard, bridging citizen complaints directly to statutory court dockets and automated payment forensics:
1. **Payment Screenshot Deep Forensics & UTR / RRN Auto-Extractor**: Automatically parses 12-digit UPI/banking transaction references, disputed amounts, and payment apps (GPay, PhonePe, Paytm, BHIM, YONO SBI, HDFC, ICICI), while inspecting screenshots for fake APK signatures (`FakePay`, `Spoof Paytm`) and missing transaction IDs.
2. **Citizen SMS & WhatsApp Phishing Message Rapid Analyzer ("Scam Sandbox")**: Inspects raw message payloads against TRAI DLT 6-character entity registries (`SBIINB`, `BESCOM`, `HDFCBK`, etc.), alerts on personal 10-digit mobile number impersonation, detects psychological coercion vectors (electricity disconnection, digital arrest, YONO account blocks, Telegram task scams), parses remote APK payloads (`.apk`), and offers 1-click pre-filled complaint filing into CyberGuard.
3. **Statutory Magistrate Case Docket Generator (Sec 193 BNSS / Sec 200 CrPC)**: Automatically generates judicial investigation reports under Section 193 Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023 with penal sections under BNS 2023 & IT Act 2000, Section 65B BSA electronic evidence exhibits with SHA-256 digests, Section 106 BNSS bank freeze records, and formal prayers to the Chief Judicial Magistrate.

---

## 2. Architecture & File Manifest

### A. Backend Core Services & Utilities
- **`backend/src/services/ocrService.js`**:
  - Implemented `extractFinancialIdentifiers(text)` pure parser.
  - Extracts 12-digit UTR/RRN numbers via explicit labels (`UPI Ref No`, `UTR`, `Ref No`, `RRN`, `Txn ID`) and bounded 12-digit NPCI numbers.
  - Formatted amount parser handling currency notations (`₹`, `INR`, `Rs.`), thousand commas, and decimals.
  - Payment app fingerprinting (Google Pay, PhonePe, Paytm, BHIM/NPCI, CRED, Amazon Pay, SBI YONO, HDFC, ICICI).
  - Algorithmic receipt forgery inspection: detects generator watermarks/signatures (`fakepay`, `spoof paytm`, `prank payment`), flags high-value claimed transfers lacking bank UTR references (`MISSING_MANDATORY_RRN`), and tags predatory micro-lending receipts.
- **`backend/src/utils/messageThreatAnalyzer.js`**:
  - Validates sender identity against TRAI DLT 6-character principal entity registry (`OFFICIAL_DLT_HEADERS`).
  - Detects personal mobile 10-digit prefix spoofing with high-severity alert.
  - Detects psychological coercion patterns across 4 core scam verticals: Utility/Electricity power disconnection, Customs contraband video arrest extortion, Banking KYC panic, and Telegram task Ponzi schemes.
  - Cross-references URLs against CyberGuard threat intelligence (`lookupThreat`) and detects mobile APK downloads (`.apk`).
  - Generates structured pre-fill draft payloads for 1-click citizen reporting.
- **`backend/src/controllers/complaintsController.js`**:
  - Upgraded `processOCR` to store extracted UTRs, disputed amounts, detected applications, and forgery analysis directly inside the complaint model.
  - Implemented `generateMagistrateDocket`: Generates structured statutory court dockets under Sec 193 BNSS with verified SHA-256 evidence integrity exhibits and penal sections.
- **`backend/src/models/Complaint.js`**:
  - Extended schema: `ocrData.extracted.utrs`, `amounts`, `detectedApps`, and `forgeryAnalysis` structure.
- **`backend/src/routes/complaints.js`**:
  - Mounted `GET /api/complaints/:id/magistrate-docket`.
- **`backend/src/routes/security.js`**:
  - Mounted `POST /api/security/analyze-message`.

### B. Frontend Integration & CyberGuard Design System
- **`web-app/src/services/api.js`**:
  - Added `complaintsAPI.getMagistrateDocket(id)` and `securityAPI.analyzeMessage(payload)`.
- **`web-app/src/pages/ComplaintDetails.js`**:
  - Added `MAGISTRATE DOCKET (SEC 193 BNSS)` action button.
  - Added Modal 8 for reviewing, copying, and printing formal Magistrate investigation dockets.
  - Enhanced evidence forensics section with interactive UTR/RRN tags (with 1-click copy), payment app badges, and forgery alerts.
  - Auto-prefills extracted UTR/RRN numbers and amounts directly into the Section 106 BNSS Bank Freeze modal.
- **`web-app/src/pages/ScamSearch.js`**:
  - Introduced dual-mode selector: **IDENTIFIER LOOKUP** vs. **SMS & WHATSAPP PHISHING SANDBOX**.
  - One-click sample test buttons for prominent scam scenarios (BESCOM Power Cut, Customs Video Extortion, SBI YONO KYC Block, Telegram Task Ponzi).
  - Forensic audit report displaying risk score (0–100), TRAI DLT compliance badge, psychological coercion tags, extracted link security status, and statutory citizen advisories.
  - 1-Click **"FILE REPORT ON CYBERGUARD"** button that pre-populates the complaint submission flow (`/submit`).

---

## 3. Automated Test Suite & Coverage

Test file: `backend/src/utils/phase3Intelligence.test.js` (15 tests):
1. **OCR Financial Extraction**:
   - Empty/null input handling without exceptions.
   - Standard payment text UTR and amount extraction.
   - Multi-variant extraction (UTR, RRN, Ref No, PhonePe/Google Pay signatures).
   - Spoof APK signature detection (`FakePay`, `Spoof Paytm`) with `SUSPECT_TAMPERING` verdict.
   - Missing mandatory 12-digit RRN in claimed completed transfers.
   - Predatory micro-loan receipt anomalies.
2. **Citizen SMS & WhatsApp Phishing Sandbox**:
   - Empty message handling.
   - TRAI DLT header whitelist check (`VK-BESCOM`, `AX-SBIINB`, `MD-HDFCBK`).
   - Personal 10-digit number impersonation critical flag.
   - Customs & Digital Arrest extortion detection.
   - Banking KYC account block panic & APK link payload detection.
   - Telegram task Ponzi triggers.
   - Obfuscated shortlink penalty & contact number extraction.
3. **Statutory Magistrate Docket**:
   - 404 AppError handling for non-existent complaints.
   - Full Section 193 BNSS docket generation with Section 318(4) BNS, Section 66D IT Act, Section 65B electronic certificate exhibits with SHA-256 hashes, and prayer for judicial cognizance.

### Test Results
- **Backend**: `101 passed, 101 total` across 6 test suites (`phase3Intelligence.test.js`, `phase2Intelligence.test.js`, `securityAndLegalCompliance.test.js`, `evidenceSecurity.test.js`, `threatIntelligence.test.js`, `breachService.test.js`).
- **Frontend Production Build**: `Compiled with 0 errors` via `craco build` (`main.004f9a46.js`).

