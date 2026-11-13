# CyberGuard Revision Report: Comprehensive Section-by-Section Transformation

**Revision Date**: November 2026  
**Document Author**: Senior Academic Research Analyst & IEEE Technical Editor  
**Target Projects**:
1. `CyberGuard_Project_Report_Revised.docx` (and `.pdf`)
2. `CyberGuard_Research_Paper_Revised.docx` (and `.pdf`)  
**Source Baseline**: `c:\Users\Mohith\Desktop\CyberGuard_report.docx` and `c:\Users\Mohith\Desktop\CyberGuard_research.docx`  
**Repository Branch**: `mohithkotian/CyberGuard_App` (main branch)

---

## 1. Executive Summary of Revisions

The two original documents (`CyberGuard_report.docx` and `CyberGuard_research.docx`) described an early exploratory prototype evaluated on a legacy, hand-authored dataset of only **257 synthetic samples** with exploratory holdout accuracy of 74.36%. Over the past development cycles, the CyberGuard platform has matured into a production-grade, distributed cybercrime intelligence system.

This revision thoroughly revamps both documents using verified repository implementation artifacts, establishing:
1. **Canonical v3 Dataset Integration**: Scaled from 257 to **1,950 validated complaint narratives** across 13 balanced attack classes (150 per class) structured across **130 scenario families** (10 per class) to completely eliminate boilerplate template repetition.
2. **Group-Aware Evaluation Rigor**: Replaced random stratified splits with **scenario-family-disjoint partitioning (`GroupKFold`)**, demonstrating an unbiased held-out accuracy of **88.97% (347/390)** and cross-validation accuracy of **79.48% ± 3.21%** (zero group leakage).
3. **Dual-Layer Triage Distinction**: Clearly delineated the mathematical boundary between the Python ML Microservice Out-of-Distribution (OOD) rejection threshold ($\tau = 0.20$) and the Node.js Express keyword fallback heuristics ($\tau = 0.50$).
4. **PrivacyShield Dual-Path Architecture**: Formalized the in-memory tokenization of 15 sensitive PII categories for ML inference versus secure, role-guarded raw persistence in MongoDB for authorized law enforcement desks.
5. **Multi-Modal Forensic Pipeline**: Integrated Tesseract.js OCR and deterministic regex parsing for 12-digit UTRs and UPI IDs, sealed with SHA-256 cryptographic digests and automated procedural statutory notices (Section 65B BSA 2023, Section 94/173 BNSS).
6. **11 Publication-Grade Original Figures**: Replaced low-fidelity conceptual sketches with 11 professional, high-resolution (300 DPI) vector-style architectural, mathematical, and dataflow diagrams.

---

## 2. Detailed Revision Analysis: Project Report (`CyberGuard_Project_Report_Revised.docx`)

| Original Report Section | Original Flaws / Stale Baseline | Revised Project Report Enhancements | Verification Artifact |
| :--- | :--- | :--- | :--- |
| **Title & Front Matter** | Generic layout, lacked VTU/SMVITM institutional formatting and comprehensive Table of Contents. | Formatted according to official university specifications; preserved Dr. Sadananda L (Guide), authors Mohith Raj K Kotian, Nikhil G Shetty, Pradyumna Shettigar, Pruthvi Shetty; added Certificate, Detailed Table of Contents, List of Figures, and List of Tables. | Institutional Records & SMVITM CSE Guidelines |
| **Abstract & Problem** | Vague scope; cited 257 synthetic records; lacked clear definition of triage vs judicial decisions. | Re-anchored in Indian cybercrime scale (I4C trends, UPI fraud volume); formalized complaint tuple $C = (T, D, E, U, t)$; emphasized the financial fraud golden hour and privacy-preservation imperatives. | NCRB 2023, I4C Annual Compendium |
| **System Architecture** | Conceptual diagram lacked port mappings, service boundaries, and internal authentication details. | Added **Figure 1** and **Figure 2** detailing the 4-tier service topology: React 18 SPA (port 3000), React Native Expo (port 8081), Express Gateway (port 5002), Python Flask ML (port 5003), and MongoDB (port 27017) with `X-ML-Secret` header security. | `backend/src/server.js`, `ml-service/src/app.py` |
| **Database Design** | Superficial mention of MongoDB collections without schema attributes or relational constraints. | Added **Figure 11** detailing Mongoose document schemas (`User`, `Complaint`, `Evidence`, `ThreatRecord`, `ChatMessage`), index strategies, and append-only timeline subdocuments. | `backend/src/models/` |
| **ML Methodology** | Brief mention of TF-IDF without mathematical formulation or sublinear scaling equations. | Added **Figure 3** and **Figure 5** containing full mathematical derivations of sublinear TF-IDF, smooth IDF, $L_2$ vector normalization, Multinomial Logistic Regression logit scoring, softmax probabilities, and class-weighted cross-entropy loss. | `ml-service/src/classifier.py` |
| **Dataset Preparation** | Stale 257-sample baseline; no mention of scenario families or template leakage. | Added **Figure 4** and comprehensive dataset tables detailing 1,950 records, 130 scenario families, 80% detailed (1,560) vs 20% concise (390), 98 noisy records (5.03%), and Git CRLF vs LF SHA-256 line-ending analysis. | `ml-service/data/dataset-manifest.json` |
| **Model Evaluation** | Reported 74.36% exploratory accuracy on 39 holdout items; mixed preliminary experiments. | Added **Figure 10** (13x13 confusion matrix) and detailed tables verifying 88.97% holdout accuracy (347/390), 5-fold GroupKFold CV (79.48% ± 3.21%), calibration sweep data, and 215-sample independent challenge set performance. | `research-evidence/ml-evaluation/` |
| **PrivacyShield & PII** | Treated PII masking as general de-identification; did not disclose raw database persistence. | Added **Figure 7** illustrating the dual-path lifecycle: in-memory regex tokenization for model inference vs raw encrypted storage for police desks; included sensitivity and latency benchmarks (0.200 ms avg). | `research-evidence/privacy-evaluation/` |
| **Forensic OCR** | Described OCR as an unverified future concept. | Added **Figure 8** detailing Sharp preprocessing, Tesseract.js text recognition, regex financial parsing (UTRs, UPIs, amounts), SHA-256 evidence integrity hashing, and statutory notice drafting (BSA 65B, BNSS 94/173). | `research-evidence/ocr-evaluation/` |
| **Security & RBAC** | Basic mention of JWT. | Added **Figure 9** detailing role-based endpoint route guards (`user`, `officer`, `admin`), token lifecycle, and public radar anonymization filters. | `backend/src/middleware/auth.js` |
| **Limitations & Ethics** | Glossed over synthetic limitations and legal boundaries. | Dedicated chapter detailing synthetic domain boundaries, softmax calibration constraints, OCR lighting/tilt dependencies, and non-autonomous procedural legal limitations. | `docs/research-limitations.md` |

---

## 3. Detailed Revision Analysis: Research Paper (`CyberGuard_Research_Paper_Revised.docx`)

| Original Paper Section | Original Deficiencies | Revised Research Manuscript Enhancements |
| :--- | :--- | :--- |
| **Title & Header** | Outdated phrasing; lacked formal IEEE conference/transactions running header. | Updated title to reflect group-aware methodology and forensic entity extraction; formatted running headers and footers per IEEE Access / TDSC specifications. |
| **Abstract & Index Terms** | Cited 257 synthetic samples and 0.744 accuracy; lacked clear metric reporting. | Comprehensive IEEE abstract detailing 1,950 samples, 130 scenario families, zero group leakage, 88.97% test accuracy, 79.48% ± 3.21% GroupKFold CV, τ = 0.20 OOD gating, and OCR entity extraction. |
| **Section I: Introduction** | Focused on general cybercrime stats without addressing template leakage or DPDP Act 2023 compliance. | Contextualized within Indian UPI fraud growth and legal statutory frameworks (DPDP Act 2023, BSA 2023, BNSS 2023); clearly stated three core technical contributions. |
| **Section II: Related Work** | Fragmented literature review. | Structured review covering four thematic axes: (1) Crime text classification, (2) Privacy-preserving NLP, (3) Digital evidence integrity, and (4) OOD uncertainty estimation; added 22 formal IEEE citations. |
| **Section III: Problem Formulation** | Lacked mathematical rigor. | Formalized the multi-class complaint triage problem tuple, privacy invariant, epistemic uncertainty invariant, and evidentiary chain of custody. |
| **Section IV: Architecture** | Single block diagram with no dataflow separation. | Embedded **Fig. 1** (multi-tier topology) and **Fig. 2** (end-to-end lifecycle); detailed inter-service security via `X-ML-Secret`. |
| **Section V: Dataset Methodology** | Conflated old v1 and v2 numbers. | Embedded **Fig. 4** and **Table I**; detailed 130 scenario families, 80/20 group split, zero group leakage, and explained the CRLF vs LF SHA-256 verification findings. |
| **Section VI: Feature Formulation** | Textual summary without mathematical definitions. | Embedded **Fig. 3**, **Fig. 5**, and formal numbered mathematical equations for sublinear TF-IDF, logit scoring, softmax probabilities, and class-weighted cross-entropy loss. |
| **Section VII: OOD Gating** | Did not explain why τ = 0.20 was chosen or how it differs from backend fallback. | Embedded **Fig. 6**; detailed the empirical calibration sweep across τ ∈ [0.15, 0.35], explaining that τ = 0.20 prevents the 40.8% false rejection observed at τ = 0.30. |
| **Section VIII: Results & Discussion** | Stale 39-sample holdout metrics. | Embedded **Fig. 10** (13x13 confusion matrix) and **Table II**; reported verified per-class precision, recall, and F1-scores; verified 5-fold GroupKFold cross-validation and 215-sample challenge set results. |
| **Section IX: Evidence & Privacy** | No quantitative OCR or privacy metrics. | Embedded **Fig. 7** and **Fig. 8**; reported 91.67% PII recall, 1.0000 UPI precision/recall, and 1.0000 UTR recall; explained Section 65B BSA cryptographic certificates. |
| **Section X: Security & RBAC** | Minimal mention of access control. | Embedded **Fig. 9**; detailed JWT authentication and endpoint route guards protecting citizen, officer, and admin domains. |
| **Section XI: Limitations & Ethics** | Missing critical disclosures. | Disclosed synthetic benchmark constraints, uncalibrated softmax linear margins, OCR quality dependencies, and human-in-the-loop legal safeguards. |
| **References** | Contained 7 informal references. | Expanded to 22 authoritative, verified peer-reviewed IEEE, NIST, and statutory citations. |

---

## 4. Summary of Output Deliverables

All deliverables have been compiled, verified, and placed on the user's Desktop and project repository:

1. `CyberGuard_Project_Report_Revised.docx` — Complete multi-chapter project report.
2. `CyberGuard_Project_Report_Revised.pdf` — Publication-ready PDF compiled via Microsoft Word.
3. `CyberGuard_Research_Paper_Revised.docx` — IEEE formatted research manuscript.
4. `CyberGuard_Research_Paper_Revised.pdf` — Publication-ready PDF compiled via Microsoft Word.
5. `CyberGuard_Figures/` — Directory containing all 11 original high-resolution (300 DPI) figures.
6. `CyberGuard_Revision_Report.md` — This document.
7. `CyberGuard_Metric_Verification.md` — Audit of every reported metric.
8. `CyberGuard_Source_Gap_Report.md` — Source discrepancy investigation report.
9. `CyberGuard_Final_Quality_Check.md` — Quality assurance verification report.
