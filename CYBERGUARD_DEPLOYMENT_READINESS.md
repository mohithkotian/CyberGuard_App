# Deployment Readiness

**Repository:** `mohithkotian/CyberGuard_App`  
**Scope:** Deployment blocker resolution only  
**Phase 2:** Not started  
**Deployment performed:** No. No cloud account, production credential, or production database was created or modified.

## Backend

**BLOCKED for production runtime verification; source and deployment configuration are prepared.**

The backend entry point is confirmed as `backend/src/server.js`, and `backend/package.json` starts it with `node src/server.js`. The root `Procfile` and root `railway.json` now use `cd backend && npm start` rather than the nonexistent `backend/src/app.py` or the separate ML service.

Completed backend readiness work includes:

- Added `GET /health`, returning only `{ status: "ok", service: "cyberguard-backend" }`.
- Restricted CORS to the comma-separated `ALLOWED_ORIGINS` allowlist while allowing native requests without an `Origin` header.
- Removed the public `/uploads` static mount for evidence.
- Added authenticated complaint-scoped evidence delivery.
- Added Socket.IO JWT handshake authentication, blacklist checks, inactive/locked-user checks, room authorization, and server-side sender identity.

`npm ci --no-audit --no-fund` succeeded and all backend JavaScript syntax checks passed.

**Exact blocker:** A full backend runtime test could not be completed because no MongoDB server is available at the local validation environment’s `127.0.0.1:27017`.

**Why it exists:** The backend connects to MongoDB during startup and requires a live database for authentication, complaint, evidence, and Socket.IO integration tests.

**Required:** Supply a managed production/staging MongoDB URI and run staging integration tests.

**Code changes required:** No additional code change is required for the current HTTP health endpoint. Further production work may be required for durable uploads.

**External configuration required:** `MONGODB_URI`, JWT secrets, admin seed values, `ALLOWED_ORIGINS`, and other backend variables.

## MongoDB

**BLOCKED.**

The backend reads the production connection string from:

```text
MONGODB_URI
```

It falls back to `MONGODB_URI_PROD` if `MONGODB_URI` is not present. Expected production format:

```text
mongodb+srv://<user>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority
```

Initialization requirements:

- MongoDB must be reachable from the backend host.
- The database user must have least-privilege access to the application database.
- TLS, network restrictions, backups, and retention must be configured by the managed provider.
- The backend automatically creates the seeded administrator when the database is empty or the seed logic determines it is required.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` must be supplied for controlled administrator seeding and rotated after first access.
- Existing Mongoose indexes include the unique `complaintId` index, indexed `userId`, and a text index on complaint title/description.
- No migration framework was found. Schema/index changes rely on Mongoose model initialization and application behavior.

**Exact blocker:** No staging or production MongoDB instance/URI was supplied, and no database was created by this task.

**Why it exists:** Database state and credentials are external deployment resources.

**Required:** Provision and secure a managed MongoDB deployment, then test backend startup and indexes against a non-production staging database.

**Code changes required:** None for basic startup. A future migration strategy may be needed for schema evolution.

**External configuration required:** `MONGODB_URI`, database access rules, backups, TLS, and administrator credentials.

## ML Service

**PASS for local artifact generation and service prediction; BLOCKED for production artifact promotion.**

The ML entry point is `ml-service/src/app.py`. The existing deterministic training pipeline is `ml-service/train_model.py`, using `ml-service/data/dataset.csv`. The classifier uses `random_state=42`.

Generated locally from the existing pipeline:

```text
ml-service/models/classifier.pkl
ml-service/models/vectorizer.pkl
```

The artifacts are intentionally ignored by `.gitignore`; they are not committed. The training run loaded 257 samples across 13 categories, reported 0.7436 test accuracy, and generated both required files.

Validation performed:

- ML service `/health` returned HTTP 200 with `model_loaded: true`.
- ML service `/predict` returned a phishing classification for a phishing test input.
- Python compilation checks passed.
- The service can run behind the existing Gunicorn command:

```bash
gunicorn -w 2 -b 0.0.0.0:$PORT src.app:app
```

**Exact blocker:** The generated model files remain ignored/untracked, and the current Railway configuration trains at service startup.

**Why it exists:** The repository intentionally excludes pickle artifacts, while production needs an approved model-artifact delivery process.

**Required:** Store or promote the approved artifacts through a controlled build/artifact repository, or explicitly approve the existing dataset-training step as the deployment build process. Verify `/health` reports `model_loaded: true` in staging.

**Code changes required:** No model code change is required. Replacing train-at-startup with controlled artifact promotion would be a later deployment-hardening change.

**External configuration required:** ML service hosting, private service networking, `ML_SERVICE_URL`, and artifact storage/promotion.

## Web

**PASS with build warnings.**

The web application builds from `web-app` using:

```bash
npm ci
npm run build
```

Output directory:

```text
web-app/build
```

`web-app/vercel.json` preserves SPA routing by rewriting requests to `index.html`.

Completed work:

- Repaired the minimal `package-lock.json` mismatch by adding the missing locked `yaml@2.9.1` entry.
- `npm ci` succeeds.
- The production build succeeds.
- Hard-coded Railway and localhost evidence/API URLs were replaced with `REACT_APP_API_URL`-derived configuration or authenticated API calls.
- Existing Socket.IO web clients now send the access token in the handshake.
- Added `web-app/.env.example` containing only public variables.

Public variables:

```text
REACT_APP_API_URL=https://<chosen-api-domain>/api
REACT_APP_SOCKET_URL=https://<chosen-api-domain>
GENERATE_SOURCEMAP=false
```

**Remaining issue:** The build emits existing dynamic-`require` and bundle-size warnings. The build succeeds normally, but `CI=true` may promote warnings to errors.

**Required:** Resolve or explicitly govern the existing build warnings before strict CI deployment.

**Code changes required:** Not required for the current successful non-CI build; warning cleanup is recommended.

**External configuration required:** Final web hosting project and eventual API/socket domain values.

## Mobile

**PASS for dependency and bundle validation; BLOCKED for distribution.**

The mobile app uses Expo/EAS and reads its backend URL from:

```text
EXPO_PUBLIC_API_URL
```

The Android Expo export succeeded after the Phase 1.1 JSX correction. No mobile production build or publication was performed.

Production builds require:

```text
EXPO_PUBLIC_API_URL=https://<chosen-api-domain>/api
```

The value must be supplied through the EAS production environment or CI build environment. No backend secrets may be placed in Expo.

**Exact blocker:** EAS signing credentials, store configuration, notification credentials, and final API domain are not configured.

**Why it exists:** Mobile distribution requires external Apple/Google/EAS project configuration.

**Required:** Configure EAS project/signing and run a preview build against staging before production distribution.

**Code changes required:** None for current API configuration.

**External configuration required:** EAS environment variable, signing credentials, store metadata, and notification setup.

## File Storage

**BLOCKED for durable production evidence retention; authorization is improved.**

Evidence is currently written to:

```text
<backend working directory>/uploads/evidence
```

Chat attachments are written to:

```text
<backend working directory>/uploads/chats
```

Evidence is stored in the complaint document with a filename and relative URL. The public `/uploads` mount was removed for evidence, and evidence is now retrieved through:

```text
GET /api/complaints/:complaintId/evidence/:filename
```

The route requires JWT authentication and permits only:

- The complaint owner
- The assigned officer
- An administrator

It validates the requested filename against the complaint’s stored evidence and resolves the final path under the evidence directory.

**Exact blocker:** Local filesystem storage is not durable on most PaaS platforms. Existing chat attachments still use a static chat-upload path and need a dedicated authorization design.

**Why it exists:** Instance replacement or redeployment can remove local files, and object storage was not already present in the repository.

**Required:** Select durable private object storage, migrate upload writes and reads, define retention/backups, and authorize chat attachment retrieval.

**Code changes required:** Yes, for durable object storage and chat attachment authorization.

**External configuration required:** Object-storage bucket, private access policy, credentials, retention, and lifecycle policy.

## Socket.IO

**PASS for implemented security controls; BLOCKED for staging integration verification.**

The existing web Socket.IO behavior remains in place, but the server now:

- Requires a JWT in the Socket.IO handshake.
- Rejects missing, invalid, expired, blacklisted, inactive, and locked-user tokens.
- Restricts admin-room joins to administrators.
- Restricts user-room joins to the authenticated user’s own ID.
- Checks complaint-room access for complaint owner, assigned officer, or administrator.
- Replaces client-provided sender identity with the authenticated socket user.
- Uses the configured CORS origin allowlist rather than `*`.

Existing web clients were updated to provide the token. No mobile Socket.IO/chat integration was added.

**Exact blocker:** No live MongoDB-backed staging session was available to verify handshake, room, and message behavior end to end.

**Why it exists:** Socket authentication and complaint authorization depend on live user, blacklist, and complaint records.

**Required:** Run staging tests with normal users, officers, administrators, invalid tokens, expired tokens, revoked tokens, and unauthorized complaint-room attempts.

**Code changes required:** No additional change required before staging verification, except any defects exposed by those tests.

**External configuration required:** Production `REACT_APP_SOCKET_URL`, `ALLOWED_ORIGINS`, and staging users/data.

## Security

**PASS for the scoped blocker fixes; BLOCKED for full production security sign-off.**

Completed security improvements:

- Restricted browser CORS to `ALLOWED_ORIGINS`.
- Preserved native no-`Origin` API requests.
- Removed public evidence static serving.
- Added server-side evidence authorization.
- Added Socket.IO authentication and room authorization.
- Replaced client-provided Socket.IO sender identity.
- Kept backend secrets out of web and Expo configuration.
- Preserved the Phase 1 public-registration role restrictions and refresh-token changes.

**Exact blocker:** Durable storage authorization, production secret configuration, staging penetration testing, and chat attachment authorization remain incomplete.

**Why it exists:** These require deployment infrastructure, live data, and external security verification.

**Required:** Complete staging security tests, object-storage migration, chat attachment authorization, secret rotation, and operational monitoring.

**Code changes required:** Yes for durable storage and chat attachments.

**External configuration required:** Managed secrets, storage, HTTPS, monitoring, and security testing.

## Environment Configuration

**BLOCKED until deployment-specific values are supplied; templates are prepared.**

### BACKEND-ONLY SECRETS

```text
MONGODB_URI
MONGODB_URI_PROD
JWT_SECRET
JWT_REFRESH_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
NAME_MASK_SALT
SMTP_USER
SMTP_PASS
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
GEMINI_API_KEY
ELEVENLABS_API_KEY
```

Also configure server-side operational values:

```text
NODE_ENV=production
PORT=<platform-provided>
ALLOWED_ORIGINS=https://<chosen-web-domain>
ML_SERVICE_URL=https://<chosen-ml-service-domain>
ML_SERVICE_TIMEOUT=10000
SMTP_HOST
SMTP_PORT
TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID
MAX_FILE_SIZE
UPLOAD_PATH
```

### PUBLIC WEB VARIABLES

```text
REACT_APP_API_URL=https://<chosen-api-domain>/api
REACT_APP_SOCKET_URL=https://<chosen-api-domain>
GENERATE_SOURCEMAP=false
```

### PUBLIC MOBILE VARIABLES

```text
EXPO_PUBLIC_API_URL=https://<chosen-api-domain>/api
```

**Exact blocker:** Final domains, managed-service credentials, and hosting environments do not exist in this task.

**Why it exists:** The task explicitly prohibits creating accounts, credentials, or production resources.

**Required:** Supply values through the selected hosting/EAS secret managers after domains and services are chosen.

**Code changes required:** None for current templates.

**External configuration required:** All production values and secret managers.

## Production Build

**PASS for local build validation; BLOCKED for production release.**

Validated:

- Backend `npm ci` succeeded.
- Backend JavaScript syntax checks passed.
- Web `npm ci` succeeded after the minimal lockfile repair.
- Web `npm run build` succeeded.
- Expo Android export succeeded.
- ML requirements were already installed and the ML service returned successful health and prediction responses with generated artifacts.
- Python compilation checks passed.
- Deployment JSON files parsed successfully.
- `git diff --check` passed.

**Exact blocker:** Production release still depends on MongoDB, domains/HTTPS, secret configuration, durable storage, ML artifact promotion, EAS signing, and staging integration verification.

**Why it exists:** These are external deployment and operational prerequisites, not local build failures.

**Required:** Complete the production checklist after staging verification.

**Code changes required:** Additional durable storage work remains.

**External configuration required:** Hosting, database, ML artifact, domains, secrets, storage, and EAS configuration.

## Changed files in this task

- `Procfile`
- `railway.json`
- `backend/src/server.js`
- `backend/src/routes/complaints.js`
- `backend/src/controllers/complaintsController.js`
- `web-app/package-lock.json`
- `web-app/src/services/api.js`
- `web-app/src/services/socket.js`
- `web-app/src/components/SecureChat.js`
- `web-app/src/pages/ComplaintDetails.js`
- `web-app/src/pages/GlobalChat.js`
- `web-app/src/pages/SubmitComplaint.js`
- `web-app/.env.example`
- `CYBERGUARD_DEPLOYMENT_PLAN.md`
- `CYBERGUARD_DEPLOYMENT_READINESS.md`

Generated locally but ignored by Git:

- `ml-service/models/classifier.pkl`
- `ml-service/models/vectorizer.pkl`

## Final status

The repository is **locally deployment-prepared**, but **not approved for production deployment**. The remaining blockers are primarily external infrastructure and staging-verification requirements: MongoDB, durable storage, service domains, secrets, ML artifact promotion, EAS credentials, and end-to-end security testing.

No deployment was performed. Phase 2 was not started.
