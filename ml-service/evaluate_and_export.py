"""
evaluate_and_export.py
Executes rigorous evaluation on CyberGuard ML dataset and produces authentic
empirical evidence for the IEEE research paper in research-evidence/ml-evaluation/.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import sklearn
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from preprocessor import TextPreprocessor

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'dataset.csv')
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'research-evidence', 'ml-evaluation')
os.makedirs(OUTPUT_DIR, exist_ok=True)

def main():
    print("=" * 60)
    print("CYBERGUARD ML EMPIRICAL EVALUATION")
    print("=" * 60)

    # 1. Dataset Inspection
    df_raw = pd.read_csv(DATA_PATH)
    total_raw = len(df_raw)
    null_texts = int(df_raw['text'].isnull().sum())
    null_labels = int(df_raw['label'].isnull().sum())
    duplicate_texts = int(df_raw.duplicated(subset=['text']).sum())

    df = df_raw.dropna(subset=['text', 'label']).copy()
    df['text'] = df['text'].astype(str)
    df['label'] = df['label'].astype(str)
    total_clean = len(df)
    unique_classes = sorted(df['label'].unique().tolist())
    num_classes = len(unique_classes)

    print(f"Dataset records: {total_clean} (raw: {total_raw})")
    print(f"Missing values: text={null_texts}, label={null_labels}")
    print(f"Duplicate text samples: {duplicate_texts}")
    print(f"Number of classes: {num_classes}")

    # Export dataset statistics
    class_counts = df['label'].value_counts()
    stats_rows = []
    for cls in unique_classes:
        cnt = int(class_counts.get(cls, 0))
        pct = round((cnt / total_clean) * 100, 2)
        stats_rows.append({
            'class': cls,
            'count': cnt,
            'percentage': pct
        })
    # Summary row
    stats_df = pd.DataFrame(stats_rows)
    stats_df.to_csv(os.path.join(OUTPUT_DIR, 'dataset-statistics.csv'), index=False)
    print(f"[+] Saved dataset-statistics.csv ({len(stats_df)} classes)")

    # 2. Text Preprocessing
    prep = TextPreprocessor()
    df['cleaned'] = df['text'].apply(prep.preprocess)

    # 3. Stratified Train/Test Split (80% train, 20% test with reproducible seed)
    RANDOM_SEED = 42
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        df['cleaned'],
        df['label'],
        test_size=0.20,
        random_state=RANDOM_SEED,
        stratify=df['label']
    )

    print(f"Train split: {len(X_train_raw)} samples (80%)")
    print(f"Test split:  {len(X_test_raw)} samples (20%)")

    # 4. Strict Fit on Train Only (No test data leakage)
    vectorizer = TfidfVectorizer(
        max_features=25000,
        ngram_range=(1, 3),
        min_df=1,
        sublinear_tf=True,
        strip_accents='unicode'
    )
    X_train = vectorizer.fit_transform(X_train_raw)
    X_test = vectorizer.transform(X_test_raw)

    # 5. Fit Logistic Regression
    clf = LogisticRegression(
        max_iter=2000,
        C=4.0,
        solver='lbfgs',
        class_weight='balanced',
        random_state=RANDOM_SEED
    )
    clf.fit(X_train, y_train)

    # 6. Evaluate on Unseen Test Split
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(y_test, y_pred, average='macro', zero_division=0)
    p_weighted, r_weighted, f1_weighted, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted', zero_division=0)

    report_str = classification_report(y_test, y_pred, digits=4, zero_division=0)
    print("\nClassification Report (Test Set):")
    print(report_str)
    print(f"Accuracy: {acc:.4f} | Macro F1: {f1_macro:.4f} | Weighted F1: {f1_weighted:.4f}")

    # Calibration Assessment
    max_probs = np.max(y_proba, axis=1)
    mean_confidence = float(np.mean(max_probs))
    correct_mask = (y_pred == y_test).values
    conf_correct = float(np.mean(max_probs[correct_mask])) if any(correct_mask) else 0.0
    conf_incorrect = float(np.mean(max_probs[~correct_mask])) if any(~correct_mask) else 0.0

    # Write classification report text file
    with open(os.path.join(OUTPUT_DIR, 'classification-report.txt'), 'w') as f:
        f.write("=" * 70 + "\n")
        f.write("CYBERGUARD IEEE RESEARCH BENCHMARK: ML CLASSIFICATION REPORT\n")
        f.write("=" * 70 + "\n\n")
        f.write(f"Scikit-Learn Version: {sklearn.__version__}\n")
        f.write(f"Random Seed: {RANDOM_SEED}\n")
        f.write(f"Dataset Size: {total_clean} samples across {num_classes} categories\n")
        f.write(f"Train/Test Split: {len(X_train_raw)} train (80%), {len(X_test_raw)} test (20%), Stratified\n")
        f.write(f"Feature Extraction: TF-IDF (1-3 ngrams, max_features=25000, sublinear_tf=True)\n")
        f.write(f"Model: Multiclass Logistic Regression (solver='lbfgs', C=4.0, class_weight='balanced')\n\n")
        f.write("OVERALL EVALUATION METRICS (TEST SET):\n")
        f.write(f"  Accuracy:          {acc:.4f} ({acc*100:.2f}%)\n")
        f.write(f"  Macro Precision:   {p_macro:.4f}\n")
        f.write(f"  Macro Recall:      {r_macro:.4f}\n")
        f.write(f"  Macro F1-Score:    {f1_macro:.4f}\n")
        f.write(f"  Weighted F1-Score: {f1_weighted:.4f}\n\n")
        f.write("PER-CLASS CLASSIFICATION BREAKDOWN:\n")
        f.write(report_str + "\n\n")
        f.write("CONFIDENCE & CALIBRATION ANALYSIS:\n")
        f.write(f"  Mean Model Confidence (Max Softmax Probability): {mean_confidence:.4f}\n")
        f.write(f"  Confidence on Correct Predictions:               {conf_correct:.4f}\n")
        f.write(f"  Confidence on Error Predictions:                 {conf_incorrect:.4f}\n\n")
        f.write("SCIENTIFIC METHODOLOGY NOTE FOR IEEE PUBLICATION:\n")
        f.write("  The production classifier operates on standard Multiclass Logistic Regression with\n")
        f.write("  L-BFGS optimization and balanced class weighting. Probability calibration via\n")
        f.write("  CalibratedClassifierCV (Platt scaling or isotonic regression) is NOT fitted in production;\n")
        f.write("  therefore, raw softmax probabilities represent relative class log-odds rather than\n")
        f.write("  empirically calibrated posterior confidence. This technical distinction must be preserved\n")
        f.write("  in academic documentation.\n")
    print(f"[+] Saved classification-report.txt")

    # 7. Confusion Matrix Plot
    cm = confusion_matrix(y_test, y_pred, labels=unique_classes)
    plt.figure(figsize=(12, 10))
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        xticklabels=unique_classes,
        yticklabels=unique_classes,
        cbar=True
    )
    plt.title('CyberGuard Incident Classification — Confusion Matrix (Test Split)', fontsize=14, pad=15)
    plt.xlabel('Predicted Class', fontsize=12, labelpad=10)
    plt.ylabel('Ground Truth Class', fontsize=12, labelpad=10)
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    cm_path = os.path.join(OUTPUT_DIR, 'confusion-matrix.png')
    plt.savefig(cm_path, dpi=300)
    plt.close()
    print(f"[+] Saved confusion-matrix.png")

    # 8. Model Metadata JSON
    metadata = {
        "model_name": "CybercrimeClassifier",
        "architecture": "TF-IDF + Multinomial Logistic Regression",
        "vectorizer": {
            "type": "TfidfVectorizer",
            "ngram_range": [1, 3],
            "max_features": 25000,
            "sublinear_tf": True
        },
        "classifier": {
            "type": "LogisticRegression",
            "solver": "lbfgs",
            "C": 4.0,
            "class_weight": "balanced",
            "max_iter": 2000,
            "calibrated": False
        },
        "dataset": {
            "total_samples": total_clean,
            "raw_samples": total_raw,
            "missing_values": {"text": null_texts, "label": null_labels},
            "duplicate_text_samples": duplicate_texts,
            "classes": unique_classes,
            "num_classes": num_classes
        },
        "split": {
            "train_samples": len(X_train_raw),
            "test_samples": len(X_test_raw),
            "test_ratio": 0.20,
            "stratified": True,
            "random_seed": RANDOM_SEED
        },
        "evaluation_metrics": {
            "accuracy": round(acc, 4),
            "macro_precision": round(p_macro, 4),
            "macro_recall": round(r_macro, 4),
            "macro_f1": round(f1_macro, 4),
            "weighted_f1": round(f1_weighted, 4),
            "mean_confidence": round(mean_confidence, 4)
        },
        "environment": {
            "sklearn_version": sklearn.__version__,
            "numpy_version": np.__version__,
            "pandas_version": pd.__version__
        }
    }
    with open(os.path.join(OUTPUT_DIR, 'model-metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"[+] Saved model-metadata.json")
    print("[SUCCESS] ML Evaluation Completed.")

if __name__ == '__main__':
    main()
