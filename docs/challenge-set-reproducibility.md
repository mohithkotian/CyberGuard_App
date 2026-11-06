# CyberGuard ML v3 Independent Challenge-Set Benchmark Reproducibility Guide

## 1. Executive Summary & Provenance Disclosure

This document provides complete, verifiable provenance and step-by-step reproduction instructions for the CyberGuard ML v3 215-sample independent challenge evaluation set.

### 1.1 Provenance & Authoring Disclosure
- **Benchmark Artifact**: `tools/challenge_set_v3_200.py`
- **Evaluation Runner**: `tools/evaluate_challenge_set.py`
- **Saved Evidence File**: `research-evidence/ml-evaluation/challenge-set-results.txt`
- **Total Samples**: 215 items
  - **In-Domain Samples**: 195 incidents (exactly 15 items per class across all 13 canonical categories).
  - **Benign Out-of-Distribution (OOD) Queries**: 20 everyday non-cyber prompts (cooking recipes, transit schedules, medical queries, academic questions).
- **Provenance Classification**: The benchmark was authored programmatically and curated to evaluate vocabulary, syntactic phrasing, and out-of-domain robustness beyond the 1,950 training narratives.
- **Academic Limitation**: **These records are NOT sourced from real police First Information Reports (FIRs) or courtroom transcripts, nor were they authored by certified forensic law enforcement personnel.** They serve strictly as a syntactically held-out synthetic stress test to verify model generalization across diverse lexical expressions.

### 1.2 De-duplication and Near-Duplicate Audit History
Prior to final evaluation, a similarity audit against the 1,950-sample training dataset (`ml-service/data/dataset.csv`) revealed that 25 challenge candidates originally carried high lexical overlap ($\ge 0.70$ cosine similarity) with the training generator output. All 25 candidate items were replaced with completely independent scenario descriptions. 
- **Exact Duplicates against Training Set**: 0
- **Cosine Similarity $\ge 0.70$ against Training Set**: 0 pairs (Maximum observed cosine similarity: 0.6925, Mean similarity: 0.3841)

---

## 2. Independent Reproduction Instructions

To reproduce the benchmark evaluation from scratch using repository artifacts:

### 2.1 Prerequisites
Ensure the repository Python virtual environment is active with dependencies installed:
```bash
source .venv/bin/activate
pip install -r ml-service/requirements.txt
```

### 2.2 Execution Command
Execute the evaluation harness:
```bash
python tools/evaluate_challenge_set.py
```
Or directly using the virtual environment interpreter:
```bash
.venv/bin/python tools/evaluate_challenge_set.py
```

### 2.3 Execution Pipeline
1. Loads the serialized model artifact from `ml-service/models/classifier.pkl`.
2. Validates the calibrated confidence threshold ($\tau = 0.20$).
3. Iterates through all 215 records in `tools/challenge_set_v3_200.py`.
4. Computes argmax predictions, softmax confidence scores, and operational rejection status.
5. Saves the complete evaluation report to `research-evidence/ml-evaluation/challenge-set-results.txt`.

---

## 3. Verified Benchmark Results (Reproducible Baseline)

The following metrics are generated directly from the executed pipeline and correspond exactly to `research-evidence/ml-evaluation/challenge-set-results.txt`:

### 3.1 In-Domain Evaluation ($N = 195$)
- **Raw Accuracy ($\text{Argmax}$)**: **98.46%** (192 / 195 correctly classified)
- **Raw Macro Precision**: **98.56%**
- **Raw Macro Recall**: **98.46%**
- **Raw Macro F1-Score**: **98.46%**
- **Weighted F1-Score**: **98.46%**
- **Operational Gated Accuracy ($\ge \tau = 0.20$)**: **97.44%** (190 / 195 correct and accepted)
- **In-Domain False Rejection Rate (FRR)**: **1.03%** (2 / 195 false rejections due to $\text{confidence} < 0.20$)
- **Mean In-Domain Confidence**: **0.5868**

### 3.2 Benign Out-of-Distribution Evaluation ($N = 20$)
- **OOD False Acceptance Rate (FAR)**: **0.00%** (0 / 20 accepted above threshold; zero false positives)
- **OOD Safe Rejection / Handled**: **100.00%** (20 / 20 gated to `other` with `uncertain: true`)
- **Mean OOD Softmax Confidence**: **0.1673** (safely below operational threshold $\tau = 0.20$)

### 3.3 Per-Class Classification Report
```
                    precision    recall  f1-score   support

child_exploitation     1.0000    1.0000    1.0000        15
      crypto_fraud     1.0000    1.0000    1.0000        15
     cyberbullying     0.9375    1.0000    0.9677        15
       data_breach     1.0000    0.9333    0.9655        15
   financial_fraud     0.9375    1.0000    0.9677        15
           hacking     1.0000    1.0000    1.0000        15
    identity_theft     0.9375    1.0000    0.9677        15
   network_attacks     1.0000    1.0000    1.0000        15
      online_fraud     1.0000    1.0000    1.0000        15
             other     1.0000    0.9333    0.9655        15
          phishing     1.0000    1.0000    1.0000        15
        ransomware     1.0000    1.0000    1.0000        15
women_child_safety     1.0000    0.9333    0.9655        15

          accuracy                         0.9846       195
         macro avg     0.9856    0.9846    0.9846       195
      weighted avg     0.9856    0.9846    0.9846       195
```

---

## 4. Verification and Academic Scope

All reproduction steps run synchronously without external API network dependencies. The dataset and test harnesses are self-contained within the Git repository tree.
