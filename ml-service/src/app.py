import os
import sys
import logging
import hmac
from flask import Flask, request, jsonify
from flask_cors import CORS
try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
except ImportError:
    import time
    from functools import wraps

    class Limiter:
        def __init__(self, key_func=None, app=None, default_limits=None, storage_uri=None):
            self.app = app
            self.history = {}

        def limit(self, limit_string):
            parts = limit_string.lower().split()
            max_calls = int(parts[0]) if parts and parts[0].isdigit() else 100
            window = 60
            if 'second' in limit_string:
                window = 1
            elif 'minute' in limit_string:
                window = 60
            elif 'hour' in limit_string:
                window = 3600

            def decorator(f):
                endpoint = f.__name__
                @wraps(f)
                def wrapped(*args, **kwargs):
                    now = time.time()
                    key = (request.remote_addr or '127.0.0.1', endpoint)
                    timestamps = [t for t in self.history.get(key, []) if now - t < window]
                    if len(timestamps) >= max_calls:
                        return jsonify({'error': 'Too Many Requests'}), 429
                    timestamps.append(now)
                    self.history[key] = timestamps
                    return f(*args, **kwargs)
                return wrapped
            return decorator

        def reset(self):
            self.history.clear()

    def get_remote_address():
        return '127.0.0.1'
from dotenv import load_dotenv
import joblib

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.dirname(os.path.abspath(__file__))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

DEFAULT_MODEL_PATH = os.path.join(BASE_DIR, 'models', 'classifier.pkl')
DEFAULT_VECTOR_PATH = os.path.join(BASE_DIR, 'models', 'vectorizer.pkl')

MODEL_PATH      = os.getenv('MODEL_PATH',      DEFAULT_MODEL_PATH)
VECTORIZER_PATH = os.getenv('VECTORIZER_PATH', DEFAULT_VECTOR_PATH)

from classifier import CybercrimeClassifier
from preprocessor import TextPreprocessor

logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS: ML service is called server-to-server (Node backend only).
# Restrict to backend origin as defence-in-depth; browsers never call this directly.
_allowed_origins = [o.strip() for o in os.getenv('ML_ALLOWED_ORIGINS', 'http://127.0.0.1:5002').split(',') if o.strip()]
CORS(app, origins=_allowed_origins, methods=['GET', 'POST'])

# Rate limiting: in-memory storage is correct for single-worker deployment (-w 1).
# If workers are ever increased, switch storage_uri to a Redis URI.
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],
    storage_uri='memory://'
)

def is_production_environment():
    return (
        os.getenv('FLASK_ENV', '').lower() == 'production' or
        os.getenv('ENV', '').lower() == 'production' or
        os.getenv('NODE_ENV', '').lower() == 'production' or
        os.getenv('RENDER', '').lower() == 'true'
    )

@app.before_request
def require_internal_secret():
    # Only protect internal prediction endpoints; /health and / remain accessible for probes
    if request.path in ('/predict', '/batch-predict'):
        is_prod = is_production_environment()
        secret = os.getenv('ML_INTERNAL_SECRET', '').strip()

        # 1. Production must fail closed if secret is missing or misconfigured
        if is_prod:
            if not secret:
                logger.error('[SECURITY FATAL] ML_INTERNAL_SECRET is missing or empty in production. Rejecting request.')
                return jsonify({'error': 'Internal authentication configuration error.'}), 500

            client_secret = request.headers.get('X-ML-Secret', '')
            if not client_secret or not hmac.compare_digest(client_secret, secret):
                return jsonify({'error': 'Unauthorized'}), 401

        # 2. Local development mode
        else:
            if secret:
                client_secret = request.headers.get('X-ML-Secret', '')
                if not client_secret or not hmac.compare_digest(client_secret, secret):
                    return jsonify({'error': 'Unauthorized'}), 401
            # Development bypass permitted only when secret is explicitly unset locally

MODEL_VERSION = '3.0.0-PRO'
classifier = CybercrimeClassifier()
preprocessor = TextPreprocessor()

model_loaded = False
try:
    classifier.load(MODEL_PATH, VECTORIZER_PATH)
    model_loaded = True
    logger.info(f'[OK] Advanced Cybercrime Model loaded successfully from: {MODEL_PATH}')
except Exception as e:
    logger.warning(f'[WARN]️  Model not found — run train_model.py first. ({e})')

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'service': 'CyberGuard ML Classification Service',
        'status': 'online',
        'model_loaded': model_loaded,
        'model_version': MODEL_VERSION,
        'endpoints': {
            'health': '/health',
            'model_info': '/model-info',
            'predict': 'POST /predict',
            'batch_predict': 'POST /batch-predict'
        }
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model_loaded': model_loaded,
        'model_version': MODEL_VERSION,
        'categories': classifier.CATEGORIES,
    })

@app.route('/predict', methods=['POST'])
@limiter.limit('30 per minute')
def predict():
    if not model_loaded:
        return jsonify({'error': 'Model not loaded. Run train_model.py first.'}), 503

    data = request.get_json(silent=True) or {}
    text = data.get('text') or data.get('description') or data.get('narrative') or data.get('body') or data.get('query') or ''
    text = str(text).strip()
    
    if not text:
        return jsonify({'error': 'Request body must contain text or description.'}), 400

    max_len = int(os.getenv('MAX_TEXT_LENGTH', 10000))
    if len(text) > max_len:
        text = text[:max_len]

    try:
        cleaned = preprocessor.preprocess(text)
        result = classifier.predict(cleaned)
        logger.info(f'Predicted: {result["category"]} ({result["confidence"]:.2f}) -> {result["subcategory"]}')
        return jsonify({**result, 'model_version': MODEL_VERSION})
    except Exception as e:
        logger.error(f'Prediction error: {e}')
        return jsonify({'error': 'Prediction failed. Please try again.'}), 500

@app.route('/batch-predict', methods=['POST'])
@limiter.limit('10 per minute')
def batch_predict():
    if not model_loaded:
        return jsonify({'error': 'Model not loaded.'}), 503

    data = request.get_json(silent=True)
    if not data or 'texts' not in data or not isinstance(data['texts'], list):
        return jsonify({'error': 'Request body must contain a "texts" array.'}), 400

    results = []
    for text in data['texts'][:50]:
        try:
            cleaned = preprocessor.preprocess(str(text))
            results.append(classifier.predict(cleaned))
        except Exception as e:
            logger.error(f'Batch prediction error for item: {e}')
            results.append({'error': 'Item prediction failed.'})

    return jsonify({'results': results, 'count': len(results), 'model_version': MODEL_VERSION})

@app.route('/model-info', methods=['GET'])
def model_info():
    return jsonify({
        'model_version': MODEL_VERSION,
        'categories': classifier.CATEGORIES,
        'algorithm': 'N-Gram TF-IDF + Calibrated Balanced Logistic Ensemble',
        'preprocessing': 'Domain Regex Normalization, Entity Tokenization, Stopwords Filtering',
        'model_loaded': model_loaded,
    })

if __name__ == '__main__':
    port = int(os.getenv('ML_PORT', os.getenv('PORT', 5003)))
    if port == 5002:
        port = 5003
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    logger.info(f'[START] Cybercrime ML Microservice running on port {port}')
    app.run(host='0.0.0.0', port=port, debug=debug)
