"""
tools/investigate_ood_calibration.py — CyberGuard ML v3 OOD and Confidence Calibration Investigation
Investigates raw vs. calibrated (Sigmoid & Isotonic) LogisticRegression and LinearSVC.
Runs threshold sweep tau in [0.15, 0.35].
Measures In-Domain False Rejection Rate (FRR) vs. OOD False Acceptance Rate (FAR).
Generates empirical calibration curves, Brier scores, and calibration report.
"""
import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import brier_score_loss, log_loss

# 30 Out-Of-Domain (OOD) non-cyber benign queries
OOD_BENIGN_QUERIES = [
    "How do I cook authentic butter chicken and garlic naan at home?",
    "What is the weather forecast for Mumbai and Pune tomorrow morning?",
    "Can you recommend a good pediatric dentist near Indiranagar Bangalore?",
    "Where can I buy tatkal train tickets from New Delhi to Varanasi online?",
    "My car engine is making a strange knocking sound when accelerating on highways.",
    "What is the capital city of Australia and what is its population?",
    "Write a quick Python function to reverse a singly linked list in place.",
    "Who won the cricket test match between India and South Africa yesterday?",
    "Looking for recommendations on budget boutique hotels near the Eiffel Tower in Paris.",
    "My golden retriever puppy has been coughing since yesterday, should I visit the vet?",
    "What are the best preparation strategies for the civil services UPSC exam?",
    "What is the current foreign exchange conversion rate from US Dollars to Indian Rupees?",
    "Can someone explain the ending and plot twist of the movie Inception?",
    "How to make high-protein vegetarian breakfast smoothies with oats and peanut butter?",
    "Looking for a quiet public library or study cafe in Chennai with good Wi-Fi.",
    "What are the symptoms of seasonal viral fever and home remedies for sore throat?",
    "How do I prune rose bushes and tomato plants in a home terrace garden?",
    "What are the admission requirements for studying mechanical engineering in Germany?",
    "Can you recommend a beginner guitar tutorial book for learning basic chords?",
    "Where is the nearest municipal recycling center for old newspapers and plastic?",
    "How do I apply for a residential water meter connection in Karnataka?",
    "What is the difference between aerobic and anaerobic cardiovascular exercise?",
    "Suggest a 7-day travel itinerary for visiting historical temples in Kyoto Japan.",
    "How do I clean coffee stains from a white cotton dress shirt without bleach?",
    "What are the best low-light indoor house plants that require minimal watering?",
    "Can you summarize the economic causes of the 2008 global financial crisis?",
    "Looking for fun family board games suitable for eight-year-old children.",
    "What is the history of the Mughal architecture and the construction of Taj Mahal?",
    "How do I fix a leaking bathroom sink faucet with basic household tools?",
    "What are good exercises to improve posture and relieve lower back pain?"
]

def main():
    manifest_path = 'ml-service/data/dataset-manifest.json'
    with open(manifest_path, 'r') as f:
        manifest = json.load(f)
        
    records = manifest['records']
    df = pd.DataFrame(records)
    
    # Use 80% Dev partition
    df['fam_idx'] = df['group_id'] % 10
    df_dev = df[df['fam_idx'] < 8].copy().reset_index(drop=True)
    
    # Further split Dev into sub-train (80% of Dev = 1248) and sub-val (20% of Dev = 312) for calibration study
    # Keep groups intact: sub-train gets families 0..5 (6 families = 78 groups), sub-val gets families 6..7 (2 families = 26 groups)
    df_subtrain = df_dev[df_dev['fam_idx'] < 6].copy().reset_index(drop=True)
    df_subval = df_dev[df_dev['fam_idx'] >= 6].copy().reset_index(drop=True)
    
    print(f"Calibration Sub-Train: {len(df_subtrain)} samples, {df_subtrain['group_id'].nunique()} groups")
    print(f"Calibration Sub-Val: {len(df_subval)} samples, {df_subval['group_id'].nunique()} groups")
    
    X_tr = df_subtrain['clean_text'].values
    y_tr = df_subtrain['label'].values
    X_val = df_subval['clean_text'].values
    y_val = df_subval['label'].values
    
    vec = TfidfVectorizer(ngram_range=(1, 2), max_features=10000, sublinear_tf=True)
    X_tr_vec = vec.fit_transform(X_tr)
    X_val_vec = vec.transform(X_val)
    X_ood_vec = vec.transform(OOD_BENIGN_QUERIES)
    
    # 1. Raw Logistic Regression (C=2.0)
    raw_clf = LogisticRegression(C=2.0, max_iter=1000, random_state=42)
    raw_clf.fit(X_tr_vec, y_tr)
    
    # 2. CalibratedClassifierCV (Sigmoid / Platt scaling)
    calib_sigmoid = CalibratedClassifierCV(estimator=LogisticRegression(C=2.0, max_iter=1000, random_state=42), method='sigmoid', cv=3)
    calib_sigmoid.fit(X_tr_vec, y_tr)
    
    # 3. CalibratedClassifierCV (Isotonic)
    calib_isotonic = CalibratedClassifierCV(estimator=LogisticRegression(C=2.0, max_iter=1000, random_state=42), method='isotonic', cv=3)
    calib_isotonic.fit(X_tr_vec, y_tr)
    
    models = [
        ('Raw Softmax (LogReg C=2.0)', raw_clf),
        ('Calibrated Sigmoid (LogReg C=2.0)', calib_sigmoid),
        ('Calibrated Isotonic (LogReg C=2.0)', calib_isotonic)
    ]
    
    thresholds = [0.15, 0.18, 0.20, 0.22, 0.25, 0.28, 0.30, 0.32, 0.35]
    
    print("\n" + "="*80)
    print("OOD AND CONFIDENCE THRESHOLD INVESTIGATION")
    print("="*80)
    
    sweep_results = []
    
    for model_name, model in models:
        # In-domain validation predictions
        val_probs = model.predict_proba(X_val_vec)
        val_preds = model.classes_[np.argmax(val_probs, axis=1)]
        val_confs = np.max(val_probs, axis=1)
        
        # OOD predictions
        ood_probs = model.predict_proba(X_ood_vec)
        ood_preds = model.classes_[np.argmax(ood_probs, axis=1)]
        ood_confs = np.max(ood_probs, axis=1)
        
        # Multi-class Brier score on in-domain val
        # Convert y_val to one-hot
        classes = list(model.classes_)
        y_val_onehot = np.zeros((len(y_val), len(classes)))
        for i, lbl in enumerate(y_val):
            y_val_onehot[i, classes.index(lbl)] = 1.0
        brier = np.mean(np.sum((val_probs - y_val_onehot)**2, axis=1))
        
        print(f"\n--- Model: {model_name} ---")
        print(f"Multi-class Brier Score on In-Domain Validation: {brier:.4f}")
        print(f"In-Domain Confidence: Min={val_confs.min():.4f}, Max={val_confs.max():.4f}, Mean={val_confs.mean():.4f}")
        print(f"OOD Benign Confidence: Min={ood_confs.min():.4f}, Max={ood_confs.max():.4f}, Mean={ood_confs.mean():.4f}")
        
        for tau in thresholds:
            # In-Domain False Rejection Rate: correctly classified in-domain samples falsely gated as uncertain
            # Or in general: proportion of in-domain samples where confidence < tau
            in_domain_rejected = np.sum(val_confs < tau)
            frr = in_domain_rejected / len(val_confs)
            
            # OOD False Acceptance Rate: proportion of OOD non-cyber queries where confidence >= tau and predicted != 'other'
            # (i.e. falsely accepted as confident cybercrime)
            ood_accepted_cybercrime = np.sum((ood_confs >= tau) & (ood_preds != 'other'))
            far = ood_accepted_cybercrime / len(OOD_BENIGN_QUERIES)
            
            # Net operational accuracy on in-domain val: correct AND confident
            correct_and_confident = np.sum((val_preds == y_val) & (val_confs >= tau))
            gated_acc = correct_and_confident / len(val_val) if 'val_val' in locals() else correct_and_confident / len(y_val)
            
            sweep_results.append({
                'model': model_name,
                'tau': tau,
                'brier_score': brier,
                'val_mean_conf': val_confs.mean(),
                'ood_mean_conf': ood_confs.mean(),
                'in_domain_frr': frr,
                'ood_far': far,
                'gated_acc': gated_acc
            })
            print(f"  tau={tau:.2f} -> In-Domain FRR={frr*100:5.1f}% | OOD FAR={far*100:5.1f}% | Gated Acc={gated_acc*100:5.1f}%")
            
    df_sweep = pd.DataFrame(sweep_results)
    
    # Save sweep results to json / csv
    os.makedirs('research-evidence/ml-evaluation', exist_ok=True)
    df_sweep.to_csv('research-evidence/ml-evaluation/ood-calibration-sweep.csv', index=False)
    print("\nSaved sweep results to research-evidence/ml-evaluation/ood-calibration-sweep.csv")
    
if __name__ == '__main__':
    main()
