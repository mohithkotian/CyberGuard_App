import os
import sys
import unittest
import json

# Add src to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from app import app, limiter

class TestMLSecurityAndAuth(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        # Reset rate limiter storage between test cases if supported
        try:
            limiter.reset()
        except Exception:
            pass

    def tearDown(self):
        # Restore environment variables
        os.environ.pop('FLASK_ENV', None)
        os.environ.pop('ENV', None)
        os.environ.pop('NODE_ENV', None)
        os.environ.pop('RENDER', None)
        os.environ.pop('ML_INTERNAL_SECRET', None)

    def test_production_fails_closed_when_secret_missing(self):
        """Production must reject inference if ML_INTERNAL_SECRET is unconfigured."""
        os.environ['FLASK_ENV'] = 'production'
        os.environ['ML_INTERNAL_SECRET'] = ''

        response = self.client.post('/predict', json={'text': 'phishing email login alert'})
        self.assertEqual(response.status_code, 500)
        data = response.get_json()
        self.assertIn('error', data)
        self.assertIn('configuration error', data['error'].lower())

    def test_unauthorized_when_secret_header_missing_or_wrong(self):
        """When secret is set, missing or incorrect X-ML-Secret must return 401."""
        test_secret = 'super-secure-production-ml-token-999'
        os.environ['FLASK_ENV'] = 'production'
        os.environ['ML_INTERNAL_SECRET'] = test_secret

        # No header
        resp1 = self.client.post('/predict', json={'text': 'phishing email'})
        self.assertEqual(resp1.status_code, 401)
        self.assertEqual(resp1.get_json(), {'error': 'Unauthorized'})

        # Wrong header
        resp2 = self.client.post('/predict', json={'text': 'phishing email'}, headers={'X-ML-Secret': 'wrong-token'})
        self.assertEqual(resp2.status_code, 401)
        self.assertEqual(resp2.get_json(), {'error': 'Unauthorized'})

    def test_authorized_request_proceeds(self):
        """Valid X-ML-Secret allows request to proceed."""
        test_secret = 'super-secure-production-ml-token-999'
        os.environ['FLASK_ENV'] = 'production'
        os.environ['ML_INTERNAL_SECRET'] = test_secret

        resp = self.client.post(
            '/predict',
            json={'text': 'Unauthorized login attempt on banking portal'},
            headers={'X-ML-Secret': test_secret}
        )
        self.assertIn(resp.status_code, (200, 503))  # 200 if model loaded, 503 if not loaded, but NEVER 401/500 auth fail
        if resp.status_code == 200:
            data = resp.get_json()
            self.assertIn('category', data)

    def test_secret_never_leaked_in_responses(self):
        """The secret value must never be reflected in error or auth responses."""
        test_secret = 'secret-canary-token-xyz123'
        os.environ['FLASK_ENV'] = 'production'
        os.environ['ML_INTERNAL_SECRET'] = test_secret

        # 401 response
        resp = self.client.post('/predict', json={'text': 'test'}, headers={'X-ML-Secret': 'bad-token'})
        self.assertNotIn(test_secret, resp.get_data(as_text=True))

        # 500 error response
        resp_err = self.client.post('/predict', json={}, headers={'X-ML-Secret': test_secret})
        self.assertNotIn(test_secret, resp_err.get_data(as_text=True))

    def test_generic_error_response_in_predict(self):
        """Prediction exceptions must return a generic message and not leak detail/stack trace."""
        test_secret = 'test-token'
        os.environ['ML_INTERNAL_SECRET'] = test_secret

        # Request with empty text triggers 400
        resp = self.client.post('/predict', json={'text': ''}, headers={'X-ML-Secret': test_secret})
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertNotIn('detail', data)

    def test_batch_predict_generic_error_and_auth(self):
        """Batch predict must enforce auth and return generic error items on failure."""
        test_secret = 'test-token'
        os.environ['FLASK_ENV'] = 'production'
        os.environ['ML_INTERNAL_SECRET'] = test_secret

        # Missing header -> 401
        resp = self.client.post('/batch-predict', json={'texts': ['test text']})
        self.assertEqual(resp.status_code, 401)

        # With header -> 200
        resp_auth = self.client.post(
            '/batch-predict',
            json={'texts': ['OTP was stolen from my phone']},
            headers={'X-ML-Secret': test_secret}
        )
        self.assertIn(resp_auth.status_code, (200, 503))

    def test_public_routes_unprotected(self):
        """Public health and index endpoints remain accessible without auth headers."""
        os.environ['FLASK_ENV'] = 'production'
        os.environ['ML_INTERNAL_SECRET'] = 'some-secret'

        health_resp = self.client.get('/health')
        self.assertEqual(health_resp.status_code, 200)

        index_resp = self.client.get('/')
        self.assertEqual(index_resp.status_code, 200)

    def test_rate_limiting_enforcement(self):
        """Flooding requests beyond rate limit must return 429 Too Many Requests."""
        # Rate limit on /batch-predict is 10 per minute
        for i in range(10):
            self.client.post('/batch-predict', json={'texts': ['ping']})
        
        # 11th request should be rate-limited
        rate_limited_resp = self.client.post('/batch-predict', json={'texts': ['ping']})
        self.assertEqual(rate_limited_resp.status_code, 429)

if __name__ == '__main__':
    unittest.main()

