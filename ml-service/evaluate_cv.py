"""
evaluate_cv.py — Stratified 5-Fold Cross-Validation & Out-of-Fold Evaluation
Implements strict leakage-free evaluation for CyberGuard ML classifier (Issue #19).

Key safeguards:
1. TF-IDF vectorizer is fit strictly on each fold's training split (zero val leakage).
2. StratifiedKFold (n_splits=5, shuffle=True, random_state=42).
3. Computes per-fold and aggregated metrics: Accuracy, Precision, Recall, Macro-F1, Weighted-F1.
4. Generates Out-of-Fold (OOF) confusion matrix and classification report across all 257 samples.
5. Saves artifacts in research-evidence/ml-evaluation/ and prints reproducible stdout.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import sklearn
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    precision_recall_fscore_support
)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from preprocessor import TextPreprocessor

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'dataset.csv')
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'research-evidence', 'ml-evaluation')
os.makedirs(OUTPUT_DIR, exist_ok=True)

RANDOM_SEED = 42

def run_cross_validation():
    print("=" * 70)
    print("CYBERGUARD STRATIFIED 5-FOLD CROSS-VALIDATION EVALUATION")
    print("=" * 70)
    print(f"Python version : {sys.version.split()[0]}")
    print(f"Scikit-learn   : {sklearn.__version__}")
    print(f"Random seed    : {RANDOM_SEED}")
    print(f"Data path      : {DATA_PATH}")

    # 1. Load dataset
    df = pd.read_csv(DATA_PATH)
    df.dropna(subset=['text', 'label'], inplace=True)
    df['text'] = df['text'].astype(str)
    df['label'] = df['label'].astype(str)
    
    total_samples = len(df)
    unique_classes = sorted(df['label'].unique().tolist())
    num_classes = len(unique_classes)

    print(f"\nTotal dataset samples: {total_samples}")
    print(f"Distinct categories  : {num_classes}")
    print(f"Categories           : {unique_classes}")
    
    # Preprocess text
    prep = TextPreprocessor()
    df['cleaned'] = df['text'].apply(prep.preprocess)

    X = df['cleaned'].values
    y = df['label'].values

    # Check minimum class frequency
    min_count = df['label'].value_counts().min()
    min_class = df['label'].value_counts().idxmin()
    print(f"\nSmallest category    : '{min_class}' with {min_count} samples.")
    if min_count < 5:
        print(f"[ERROR] Cannot perform 5-fold CV: class '{min_class}' has {min_count} < 5 samples.")
        return False
    else:
        print(f"[OK] Feasible for 5-fold CV: all classes have >= {min_count} samples (>= 5).")

    # 2. Setup Stratified 5-Fold Cross Validation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)

    fold_metrics = []
    oof_predictions = np.empty(total_samples, dtype=object)
    oof_probabilities = np.zeros((total_samples, num_classes))

    print("\n--- Executing 5 Folds ---")
    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y), start=1):
        X_train_f, X_val_f = X[train_idx], X[val_idx]
        y_train_f, y_val_f = y[train_idx], y[val_idx]

        # Fit TF-IDF strictly on training fold only (prevent data leakage)
        vec = TfidfVectorizer(
            max_features=25000,
            ngram_range=(1, 3),
            min_df=1,
            sublinear_tf=True,
            strip_accents='unicode'
        )
        X_train_vec = vec.fit_transform(X_train_f)
        X_val_vec = vec.transform(X_val_f)

        # Classifier specification
        clf = LogisticRegression(
            max_iter=2000,
            C=4.0,
            solver='lbfgs',
            class_weight='balanced',
            random_state=RANDOM_SEED
        )
        clf.fit(X_train_vec, y_train_f)

        # Predictions on validation fold
        val_pred = clf.predict(X_val_vec)
        val_prob = clf.predict_proba(X_val_vec)

        # Store OOF
        oof_predictions[val_idx] = val_pred
        
        # Match probability indices to sorted unique_classes
        clf_classes = list(clf.classes_)
        for i, pred_probs in enumerate(val_prob):
            for cls_idx, cls_name in enumerate(unique_classes):
                if cls_name in clf_classes:
                    prob_idx = clf_classes.index(cls_name)
                    oof_probabilities[val_idx[i], cls_idx] = pred_probs[prob_idx]

        # Compute fold metrics
        acc_f = accuracy_score(y_val_f, val_pred)
        p_m, r_m, f1_m, _ = precision_recall_fscore_support(y_val_f, val_pred, average='macro', zero_division=0)
        p_w, r_w, f1_w, _ = precision_recall_fscore_support(y_val_f, val_pred, average='weighted', zero_division=0)

        fold_metrics.append({
            'fold': fold,
            'train_size': len(train_idx),
            'val_size': len(val_idx),
            'accuracy': acc_f,
            'macro_precision': p_m,
            'macro_recall': r_m,
            'macro_f1': f1_m,
            'weighted_precision': p_w,
            'weighted_recall': r_w,
            'weighted_f1': f1_w
        })

        print(f"Fold {fold}: Train={len(train_idx):3d}, Val={len(val_idx):2d} | "
              f"Acc={acc_f:.4f} | Macro-F1={f1_m:.4f} | Weighted-F1={f1_w:.4f}")

    # 3. Aggregate K-Fold Metrics
    fold_df = pd.DataFrame(fold_metrics)
    mean_acc = fold_df['accuracy'].mean()
    std_acc = fold_df['accuracy'].std()
    mean_mf1 = fold_df['macro_f1'].mean()
    std_mf1 = fold_df['macro_f1'].std()
    mean_wf1 = fold_df['weighted_f1'].mean()
    std_wf1 = fold_df['weighted_f1'].std()

    print("\n--- 5-Fold Cross-Validation Aggregated Summary ---")
    print(f"Mean Accuracy      : {mean_acc:.4f} ± {std_acc:.4f}")
    print(f"Mean Macro-F1      : {mean_mf1:.4f} ± {std_mf1:.4f}")
    print(f"Mean Weighted-F1   : {mean_wf1:.4f} ± {std_wf1:.4f}")

    # 4. Out-of-Fold (OOF) Overall Evaluation (all 257 samples)
    oof_acc = accuracy_score(y, oof_predictions)
    oof_p_m, oof_r_m, oof_f1_m, _ = precision_recall_fscore_support(y, oof_predictions, average='macro', zero_division=0)
    oof_p_w, oof_r_w, oof_f1_w, _ = precision_recall_fscore_support(y, oof_predictions, average='weighted', zero_division=0)
    oof_report = classification_report(y, oof_predictions, labels=unique_classes, digits=4, zero_division=0)

    print("\n--- Out-of-Fold (OOF) Comprehensive Classification Report (N=257) ---")
    print(oof_report)
    print(f"OOF Accuracy       : {oof_acc:.4f}")
    print(f"OOF Macro-F1       : {oof_f1_m:.4f}")
    print(f"OOF Weighted-F1    : {oof_f1_w:.4f}")

    # 5. Out-of-Fold Confusion Matrix
    cm = confusion_matrix(y, oof_predictions, labels=unique_classes)
    plt.figure(figsize=(13, 11))
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        xticklabels=unique_classes,
        yticklabels=unique_classes,
        cbar=True
    )
    plt.title('CyberGuard Incident Classification — Out-of-Fold Confusion Matrix (5-Fold CV, N=257)', fontsize=13, pad=15)
    plt.xlabel('Predicted Category', fontsize=12, labelpad=10)
    plt.ylabel('Ground Truth Category', fontsize=12, labelpad=10)
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    cm_path = os.path.join(OUTPUT_DIR, 'confusion-matrix.png')
    plt.savefig(cm_path, dpi=300)
    plt.close()
    print(f"\n[+] Saved labeled confusion matrix plot to: {cm_path}")

    # 6. Save CV Results Table & Metadata
    cv_csv_path = os.path.join(OUTPUT_DIR, 'cv-5fold-results.csv')
    fold_df.to_csv(cv_csv_path, index=False)
    print(f"[+] Saved fold-by-fold results table to: {cv_csv_path}")

    report_path = os.path.join(OUTPUT_DIR, 'cv-classification-report.txt')
    with open(report_path, 'w') as f:
        f.write("=" * 70 + "\n")
        f.write("CYBERGUARD IEEE RESEARCH BENCHMARK: 5-FOLD CROSS-VALIDATION REPORT\n")
        f.write("=" * 70 + "\n\n")
        f.write(f"Scikit-Learn Version   : {sklearn.__version__}\n")
        f.write(f"Random Seed            : {RANDOM_SEED}\n")
        f.write(f"Cross-Validation Design: StratifiedKFold (n_splits=5, shuffle=True)\n")
        f.write(f"Feature Extraction     : TF-IDF (1-3 ngrams, max_features=25000, fitted in-fold)\n")
        f.write(f"Classifier             : LogisticRegression (lbfgs, C=4.0, class_weight='balanced')\n")
        f.write(f"Dataset Size           : {total_samples} samples, {num_classes} categories\n\n")
        f.write("FOLD-BY-FOLD METRICS:\n")
        f.write(fold_df.to_string(index=False) + "\n\n")
        f.write("CROSS-VALIDATION SUMMARY (MEAN ± STD):\n")
        f.write(f"  Accuracy           : {mean_acc:.4f} ± {std_acc:.4f}\n")
        f.write(f"  Macro Precision    : {fold_df['macro_precision'].mean():.4f} ± {fold_df['macro_precision'].std():.4f}\n")
        f.write(f"  Macro Recall       : {fold_df['macro_recall'].mean():.4f} ± {fold_df['macro_recall'].std():.4f}\n")
        f.write(f"  Macro F1-Score     : {mean_mf1:.4f} ± {std_mf1:.4f}\n")
        f.write(f"  Weighted F1-Score  : {mean_wf1:.4f} ± {std_wf1:.4f}\n\n")
        f.write("OUT-OF-FOLD (OOF) POOLED EVALUATION (ALL 257 SAMPLES):\n")
        f.write(f"  OOF Accuracy       : {oof_acc:.4f}\n")
        f.write(f"  OOF Macro F1       : {oof_f1_m:.4f}\n")
        f.write(f"  OOF Weighted F1    : {oof_f1_w:.4f}\n\n")
        f.write("PER-CLASS OUT-OF-FOLD BREAKDOWN:\n")
        f.write(oof_report + "\n")
    print(f"[+] Saved CV classification report to: {report_path}")

    # Update model-metadata.json with both held-out test and 5-fold CV metrics
    meta_path = os.path.join(OUTPUT_DIR, 'model-metadata.json')
    meta_data = {}
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            meta_data = json.load(f)

    meta_data['cross_validation_5fold'] = {
        'n_splits': 5,
        'strategy': 'StratifiedKFold',
        'random_seed': RANDOM_SEED,
        'mean_accuracy': round(float(mean_acc), 4),
        'std_accuracy': round(float(std_acc), 4),
        'mean_macro_f1': round(float(mean_mf1), 4),
        'std_macro_f1': round(float(std_mf1), 4),
        'mean_weighted_f1': round(float(mean_wf1), 4),
        'std_weighted_f1': round(float(std_wf1), 4),
        'oof_accuracy': round(float(oof_acc), 4),
        'oof_macro_f1': round(float(oof_f1_m), 4),
        'oof_weighted_f1': round(float(oof_f1_w), 4)
    }

    with open(meta_path, 'w') as f:
        json.dump(meta_data, f, indent=2)
    print(f"[+] Updated model-metadata.json with 5-fold CV results")
    print("\n[SUCCESS] 5-Fold Cross-Validation Evaluation Completed.")
    return True

if __name__ == '__main__':
    run_cross_validation()
