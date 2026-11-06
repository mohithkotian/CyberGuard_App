# CyberGuard Technical Claims & Capability Audit

**Document Version**: 1.0.0  
**Evaluated Revision**: `6d6fa1e57882bcaf6a9c47873fe4bce0312e005e`  
**Audit Date**: November 6, 2026  
**GitHub Issue Addressed**: #13 (Audit Unsupported Feature & Functionality Claims)

---

## 1. Audit Framework & Disposition Taxonomy

Every technical claim identified across the README, codebase documentation, and API architecture has been verified against the underlying implementation, test suites, and deployment configuration. Claims are classified into one of six explicit disposition categories:

1. **`VERIFIED_IMPLEMENTED`**: Fully implemented, active in codebase, verified with automated unit/integration tests or runtime execution.
2. **`PARTIALLY_IMPLEMENTED`**: Implemented with documented constraints or scope boundaries (e.g., regex-based rather than ML-based, or single-node rather than distributed).
3. **`DRAFT_TEMPLATE_GENERATION`**: Formats and generates legally structured procedural drafts (e.g., Section 65B certificates, FIR drafts, bank freeze notices) requiring manual officer signature or judicial transmission.
4. **`SIMULATED_LOCAL_FALLBACK`**: High-fidelity local database or deterministic heuristic engine providing simulated or offline responses when live external third-party APIs are unconfigured.
5. **`PLANNED_FUTURE_WORK`**: Conceptual or architectural capability not yet implemented in the current code revision.
6. **`UNSUPPORTED_OVERSTATED`**: Deprecated or inaccurate claim requiring qualification or removal.

---

## 2. Claim-to-Evidence Verification Inventory

| # | Feature / Claim Area | Documented Claim Location | Implementation & Code Evidence | Verified Disposition | Technical Notes & Scope Clarification |
|---|---|---|---|---|---|
| **1** | **ML Classification** | `README.md` (Key Features), `docs/system-methodology.md` | `ml-service/src/classifier.py`, `train_model.py` | `VERIFIED_IMPLEMENTED` | Multinomial Logistic Regression ($C=4.0$, L-BFGS, balanced weights) with TF-IDF (1–3 n-grams). Note: Standard uncalibrated softmax output, not CalibratedClassifierCV. |
| **2** | **PII Masking & Privacy Shield** | `README.md` (Privacy Architecture), `docs/system-methodology.md` | `backend/src/utils/privacyShield.js`, `modelPrivacy.js` | `VERIFIED_IMPLEMENTED` | 18-stage deterministic regex pipeline covering URLs, UPI, emails, phone numbers, Aadhaar, PAN, and bank accounts before ML forwarding. |
| **3** | **Internal ML Service Auth** | `README.md` (Architecture), `ml-service/src/app.py` | `ml-service/src/app.py` lines 99–123, `mlService.js` | `VERIFIED_IMPLEMENTED` | Enforces `X-ML-Secret` header validation using constant-time `hmac.compare_digest`. Production mode fails closed (HTTP 500) if unset. |
| **4** | **ML Microservice Rate Limiting** | `README.md` (Key Features), `ml-service/src/app.py` | `ml-service/src/app.py` lines 84–90, 161 | `VERIFIED_IMPLEMENTED` | 30 req/min on `/predict`, 10 req/min on `/batch-predict` via Flask-Limiter in-memory storage (single-worker process). |
| **5** | **Zero-Downtime ML Fallback** | `docs/system-methodology.md` | `backend/src/services/mlService.js` lines 60–191 | `VERIFIED_IMPLEMENTED` | Catches connection errors or timeouts and falls back to deterministic regex heuristics (`localRuleClassification`). Verified by test suite. |
| **6** | **OCR Financial Extraction** | `README.md` (Forensics & OCR), `docs/system-methodology.md` | `backend/src/services/ocrService.js` | `VERIFIED_IMPLEMENTED` | Tesseract.js (`eng` model) extracts raw text; regex parses UPI IDs, phone numbers, 12-digit UTR/RRN references, and Rupee amounts. |
| **7** | **Receipt Forgery Detection** | `docs/system-methodology.md` | `backend/src/services/ocrService.js` lines 111–181 | `PARTIALLY_IMPLEMENTED` | Rule-based integrity score based on keyword match for spoof APK generator signatures (`fakepay`) and missing RRNs on high-value receipts. Not an image pixel/ELA model. |
| **8** | **Evidence SHA-256 Hashing** | `README.md`, `backend/src/utils/evidenceSecurity.js` | `backend/src/utils/evidenceSecurity.js`, `Complaint.js` | `VERIFIED_IMPLEMENTED` | Computes SHA-256 hash on intake stream, verifies binary magic bytes, persists hash in MongoDB record and `chainOfCustody` array. |
| **9** | **Public Evidence Validator** | `backend/src/routes/security.js` | `backend/src/routes/security.js` lines 180–230 | `VERIFIED_IMPLEMENTED` | Route `POST /api/security/verify-integrity` queries database by SHA-256 hash, notice reference, or docket ID. |
| **10** | **Threat Intelligence Domain Matching** | `backend/src/utils/threatIntelligence.js` | `backend/src/utils/threatIntelligence.js` | `VERIFIED_IMPLEMENTED` | Exact hostname and dot-boundary subdomain matching with explicit `AUTHORITY_DOMAINS` allowlist to eliminate false positives on legitimate sites. |
| **11** | **Breach Monitoring & Leak Detection** | `README.md` (Features), `backend/src/services/breachService.js` | `backend/src/services/breachService.js` | `SIMULATED_LOCAL_FALLBACK` | Real-time DNS MX lookup + local catalog of historical corporate breaches (`HISTORICAL_BREACH_CATALOG`). Live HaveIBeenPwned API requires external key. |
| **12** | **Banking Freeze Directives** | `backend/src/utils/phase6Intelligence.js` | `backend/src/utils/phase6Intelligence.js`, `complaintsController.js` | `DRAFT_TEMPLATE_GENERATION` | Generates standardized Section 91 CrPC / Section 94 BNSS notices with UTRs and victim declarations for manual delivery to nodal bank officers. |
| **13** | **Section 65B Electronic Certificates** | `backend/src/utils/section65bGenerator.js` | `backend/src/utils/section65bGenerator.js` | `DRAFT_TEMPLATE_GENERATION` | Formats electronic evidence affidavit drafts pursuant to Section 63(4) BSA / Section 65B IEA. Contains statutory disclaimer on judicial admissibility. |
| **14** | **First Information Report (FIR) Drafting** | `backend/src/utils/phase8Intelligence.js` | `backend/src/utils/phase8Intelligence.js` | `DRAFT_TEMPLATE_GENERATION` | Drafts structured criminal complaint petitions mapping incident details to Indian Penal Code / Bharatiya Nyaya Sanhita (BNS) 2023 legal sections. |
| **15** | **Telecom Information Requisitions** | `backend/src/utils/telecomRequisition.js` | `backend/src/utils/telecomRequisition.js` | `DRAFT_TEMPLATE_GENERATION` | Formats CDR / IPDR requisition notices under DoT Unified License Condition 39.20 & Section 67C IT Act 2000. Not a direct telecom API gateway. |
| **16** | **Static Artifact Inspection** | `backend/src/utils/artifactForensics.js`, `ForensicScanner.js` | `backend/src/utils/artifactForensics.js` | `VERIFIED_IMPLEMENTED` | Static heuristic inspection (entropy calculation, suspicious string matching, manifest analysis). Not dynamic sandbox detonation. |
| **17** | **Zero-Trust Role-Based Access Control** | `README.md` (Overview), `auth.js` | `backend/src/middleware/auth.js`, `authController.js` | `VERIFIED_IMPLEMENTED` | Multi-tier boundary checks on complaint ownership (`checkComplaintAccess`), JWT blacklisting, and registration role lockdown (`role: 'user'`). |
| **18** | **Two-Factor Authentication (2FA)** | `backend/src/controllers/authController.js` | `backend/src/controllers/authController.js` lines 52–60 | `VERIFIED_IMPLEMENTED` | Generates TOTP secret via `speakeasy`, presents QR code, requires 6-digit challenge verification during login when enabled. |
| **19** | **Live Core Banking API Direct Freezes** | Historical documentation | None (No NPCI / SFMS direct integration) | `PLANNED_FUTURE_WORK` | Direct programmatic freezing requires integration with central bank gateways (e.g. NPCI 1930 / I4C CFCFRMS), currently modeled as notice drafts. |
| **20** | **Automated Telecom Gateway Subpoenas** | Historical documentation | None (No direct telecom carrier APIs) | `PLANNED_FUTURE_WORK` | Direct electronic dispatch to telco LEA portals requires dedicated government agency clearance; currently handled via standardized formal notice PDFs. |

---

## 3. Corrective Adjustments Applied to Documentation

1. **ML Probability Calibration**: Removed references to "Calibrated Logistic Regression" in technical documentation; clarified that the production model uses standard multiclass Logistic Regression with balanced weighting.
2. **Malware Detonation vs. Static Inspection**: Verified that `/detonate-artifact` executes static heuristic analysis rather than live kernel-level sandboxed detonation; rebranded all user-facing labels to "Static Artifact Inspection (ISO/IEC 27037)".
3. **Statutory Notice Generation**: Explicitly labeled all banking freezes, magistrate dockets, Section 65B certificates, and telecom requisitions as **Procedural Drafts** requiring statutory officer verification and dispatch, avoiding any false claim of automated unassisted law enforcement execution.
