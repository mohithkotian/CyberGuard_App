# CyberGuard Research Limitations & Prioritized Future Enhancements

**Document Version**: 3.0.0 (Group-Aware & De-Biased Release)
**Evaluated Revision**: CyberGuard ML v3.0 Architecture
**Publication Target**: IEEE Research Paper Discussion & Limitations Section  
**GitHub Issue Addressed**: #15 (Document Research Limitations and Future Enhancements), Master ML Upgrade (Phases 1–9)

---

## 1. Context & Research Scope

Academic and industrial rigor requires transparent disclosure of the empirical boundaries of the CyberGuard platform. This document delineates verified constraints across data, machine learning, natural language processing, computer vision, legal workflows, and deployment architecture, connecting each limitation to its analytical implication and outlining concrete future research avenues.

---

## 2. Evidence-Based Study Limitations

### 2.1 Synthetic Academic Benchmark Scale & Domain Boundaries (1,950 Records)
- **Identified Constraint**: The experimental benchmark operates on $N = 1,950$ validated text samples across 13 cybercrime attack categories (`ml-service/data/dataset.csv`).
- **Empirical Scope**: Synthetic records were used to guarantee victim anonymity and avoid exposing sensitive real-world investigative details. The v3.0 corpus was structured into 130 scenario families (10 per category) with diverse narrative openings, sentence orderings, and technical modalities to eliminate template repetition artifacts.
- **Analytical Implication**: While template repetition has been eliminated and 5-fold cross-validation is strictly group-aware ($79.48\% \pm 3.21\%$), all 1,950 training records remain synthetically authored. Deep neural models require extensive real-world domain pretraining to avoid synthetic distribution artifacts, supporting the selection of TF-IDF and regularized Logistic Regression ($C=2.0$) for this benchmark.

### 2.2 Synthetic vs. Real-World Language Distribution Gap & Challenge Set Provenance
- **Identified Constraint**: The classifier has been evaluated on group-disjoint held-out test splits ($N=390$), group-aware cross-validation ($N=1,560$), and an independent 215-sample challenge benchmark. It has **not** been benchmarked on a live production stream of uncurated citizen police filings.
- **Challenge Set Provenance Disclosure**: All 215 challenge examples were programmatically authored in code to evaluate lexical generalization outside the training set (achieving 0 exact duplicates and 0 pairs with cosine similarity $\ge 0.70$). **They have not been independently validated or annotated by police desk officers or legal experts**, and the resulting benchmark accuracy ($98.46\%$ raw, $97.44\%$ operational gated) must not be construed as 100% real-world accuracy on uncurated public complaints.
- **Empirical Scope**: Real-world citizen reports frequently contain mixed code-switched languages (e.g. Hinglish, Tanglish), colloquial slang, multi-incident narratives, conversational preamble, and irrelevant emotional distress disclosures.
- **Analytical Implication**: High benchmark accuracy on structured and programmatically authored narratives does not substitute for empirical clinical trials or field validation across live public intake streams.

### 2.3 Out-of-Distribution Rejection & Calibrated Softmax Operating Boundaries
- **Identified Constraint**: In a 13-class softmax distribution, random uninformative probability is $1/13 \approx 0.0769$. On informal or concise natural language complaints, top predictions naturally score between $0.18$ and $0.35$.
- **Empirical Scope**: A naive high confidence threshold (such as $\tau = 0.50$ or $\tau = 0.30$) rejects $40.8\%$ of valid in-domain complaints. Operating at the calibrated threshold $\tau = 0.20$ reduces in-domain false rejection to $14.4\%$ in difficult validation folds while keeping benign out-of-domain false acceptance low ($6.7\%$ in calibration sweeps, $0.0\%$ on the independent challenge set).
- **Analytical Implication**: Raw softmax confidence reflects linear margin distance rather than exact Bayesian posterior certainty. Predictions falling in the marginal zone ($0.15 \le \text{confidence} < 0.25$) are tagged for secondary officer review and safety-net validation.

### 2.4 OCR Accuracy & Visual Evidence Benchmarks
- **Identified Constraint**: While OCR functionality is implemented using Tesseract.js with deterministic regex extraction for 12-digit UTRs and Rupee amounts, **no quantitative word error rate (WER), character error rate (CER), or extraction accuracy benchmark has been measured** across a standardized test dataset of distorted payment screenshots.
- **Empirical Scope**: Screen glare, mobile camera angle tilt, font variations across differing banking apps (e.g., PhonePe vs. Google Pay vs. Paytm), and JPEG compression artifacts impact optical character recognition.
- **Analytical Implication**: OCR extraction performance remains qualitatively functional but empirically unquantified. All extracted financial references must be treated as preliminary and require visual officer confirmation against raw uploaded evidence.

### 2.5 Deployment Cold-Start & Free-Tier Infrastructure Constraints
- **Identified Constraint**: The demonstration environment is deployed on Render and Railway free-tier compute instances.
- **Empirical Scope**: Free-tier web services automatically spin down to zero instances following 15 minutes of inactivity. When a new incoming request triggers a spin-up, cold starts incur a 30 to 60-second gateway delay before the Node.js runtime and Python Gunicorn process accept traffic.
- **Analytical Implication**: Request timeouts observed during cold-start cycles (e.g., Axios 15-second client timeout thresholds) represent hosting platform hibernation rather than internal software logic faults. Production deployments require persistent, auto-scaling compute nodes with keep-alive health pings.

### 2.6 Statutory Notice Automation Boundaries
- **Identified Constraint**: Statutory outputs generated by the platform (Section 65B Electronic Evidence Certificates, Section 94 BNSS Bank Freezes, Section 173 BNSS Zero-FIR transfer dockets, and Telecom Requisition notices) are **procedural drafts**.
- **Empirical Scope**: CyberGuard does not possess direct programmatic API access to core banking networks (NPCI / SFMS) or telecom law enforcement portals. All notices require human review, institutional authorization, and formal digital signature by a designated nodal officer.

---

## 3. Prioritized Future Research & Engineering Roadmap

The following enhancements are proposed as future research directions:

```
+-----------------------------------------------------------------------------------------+
|                              PRIORITIZED FUTURE WORK                                    |
|                                                                                         |
|  [HIGH PRIORITY]                                                                        |
|    1. Multilingual & Code-Mixed NLP Support (IndicBERT / MuRIL / Multilingual DistilBERT)  |
|    2. Population-Scale Empirical Corpus (Collate 5,000+ anonymized real-world cases)    |
|    3. Temperature Scaling & Bayesian Deep Learning for Out-of-Domain Gating             |
|                                                                                         |
|  [MEDIUM PRIORITY]                                                                      |
|    4. Transformer-Based Named Entity Recognition (Token-level contextual PII masking)   |
|    5. Computer Vision Receipt Forgery Model (Error Level Analysis & CNN artifact detect)|
|    6. Centralized Distributed Rate Limiting & Audit Ledger (Redis + Hash-Chained DB)   |
|                                                                                         |
|  [STATUTORY / INTEGRATION PRIORITY]                                                     |
|    7. National Cybercrime Portal Direct API Interoperability (I4C / 1930 CFCFRMS)       |
|    8. Hardware Security Module (HSM) Cryptographic Key Signing for Section 65B Certs   |
+-----------------------------------------------------------------------------------------+
```

1. **Multilingual NLP for Vernacular Cybercrime**:
   - Integrate pre-trained multilingual language models (e.g., IndicBERT, MuRIL) capable of understanding regional dialectic complaint narratives and phonetic Romanized spellings.
2. **Empirical Population-Scale Validation**:
   - Partner with legal aid clinics and law enforcement cyber cells to curate a benchmark dataset of 5,000+ anonymized real-world incident filings across urban and rural demographics.
3. **Bayesian & Temperature Scaling Calibration**:
   - Implement temperature scaling or Dirichlet calibration on neural representations to further decouple epistemic uncertainty from aleatoric text noise.
4. **Contextual Token-Classification NER**:
   - Augment regex masking with transformer-based NER to detect unconventional person names, unformatted rural addresses, and emerging cryptocurrency transaction hashes.
5. **Computer Vision-Based Receipt Tampering Detection**:
   - Supplement OCR text parsing with Error Level Analysis (ELA) and convolutional neural networks to detect spliced pixels, cloned font glyphs, and image manipulation in mobile payment screenshots.
6. **Statutory Bank & Telecom Direct API Interoperability (PLANNED FUTURE WORK)**:
   - Establish secure, authenticated programmatic API connections with central banking dispute networks (e.g. NPCI 1930 / I4C CFCFRMS) and telecom LEA gateways under institutional MoU, replacing manual PDF procedural dispatches.
