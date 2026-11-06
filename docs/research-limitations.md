# CyberGuard Research Limitations & Prioritized Future Enhancements

**Document Version**: 1.0.0  
**Evaluated Revision**: `6d6fa1e57882bcaf6a9c47873fe4bce0312e005e`  
**Publication Target**: IEEE Research Paper Discussion & Limitations Section  
**GitHub Issue Addressed**: #15 (Document Research Limitations and Future Enhancements)

---

## 1. Context & Research Scope

Academic and industrial rigor requires transparent disclosure of the empirical boundaries of the CyberGuard platform. This document delineates verified constraints across data, machine learning, natural language processing, computer vision, legal workflows, and deployment architecture, connecting each limitation to its analytical implication and outlining concrete future research avenues.

---

## 2. Evidence-Based Study Limitations

### 2.1 Small Synthetic Dataset (257 Records)
- **Identified Constraint**: The experimental benchmark operates strictly on $N = 257$ curated text samples across 13 cybercrime attack categories (`ml-service/data/dataset.csv`).
- **Empirical Scope**: Synthetic and template-derived records were used to guarantee victim anonymity and avoid exposing sensitive real-world investigative details.
- **Analytical Implication**: While representative of typical citizen incident descriptions, the sample size is limited. Deep neural models (such as transformer-based architectures) cannot be reliably fine-tuned on a corpus of this scale without severe overfitting, which justified the selection of TF-IDF and regularized Logistic Regression.

### 2.2 No Demonstrated Real-World Generalization
- **Identified Constraint**: The classifier has been evaluated exclusively on synthetic and curated held-out test splits ($N=39$) and 5-fold cross-validation ($N=257$). It has **not** been benchmarked on a production stream of real, uncurated citizen filings.
- **Empirical Scope**: Real-world citizen reports frequently contain phonetic misspellings, colloquial slang, multi-incident narratives, conversational preamble, and irrelevant emotional distress disclosures.
- **Analytical Implication**: High held-out accuracy on curated narratives ($74.36\%$) must not be interpreted as empirical proof of equivalent generalization across live public intake streams without field validation studies.

### 2.3 No Measured OCR Accuracy Benchmarks
- **Identified Constraint**: While OCR functionality is implemented using Tesseract.js with deterministic regex extraction for 12-digit UTRs and Rupee amounts, **no quantitative word error rate (WER), character error rate (CER), or extraction accuracy benchmark has been measured** across a standardized test dataset of distorted payment screenshots.
- **Empirical Scope**: Screen glare, mobile camera angle tilt, font variations across differing banking apps (e.g., PhonePe vs. Google Pay vs. Paytm), and JPEG compression artifacts impact optical character recognition.
- **Analytical Implication**: OCR extraction performance remains qualitatively functional but empirically unquantified. All extracted financial references must be treated as preliminary and require visual officer confirmation against raw uploaded evidence.

### 2.4 No Measured Inference Latency Benchmarks
- **Identified Constraint**: The documentation reports classification accuracy and F1 scores, but **does not provide formal end-to-end inference latency benchmarks** (such as $P_{50}$, $P_{95}$, or $P_{99}$ latency distributions under concurrent load).
- **Empirical Scope**: Inference time is subject to single-worker CPU execution, TF-IDF sparse matrix computation, and inter-service HTTP network hops between the Node.js API and the Python Flask microservice.
- **Analytical Implication**: Throughput capacity and latency percentiles under peak surge conditions remain unmeasured empirical parameters that require formal load testing prior to nationwide deployment.

### 2.5 Deployment Cold-Start & Free-Tier Infrastructure Constraints
- **Identified Constraint**: The demonstration environment is deployed on Render and Railway free-tier compute instances.
- **Empirical Scope**: Free-tier web services automatically spin down to zero instances following 15 minutes of inactivity. When a new incoming request triggers a spin-up, cold starts incur a 30 to 60-second gateway delay before the Node.js runtime and Python Gunicorn process accept traffic.
- **Analytical Implication**: Request timeouts observed during cold-start cycles (e.g., Axios 15-second client timeout thresholds) represent hosting platform hibernation rather than internal software logic faults. Production deployments require persistent, auto-scaling compute nodes with keep-alive health pings.

### 2.6 Class Imbalance & Evaluation Variance
- **Identified Constraint**: Class distribution ranges from 38 samples (`phishing`) down to 9 samples (`other`), reflecting a 4.22:1 imbalance ratio.
- **Empirical Scope**: In the 5-fold cross-validation evaluation, individual folds exhibit performance variance (Fold Accuracy ranges from 60.78% in Fold 5 to 78.85% in Fold 2; standard deviation $\pm 0.0802$). Classes with low support (`other`, `crypto_fraud`, `women_child_safety`) show lower recall in certain folds due to the limited number of training instances available to parameterize the L-BFGS decision boundary.

### 2.7 Absence of Probability Calibration in Production
- **Identified Constraint**: The classifier applies standard Multinomial Logistic Regression ($C=4.0$, balanced class weights). Probability calibration (such as Platt scaling via `CalibratedClassifierCV`) is not fitted in the production pipeline.
- **Empirical Scope**: The confidence score returned by `/predict` represents a raw softmax transformation of log-odds ($\sigma(z)_i$). These scores do not strictly conform to empirical posterior probabilities (e.g., a predicted confidence of 0.85 does not mathematically guarantee that 85 out of 100 cases are truly positive). Researchers and law enforcement operators must interpret confidence as relative decision margin rather than statistical certainty.

### 2.8 Statutory Notice Automation Boundaries
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
|    3. Probability Calibration Integration (Platt Scaling & Isotonic Calibration via CV)|
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
3. **Calibrated Confidence Modeling**:
   - Implement out-of-fold Platt scaling (`CalibratedClassifierCV(method='sigmoid', cv='prefit')`) so that confidence percentages mathematically represent true empirical likelihoods.
4. **Contextual Token-Classification NER**:
   - Augment regex masking with transformer-based NER to detect unconventional person names, unformatted rural addresses, and emerging cryptocurrency transaction hashes.
5. **Computer Vision-Based Receipt Tampering Detection**:
   - Supplement OCR text parsing with Error Level Analysis (ELA) and convolutional neural networks to detect spliced pixels, cloned font glyphs, and image manipulation in mobile payment screenshots.
6. **Statutory Bank & Telecom Direct API Interoperability (PLANNED FUTURE WORK)**:
   - Establish secure, authenticated programmatic API connections with central banking dispute networks (e.g. NPCI 1930 / I4C CFCFRMS) and telecom LEA gateways under institutional MoU, replacing manual PDF procedural dispatches.
7. **Production Load & Latency Benchmarking (PLANNED FUTURE WORK)**:
   - Execute formal distributed load testing (Locust / k6) to quantify end-to-end $P_{50}$, $P_{95}$, and $P_{99}$ inference and API latency distributions under concurrent multi-user surges.
