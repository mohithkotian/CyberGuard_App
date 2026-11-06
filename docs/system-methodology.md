# CyberGuard System Methodology & Technical Architecture

**Document Version**: 1.0.0  
**Evaluated Revision**: `6d6fa1e57882bcaf6a9c47873fe4bce0312e005e`  
**Publication Target**: IEEE Research Paper Methodology Section  
**GitHub Issues Addressed**: #10 (Complete System Methodology), #20 (ML Architecture Documentation)

---

## 1. High-Level Architectural Topology

CyberGuard AI is structured as a decoupled, multi-tier microservices platform designed for high-assurance cybercrime incident intake, privacy preservation, machine learning triage, and statutory workflow coordination.

### System Flow Diagram

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                        |
|  +---------------------------------------------------------------------------------+  |
|  | React 18 Web SPA (Framer Motion, Tailwind, IBM Plex Typography, Onee AI Guide)  |  |
|  +---------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
                                           |
                                [HTTPS / JSON & Multipart]
                                [JWT Bearer Authentication]
                                           v
+---------------------------------------------------------------------------------------+
|                                 APPLICATION GATEWAY                                   |
|  +---------------------------------------------------------------------------------+  |
|  | Node.js / Express.js REST API Server (Port 5002)                                |  |
|  |  * Security Headers: Helmet, XSS-Clean, Express Mongo Sanitize, HPP             |  |
|  |  * Rate Limiting: authLimiter, apiLimiter, speedLimiter                        |  |
|  |  * RBAC & Token Auth: JWT verify, TokenBlacklist, role-based middleware        |  |
|  +---------------------------------------------------------------------------------+  |
|             |                                   |                         |           |
|             | [Privacy Boundary]                | [Forensics]             | [Data]    |
|             v                                   v                         v           |
|  +---------------------+             +----------------------+    +-----------------+  |
|  | privacyShield.js    |             | ocrService.js        |    | MongoDB (Mongoose| |
|  | (18-stage PII mask) |             | (Tesseract.js OCR)   |    | Complaint, User,|  |
|  +---------------------+             +----------------------+    | AuditTrail, etc)|  |
+------------------------------------------------------------------+-----------------+--+
                                           |
                              [HTTP / JSON POST /predict]
                              [X-ML-Secret Header Auth]
                                           v
+---------------------------------------------------------------------------------------+
|                              INTELLIGENCE MICROSERVICE                                |
|  +---------------------------------------------------------------------------------+  |
|  | Python 3.14 / Flask ML Microservice (Port 5003)                                 |  |
|  |  * Security Gate: @before_request require_internal_secret (hmac.compare_digest)  |  |
|  |  * Rate Limiting: Flask-Limiter (30 req/min /predict, 10 req/min /batch-predict)|  |
|  |  * Preprocessing: TextPreprocessor (normalization, entity tokens, stop words)  |  |
|  |  * Feature Extraction: TfidfVectorizer (ngrams 1-3, 25k features, sublinear TF)|  |
|  |  * Classifier: Multinomial Logistic Regression (L-BFGS, C=4.0, balanced)        |  |
|  |  * Fallback Mechanism: Node.js built-in NLP heuristics on connection failure    |  |
|  +---------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
```

---

## 2. API Communication & Gateway Routing

### 2.1 Client-to-Backend Protocol
- **Transport**: Standard HTTP/1.1 and HTTP/2 over TLS.
- **Session Authentication**: JSON Web Tokens (JWT) signed with HMAC-SHA256 (`process.env.JWT_SECRET`). Tokens carry the subject user ID and expire after 7 days (`JWT_EXPIRES_IN`). Token revocation is enforced on logout via the database-backed `TokenBlacklist` collection.
- **CORS Protection**: Dynamic origin validation permitting authorized local addresses (`localhost:3000`, `127.0.0.1:3000`) and validated Render production origins (`*.onrender.com`).
- **Defensive Middleware**:
  - `helmet`: Sets secure HTTP headers (`X-Content-Type-Options`, `X-Frame-Options`, strict CSP).
  - `express-rate-limit`: Restricts brute-force authentication attempts (5 per 15-minute window per IP/email in production) and general API throughput.
  - `express-mongo-sanitize`: Strips dangerous query operators (`$`, `.`) from user payloads to prevent NoSQL injection.

### 2.2 Server-to-Server Internal Microservice Authentication
Communication between the Node.js API server and the Flask ML microservice is isolated and authenticated server-to-server:
- **Client Implementation (`backend/src/services/mlService.js`)**: An Axios HTTP client is configured with an interceptor that automatically attaches the shared secret header:
  ```javascript
  mlClient.interceptors.request.use((config) => {
    const secret = process.env.ML_INTERNAL_SECRET;
    if (secret) {
      config.headers['X-ML-Secret'] = secret;
    }
    return config;
  });
  ```
- **Service Verification (`ml-service/src/app.py`)**: A Flask `@app.before_request` hook intercepts requests targeting `/predict` and `/batch-predict`. In production environments (`RENDER=true` or `FLASK_ENV=production`), the service operates in a strict **fail-closed** mode:
  1. If `ML_INTERNAL_SECRET` is unset or empty, the service rejects the request with `HTTP 500 Configuration Error` to prevent unauthenticated exposure.
  2. The incoming `X-ML-Secret` header is compared against the server secret using constant-time evaluation (`hmac.compare_digest`) to prevent timing side-channel attacks. Unmatched headers receive `HTTP 401 Unauthorized`.
  3. Probes on `/health` and `/` remain unauthenticated for container orchestrator health checks.

---

## 3. Machine Learning Microservice Pipeline

### 3.1 Preprocessing (`TextPreprocessor`)
Raw text undergoes multistage lexical normalization before feature generation:
1. **Lowercasing**: Text converted to lowercase.
2. **Entity Tokenization**:
   - URLs and domains $\rightarrow$ `' url_link '`
   - Email addresses $\rightarrow$ `' email_addr '`
   - Mobile and telephone strings $\rightarrow$ `' phone_num '`
   - Bank account numbers $\rightarrow$ `' bank_account '`
   - Numbers and numerical quantities $\rightarrow$ `' num_val '`
3. **Punctuation Stripping**: Non-alphanumeric symbols removed (`[^a-zA-Z0-9_\s]`).
4. **Stop Word Removal with Semantic Retention**: Common English stop words are filtered using a standardized 179-word dictionary. Critically, crime-relevant negations and directional prepositions are explicitly retained: `{'no', 'not', 'nor', 'never', 'none', 'against', 'out'}`.

### 3.2 Feature Extraction (`TfidfVectorizer`)
The normalized token sequence is transformed into a high-dimensional sparse representation using term frequency-inverse document frequency weighting:
- **N-gram Range**: Unigrams, bigrams, and trigrams (`ngram_range=(1, 3)`).
- **Maximum Features**: 25,000 top vocabulary terms (`max_features=25000`).
- **Minimum Document Frequency**: 1 document (`min_df=1`).
- **Sublinear Term Frequency**: Enabled (`sublinear_tf=True`), applying logarithmic scaling $1 + \log(\text{tf})$ to prevent high-frequency term domination.
- **Accent Handling**: Stripped to unicode (`strip_accents='unicode'`).

### 3.3 Classifier Architecture & Parameters
- **Algorithm**: Multinomial Logistic Regression (`sklearn.linear_model.LogisticRegression`).
- **Optimization Solver**: Limited-memory Broyden–Fletcher–Goldfarb–Shanno (`solver='lbfgs'`).
- **Regularization Strength**: $C = 4.0$ (moderate inverse L2 regularization penalizing parameter overfitting).
- **Maximum Iterations**: 2,000 (`max_iter=2000`).
- **Class Balancing**: Balanced weights (`class_weight='balanced'`), inversely proportional to class frequencies $w_c = \frac{N}{|C| \cdot N_c}$.
- **Random State**: 42.

> [!IMPORTANT]
> **Scientific Methodology Note on Probability Calibration**:
> The production classifier employs standard Multinomial Logistic Regression. Although `CalibratedClassifierCV` is imported in `classifier.py`, probability calibration (e.g., Platt scaling or isotonic regression) is **not fitted** in the production pipeline. Therefore, raw softmax outputs $\sigma(z)_i = \frac{e^{z_i}}{\sum_j e^{z_j}}$ represent relative class decision margins rather than empirically calibrated posterior probabilities. Academic and research documentation must describe the model as standard multiclass Logistic Regression with balanced weighting.

### 3.4 Inference Response Schema
The `/predict` endpoint produces a standardized JSON response:
```json
{
  "category": "financial_fraud",
  "confidence": 0.9241,
  "severity": "CRITICAL",
  "subcategory": "UPI / Banking & Card Fraud",
  "scores": {
    "financial_fraud": 0.9241,
    "phishing": 0.0412,
    "online_fraud": 0.0215,
    "..." : 0.0010
  },
  "model_version": "2.0.0-PRO"
}
```

### 3.5 High-Availability Fallback Mechanism
If the Flask microservice is unreachable (e.g., cold start, container restart, network disruption), `mlService.js` automatically routes the request to an in-memory heuristic NLP classification engine (`localRuleClassification`). This engine matches curated, high-precision forensic regex patterns across all 13 attack vectors, guaranteeing zero-downtime triage for incident intake.

---

## 4. Privacy Shield & PII Masking Architecture

To protect citizen confidentiality and satisfy Indian Digital Personal Data Protection (DPDP) Act 2023 principles, PII is sanitized **prior** to transmission to internal ML models or third-party AI APIs (`modelPrivacy.js` $\rightarrow$ `privacyShield.js`).

### 4.1 18-Stage Regex Masking Pipeline
Patterns are executed in a strict deterministic order to prevent sub-string collision (e.g., URLs processed before emails):

| Stage | PII Category | Detection Logic & Regex Boundary | Masked Token |
| :---: | :--- | :--- | :--- |
| 1 | **URL / Domain** | Web addresses (`http/https/www/ftp`) | `[URL_1]` |
| 2 | **UPI / VPA** | Indian Virtual Payment Addresses (`name@bank`, `phone@upi`) | `[UPI_ID_1]` |
| 3 | **Email** | Standard RFC 5322 email patterns | `[EMAIL_1]` |
| 4 | **IPv6 Address** | Full & collapsed 128-bit hexadecimal notation | `[IPV6_1]` |
| 5 | **IPv4 Address** | Dotted-decimal notation (0–255 octets) | `[IPV4_1]` |
| 6 | **Credit / Debit Card**| 13–19 digit Luhn-conforming numeric sequences | `[CREDIT_CARD_1]` |
| 7 | **Bank Account** | 9–18 digit numeric sequences preceded by banking keywords | `[BANK_ACCOUNT_1]` |
| 8 | **Driving Licence** | State-code prefixed Indian DL formats | `[DRIVING_LICENSE_1]` |
| 9 | **Passport** | 1 letter followed by 7 numeric digits | `[PASSPORT_1]` |
| 10 | **Aadhaar Number** | 12-digit Indian national identity numbers | `[AADHAAR_1]` |
| 11 | **PAN Card** | Indian Income Tax PAN format (`[A-Z]{5}[0-9]{4}[A-Z]`) | `[PAN_1]` |
| 12 | **IFSC Code** | Indian bank branch routing codes (`[A-Z]{4}0[A-Z0-9]{6}`) | `[IFSC_1]` |
| 13 | **Phone Number** | E.164 and Indian mobile numbers (`+91`, `0`, 10 digits) | `[PHONE_1]` |
| 14 | **Person Name** | Name-introducing phrases and labeled identity fields | `[PERSON_1]` |
| 15 | **Organization** | Corporate legal entity suffixes (Ltd, Pvt, LLC, Corp) | `[ORGANIZATION_1]` |
| 16 | **Postal PIN Code** | 6-digit Indian postal index numbers | `[PINCODE_1]` |
| 17 | **Social Handle** | Platform usernames (`@username`) | `[SOCIAL_HANDLE_1]` |
| 18 | **City Name** | Closed-dictionary lookup of global and Indian cities | `[CITY_1]` |

### 4.2 Masking Guarantees
- **Consistent Token Substitution**: Multiple occurrences of the same identifier within a single complaint document receive the same masked token index (e.g., `user@test.com` $\rightarrow$ `[EMAIL_1]` consistently).
- **Log Sanitation**: Unmasked PII values are strictly prevented from appearing in Winston application logs or standard output.

---

## 5. Optical Character Recognition (OCR) & Forensic Evidence Extraction

The OCR subsystem (`backend/src/services/ocrService.js`) ingests uploaded images (payment screenshots, extortion chats, bank SMS receipts) to automate transaction correlation.

### 5.1 OCR Processing Flow
1. **Engine**: Tesseract.js (WebAssembly / JavaScript port of the Tesseract OCR engine, operating on the `eng` trained model).
2. **Text Extraction**: Converts pixel buffers into unstructured UTF-8 text strings.
3. **Structured Financial Parsing (`extractFinancialIdentifiers`)**:
   - **Transaction References (UTR / RRN)**: Extracts 12-digit NPCI transaction references and labeled transaction tokens.
   - **Disputed Amounts**: Detects Indian Rupee currency symbols (`₹`, `INR`, `Rs.`) and numeric amounts ($0 < \text{amt} < 10,000,000$).
   - **Payment Applications**: Identifies application signatures (Google Pay, PhonePe, Paytm, BHIM, CRED, SBI YONO, ICICI, HDFC).
   - **VPA & Phone Numbers**: Extracts suspect receiver accounts and recipient contact numbers.

### 5.2 Receipt Forgery Analysis & Confidence Handling
Rather than relying solely on raw Tesseract character confidence (which reflects image optical sharpness rather than authenticity), CyberGuard computes a deterministic **Forensic Integrity Score** ($0 \le \text{Score} \le 100$):
- **Base Score**: 95 / 100.
- **Spoof APK Signatures**: Inspects raw text for strings matching known payment screenshot generator applications (`fakepay`, `spoof paytm`, `prank payment`, `fake transaction`, `simulator`). Detection deducts 60 points, immediately marking the receipt as `isSuspect: true`.
- **Missing Mandatory RRN**: High-value transactions ($\ge \text{₹}5,000$) asserting successful completion but lacking a 12-digit banking reference deduct 25 points.
- **Verdict States**: Categorized into `AUTHENTIC_RECEIPT`, `SUSPECT_FORGERY`, or `UNVERIFIED_FORMAT`.

---

## 6. Evidence Integrity & Chain of Custody

To satisfy judicial requirements under Section 63(4) of the Bharatiya Sakshya Adhiniyam (BSA) 2023 / Section 65B of the Indian Evidence Act:
1. **Magic Number Verification (`detectMagicType`)**: On upload, file buffers are inspected for binary magic signatures (JPEG `FF D8 FF`, PNG `89 50 4E 47`, PDF `%PDF`, MP4 `ftyp`). Executable payloads disguised with spoofed file extensions are rejected immediately.
2. **Cryptographic Hashing**: An unalterable SHA-256 cryptographic digest is computed via `crypto.createHash('sha256')` across the complete raw file stream.
3. **Immutability Record**: The SHA-256 digest is persisted directly on the MongoDB `Complaint` record (`evidence[i].sha256`) and recorded in the tamper-evident `chainOfCustody` log with timestamp, operator ID, and action identifier.
4. **Integrity Validation Endpoint**: The public verification route `POST /api/security/verify-integrity` allows judicial authorities and respondents to verify evidence integrity by submitting a SHA-256 hash or notice reference to confirm whether it matches the registered record.

---

## 7. Role-Based Access Control (RBAC) & Authorization Boundaries

The platform enforces strict multi-tier access boundaries:
- **`user` (Citizen / Complainant)**:
  - Can file new complaints.
  - Can view only their own filed complaints (`owner: req.user._id`).
  - Access to other citizen complaints is strictly prohibited (IDOR prevention).
- **`officer` (Investigating Officer)**:
  - Can view all complaints assigned to their desk or jurisdiction.
  - Can update case investigation statuses, append suspect intelligence, and generate statutory notice drafts.
  - Cannot access administrative server controls or assign arbitrary officer accounts.
- **`admin` (System Administrator)**:
  - Full operational visibility across all complaints, officer assignments, and audit trails.
  - Access to system forensics, model diagnostics, and administrative dashboards.
- **Role Elevation Tamper Protection**: During public registration (`authController.register`), the user role is hardcoded to `'user'`. Requests attempting to supply `{ role: 'admin' }` or `{ role: 'officer' }` are ignored by destructuring only allowed registration fields.
