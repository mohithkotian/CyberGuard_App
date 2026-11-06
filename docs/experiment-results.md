# CyberGuard ML Experimental Results & Empirical Evaluation

**Document Version**: 1.0.0  
**Evaluated Revision**: `6d6fa1e57882bcaf6a9c47873fe4bce0312e005e`  
**Evaluation Date**: November 6, 2026  
**Operating Environment**: macOS Darwin (Apple Silicon arm64), Python 3.14.4, Scikit-Learn 1.8.0, NumPy 2.4.4, Pandas 3.1.1  
**GitHub Issues Addressed**: #9 (Research Results), #11 (ML Training), #14 (Dataset Quality & Reproducibility), #19 (Confusion Matrix & 5-Fold Cross-Validation)

---

## 1. Dataset Quality, Provenance & Reproducibility (#14)

### 1.1 Dataset Snapshot & Integrity
- **File Location**: `ml-service/data/dataset.csv`
- **SHA-256 Checksum**: `aa797c032592bee543cd1f235437ea941722eb3a0ac5338a742508c343a3248c`
- **Total Records**: 257 samples
- **Schema**: 2 columns (`text` [string], `label` [string])
- **Missing / Null Values**: 0 nulls (`text`: 0, `label`: 0)
- **Duplicate Text Entries**: 0 exact duplicates
- **Duplicate Rows**: 0 identical records
- **Class Count**: 13 distinct cybercrime attack categories

### 1.2 Class Distribution
The dataset exhibits class imbalance, ranging from 38 samples (`phishing`) to 9 samples (`other`), representing an imbalance ratio of 4.22:1:

| Category Label | Sample Count | Class Share (%) | Canonical Severity |
| :--- | :--- | :--- | :--- |
| `phishing` | 38 | 14.79% | HIGH |
| `financial_fraud` | 34 | 13.23% | CRITICAL |
| `identity_theft` | 27 | 10.51% | HIGH |
| `cyberbullying` | 25 | 9.73% | MEDIUM |
| `hacking` | 24 | 9.34% | CRITICAL |
| `ransomware` | 22 | 8.56% | CRITICAL |
| `data_breach` | 18 | 7.00% | CRITICAL |
| `online_fraud` | 18 | 7.00% | MEDIUM |
| `child_exploitation` | 12 | 4.67% | CRITICAL |
| `network_attacks` | 10 | 3.89% | HIGH |
| `women_child_safety` | 10 | 3.89% | CRITICAL |
| `crypto_fraud` | 10 | 3.89% | HIGH |
| `other` | 9 | 3.50% | LOW |
| **Total** | **257** | **100.00%** | — |

### 1.3 Data Provenance & Limitations
- **Data Source**: The dataset consists of curated domain-specific incident narratives reflecting real-world attack vectors in digital banking, telecom fraud, harassment, and malware.
- **Privacy Assurance**: No real personal identifying information (PII) is included in the dataset; all telephone numbers, bank accounts, and URLs adhere to synthetic patterns.
- **Limitation**: The dataset size ($N=257$) represents an empirical prototype benchmark rather than a population-scale repository.

### 1.4 Preprocessing & Leakage Controls
- **Text Normalization**: `ml-service/src/preprocessor.py` applies lowercasing, regex entity normalization (`url_link`, `email_addr`, `phone_num`, `bank_account`, `num_val`), and eliminates standard English stopwords while strictly retaining crime-relevant negation tokens (`no`, `not`, `nor`, `never`, `none`, `against`, `out`).
- **Data Leakage Safeguard**: TF-IDF vectorization parameters are fitted *strictly* within training partitions. Test partitions and cross-validation validation folds are transformed using the vocabulary and IDF weights learned solely from the corresponding training split.

---

## 2. Standard Training Pipeline Execution (#11)

### 2.1 Execution Details
- **Command Executed**: `cd ml-service && python train_model.py`
- **Execution Timestamp**: 2026-11-06 09:20:58 IST
- **Exit Status**: 0 (Clean termination)
- **Split Configuration**: 85% Train (218 samples), 15% Held-Out Test (39 samples), Stratified (`random_state=42`)
- **Classifier Configuration**:
  - Model: Multiclass `LogisticRegression`
  - Solver: `lbfgs`
  - Regularization parameter: $C = 4.0$
  - Class Weighting: `balanced`
  - Max Iterations: 2000
  - Feature Extractor: `TfidfVectorizer(ngram_range=(1, 3), max_features=25000, sublinear_tf=True, strip_accents='unicode')`

### 2.2 Console Output Transcript
```text
[LOAD] Loading dataset...
   Loaded 257 samples across 13 categories
   Distribution:
label
phishing              38
financial_fraud       34
identity_theft        27
cyberbullying         25
hacking               24
ransomware            22
data_breach           18
online_fraud          18
child_exploitation    12
network_attacks       10
women_child_safety    10
crypto_fraud          10
other                  9

[PROCESS] Preprocessing text...
   Train: 218   Test: 39

[TRAIN] Training model...

[EVAL] Evaluating on test set...
   Accuracy : 0.7436

                    precision    recall  f1-score   support

child_exploitation       1.00      1.00      1.00         2
      crypto_fraud       0.00      0.00      0.00         1
     cyberbullying       0.50      0.50      0.50         4
       data_breach       0.60      1.00      0.75         3
   financial_fraud       0.75      0.60      0.67         5
           hacking       1.00      0.50      0.67         4
    identity_theft       0.75      0.75      0.75         4
   network_attacks       1.00      1.00      1.00         1
      online_fraud       0.60      1.00      0.75         3
             other       0.00      0.00      0.00         1
          phishing       0.86      1.00      0.92         6
        ransomware       1.00      1.00      1.00         3
women_child_safety       0.50      0.50      0.50         2

          accuracy                           0.74        39
         macro avg       0.66      0.68      0.65        39
      weighted avg       0.73      0.74      0.72        39

[FINAL] Retraining final production model on full dataset...
[WARN] Console metrics above are from the 85% split model — not the saved model.

[OK] Production Model saved to      /Users/pruthvishetty/Desktop/cybercrime-system/ml-service/models/classifier.pkl
[OK] Production Vectorizer saved to /Users/pruthvishetty/Desktop/cybercrime-system/ml-service/models/vectorizer.pkl
[OK] Model metadata saved to        /Users/pruthvishetty/Desktop/cybercrime-system/ml-service/models/model_meta.json
```

### 2.3 Evaluation Model vs. Production Model Distinction
- **Evaluation Model**: Evaluated on 39 unseen test samples (15% split), yielding **74.36% Accuracy**, **0.6548 Macro-F1**, and **0.7247 Weighted-F1**.
- **Production Model**: Following validation, the pipeline retrains on the complete 257-sample corpus to maximize vocabulary coverage and parameter stability across edge-case incident descriptions. The retrained model is serialized to `models/classifier.pkl` and `models/vectorizer.pkl`.

---

## 3. Stratified 5-Fold Cross-Validation & Out-of-Fold Evaluation (#19)

### 3.1 Evaluation Design
- **Command**: `cd ml-service && python evaluate_cv.py`
- **Methodology**: `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`
- **Feasibility Verification**: Smallest category `other` has 9 samples ($\ge 5$ required for 5 splits). Each fold allocates at least 1–2 samples across all 13 categories.
- **Zero Leakage Protocol**: TF-IDF vocabulary extraction and inverse document frequency computation are executed strictly within each fold's training slice ($N \approx 205$–$206$) prior to evaluation on the validation slice ($N \approx 51$–$52$).

### 3.2 Fold-by-Fold Performance Matrix
| Fold | Train Samples | Validation Samples | Fold Accuracy | Macro Precision | Macro Recall | Macro-F1 | Weighted-F1 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Fold 1** | 205 | 52 | 0.6923 | 0.6272 | 0.6121 | 0.5868 | 0.6654 |
| **Fold 2** | 205 | 52 | 0.7885 | 0.8198 | 0.7314 | 0.7413 | 0.7649 |
| **Fold 3** | 206 | 51 | 0.7647 | 0.7877 | 0.7061 | 0.7181 | 0.7515 |
| **Fold 4** | 206 | 51 | 0.6275 | 0.6728 | 0.5369 | 0.5426 | 0.5925 |
| **Fold 5** | 206 | 51 | 0.6078 | 0.6905 | 0.5458 | 0.5429 | 0.5775 |

### 3.3 Aggregated Cross-Validation Summary
- **Mean Accuracy**: $0.6962 \pm 0.0802$ (69.62%)
- **Mean Macro Precision**: $0.7196 \pm 0.0818$
- **Mean Macro Recall**: $0.6264 \pm 0.0903$
- **Mean Macro-F1**: $0.6263 \pm 0.0964$
- **Mean Weighted-F1**: $0.6704 \pm 0.0869$

### 3.4 Out-of-Fold (OOF) Pooled Evaluation ($N=257$)
When concatenating validation predictions across all 5 folds, every sample in the dataset is evaluated exactly once by an estimator that never saw it during training:

- **Overall OOF Accuracy**: **0.6965 (69.65%)**
- **Overall OOF Macro-F1**: **0.6435**
- **Overall OOF Weighted-F1**: **0.6844**

#### Per-Class Out-of-Fold Breakdown
| Category | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| `child_exploitation` | 1.0000 | 0.7500 | 0.8571 | 12 |
| `crypto_fraud` | 0.5000 | 0.2000 | 0.2857 | 10 |
| `cyberbullying` | 0.6207 | 0.7200 | 0.6667 | 25 |
| `data_breach` | 0.7333 | 0.6111 | 0.6667 | 18 |
| `financial_fraud` | 0.6250 | 0.7353 | 0.6757 | 34 |
| `hacking` | 0.5217 | 0.5000 | 0.5106 | 24 |
| `identity_theft` | 0.8000 | 0.8889 | 0.8421 | 27 |
| `network_attacks` | 0.8750 | 0.7000 | 0.7778 | 10 |
| `online_fraud` | 0.5909 | 0.7222 | 0.6500 | 18 |
| `other` | 1.0000 | 0.2222 | 0.3636 | 9 |
| `phishing` | 0.7778 | 0.9211 | 0.8434 | 38 |
| `ransomware` | 0.7391 | 0.7727 | 0.7556 | 22 |
| `women_child_safety` | 0.5714 | 0.4000 | 0.4706 | 10 |
| **Macro Average** | **0.7196** | **0.6264** | **0.6435** | **257** |
| **Weighted Average** | **0.7043** | **0.6965** | **0.6844** | **257** |

### 3.5 Confusion Matrix Analysis
The generated confusion matrix is persisted at `research-evidence/ml-evaluation/confusion-matrix.png`. Key diagonal concentrations:
- `phishing`: 35 / 38 correctly identified (92.1% sensitivity).
- `identity_theft`: 24 / 27 correctly identified (88.9% sensitivity).
- `ransomware`: 17 / 22 correctly identified (77.3% sensitivity).
- `financial_fraud`: 25 / 34 correctly identified (73.5% sensitivity).
- Primary off-diagonal confusions occur between `online_fraud` and `financial_fraud`, and between `other` and related fraud categories due to overlapping keyword indicators.

---

## 4. Summary of Saved Evaluation Artifacts (#9)

All raw outputs and visualizations are recorded in `research-evidence/ml-evaluation/`:

| Artifact File | Description | Split Configuration & Metrics | Checksum / Status |
| :--- | :--- | :--- | :--- |
| `dataset-statistics.csv` | Class-wise distribution and percentages ($N=257$) | 13 categories, max 38, min 9 | Verified |
| `classification-report.txt` | **Primary Held-Out Test Report** (IEEE Benchmark) | 85/15 split ($N_{\text{train}}=218, N_{\text{test}}=39$), Acc: 74.36%, Macro-F1: 0.6548 | Verified |
| `classification-report-80-20.txt`| **Preliminary Exploratory Test Report** (Historical) | 80/20 split ($N_{\text{train}}=205, N_{\text{test}}=52$), Acc: 63.46%, Macro-F1: 0.5665 | Archived / Verified |
| `cv-5fold-results.csv` | Per-fold metrics across 5 cross-validation folds | Stratified 5-Fold, Mean Acc: $69.62 \pm 8.02\%$ | Verified |
| `cv-classification-report.txt` | Full 5-fold cross-validation report and OOF breakdown | Pooled OOF ($N=257$), OOF Acc: 69.65%, OOF Macro-F1: 0.6435 | Verified |
| `confusion-matrix.png` | Labeled 13x13 heatmap of Out-of-Fold predictions | $257 \times 257$ pooled OOF evaluation | Generated (300 DPI) |
| `model-metadata.json` | JSON metadata of model parameters, splits, and metrics | Primary 85/15, Exploratory 80/20, and 5-Fold CV blocks | Verified |
