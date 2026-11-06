"""
evaluate_challenge_set.py — Evaluates the CyberGuard ML v3 Production Model
on the 215-sample independent challenge set (195 in-domain complaints + 20 benign queries).

Computes:
- Raw Accuracy (highest argmax without gating)
- Operational Gated Accuracy at calibrated threshold tau = 0.20
- In-Domain False Rejection Rate (FRR)
- Benign OOD False Acceptance Rate (FAR)
- Per-class classification reports
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, accuracy_score, precision_recall_fscore_support

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, 'ml-service', 'src'))
from classifier import CybercrimeClassifier
from preprocessor import TextPreprocessor
from tools.challenge_set_v3_200 import CHALLENGE_DATA_V3

MODEL_PATH = os.path.join(BASE_DIR, 'ml-service', 'models', 'classifier.pkl')
VECTORIZER_PATH = os.path.join(BASE_DIR, 'ml-service', 'models', 'vectorizer.pkl')
OUT_REPORT = os.path.join(BASE_DIR, 'research-evidence', 'ml-evaluation', 'challenge-set-results.txt')

def main():
    print("=" * 70)
    print("CYBERGUARD ML v3 INDEPENDENT CHALLENGE BENCHMARK EVALUATION")
    print("=" * 70)

    clf = CybercrimeClassifier()
    clf.load(MODEL_PATH, VECTORIZER_PATH)
    prep = TextPreprocessor()

    print(f"Loaded model from {MODEL_PATH}")
    print(f"Calibrated confidence threshold tau = {clf.CONFIDENCE_THRESHOLD}")

    # Identify in-domain (195 samples: 15 per class * 13 classes) and benign OOD (last 20 samples of 'other')
    # In CHALLENGE_DATA_V3: first 180 are classes 0-11 (15 each), then 35 'other' (first 15 IT/other, last 20 benign non-cyber)
    in_domain_items = CHALLENGE_DATA_V3[:195]
    benign_items = CHALLENGE_DATA_V3[195:]

    print(f"Total benchmark items : {len(CHALLENGE_DATA_V3)}")
    print(f"In-domain complaints  : {len(in_domain_items)} (15 samples per class across all 13 categories)")
    print(f"Benign OOD queries    : {len(benign_items)} (non-cyber everyday queries)")

    # 1. Evaluate In-Domain Complaints
    in_texts = [x['text'] for x in in_domain_items]
    in_true  = [x['label'] for x in in_domain_items]
    in_raw_preds = []
    in_gated_preds = []
    in_confs = []

    for text in in_texts:
        cleaned = prep.preprocess(text)
        vec = clf.vectorizer.transform([cleaned])
        probs = clf.model.predict_proba(vec)[0]
        max_idx = int(np.argmax(probs))
        raw_pred = clf.model.classes_[max_idx]
        conf = float(probs[max_idx])
        in_confs.append(conf)
        in_raw_preds.append(raw_pred)

        if conf < clf.CONFIDENCE_THRESHOLD:
            gated_pred = 'other'
        else:
            gated_pred = raw_pred
        in_gated_preds.append(gated_pred)

    raw_acc_in = accuracy_score(in_true, in_raw_preds)
    p_m, r_m, f1_m, _ = precision_recall_fscore_support(in_true, in_raw_preds, average='macro', zero_division=0)
    p_w, r_w, f1_w, _ = precision_recall_fscore_support(in_true, in_raw_preds, average='weighted', zero_division=0)
    gated_acc_in = accuracy_score(in_true, in_gated_preds)
    in_frr = sum(1 for c in in_confs if c < clf.CONFIDENCE_THRESHOLD) / len(in_confs)

    # 2. Evaluate Benign Out-of-Domain Queries
    benign_texts = [x['text'] for x in benign_items]
    benign_confs = []
    benign_raw_preds = []
    benign_gated_preds = []

    for text in benign_texts:
        cleaned = prep.preprocess(text)
        vec = clf.vectorizer.transform([cleaned])
        probs = clf.model.predict_proba(vec)[0]
        max_idx = int(np.argmax(probs))
        raw_pred = clf.model.classes_[max_idx]
        conf = float(probs[max_idx])
        benign_confs.append(conf)
        benign_raw_preds.append(raw_pred)

        if conf < clf.CONFIDENCE_THRESHOLD:
            gated_pred = 'other'
        else:
            gated_pred = raw_pred
        benign_gated_preds.append(gated_pred)

    # Benign False Acceptance = confident (>= tau) classification into a specific cybercrime class (not 'other')
    benign_false_accepts = sum(1 for conf, pred in zip(benign_confs, benign_raw_preds) if conf >= clf.CONFIDENCE_THRESHOLD and pred != 'other')
    benign_far = benign_false_accepts / len(benign_items) if benign_items else 0.0
    benign_safety = 1.0 - benign_far

    print(f"\n--- IN-DOMAIN EVALUATION (N={len(in_domain_items)}) ---")
    print(f"Raw Accuracy (Argmax)       : {raw_acc_in:.4f} ({accuracy_score(in_true, in_raw_preds, normalize=False)}/{len(in_true)})")
    print(f"Raw Macro Precision         : {p_m:.4f}")
    print(f"Raw Macro Recall            : {r_m:.4f}")
    print(f"Raw Macro F1-Score          : {f1_m:.4f}")
    print(f"Weighted F1-Score           : {f1_w:.4f}")
    print(f"Operational Gated Accuracy  : {gated_acc_in:.4f} ({accuracy_score(in_true, in_gated_preds, normalize=False)}/{len(in_true)})")
    print(f"In-domain False Rejections  : {sum(1 for c in in_confs if c < clf.CONFIDENCE_THRESHOLD)}/{len(in_confs)} (FRR = {in_frr:.2%})")
    print(f"Average In-Domain Confidence: {np.mean(in_confs):.4f}")

    print(f"\n--- BENIGN OUT-OF-DOMAIN EVALUATION (N={len(benign_items)}) ---")
    print(f"OOD False Acceptance (FAR)  : {benign_false_accepts}/{len(benign_items)} ({benign_far:.2%})")
    print(f"OOD Safe Handling / Rejected: {len(benign_items) - benign_false_accepts}/{len(benign_items)} ({benign_safety:.2%})")
    print(f"Average OOD Confidence      : {np.mean(benign_confs):.4f}")

    c_report = classification_report(in_true, in_raw_preds, labels=sorted(list(set(in_true))), digits=4, zero_division=0)
    print("\n--- IN-DOMAIN PER-CLASS CLASSIFICATION REPORT ---")
    print(c_report)

    # Save to report file
    with open(OUT_REPORT, 'w') as f:
        f.write("=" * 70 + "\n")
        f.write("CYBERGUARD ML v3 INDEPENDENT CHALLENGE BENCHMARK RESULTS\n")
        f.write("=" * 70 + "\n\n")
        f.write(f"Model File               : {MODEL_PATH}\n")
        f.write(f"Confidence Threshold tau : {clf.CONFIDENCE_THRESHOLD}\n\n")
        f.write("215-SAMPLE INDEPENDENT CHALLENGE BENCHMARK\n")
        f.write(f"  Total Samples          : {len(CHALLENGE_DATA_V3)}\n")
        f.write(f"  In-Domain Samples      : {len(in_domain_items)} (15/class across 13 canonical classes)\n")
        f.write(f"  Benign OOD Samples     : {len(benign_items)} (everyday non-cyber queries)\n\n")
        f.write("IN-DOMAIN METRICS:\n")
        f.write(f"  Raw Accuracy           : {raw_acc_in:.4f}\n")
        f.write(f"  Raw Macro Precision    : {p_m:.4f}\n")
        f.write(f"  Raw Macro Recall       : {r_m:.4f}\n")
        f.write(f"  Raw Macro F1-Score     : {f1_m:.4f}\n")
        f.write(f"  Weighted F1-Score      : {f1_w:.4f}\n")
        f.write(f"  Operational Accuracy   : {gated_acc_in:.4f}\n")
        f.write(f"  In-Domain FRR (tau={clf.CONFIDENCE_THRESHOLD}): {in_frr:.2%}\n")
        f.write(f"  Mean Confidence        : {np.mean(in_confs):.4f}\n\n")
        f.write("BENIGN OOD METRICS:\n")
        f.write(f"  OOD False Acceptance   : {benign_far:.2%}\n")
        f.write(f"  OOD Safe Rejection     : {benign_safety:.2%}\n")
        f.write(f"  Mean Confidence        : {np.mean(benign_confs):.4f}\n\n")
        f.write("IN-DOMAIN PER-CLASS BREAKDOWN:\n")
        f.write(c_report + "\n")

    print(f"\n[OK] Saved challenge results to {OUT_REPORT}")

if __name__ == '__main__':
    main()
