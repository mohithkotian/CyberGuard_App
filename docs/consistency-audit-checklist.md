# CyberGuard Research Paper & Repository Consistency Audit Checklist

**Document Version**: 1.0.0  
**Evaluated Revision**: `6d6fa1e57882bcaf6a9c47873fe4bce0312e005e`  
**Audit Date**: November 6, 2026  
**Auditor**: Automated Verification & Integrity Audit Suite  
**GitHub Issue Addressed**: #12 (Final Research Paper and Repository Consistency Audit)

---

## 1. Executive Summary

This consistency audit provides an item-by-item verification cross-checking the IEEE research documentation, technical README, experimental artifacts, and source code implementation. The audit confirms that every reported metric, architectural claim, security evaluation finding, and operational constraint is traceable to verified commands and code references.

---

## 2. Paper-to-Repository Consistency Checklist

| # | Document Section / Claim | Stated Paper / Documentation Value | Verified Source / Artifact Reference | Consistency Status | Required Correction or Qualification |
|---|---|---|---|---|---|
| **1** | **Dataset Size** | 257 samples across 13 classes | `ml-service/data/dataset.csv`, `docs/experiment-results.md` | **MATCH (VERIFIED)** | None. Checksum `aa797c032...` verified. |
| **2** | **Class Distribution** | Max: `phishing` (38), Min: `other` (9); Imbalance 4.22:1 | `research-evidence/ml-evaluation/dataset-statistics.csv` | **MATCH (VERIFIED)** | Disclosed in methodology & limitations. |
| **3** | **Held-Out Test Accuracy** | 74.36% (0.7436) on 85/15 test split ($N=39$) | `ml-service/train_model.py` execution output | **MATCH (VERIFIED)** | Clarified as 85/15 held-out split, not full-model CV. |
| **4** | **Held-Out Test Macro-F1** | 0.6548 (0.65) | `docs/experiment-results.md` Section 2.2 | **MATCH (VERIFIED)** | Traceable to classification report output. |
| **5** | **Held-Out Test Weighted-F1**| 0.7247 (0.72) | `docs/experiment-results.md` Section 2.2 | **MATCH (VERIFIED)** | Traceable to classification report output. |
| **6** | **5-Fold CV Mean Accuracy** | $0.6962 \pm 0.0802$ (69.62%) | `research-evidence/ml-evaluation/cv-5fold-results.csv` | **MATCH (VERIFIED)** | Executed via `evaluate_cv.py` (zero-leakage fold split). |
| **7** | **5-Fold CV Mean Macro-F1** | $0.6263 \pm 0.0964$ | `research-evidence/ml-evaluation/cv-classification-report.txt` | **MATCH (VERIFIED)** | Verified with StratifiedKFold ($K=5$). |
| **8** | **5-Fold CV Mean Weighted-F1** | $0.6704 \pm 0.0869$ | `research-evidence/ml-evaluation/cv-classification-report.txt` | **MATCH (VERIFIED)** | Verified across all 5 validation splits. |
| **9** | **Out-of-Fold (OOF) Accuracy**| 0.6965 (69.65%) pooled over $N=257$ | `docs/experiment-results.md` Section 3.4 | **MATCH (VERIFIED)** | Every sample evaluated once by an out-of-fold estimator. |
| **10**| **Out-of-Fold (OOF) Macro-F1** | 0.6435 pooled over $N=257$ | `docs/experiment-results.md` Section 3.4 | **MATCH (VERIFIED)** | Traceable to OOF classification report. |
| **11**| **Model Architecture** | TF-IDF (1–3 ngrams, 25k max features) + Multinomial Logistic Regression ($C=4.0$, L-BFGS, balanced) | `ml-service/src/classifier.py`, `train_model.py` | **MATCH (VERIFIED)** | Clarified: NOT probability-calibrated in production. |
| **12**| **Service-to-Service ML Auth**| Server-to-server `X-ML-Secret` header validated via `hmac.compare_digest`; fails closed (HTTP 500) | `ml-service/src/app.py` lines 99–123, `mlService.js` | **MATCH (VERIFIED)** | Verified by `ml-service/test_security.py`. |
| **13**| **ML Microservice Rate Limits**| 30 req/min on `/predict`, 10 req/min on `/batch-predict` | `ml-service/src/app.py` lines 161, 187 | **MATCH (VERIFIED)** | Verified with automated flood test. |
| **14**| **Zero-Downtime Fallback** | Heuristic regex classifier with 13 category patterns | `backend/src/services/mlService.js` lines 60–191 | **MATCH (VERIFIED)** | Verified by `mlService.test.js`. |
| **15**| **PII Masking Pipeline** | 18 deterministic regex stages executed in strict precedence | `backend/src/utils/privacyShield.js`, `modelPrivacy.js` | **MATCH (VERIFIED)** | Evaluated in `privacy-evaluation/evaluation-results.csv`. |
| **16**| **OCR Financial Extraction** | Tesseract.js (`eng`) parsing phone, UPI, 12-digit UTR, and amounts | `backend/src/services/ocrService.js` | **MATCH (VERIFIED)** | Verified by unit tests. Evaluated in `ocr-evaluation/`. |
| **17**| **Evidence Integrity** | Binary magic numbers checked, SHA-256 computed on intake, immutable custody logging | `backend/src/utils/evidenceSecurity.js`, `security.js` | **MATCH (VERIFIED)** | Verified by `evidenceSecurity.test.js` (12 passing tests). |
| **18**| **Public Integrity Verification** | Endpoint `POST /api/security/verify-integrity` | `backend/src/routes/security.js` | **MATCH (VERIFIED)** | Verified by `phase5Intelligence.test.js`. |
| **19**| **Threat Intel Domain Matching** | Dot-boundary matching + `AUTHORITY_DOMAINS` allowlist | `backend/src/utils/threatIntelligence.js` | **MATCH (VERIFIED)** | Verified by `threatIntelligence.test.js` (14 passing tests). |
| **20**| **Backend Test Suite Total** | 13 Suites, 174 Tests Passing (100% success) | Jest test run (`npm --prefix backend test`) | **MATCH (VERIFIED)** | Verified on revision `6d6fa1e` (4.669s runtime). |
| **21**| **Statutory Notice Generation** | Section 65B affidavits, bank freezes, magistrate dockets, FIR drafts | `phase2` to `phase8` intelligence utilities | **MATCH (VERIFIED)** | Labeled as **Procedural Drafts** (manual dispatch). |
| **22**| **Breach Monitoring Status** | Local historical catalog + DNS MX verification; HIBP requires API key | `backend/src/services/breachService.js` | **MATCH (VERIFIED)** | Classified as `SIMULATED_LOCAL_FALLBACK`. |
| **23**| **Pre-Remediation Evidence** | Historical audits (commit `a260f55`) labeled with warning banners | `CYBERGUARD_CODEBASE_EXAMINATION.md`, etc. | **MATCH (VERIFIED)** | Pre-remediation context prominently stated. |

---

## 3. Discrepancies Resolved & Final Disposition

1. **Held-Out Test vs. 5-Fold Cross-Validation Metrics**: Previously, documentation did not clearly separate held-out single-split test metrics ($74.36\%$ accuracy on 39 samples) from cross-validation metrics ($69.62 \pm 8.02\%$ across 5 folds). Both are now explicitly presented with their separate sample partitions and evaluation designs in `docs/experiment-results.md`.
2. **Probability Calibration Clarification**: Removed obsolete references claiming the classifier is "Calibrated Logistic Regression". Both `docs/system-methodology.md` and `README.md` now precisely state that standard Multinomial Logistic Regression is employed.
3. **Statutory Legal Workflows**: Fully qualified banking freeze notices, telecom requisitions, and court dockets as standardized procedural drafts rather than direct live integrations with core banking or telecom switches.
4. **Historical Audit Provenance**: Added warning banners to all historical audit documents to ensure that earlier vulnerabilities (e.g. registration role tampering, IDOR) are recognized as pre-remediation baselines and not confused with current verified security controls.
