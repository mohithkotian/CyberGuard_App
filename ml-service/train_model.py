"""
train_model.py — trains TF-IDF + Logistic Regression on dataset.csv
Run: python3 train_model.py
"""
import os, sys, json
import pandas as pd
import numpy as np
import sklearn
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from preprocessor import TextPreprocessor
from classifier import CybercrimeClassifier

DATA_PATH       = os.path.join(os.path.dirname(__file__), 'data', 'dataset.csv')
MODEL_PATH      = os.path.join(os.path.dirname(__file__), 'models', 'classifier.pkl')
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), 'models', 'vectorizer.pkl')

os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

# ── Load data ─────────────────────────────────────────────────────────────────
print('[LOAD] Loading dataset...')
df = pd.read_csv(DATA_PATH)
df.dropna(subset=['text', 'label'], inplace=True)
df['text']  = df['text'].astype(str)
df['label'] = df['label'].astype(str)
print(f'   Loaded {len(df)} samples across {df["label"].nunique()} categories')
print(f'   Distribution:\n{df["label"].value_counts().to_string()}')

# ── Preprocess ────────────────────────────────────────────────────────────────
print('\n[PROCESS] Preprocessing text...')
prep = TextPreprocessor()
df['cleaned'] = df['text'].apply(prep.preprocess)

# ── Train / test split ────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    df['cleaned'], df['label'], test_size=0.15, random_state=42, stratify=df['label']
)
print(f'   Train: {len(X_train)}   Test: {len(X_test)}')

# ── Train on full training split ───────────────────────────────────────────────
print('\n[TRAIN] Training model...')
clf = CybercrimeClassifier()
clf.fit(X_train.tolist(), y_train.tolist())

# ── Evaluate ──────────────────────────────────────────────────────────────────
print('\n[EVAL] Evaluating on test set...')
X_test_vec = clf.vectorizer.transform(X_test)
y_pred     = clf.model.predict(X_test_vec)
acc        = accuracy_score(y_test, y_pred)
print(f'   Accuracy : {acc:.4f}')
print(f'\n{classification_report(y_test, y_pred)}')

# Train final model on entire dataset for maximum real-world production coverage
print('\n[FINAL] Retraining final production model on full dataset...')
print('[WARN] Console metrics above are from the 85% split model — not the saved model.')
full_clf = CybercrimeClassifier()
full_clf.fit(df['cleaned'].tolist(), df['label'].tolist())

# ── Save ──────────────────────────────────────────────────────────────────────
full_clf.save(MODEL_PATH, VECTORIZER_PATH)
print(f'\n[OK] Production Model saved to      {MODEL_PATH}')
print(f'[OK] Production Vectorizer saved to {VECTORIZER_PATH}')

# Save model metadata for version tracking and sklearn compatibility checks
meta = {
    'trained_at': str(pd.Timestamp.now()),
    'sklearn_version': sklearn.__version__,
    'samples_total': len(df),
    'samples_train': len(X_train),
    'samples_test': len(X_test),
    'categories': sorted(df['label'].unique().tolist()),
    'eval_accuracy_85pct_split': round(float(acc), 4),
}
meta_path = os.path.join(os.path.dirname(MODEL_PATH), 'model_meta.json')
with open(meta_path, 'w') as f:
    json.dump(meta, f, indent=2)
print(f'[OK] Model metadata saved to        {meta_path}')
print('\n[START] Ready! Start the service with: python3 src/app.py')
