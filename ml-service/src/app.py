import os
import sys
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
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
CORS(app)

MODEL_VERSION = '2.0.0-PRO'
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
        return jsonify({'error': 'Prediction failed.', 'detail': str(e)}), 500

@app.route('/batch-predict', methods=['POST'])
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
            results.append({'error': str(e)})

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
    port = int(os.getenv('PORT', 5003))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    logger.info(f'[START] Cybercrime ML Microservice running on port {port}')
    app.run(host='0.0.0.0', port=port, debug=debug)