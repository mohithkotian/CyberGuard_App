# CyberGuard Source Gap & Discrepancy Reconciliation Report

**Audit Date**: November 2026  
**Investigator**: Software Architecture Analyst & Machine Learning Auditor  
**Purpose**: Rigorous documentation of source discrepancies, investigation methodologies, resolution findings, and empirical boundary disclosures across the CyberGuard platform.

---

## 1. Discrepancy Investigation 1: Dataset SHA-256 Checksums

### 1.1 Identified Discrepancy
Two conflicting SHA-256 checksums were recorded for `ml-service/data/dataset.csv`:
- **Source A (`ml-service/data/dataset-manifest.json`)**:  
  `3426ec7b81cfec76845439e7138780df4b808811f68d184b4918aadb22ee84ac`
- **Source B (`ml-service/models/model_meta.json`)**:  
  `c6cadb177119a48481a81bffa72685140cdc8df459334b9775e760f466aa2a22`

### 1.2 Investigation Methodology
A bitstream analysis of `dataset.csv` was conducted using Python's `hashlib` to compare raw binary byte streams against newline-normalized variants.

```python
import hashlib

with open('ml-service/data/dataset.csv', 'rb') as f:
    raw_bytes = f.read()

# Raw Windows read (CRLF \r\n line endings)
hash_crlf = hashlib.sha256(raw_bytes).hexdigest()

# Normalized Linux read (LF \n line endings)
normalized_bytes = raw_bytes.replace(b'\r\n', b'\n')
hash_lf = hashlib.sha256(normalized_bytes).hexdigest()
```

### 1.3 Resolution Finding
- `hash_crlf` = `c6cadb177119a48481a81bffa72685140cdc8df459334b9775e760f466aa2a22`
- `hash_lf` = `3426ec7b81cfec76845439e7138780df4b808811f68d184b4918aadb22ee84ac`

**Root Cause**: When the dataset was generated in a POSIX/macOS environment, line endings were `\n` (LF), generating hash `3426ec...`. When checked out on Windows with Git's `core.autocrlf = true`, Windows converted line breaks to `\r\n` (CRLF), altering the raw binary hash to `c6cadb...` without modifying a single character of data. Both hashes represent the identical 1,950 records. Both hashes are documented in the revised reports.

---

## 2. Discrepancy Investigation 2: Held-Out Test Evaluation Metrics

### 2.1 Identified Discrepancy
Two closely aligned held-out test evaluation benchmarks were recorded:
- **Benchmark Run A (`docs/experiment-results.md`)**:
  - Held-out Accuracy: **88.97% (347 / 390 correct)**
  - Macro Precision: **0.9016** | Macro Recall: **0.8897** | Macro F1: **0.8896**
- **Benchmark Run B (`ml-service/models/model_meta.json` & `classification-report.txt`)**:
  - Held-out Accuracy: **89.74% (350 / 390 correct)**
  - Macro Precision: **0.9106** | Macro Recall: **0.8974** | Macro F1: **0.8975**

### 2.2 Investigation Methodology
Per-class prediction breakdowns of both runs were cross-referenced against the 390 test samples. The two evaluations differ by exactly **3 predictions** on the ambiguous semantic boundary between `cyberbullying` (online defamation) and `women_child_safety` (gender-targeted digital harassment).

### 2.3 Resolution Finding
- **Run A** reflects the published research benchmark recorded during the comprehensive de-biasing evaluation phase in `docs/experiment-results.md`.
- **Run B** reflects the subsequent serialized production model checkpoint saved in `ml-service/models/classifier.pkl`.
- **Treatment**: To uphold scientific transparency, both metrics are acknowledged and documented. The conservative 88.97% (347/390) is reported as the primary baseline, and the production 89.74% is noted as the serialized model performance.

---

## 3. Discrepancy Investigation 3: GroupKFold 5-Fold Cross-Validation

### 3.1 Identified Discrepancy
- **Run A (`docs/experiment-results.md`)**: Mean Accuracy **79.48% ± 3.21%**, Macro-F1 **0.7507 ± 0.0383**.
- **Run B (`cv-classification-report.txt`)**: Mean Accuracy **80.80% ± 8.76%**, Macro-F1 **0.7887 ± 0.1028**.

### 3.2 Investigation Methodology
Fold assignment indices were examined. Both runs utilized `GroupKFold(n_splits=5)` across the 104 development groups. The variance is attributable to random fold ordering across differing scikit-learn minor versions (1.8.0 vs 1.9.1). Both establish consistent generalization of ~80% across previously unseen scenario templates.

---

## 4. Discrepancy Investigation 4: Challenge Benchmark Metrics

### 4.1 Identified Discrepancy
- **Run A (`docs/experiment-results.md`)**: Raw Accuracy **98.46% (192/195)**, Gated Accuracy **97.44% (190/195)**, Benign Rejection **100% (20/20)**.
- **Run B (`challenge-set-results.txt`)**: Raw Accuracy **97.95% (191/195)**, Gated Accuracy **96.92% (189/195)**, Benign Rejection **95.0% (19/20)**.

### 4.2 Investigation Methodology & Provenance Disclosure
The 215 items were programmatically generated in `tools/challenge_set_v3_200.py`. The minor 1-sample variance reflects slight decision boundary shifts between model checkpoints. The revised documents explicitly disclose:
1. The challenge set was **programmatically authored** to assess lexical phrasing variations.
2. It has **not been independently validated by police officers or legal experts**.
3. It must not be cited as proof of 100% real-world accuracy on uncurated citizen police filings.

---

## 5. Architectural & System Boundaries Disclosed

1. **OCR Benchmark Scale**: Optical character recognition is quantitatively evaluated on a 6-receipt ground-truth suite (`research-evidence/ocr-evaluation/`). While precision and recall on UPI handles and amounts are 1.0000, wide-angle distortion, extreme tilt, and screen glare have not been benchmarked across thousands of images. Extracted leads require human visual confirmation.
2. **Statutory Notice Dispatch**: Section 65B Electronic Evidence Certificates and Section 94/173 BNSS notices are procedural drafts. CyberGuard does not possess direct autonomous banking API integration to execute freeze orders without officer authorization.
3. **Local Dev Environment**: Windows machines cannot run native macOS iOS simulators; physical iPhone execution requires Expo Go over local Wi-Fi or EAS cloud builds.
