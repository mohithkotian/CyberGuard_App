# CyberGuard Deployment Plan

**Repository:** `mohithkotian/CyberGuard_App`  
**Scope:** Deployment preparation only  
**Phase 2:** Not started  
**Deployment action:** No cloud deployment, account creation, database creation, or production submission was performed.

## Executive deployment assessment

CyberGuard is a multi-service application:

```text
Deployed React Web (Vercel or equivalent)
        │ HTTPS / REST / Socket.IO
        ▼
Node.js + Express Backend (Railway or equivalent)
        ├── Managed MongoDB
        └── Flask ML Service (separate Railway service or equivalent)

Expo Mobile → HTTPS Backend API
```

The actual backend entry point is `backend/src/server.js`. The root deployment files incorrectly referenced the Python/ML service or a nonexistent `backend/src/app.py`; those references were minimally corrected. The ML service has its own deployment files and remains a separate process.

The repository is **deployment-prepared but not deployment-ready for production traffic** until the production environment variables, managed MongoDB, ML model artifacts, HTTPS domains, CORS origins, upload storage strategy, and service health checks are supplied and verified.

## Files modified for deployment preparation

| File | Change |
|---|---|
| `Procfile` | Changed the root web process from nonexistent `python3 backend/src/app.py` to `cd backend && npm start`. |
| `railway.json` | Changed the root Railway start command from the ML service to `cd backend && npm start`. |
| `backend/src/server.js` | Replaced unrestricted browser CORS with an allowlist from `ALLOWED_ORIGINS`; native requests without an `Origin` header remain allowed. Socket.IO now uses the configured origin list rather than `*`. |
| `backend/src/routes/complaints.js` | Added an authenticated complaint-scoped evidence download route. |
| `backend/src/controllers/complaintsController.js` | Added owner/assigned-officer/admin authorization and path-safe file delivery for evidence. |
| `web-app/src/services/api.js` | Added an authenticated evidence-download API call. |
| `web-app/src/pages/ComplaintDetails.js` | Changed evidence links to authenticated downloads instead of public URLs. |
| `web-app/src/services/socket.js`, `web-app/src/components/SecureChat.js`, `web-app/src/pages/GlobalChat.js` | Send the existing bearer access token during Socket.IO handshakes. |
| `web-app/package-lock.json` | Added the missing locked `yaml@2.9.1` entry required by `npm ci`; no dependency upgrade was performed. |
| `web-app/.env.example` | Added public-only web API/socket configuration examples. |
| `web-app/src/pages/SubmitComplaint.js` | Replaced the hard-coded Railway API URL with `REACT_APP_API_URL` and a development-only localhost fallback. |
| `CYBERGUARD_DEPLOYMENT_PLAN.md` | This deployment architecture, checklist, command, environment, and blocker document. |

No Docker files, dependency versions, production databases, cloud accounts, or secrets were added or changed.

## Files inspected but not changed

- `backend/package.json`
- `backend/package-lock.json`
- `web-app/package.json`
- `web-app/package-lock.json`
- `mobile-app/package.json`
- `mobile-app/package-lock.json`
- `mobile-app/app.json`
- `mobile-app/eas.json`
- `mobile-app/src/services/api.js`
- `mobile-app/.env.example`
- `mobile-app/README.md`
- `ml-service/Procfile`
- `ml-service/railway.json`
- `ml-service/src/app.py`
- `ml-service/src/requirements.txt`
- `requirements.txt`
- `web-app/vercel.json`
- `web-app/src/services/api.js`
- `web-app/src/services/socket.js`

There are no repository Dockerfiles or docker-compose files to deploy.

## 1. Web hosting

### Recommended target

Host `web-app` as a static React application on Vercel or an equivalent static hosting provider.

The repository already includes `web-app/vercel.json`, which rewrites all paths to `/index.html` for React Router support.

### Build configuration

- **Project/root directory:** `web-app`
- **Install command:** `npm ci` after repairing the existing lockfile mismatch, or the provider’s standard npm install if lockfile repair is intentionally deferred.
- **Build command:** `npm run build`
- **Output directory:** `build`
- **Framework:** Create React App through CRACO
- **SPA routing:** Preserve the existing rewrite to `/index.html`

### Public web variables

Set the following in the web hosting provider:

```text
REACT_APP_API_URL=https://api.example.com/api
REACT_APP_SOCKET_URL=https://api.example.com
GENERATE_SOURCEMAP=false
```

`REACT_APP_API_URL` is public browser configuration. It must contain no secret. `REACT_APP_SOCKET_URL` is also public and should point to the backend origin, not the `/api` path.

### Web deployment blocker

The existing `web-app/package-lock.json` is out of sync with `web-app/package.json`; `npm ci` reports that `yaml@2.9.1` is missing from the lockfile. This must be resolved in a dependency-maintenance change before a reproducible CI deployment. Validation used `npm install --package-lock=false` without altering the lockfile.

The production web build succeeds without CI warning promotion but reports existing dynamic-`require` warnings and a large bundle warning. With `CI=true`, those warnings fail the build and require cleanup or an explicitly approved warning policy.

## 2. Backend hosting

### Recommended target

Run the Node.js/Express backend as a separate Railway service or equivalent Node service.

### Actual entry point

```text
backend/src/server.js
```

`backend/package.json` defines:

```text
npm start → node src/server.js
```

### Repository startup commands

From the repository root:

```bash
cd backend
npm ci --omit=dev
npm start
```

The corrected root Procfile uses:

```text
web: cd backend && npm start
```

The corrected root Railway command uses:

```text
cd backend && npm start
```

If the hosting provider supports a service root directory, the cleaner provider-level configuration is:

```text
Root directory: backend
Build/install: npm ci --omit=dev
Start: npm start
```

The service must provide the platform’s `$PORT`; the application listens on `0.0.0.0` and uses `process.env.PORT` with `5002` as the local fallback.

### Backend health check

The backend now exposes `GET /health`, returning only `{ status: "ok", service: "cyberguard-backend" }`. It does not expose secrets, environment variables, database credentials, or stack traces. It is an HTTP-process health check and does not claim MongoDB or ML readiness.

## 3. MongoDB hosting

Use a managed MongoDB deployment such as MongoDB Atlas or an approved internal MongoDB service. Do not use a local MongoDB URI in production.

The backend reads the connection string in this order:

```text
MONGODB_URI
MONGODB_URI_PROD
```

Recommended production configuration:

```text
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority
```

The exact database name is deployment-specific and must not be invented in this document. Configure network access, least-privilege database credentials, TLS, backups, and retention in the managed MongoDB provider.

Do not create or modify a production database as part of this preparation task.

## 4. ML service hosting

Run the Flask ML service as a separate Python service. The repository includes dedicated ML deployment files:

- `ml-service/Procfile`
- `ml-service/railway.json`
- `ml-service/src/app.py`
- `ml-service/src/requirements.txt`

### Startup command

The dedicated ML Procfile uses:

```text
gunicorn -w 2 -b 0.0.0.0:$PORT src.app:app
```

The ML Railway configuration currently uses:

```text
python3 train_model.py && gunicorn -w 2 -b 0.0.0.0:$PORT src.app:app
```

This assumes the service root is `ml-service` and that `data/dataset.csv` is available. Training at every deployment is operationally expensive and should be replaced by a controlled build artifact process in a later deployment-hardening task; this plan does not modify it.

### Python dependencies

Use:

```text
ml-service/src/requirements.txt
```

It includes Flask, Flask-CORS, scikit-learn, NLTK, pandas, NumPy, joblib, python-dotenv, gunicorn, seaborn, and matplotlib.

The root `requirements.txt` is not equivalent to the ML service requirements because it omits pandas, NumPy, gunicorn, seaborn, and matplotlib.

### Required model files

The runtime expects:

```text
ml-service/models/classifier.pkl
ml-service/models/vectorizer.pkl
```

These files were absent during validation. The service can start and return health metadata with `model_loaded: false`, but `/predict` cannot provide classification until both artifacts exist. The repository `.gitignore` excludes `*.pkl` and `models/*.pkl`.

Do not retrain or modify the model as part of deployment preparation. Before production, generate or securely provide the exact approved model artifacts through a controlled artifact store or a reviewed build step.

### ML environment variables

Optional/available variables used by `src/app.py`:

```text
PORT=<platform-provided port, default 5003 locally>
MODEL_PATH=<optional absolute/path/to/classifier.pkl>
VECTORIZER_PATH=<optional absolute/path/to/vectorizer.pkl>
MAX_TEXT_LENGTH=<optional maximum input length>
LOG_LEVEL=<optional log level>
```

The backend must point to the deployed ML service through:

```text
ML_SERVICE_URL=https://ml.example.com
ML_SERVICE_TIMEOUT=10000
```

The backend default is a local loopback URL and is not suitable for a split production deployment.

## 5. Mobile distribution

The mobile app uses Expo and EAS configuration in `mobile-app/eas.json`.

### Production API configuration

Set the public API URL during the EAS build environment:

```text
EXPO_PUBLIC_API_URL=https://api.example.com/api
```

The value may be supplied through the EAS environment/secrets mechanism or the CI environment that invokes the build. It is public client configuration and must contain no backend secret.

Example command pattern:

```bash
cd mobile-app
eas env:create --name EXPO_PUBLIC_API_URL --value https://api.example.com/api --environment production
eas build --platform android --profile production
eas build --platform ios --profile production
```

Use the organization’s current EAS CLI syntax and authenticated project configuration when executing these commands. No EAS command was run during this preparation task.

The mobile source no longer contains the temporary localtunnel URL. It has a development-only localhost fallback and requires explicit configuration for production builds.

### Existing EAS profiles

- `development`: development client/internal distribution
- `preview`: internal Android APK
- `production`: Android App Bundle and iOS build

Before distribution, configure app signing, bundle identifiers, Apple/Google credentials, privacy declarations, notification credentials, and store metadata in the EAS account. No accounts or credentials were created here.

## 6. Environment-variable checklist

### Backend secrets and private service variables

Set these only in the backend hosting provider’s secret/environment configuration. Never place them in web or Expo source.

| Variable | Required status | Purpose / expected format |
|---|---|---|
| `MONGODB_URI` | Required | `mongodb+srv://<user>:<password>@<host>/<db>?...`; preferred production connection string |
| `MONGODB_URI_PROD` | Fallback/optional | Alternate production MongoDB URI; do not use both ambiguously |
| `JWT_SECRET` | Required | Long random secret used to sign access tokens |
| `JWT_REFRESH_SECRET` | Required | Different long random secret used to sign refresh tokens |
| `JWT_EXPIRES_IN` | Required/recommended | Access-token duration such as `15m` or approved policy value |
| `JWT_REFRESH_EXPIRES_IN` | Required/recommended | Refresh-token duration such as `30d` |
| `ADMIN_EMAIL` | Required for seeded admin | Initial administrator email; use a controlled value |
| `ADMIN_PASSWORD` | Required for seeded admin | Strong initial password; rotate after first access |
| `NAME_MASK_SALT` | Required for stable privacy masking | Long random private salt; never expose to clients |
| `ML_SERVICE_URL` | Required for ML-enabled production | Private/internal or HTTPS ML service URL |
| `ML_SERVICE_TIMEOUT` | Recommended | Millisecond timeout, for example `10000` |
| `GEMINI_API_KEY` | Optional feature secret | Gemini API key for server-side AI email/JARVIS functions |
| `ELEVENLABS_API_KEY` | Optional feature secret | Server-side JARVIS voice/TTS integration |
| `SMTP_HOST` | Required for email delivery | SMTP hostname |
| `SMTP_PORT` | Required for email delivery | Usually `587` or `465` |
| `SMTP_USER` | Required for email delivery | SMTP account username |
| `SMTP_PASS` | Required for email delivery | SMTP password/app password |
| `TWILIO_ACCOUNT_SID` | Optional SMS secret | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Optional SMS secret | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Optional SMS config | Twilio sender number |
| `TWILIO_MESSAGING_SERVICE_SID` | Optional SMS config | Twilio messaging service SID; use instead of sender number where applicable |

### Backend non-secret operational variables

| Variable | Required status | Purpose / expected format |
|---|---|---|
| `NODE_ENV` | Required | Set `production` in production |
| `PORT` | Platform-provided | Bind to the hosting platform’s assigned port |
| `ALLOWED_ORIGINS` | Required in production | Comma-separated exact browser origins, for example `https://app.example.com,https://admin.example.com` |
| `MAX_FILE_SIZE` | Recommended | Evidence upload byte limit, for example `10485760` |
| `UPLOAD_PATH` | Required if local uploads remain | Local upload directory; see storage blocker below |
| `RATE_LIMIT_WINDOW` | Optional/currently documented | Intended rate-limit window configuration; verify actual server usage before relying on it |
| `RATE_LIMIT_MAX` | Optional/currently documented | Intended rate-limit maximum; verify actual server usage before relying on it |

### Public web/mobile variables

These values are intentionally public and contain no secrets.

| Variable | Client | Value |
|---|---|---|
| `REACT_APP_API_URL` | Web | `https://api.example.com/api` |
| `REACT_APP_SOCKET_URL` | Web | `https://api.example.com` |
| `GENERATE_SOURCEMAP` | Web build | `false` if source maps should not be published |
| `EXPO_PUBLIC_API_URL` | Expo mobile | `https://api.example.com/api` |

Do not put any MongoDB URI, JWT secret, SMTP password, Twilio token, Gemini key, ElevenLabs key, or ML private credential in these client variables.

## 7. CORS and domains

The backend now uses an exact origin allowlist:

```text
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

Requests with no `Origin` header, such as native mobile API requests, remain allowed by the CORS callback. Browser requests from origins not in the allowlist are rejected.

The Socket.IO server also uses the configured allowlist rather than `*`. Existing web clients now send the access token during the handshake. The server rejects missing, invalid, expired, blacklisted, inactive, or locked-user tokens; restricts admin/user room joins; checks complaint owner/assigned-officer/admin access before joining complaint rooms; and replaces client-provided sender identity with the authenticated user.

Recommended domains:

```text
https://app.example.com       Web application
https://api.example.com       Node/Express backend
https://ml.example.com        Flask ML service, preferably private/internal
```

If the ML service is private, use the provider’s private networking or internal service URL and do not expose it publicly.

## 8. HTTPS

Production requirements:

- HTTPS for the web application.
- HTTPS for the backend API.
- HTTPS or private TLS networking for the ML service.
- No production `http://localhost`, `127.0.0.1`, or temporary localtunnel URLs.
- Configure secure cookies only if/when cookie authentication is enabled; current clients use bearer tokens.
- Configure trusted proxy behavior and secure headers according to the selected hosting provider.

## 9. Uploads and storage

The backend currently uses a local `uploads` directory. Evidence is no longer exposed through the public `/uploads` static mount; it is served through an authenticated complaint-scoped route. Existing chat attachments still use a static chat-upload path until dedicated chat attachment authorization is addressed.

Current blocker:

- Evidence/avatar/chat files may disappear during redeploy or instance replacement.
- Chat attachment access still requires a dedicated authorization design.

Before production evidence handling, choose a durable private object-storage design, configure signed/authorized access, migrate upload handling, and define retention/backup policy. This is a deployment/security follow-up and was not expanded here.

## 10. Exact deployment commands

### Backend local/host command

```bash
cd backend
npm ci --omit=dev
NODE_ENV=production npm start
```

### ML local/host command

From `ml-service`:

```bash
python3 -m pip install -r src/requirements.txt
python3 train_model.py
PORT=5003 gunicorn -w 2 -b 0.0.0.0:$PORT src.app:app
```

Do not run `train_model.py` in production unless the deployment process intentionally treats training as a controlled build step and the dataset/model governance has been approved.

### Web build command

```bash
cd web-app
npm ci
REACT_APP_API_URL=https://api.example.com/api \
REACT_APP_SOCKET_URL=https://api.example.com \
GENERATE_SOURCEMAP=false \
npm run build
```

Serve the resulting `build/` directory with SPA fallback to `index.html`.

### Mobile production build commands

```bash
cd mobile-app
eas build --platform android --profile production
eas build --platform ios --profile production
```

Provide `EXPO_PUBLIC_API_URL` through the EAS production environment before building.

## 11. Service dependencies and startup order

1. Managed MongoDB is provisioned and reachable from the backend service.
2. ML model artifacts are supplied and ML service health reports `model_loaded: true`.
3. ML service starts and its URL is configured as `ML_SERVICE_URL`.
4. Backend starts with MongoDB, JWT, CORS, upload, and optional integration variables.
5. Backend HTTPS URL is configured in web and Expo builds.
6. Web is built and deployed with SPA rewrites.
7. Mobile production builds are generated with the production API URL.
8. End-to-end login, refresh, complaint, evidence, admin/officer, email/SMS, and ML flows are verified in staging before production traffic.

## 12. Production checklist

### Infrastructure

- [ ] Backend service root/start command points to `backend/src/server.js`.
- [ ] ML service is a separate service with `src.app:app` startup.
- [ ] Managed MongoDB is provisioned with backups and network restrictions.
- [ ] Durable object storage is selected for uploads.
- [ ] HTTPS certificates/domains are active.
- [ ] Production logs and alerts are configured.

### Secrets

- [ ] `MONGODB_URI` is stored only in backend secrets.
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are long, random, and different.
- [ ] Admin seed credentials are controlled and rotated.
- [ ] SMTP/Twilio/Gemini/ElevenLabs values are stored only server-side.
- [ ] No `.env` files or secrets are committed.

### Application

- [ ] `ALLOWED_ORIGINS` contains exact deployed browser origins.
- [ ] `ML_SERVICE_URL` points to a reachable ML service.
- [ ] ML model files exist and `/health` reports `model_loaded: true`.
- [ ] Web uses production `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL`.
- [ ] Mobile uses production `EXPO_PUBLIC_API_URL`.
- [ ] Web evidence links resolve through the configured backend origin.
- [ ] Backend upload persistence and authorization are production-safe.
- [ ] Registration cannot assign privileged roles.
- [ ] Refresh-token rotation is tested in staging.

### Verification

- [ ] Backend startup and MongoDB connection.
- [ ] Web build with the real production environment.
- [ ] Mobile EAS preview build against staging.
- [ ] Login, registration, logout, and refresh.
- [ ] Complaint creation, retrieval, detail, and evidence upload.
- [ ] Admin/officer access separation.
- [ ] Email/SMS behavior where enabled.
- [ ] ML classification.
- [ ] CORS preflight from each deployed browser origin.
- [ ] Socket.IO authorization before enabling real-time features.

## 13. Current deployment blockers

1. The production MongoDB URI, credentials, network policy, and backups are not supplied.
2. ML model artifacts are generated locally but remain ignored/untracked; an approved production artifact storage or build-promotion process is still required.
3. The web lockfile mismatch was repaired and `npm ci` now succeeds; dependency deprecation warnings remain.
4. Local filesystem uploads are not durable or privately authorized on typical PaaS hosting.
5. No production domains, HTTPS certificates, hosting projects, or cloud accounts are configured.
6. The new `/health` endpoint checks HTTP process availability only; a deeper dependency health check is not implemented.
7. Socket.IO security is implemented for existing web behavior, but staging verification with real users and rooms is still required.
8. Web build warnings fail when `CI=true`; the warning policy/build issues need resolution for strict CI.
9. Expo production signing, notification credentials, and store metadata are not configured.
10. The ML Railway deployment currently trains at startup; model governance and artifact promotion need a production decision.
11. Some optional integrations are graceful when unset, but email/SMS/AI functionality will not operate until their server-side variables are supplied.

## 14. Deployment preparation validation

Performed during preparation:

- Inspected Procfile, Railway manifests, web Vercel config, package scripts, Expo/EAS configuration, ML requirements, startup commands, and environment references.
- Confirmed backend entry point is `backend/src/server.js`.
- Confirmed ML entry point is `ml-service/src/app.py`.
- Confirmed no Dockerfile or docker-compose configuration exists.
- Confirmed web build output is `web-app/build`.
- Confirmed mobile production profiles exist in `mobile-app/eas.json`.
- Confirmed production mobile API configuration uses `EXPO_PUBLIC_API_URL` and no temporary tunnel URL remains.
- Validated deployment JSON files and modified JavaScript syntax.
- Generated deterministic ML artifacts from the existing dataset and verified `/health` and `/predict` with the running Flask service.
- Verified `web-app/npm ci` succeeds after the minimal lockfile repair.
- Added authenticated evidence retrieval and Socket.IO handshake/room authorization.
- Verified `git diff --check`.

No deployment was performed and no production data or credentials were accessed.

## Final recommendation

Deploy only after provisioning a managed MongoDB instance, promoting approved ML model artifacts, choosing durable private upload storage, configuring exact HTTPS domains and CORS origins, and running the full staging checklist. Keep the backend, ML service, web host, and Expo distribution as separate deployment concerns. Do not begin Phase 2 until these production blockers are addressed.
