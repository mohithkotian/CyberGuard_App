import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer

class CybercrimeClassifier:
    CATEGORIES = [
        'phishing',
        'financial_fraud',
        'identity_theft',
        'cyberbullying',
        'hacking',
        'ransomware',
        'data_breach',
        'online_fraud',
        'child_exploitation',
        'women_child_safety',
        'network_attacks',
        'crypto_fraud',
        'other'
    ]

    SEVERITY_MAP = {
        'phishing': 'HIGH',
        'financial_fraud': 'CRITICAL',
        'identity_theft': 'HIGH',
        'cyberbullying': 'MEDIUM',
        'hacking': 'CRITICAL',
        'ransomware': 'CRITICAL',
        'data_breach': 'CRITICAL',
        'online_fraud': 'MEDIUM',
        'child_exploitation': 'CRITICAL',
        'women_child_safety': 'CRITICAL',
        'network_attacks': 'HIGH',
        'crypto_fraud': 'HIGH',
        'other': 'LOW'
    }

    SUBCATEGORY_MAP = {
        'phishing': 'Email / SSO Phishing & Spoofing',
        'financial_fraud': 'UPI / Banking & Card Fraud',
        'identity_theft': 'Aadhaar / SIM Swap & Impersonation',
        'cyberbullying': 'Online Harassment & Doxxing',
        'hacking': 'Unauthorized Intrusion & Account Takeover',
        'ransomware': 'Ransomware Extortion & Malware',
        'data_breach': 'Corporate Database Leak & PII Theft',
        'online_fraud': 'E-Commerce & Marketplace Scam',
        'child_exploitation': 'CSAM & Minor Protection',
        'women_child_safety': 'Emergency Distress & Cyberstalking',
        'network_attacks': 'DDoS & Infrastructure Flooding',
        'crypto_fraud': 'Crypto Drainer & Web3 Scam',
        'other': 'General Inquiry'
    }

    CONFIDENCE_THRESHOLD = 0.20
    MIN_TOKEN_COUNT = 3

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True,
            strip_accents='unicode'
        )
        base_model = LogisticRegression(
            max_iter=2000,
            C=2.0,
            solver='lbfgs',
            class_weight='balanced',
            random_state=42
        )
        self.model = base_model
        self._fitted = False

    def fit(self, texts, labels):
        X = self.vectorizer.fit_transform(texts)
        self.model.fit(X, labels)
        self._fitted = True

    def predict(self, text: str) -> dict:
        if not self._fitted:
            raise RuntimeError('Model not fitted. Call fit() or load() first.')

        # 1. Short-input / empty text handling
        if not text or not isinstance(text, str):
            return self._build_uncertain_response(
                confidence=0.0,
                reason='Input text is empty or null.'
            )

        tokens = [t for t in text.split() if len(t) > 1]
        if len(tokens) < self.MIN_TOKEN_COUNT:
            return self._build_uncertain_response(
                confidence=0.0,
                reason=f'Insufficient meaningful tokens ({len(tokens)} found, minimum {self.MIN_TOKEN_COUNT} required).'
            )

        # 2. Vectorization and model inference
        X = self.vectorizer.transform([text])
        proba = self.model.predict_proba(X)[0]
        scores = {cat: round(float(p), 4) for cat, p in zip(self.model.classes_, proba)}
        confidence = float(max(proba))
        raw_category = self.model.classes_[np.argmax(proba)]

        # 3. Confidence thresholding (OOD rejection)
        if confidence < self.CONFIDENCE_THRESHOLD:
            return self._build_uncertain_response(
                confidence=round(confidence, 4),
                scores=scores,
                raw_prediction=raw_category,
                reason=f'Prediction confidence ({confidence:.4f}) is below operational threshold ({self.CONFIDENCE_THRESHOLD}).'
            )

        # 4. Standard confident prediction
        severity = self.SEVERITY_MAP.get(raw_category, 'MEDIUM')
        subcategory = self.SUBCATEGORY_MAP.get(raw_category, 'General Cybercrime')

        return {
            'category': raw_category,
            'confidence': round(confidence, 4),
            'severity': severity,
            'subcategory': subcategory,
            'scores': scores,
            'uncertain': False,
            'review_recommended': False
        }

    def _build_uncertain_response(self, confidence=0.0, scores=None, raw_prediction=None, reason=''):
        if scores is None:
            uniform_p = round(1.0 / len(self.CATEGORIES), 4)
            scores = {cat: uniform_p for cat in self.CATEGORIES}

        res = {
            'category': 'other',
            'confidence': confidence,
            'severity': 'LOW',
            'subcategory': self.SUBCATEGORY_MAP.get('other', 'General Inquiry'),
            'scores': scores,
            'uncertain': True,
            'review_recommended': True,
            'reason': reason
        }
        if raw_prediction:
            res['raw_prediction'] = raw_prediction
        return res

    def save(self, model_path: str, vectorizer_path: str):
        joblib.dump(self.model, model_path)
        joblib.dump(self.vectorizer, vectorizer_path)

    def load(self, model_path: str, vectorizer_path: str):
        self.model = joblib.load(model_path)
        self.vectorizer = joblib.load(vectorizer_path)
        self._fitted = True
