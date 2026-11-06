"""Regression test suite for CyberGuard ML Classifier runtime configuration,
serialized artifact compatibility, and uncertainty / OOD handling.
"""

import os
import sys
import unittest
import numpy as np

# Add src to sys.path
SRC_DIR = os.path.join(os.path.dirname(__file__), 'src')
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from classifier import CybercrimeClassifier
from app import MODEL_PATH, VECTORIZER_PATH


class TestClassifierRuntime(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.classifier = CybercrimeClassifier()
        cls.assertTrue(
            os.path.exists(MODEL_PATH),
            f'Serialized classifier artifact not found at {MODEL_PATH}'
        )
        cls.assertTrue(
            os.path.exists(VECTORIZER_PATH),
            f'Serialized vectorizer artifact not found at {VECTORIZER_PATH}'
        )
        cls.classifier.load(MODEL_PATH, VECTORIZER_PATH)

    def test_artifact_hyperparameters_and_metadata(self):
        """Verify model and vectorizer hyperparameters match verified v3 specification."""
        self.assertEqual(self.classifier.CONFIDENCE_THRESHOLD, 0.20)
        self.assertEqual(self.classifier.MIN_TOKEN_COUNT, 3)

        # Vectorizer specs
        vec = self.classifier.vectorizer
        self.assertEqual(vec.max_features, 10000)
        self.assertEqual(vec.ngram_range, (1, 2))
        self.assertTrue(vec.sublinear_tf)
        self.assertEqual(len(vec.vocabulary_), 10000)

        # Logistic Regression model specs
        model = self.classifier.model
        self.assertEqual(model.C, 2.0)
        self.assertEqual(model.class_weight, 'balanced')
        self.assertEqual(len(model.classes_), 13)

        # Canonical 13 categories preserved verbatim
        expected_categories = set(CybercrimeClassifier.CATEGORIES)
        model_classes = set(model.classes_)
        self.assertEqual(expected_categories, model_classes)
        self.assertEqual(len(expected_categories), 13)

    def test_empty_and_null_input_rejection(self):
        """Empty or null inputs must return uncertain=True with confidence=0.0."""
        for empty_val in ['', '   ', None, '\t\n']:
            result = self.classifier.predict(empty_val)
            self.assertEqual(result['category'], 'other')
            self.assertEqual(result['confidence'], 0.0)
            self.assertTrue(result['uncertain'])
            self.assertTrue(result['review_recommended'])
            self.assertIn('scores', result)
            self.assertEqual(len(result['scores']), 13)

    def test_short_input_rejection(self):
        """Inputs with fewer than 3 meaningful tokens must be safely rejected."""
        short_inputs = [
            'hacked',
            'help please',
            'urgent money',
            'a b c'  # single characters are ignored by token len > 1
        ]
        for text in short_inputs:
            result = self.classifier.predict(text)
            self.assertEqual(result['category'], 'other')
            self.assertEqual(result['confidence'], 0.0)
            self.assertTrue(result['uncertain'])
            self.assertTrue(result['review_recommended'])

    def test_out_of_distribution_rejection(self):
        """Benign OOD text with max softmax < 0.20 must be gated to 'other'."""
        ood_queries = [
            'What is the weather forecast for Mumbai and Pune tomorrow morning?',
            'Can you recommend a good pediatric dentist near Indiranagar Bangalore?',
            'How do I cook authentic butter chicken and garlic naan at home from scratch?'
        ]
        for query in ood_queries:
            result = self.classifier.predict(query)
            self.assertEqual(result['category'], 'other')
            self.assertLess(result['confidence'], 0.20)
            self.assertTrue(result['uncertain'])
            self.assertTrue(result['review_recommended'])
            self.assertIn('raw_prediction', result)

    def test_confident_indomain_prediction(self):
        """Clear in-domain cybercrime incident must produce confident prediction >= 0.20."""
        incident_text = (
            'Received a fraudulent email claiming my corporate account password expired. '
            'The message contained a link pointing to a spoofed login domain designed to harvest credentials.'
        )
        result = self.classifier.predict(incident_text)
        self.assertEqual(result['category'], 'phishing')
        self.assertGreaterEqual(result['confidence'], 0.20)
        self.assertFalse(result['uncertain'])
        self.assertFalse(result['review_recommended'])
        self.assertEqual(result['severity'], 'HIGH')
        self.assertEqual(result['subcategory'], 'Email / SSO Phishing & Spoofing')

    def test_standard_response_schema_and_probability_sum(self):
        """Verify response schema completeness and probability distribution coherence."""
        sample_text = 'Fraudulent callers demanded money transfer claiming to be from state police department.'
        result = self.classifier.predict(sample_text)

        required_keys = {
            'category', 'confidence', 'severity', 'subcategory',
            'scores', 'uncertain', 'review_recommended'
        }
        self.assertTrue(required_keys.issubset(result.keys()))
        self.assertEqual(len(result['scores']), 13)

        # Softmax probabilities should sum to approximately 1.0
        prob_sum = sum(result['scores'].values())
        self.assertAlmostEqual(prob_sum, 1.0, places=2)


if __name__ == '__main__':
    unittest.main()
