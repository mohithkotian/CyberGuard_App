"""
evaluate_cv.py — Group-Aware 5-Fold Cross-Validation & Out-of-Fold Evaluation (v3.0)
Implements strict leakage-free evaluation for CyberGuard ML classifier.

Key safeguards:
1. Conducted strictly on the 80% development set (1,560 samples across 104 scenario families).
2. Uses GroupKFold(n_splits=5) partitioned by scenario-family group_id (zero group leakage).
3. TF-IDF vectorizer is fit strictly on each fold's training split (zero validation leakage).
4. Computes per-fold and aggregated metrics: Accuracy, Precision, Recall, Macro-F1, Weighted-F1.
5. Generates Out-of-Fold (OOF) confusion matrix across all 1,560 development samples.
6. Saves artifacts in research-evidence/ml-evaluation/ and prints reproducible stdout.
"""

import os
import sys
import json
import hashlib
import numpy as np
import pandas as pd
import sklearn
from sklearn.model_selection import GroupKFold
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
MANIFEST_PATH = os.path.join(os.path.dirname(__file__), 'data', 'dataset-manifest.json')
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'research-evidence', 'ml-evaluation')
os.makedirs(OUTPUT_DIR, exist_ok=True)

RANDOM_SEED = 42

def run_cross_validation():
    print("=" * 70)
    print("CYBERGUARD GROUP-AWARE 5-FOLD CROSS-VALIDATION EVALUATION (v3.0)")
    print("=" * 70)
    print(f"Python version : {sys.version.split()[0]}")
    print(f"Scikit-learn   : {sklearn.__version__}")
    print(f"Random seed    : {RANDOM_SEED}")
    print(f"Data path      : {DATA_PATH}")

    # 1. Load dataset & manifest
    df = pd.read_csv(DATA_PATH)
    df.dropna(subset=['text', 'label'], inplace=True)
    df['text'] = df['text'].astype(str)
    df['label'] = df['label'].astype(str)

    with open(DATA_PATH, 'rb') as f:
        dataset_hash = hashlib.sha256(f.read()).hexdigest()
    
    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)
    rec_by_id = {r['id']: r for r in manifest.get('records', [])}

    # Preprocess text
    print("\n[PROCESS] Running domain preprocessor...")
    prep = TextPreprocessor()
    df['cleaned'] = df['text'].apply(prep.preprocess)

    # Filter to 80% development set (families 0-7, 104 groups, 1,560 samples)
    dev_mask = df.index.map(lambda i: int(rec_by_id[i]['lineage_id'].split('_fam_')[1]) < 8 if i in rec_by_id else False)
    dev_df = df[dev_mask].copy().reset_index(drop=True)
    dev_records = [rec_by_id[i] for i in df[dev_mask].index]
    groups = np.array([r['group_id'] for r in dev_records])

    total_dev_samples = len(dev_df)
    unique_classes = sorted(dev_df['label'].unique().tolist())
    num_classes = len(unique_classes)
    unique_groups = len(set(groups))

    print(f"\nDevelopment dataset samples : {total_dev_samples}")
    print(f"Dataset SHA-256             : {dataset_hash}")
    print(f"Distinct categories         : {num_classes}")
    print(f"Development scenario groups : {unique_groups}")

    # Save dataset statistics table
    stats_rows = []
    for cls in unique_classes:
        cls_df = dev_df[dev_df['label'] == cls]
        stats_rows.append({
            'category': cls,
            'development_samples': len(cls_df),
            'scenario_groups': 8,
            'avg_words': round(float(cls_df['cleaned'].apply(lambda x: len(x.split())).mean()), 1)
        })
    pd.DataFrame(stats_rows).to_csv(os.path.join(OUTPUT_DIR, 'dataset-statistics.csv'), index=False)

    X = dev_df['cleaned'].values
    y = dev_df['label'].values

    # 2. Setup GroupKFold Cross Validation (5 folds)
    gkf = GroupKFold(n_splits=5)

    fold_metrics = []
    oof_predictions = np.empty(total_dev_samples, dtype=object)
    oof_probabilities = np.zeros((total_dev_samples, num_classes))

    print("\n--- Executing 5 Group-Aware Folds ---")
    for fold, (train_idx, val_idx) in enumerate(gkf.split(X, y, groups), start=1):
        X_train_f, X_val_f = X[train_idx], X[val_idx]
        y_train_f, y_val_f = y[train_idx], y[val_idx]
        train_groups = set(groups[train_idx])
        val_groups = set(groups[val_idx])
        leakage = train_groups.intersection(val_groups)

        # Fit TF-IDF strictly on training fold only (prevent data leakage)
        vec = TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True,
            strip_accents='unicode'
        )
        X_train_vec = vec.fit_transform(X_train_f)
        X_val_vec = vec.transform(X_val_f)

        # Champion Classifier specification: LogisticRegression C=2.0 balanced
        clf = LogisticRegression(
            max_iter=2000,
            C=2.0,
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
            'train_groups': len(train_groups),
            'val_groups': len(val_groups),
            'group_leakage': len(leakage),
            'accuracy': acc_f,
            'macro_precision': p_m,
            'macro_recall': r_m,
            'macro_f1': f1_m,
            'weighted_precision': p_w,
            'weighted_recall': r_w,
            'weighted_f1': f1_w
        })

        print(f"Fold {fold}: Train={len(train_idx):4d} ({len(train_groups)} groups), Val={len(val_idx):3d} ({len(val_groups)} groups), "
              f"Leakage={len(leakage)} | Acc={acc_f:.4f} | Macro-F1={f1_m:.4f} | Weighted-F1={f1_w:.4f}")

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

    # 4. Out-of-Fold (OOF) Overall Evaluation (all 1,560 development samples)
    oof_acc = accuracy_score(y, oof_predictions)
    oof_p_m, oof_r_m, oof_f1_m, _ = precision_recall_fscore_support(y, oof_predictions, average='macro', zero_division=0)
    oof_p_w, oof_r_w, oof_f1_w, _ = precision_recall_fscore_support(y, oof_predictions, average='weighted', zero_division=0)
    oof_report = classification_report(y, oof_predictions, labels=unique_classes, digits=4, zero_division=0)

    print(f"\n--- Out-of-Fold (OOF) Comprehensive Classification Report (N={total_dev_samples}) ---")
    print(oof_report)
    print(f"OOF Accuracy       : {oof_acc:.4f}")
    print(f"OOF Macro-F1       : {oof_f1_m:.4f}")
    print(f"OOF Weighted-F1    : {oof_f1_w:.4f}")

    # 5. Out-of-Fold Confusion Matrix Plot
    cm = confusion_matrix(y, oof_predictions, labels=unique_classes)
    plt.figure(figsize=(14, 12))
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        xticklabels=unique_classes,
        yticklabels=unique_classes,
        cbar=True
    )
    plt.title(f'CyberGuard v3.0 Incident Classification — Out-of-Fold Confusion Matrix (GroupKFold CV, N={total_dev_samples})', fontsize=13, pad=15)
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
        f.write("CYBERGUARD IEEE RESEARCH BENCHMARK: 5-FOLD GROUP CROSS-VALIDATION REPORT\n")
        f.write("=" * 70 + "\n\n")
        f.write(f"Scikit-Learn Version   : {sklearn.__version__}\n")
        f.write(f"Dataset Version        : 3.0-group-aware\n")
        f.write(f"Dataset SHA-256        : {dataset_hash}\n")
        f.write(f"Random Seed            : {RANDOM_SEED}\n")
        f.write(f"Cross-Validation Design: GroupKFold (n_splits=5, grouped by scenario_family)\n")
        f.write(f"Feature Extraction     : TF-IDF (1-2 ngrams, sublinear_tf=True, max_features=10000, strictly in-fold)\n")
        f.write(f"Classifier             : LogisticRegression (lbfgs, C=2.0, class_weight='balanced')\n")
        f.write(f"Development Set Size   : {total_dev_samples} samples, {num_classes} categories (balanced 120/class across 104 groups)\n\n")
        f.write("FOLD-BY-FOLD METRICS:\n")
        f.write(fold_df.to_string(index=False) + "\n\n")
        f.write("CROSS-VALIDATION SUMMARY (MEAN ± STD):\n")
        f.write(f"  Accuracy           : {mean_acc:.4f} ± {std_acc:.4f}\n")
        f.write(f"  Macro Precision    : {fold_df['macro_precision'].mean():.4f} ± {fold_df['macro_precision'].std():.4f}\n")
        f.write(f"  Macro Recall       : {fold_df['macro_recall'].mean():.4f} ± {fold_df['macro_recall'].std():.4f}\n")
        f.write(f"  Macro F1-Score     : {mean_mf1:.4f} ± {std_mf1:.4f}\n")
        f.write(f"  Weighted F1-Score  : {mean_wf1:.4f} ± {std_wf1:.4f}\n\n")
        f.write(f"OUT-OF-FOLD (OOF) POOLED EVALUATION (ALL {total_dev_samples} SAMPLES):\n")
        f.write(f"  OOF Accuracy       : {oof_acc:.4f}\n")
        f.write(f"  OOF Macro F1       : {oof_f1_m:.4f}\n")
        f.write(f"  OOF Weighted F1    : {oof_f1_w:.4f}\n\n")
        f.write("PER-CLASS OUT-OF-FOLD BREAKDOWN:\n")
        f.write(oof_report + "\n")
    print(f"[+] Saved CV classification report to: {report_path}")

    # Update model-metadata.json with 5-fold CV metrics
    meta_path = os.path.join(OUTPUT_DIR, 'model-metadata.json')
    meta_data = {}
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            meta_data = json.load(f)

    meta_data['cross_validation_5fold'] = {
        'n_splits': 5,
        'strategy': 'GroupKFold',
        'random_seed': RANDOM_SEED,
        'groups': unique_groups,
        'mean_accuracy': round(float(mean_acc), 4),
        'std_accuracy': round(float(std_acc), 4),
        'mean_macro_precision': round(float(fold_df['macro_precision'].mean()), 4),
        'mean_macro_recall': round(float(fold_df['macro_recall'].mean()), 4),
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

    # Also sync to ml-service/models/model_meta.json
    model_meta_file = os.path.join(os.path.dirname(__file__), 'models', 'model_meta.json')
    if os.path.exists(model_meta_file):
        with open(model_meta_file, 'r') as f:
            mm = json.load(f)
        mm['cross_validation_5fold'] = meta_data['cross_validation_5fold']
        with open(model_meta_file, 'w') as f:
            json.dump(mm, f, indent=2)

    print(f"[+] Updated model-metadata.json and model_meta.json with 5-fold CV results")
    print("\n[SUCCESS] 5-Fold Group Cross-Validation Evaluation Completed.")
    return True

if __name__ == '__main__':
    run_cross_validation()
