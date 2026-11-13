# CyberGuard Deployment Execution Checklist

**Repository:** `mohithkotian/CyberGuard_App`  
**Purpose:** Human-executed deployment sequence for the current repository  
**Scope:** Checklist only. No deployment, account creation, credential creation, production configuration change, or database modification was performed while creating this file.

## How to use this checklist

Execute the steps in order. Replace every angle-bracket placeholder with a value chosen by the deployment owner. Do not use the placeholder values literally. Do not invent a domain, account name, database name, username, password, API key, or credential.

The repository has three separately hosted runtime services and two clients:

```text
Web client:     web-app/
Backend API:    backend/
ML service:     ml-service/
Mobile client:  mobile-app/
Database:       Managed MongoDB selected by the deployment owner
```

The backend and ML service may be hosted on the same provider, but they must remain separate processes/services because they have different runtimes and startup commands.

---

## MUST DO BEFORE STAGING

## 1. Create the required accounts and services

**Action:** Create or obtain access to the external services needed for a non-production staging environment.

**Where the action is performed:** The selected provider consoles and the DNS registrar/provider controlled by the deployment owner. Do not create them from this repository checklist.

**Services/accounts required:**

- Managed MongoDB service.
- Railway or an equivalent Node/Python service host with two services: one backend service and one ML service.
- Vercel or an equivalent static web host.
- Expo/EAS project access for mobile preview builds.
- DNS management access for the chosen web, API, and optional ML hostnames.
- Durable private object storage if local filesystem uploads will not be accepted for staging or production.

**Repository root:** No repository command is required for account creation.

**Build/start commands:** None.

**Required variables:** None at account-creation time. Create secrets only in the selected provider secret managers after the required values are approved.

**URLs produced:** None yet. Record the provider-generated service identifiers and reserved domains without committing them to source code.

**Dependencies:** This step precedes MongoDB, ML, backend, web, and mobile setup.

**Verification:** Confirm that the deployment owner can access each service console, create staging resources, configure environment variables, view logs, and roll back/delete staging resources without affecting production.

## 2. Set up staging MongoDB

**Action:** Provision a dedicated non-production MongoDB database. Do not use a local MongoDB URI and do not use the production database for staging.

**Where the action is performed:** Managed MongoDB provider console.

**Repository root:** No repository change. Backend database code is under `backend/src/config/database.js`.

**Connection variable:**

```text
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority
```

The backend reads `MONGODB_URI` first and `MONGODB_URI_PROD` as a fallback. Use `MONGODB_URI` for staging and keep production credentials separate.

**Build/start commands:** None for MongoDB.

**Required setup:**

- Create a staging database/user with least-privilege access.
- Allow network access from the staging backend service.
- Enable TLS and backups according to the provider’s staging policy.
- Prepare `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the application’s initial administrator seed.
- Do not manually invent or commit credentials.

**URL produced:** A private MongoDB connection string, stored only in the backend staging secret manager.

**Depends on:** Step 1.

**Services that depend on it:** Backend staging service; indirectly the web and mobile staging clients.

**Verification:** Use the backend staging logs to confirm MongoDB connection success. Verify that the backend can initialize its Mongoose models and indexes. Confirm that no MongoDB URI appears in client bundles, repository files, or public logs.

## 3. Set up the staging ML service

**Action:** Create a separate Python service for the Flask ML application.

**Where the action is performed:** Railway Python service or equivalent Python host.

**Exact project/root directory:**

```text
ml-service/
```

**Relevant files:**

```text
ml-service/Procfile
ml-service/railway.json
ml-service/src/app.py
ml-service/src/requirements.txt
ml-service/train_model.py
ml-service/data/dataset.csv
```

**Install/build command:**

```bash
python3 -m pip install -r src/requirements.txt
```

**Start command:** The repository’s dedicated ML Railway configuration currently uses:

```bash
python3 train_model.py && gunicorn -w 2 -b 0.0.0.0:$PORT src.app:app
```

The dedicated Procfile command is:

```bash
gunicorn -w 2 -b 0.0.0.0:$PORT src.app:app
```

Use the training command only if the deployment owner explicitly approves training as the staging build step. The safer production approach is to promote approved artifacts and start only Gunicorn.

**Required variables:**

```text
PORT=<platform-provided port>
MODEL_PATH=<optional model path if the host does not use the default>
VECTORIZER_PATH=<optional vectorizer path if the host does not use the default>
MAX_TEXT_LENGTH=<optional configured input limit>
LOG_LEVEL=<optional log level>
```

The service requires these artifacts at runtime:

```text
ml-service/models/classifier.pkl
ml-service/models/vectorizer.pkl
```

The current repository pipeline generated both artifacts locally from `train_model.py` and `data/dataset.csv`; the artifacts are ignored by Git. Do not fabricate replacements. Promote only artifacts generated by the approved pipeline.

**URL produced:** Record the ML service’s private/internal URL if the provider supports private networking. Otherwise record its HTTPS service URL. Do not invent the URL in source code.

**Depends on:** Step 1. The backend depends on this service for ML classification.

**Verification:**

```bash
curl -fsS https://<chosen-ml-domain>/health
curl -fsS -X POST https://<chosen-ml-domain>/predict \
  -H 'Content-Type: application/json' \
  -d '{"text":"staging phishing test"}'
```

Confirm `/health` reports `model_loaded: true` and `/predict` returns a classification. Confirm the service is not running Flask debug mode in staging or production; use Gunicorn.

## 4. Set up the staging backend Railway service

**Action:** Create a separate Node.js backend service.

**Where the action is performed:** Railway or the selected Node service host.

**Exact project/root directory:** Preferred provider configuration:

```text
backend/
```

If the provider uses the repository root instead, use the corrected root `Procfile` and `railway.json`.

**Entry point:**

```text
backend/src/server.js
```

**Install/build command:**

```bash
npm ci --omit=dev
```

**Start command:**

```bash
npm start
```

Equivalent repository-root command:

```bash
cd backend && npm start
```

**Required variables:** Configure the backend-only variables from Step 5 before starting the service.

**URL produced:** Record the backend HTTPS URL as `<chosen-api-domain>`. The API base URL is that origin plus `/api`:

```text
https://<chosen-api-domain>/api
```

**Depends on:** Steps 1–3. The backend depends on MongoDB and the ML service.

**Services that depend on it:** Web, mobile, Socket.IO clients, and any staging API test client.

**Verification:**

```bash
curl -fsS https://<chosen-api-domain>/health
```

Confirm the response is similar to:

```json
{"status":"ok","service":"cyberguard-backend"}
```

Then inspect logs for successful MongoDB connection and absence of startup exceptions. The health endpoint confirms HTTP process availability only; it does not prove database or ML readiness.

## 5. Configure backend staging environment variables

**Action:** Add backend variables to the Railway backend service’s private environment/secret configuration. Never put these values in Web or Expo source code.

**Where the action is performed:** Backend service environment-variable/secret manager.

**Repository root:** `backend/`

**Required private variables:**

```text
NODE_ENV=production
PORT=<platform-provided or omitted when assigned by Railway>
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority
JWT_SECRET=<long random secret>
JWT_EXPIRES_IN=<approved access-token duration>
JWT_REFRESH_SECRET=<different long random secret>
JWT_REFRESH_EXPIRES_IN=<approved refresh-token duration>
ADMIN_EMAIL=<approved staging administrator email>
ADMIN_PASSWORD=<approved staging administrator password>
NAME_MASK_SALT=<long random private salt>
ML_SERVICE_URL=https://<chosen-ml-domain>
ML_SERVICE_TIMEOUT=10000
ALLOWED_ORIGINS=https://<chosen-web-domain>
MAX_FILE_SIZE=10485760
UPLOAD_PATH=<staging upload path if local storage is temporarily used>
```

**Optional integration variables:** Configure only when the corresponding staging feature is intentionally tested:

```text
SMTP_HOST=<approved SMTP host>
SMTP_PORT=<approved SMTP port>
SMTP_USER=<staging SMTP user>
SMTP_PASS=<staging SMTP password/app password>
TWILIO_ACCOUNT_SID=<Twilio SID>
TWILIO_AUTH_TOKEN=<Twilio token>
TWILIO_PHONE_NUMBER=<approved sender number>
TWILIO_MESSAGING_SERVICE_SID=<approved messaging service SID>
GEMINI_API_KEY=<server-side Gemini key>
ELEVENLABS_API_KEY=<server-side ElevenLabs key>
```

**URLs produced:** None; this step configures the backend to use the MongoDB, ML, and eventual web URLs.

**Depends on:** Steps 2–4 and the web domain choice from Step 9 if the domain already exists. If the web domain does not yet exist, configure the final value before opening browser-based staging tests.

**Verification:** Restart/redeploy the staging backend after setting variables. Confirm logs do not print secret values. Confirm missing optional integrations fail gracefully and that `ALLOWED_ORIGINS` is not `*`.

## 6. Set up the staging Web Vercel project

**Action:** Create/import a Vercel project for the React web application.

**Where the action is performed:** Vercel project console.

**Exact project/root directory:**

```text
web-app/
```

**Install command:**

```bash
npm ci
```

**Build command:**

```bash
npm run build
```

**Output directory:**

```text
build
```

**Routing:** Preserve `web-app/vercel.json`, which rewrites routes to `index.html` for React Router.

**Required variables:** Configure the public variables from Step 7.

**URL produced:** Record the Vercel-generated staging URL as `<chosen-web-staging-domain>`. Do not hard-code it into source.

**Depends on:** Step 4 backend URL and Step 7 variables.

**Verification:** Confirm the Vercel build completes, direct navigation to a client route returns the React application rather than a 404, and browser requests reach the configured backend URL.

## 7. Configure staging Web environment variables

**Action:** Add public build-time variables to the Web hosting project. These are not secrets.

**Where the action is performed:** Vercel project environment-variable settings.

**Exact project/root directory:** `web-app/`

**Variables:**

```text
REACT_APP_API_URL=https://<chosen-api-domain>/api
REACT_APP_SOCKET_URL=https://<chosen-api-domain>
GENERATE_SOURCEMAP=false
```

**Build command:**

```bash
npm run build
```

**Start command:** Static hosting; no Node application start command is required. For local preview only:

```bash
npx serve -s build
```

**URL produced:** The Vercel staging URL from Step 6.

**Depends on:** Backend URL from Step 4 and selected Web hostname from Step 9.

**Verification:** Inspect the generated build configuration and use browser developer tools to confirm API requests target `https://<chosen-api-domain>/api`. Confirm there are no production requests to localhost, `127.0.0.1`, temporary tunnels, or an old Railway URL.

## 8. Configure the Mobile EAS staging environment

**Action:** Configure the Expo/EAS project for a staging or preview build. Do not publish the mobile app yet.

**Where the action is performed:** Expo/EAS project environment configuration.

**Exact project/root directory:**

```text
mobile-app/
```

**Required public variable:**

```text
EXPO_PUBLIC_API_URL=https://<chosen-api-domain>/api
```

**Build command:** For an internal preview build, use the existing profile:

```bash
eas build --platform android --profile preview
```

The existing production profile must not be used until production readiness approval.

**Start command:** Local development only:

```bash
npx expo start
```

There is no server start command for the mobile client.

**URL produced:** No hosted app URL. The mobile build embeds the staging API URL as public configuration.

**Depends on:** Backend staging URL from Step 4.

**Verification:** Build or export the preview app and confirm the embedded configuration points to `https://<chosen-api-domain>/api`. Verify no backend secret is present in the Expo environment or bundle. Do not use localhost or temporary tunnels for staging device testing unless explicitly configuring a separate local-development build.

## MUST DO BEFORE PRODUCTION

## 9. Configure final domains and DNS

**Action:** Choose and configure the final domain names. Do not use the placeholders in this checklist as real domains.

**Where the action is performed:** DNS registrar/provider and the hosting provider custom-domain settings.

**Recommended roles, with placeholders only:**

```text
Web:     https://<chosen-web-domain>
Backend: https://<chosen-api-domain>
ML:      private/internal URL or https://<chosen-ml-domain>
```

The final ML URL should preferably be private/internal and not publicly exposed.

**Repository root:** No source change. The chosen values are supplied through hosting environment variables.

**Build/start commands:** None.

**Required variables after domain selection:**

```text
REACT_APP_API_URL=https://<chosen-api-domain>/api
REACT_APP_SOCKET_URL=https://<chosen-api-domain>
EXPO_PUBLIC_API_URL=https://<chosen-api-domain>/api
ML_SERVICE_URL=<chosen-private-ml-url-or-https-url>
```

**URLs produced:** The final Web, API, and optional ML URLs selected by the deployment owner.

**Depends on:** Accounts/services from Step 1 and staging verification from Steps 2–8.

**Verification:** DNS records resolve to the intended hosting services. Hosting consoles show the custom domains as verified. No domain is added to source code as a hard-coded fallback.

## 10. Configure production CORS

**Action:** Set the exact production browser origin allowlist.

**Where the action is performed:** Backend Railway service environment variables.

**Repository root:** `backend/`

**Variable:**

```text
ALLOWED_ORIGINS=https://<chosen-web-domain>
```

If more than one browser origin is intentionally supported, use a comma-separated list of exact origins:

```text
ALLOWED_ORIGINS=https://<chosen-web-domain>,https://<second-approved-web-origin>
```

Do not use `*`. Native/mobile requests without an `Origin` header continue to work under the current backend CORS callback.

**Build/start commands:** Restart the backend service after changing the environment variable.

**URLs produced:** No new URL. This authorizes the selected Web origin to call the API and Socket.IO service.

**Depends on:** Final Web and API domains from Step 9.

**Verification:** From the final Web origin, verify API and Socket.IO connections succeed. From an unlisted browser origin, verify the request is rejected. Verify native mobile API requests without an `Origin` header remain accepted.

## 11. Enable and verify HTTPS

**Action:** Enable HTTPS for every public endpoint and use provider-managed certificates or an approved equivalent.

**Where the action is performed:** Web, backend, ML hosting, and DNS provider consoles.

**Required HTTPS endpoints:**

```text
Web:     https://<chosen-web-domain>
Backend: https://<chosen-api-domain>
ML:      private TLS URL or https://<chosen-ml-domain>
```

**Repository root:** No source change.

**Build/start commands:** None beyond the service commands in Steps 3–7.

**Required variables:** Update the backend, Web, and EAS variables to use HTTPS URLs only.

**URLs produced:** Certificate-backed HTTPS URLs for the selected domains.

**Depends on:** Step 9 DNS configuration.

**Verification:**

```bash
curl -I https://<chosen-web-domain>
curl -fsS https://<chosen-api-domain>/health
```

Confirm certificates are valid, HTTP redirects to HTTPS where appropriate, Web requests use HTTPS, and no production client configuration uses `http://localhost`, `127.0.0.1`, or a temporary tunnel.

## 12. Decide and implement production file storage

**Action:** Choose the production storage strategy before accepting production evidence.

**Where the action is performed:** Deployment architecture review and selected object-storage provider, if needed.

**Current repository behavior:** Evidence is written under:

```text
<backend working directory>/uploads/evidence
```

The backend now protects evidence retrieval through the authenticated complaint-scoped route. Chat attachments remain under:

```text
<backend working directory>/uploads/chats
```

**Required decision:**

- **Preferred:** Implement durable private object storage with authorized/signed retrieval and retention/backup controls.
- **Temporary only:** Use local filesystem storage only if the selected host provides durable persistent volume storage and the deployment owner explicitly accepts its backup, scaling, and privacy properties.

**Build/start commands:** None for the architectural decision. If code changes are approved later, run the backend validation commands again.

**Required variables:** Provider-specific storage credentials must be backend-only secrets. Do not add them to Web or Expo.

**URLs produced:** Prefer private object-storage URLs or application-authorized download URLs. Do not expose unauthenticated evidence URLs.

**Depends on:** Backend service and security review.

**Verification:** Upload a staging evidence file, retrieve it as the owner, assigned officer, and administrator, and confirm unauthorized users receive HTTP 403. Confirm files survive a controlled staging restart/redeploy before accepting production evidence.

## 13. Promote the staging deployment

**Action:** Deploy the backend, ML service, Web, and mobile preview build to staging in dependency order.

**Where the action is performed:** Railway/ML host, Railway/backend host, Vercel, and EAS.

**Exact project/root directories and commands:**

Backend:

```bash
cd backend
npm ci --omit=dev
npm start
```

ML:

```bash
cd ml-service
python3 -m pip install -r src/requirements.txt
# Use the approved artifact startup process.
# The current repository Railway configuration is:
python3 train_model.py && gunicorn -w 2 -b 0.0.0.0:$PORT src.app:app
```

Web:

```bash
cd web-app
npm ci
npm run build
```

Mobile preview:

```bash
cd mobile-app
eas build --platform android --profile preview
```

**Required environment variables:** The complete staging values from Steps 2, 5, 7, and 8.

**URLs produced:** Staging Web URL, staging API URL, ML service URL, and internal mobile preview artifact. Record actual provider-generated values; do not invent them.

**Depends on:** Steps 1–12.

**Verification:**

- Backend `GET /health` returns HTTP 200.
- Backend logs show MongoDB connection.
- ML `/health` reports `model_loaded: true`.
- Web loads at its staging URL and routes correctly.
- Mobile preview can reach the staging API.
- CORS and Socket.IO work from the staging Web origin.

## 14. Perform end-to-end staging tests

**Action:** Run the complete staging test matrix before any production deployment.

**Where the action is performed:** Staging Web, mobile preview build, staging API, staging MongoDB, and staging ML service.

**Repository root:** No source changes are expected. Test clients may be run from the repository root or from their service directories.

**Build/start commands:** Use the already-running staging services. For local reproduction only, use the commands in Steps 3–8.

**Required variables:** Use staging values only. Never test with production credentials or production data.

**Required tests:**

- Registration cannot assign `admin`, `officer`, or other privileged roles.
- Login, access-token expiry behavior, refresh-token rotation, logout, and revoked-token rejection.
- `/health` returns no secrets.
- Complaint submission with and without evidence.
- Evidence access as owner, assigned officer, administrator, unrelated user, and unauthenticated client.
- Evidence path traversal and unknown filename rejection.
- Complaint tracking and complaint detail retrieval.
- Admin/officer access separation.
- ML prediction from complaint submission and direct ML endpoint.
- CORS preflight from the approved Web origin and rejection from an unapproved origin.
- Socket.IO handshake with valid, invalid, expired, and revoked JWTs.
- Socket.IO room access for owner, assigned officer, administrator, unrelated user, and non-admin admin-room attempts.
- Server-side sender identity cannot be spoofed by changing client payload fields.
- Email, SMS, Gemini, and ElevenLabs only if their staging credentials are intentionally configured.
- Mobile login, complaint submission, tracking, detail, and authenticated API calls.
- Web direct navigation and refresh on client-side routes.
- Upload persistence across a controlled staging restart/redeploy.

**URLs used:** Only the actual staging URLs produced by Steps 3, 4, 6, and 8.

**Depends on:** Step 13.

**Verification:** Record pass/fail results, HTTP status codes, server logs, and any evidence-access audit results. Do not proceed to production while a required security or data-integrity test fails.

## PRODUCTION DEPLOYMENT GATE

## 15. Deploy to production only after approval

**Action:** After all staging tests pass and the deployment owner explicitly approves release, promote the same reviewed configuration and approved artifacts to production.

**Where the action is performed:** Production MongoDB, ML service, backend Railway service, Web Vercel project, DNS/HTTPS provider, object storage, and EAS production environment.

**Exact project/root directories and commands:**

Backend:

```bash
cd backend
npm ci --omit=dev
npm start
```

ML, preferably with promoted artifacts rather than train-at-startup:

```bash
cd ml-service
python3 -m pip install -r src/requirements.txt
gunicorn -w 2 -b 0.0.0.0:$PORT src.app:app
```

If the approved production process intentionally trains during deployment, use the reviewed Railway command instead:

```bash
python3 train_model.py && gunicorn -w 2 -b 0.0.0.0:$PORT src.app:app
```

Web:

```bash
cd web-app
npm ci
npm run build
```

Mobile production build, only after store/signing approval:

```bash
cd mobile-app
eas build --platform android --profile production
eas build --platform ios --profile production
```

**Required production variables:**

Backend-only:

```text
NODE_ENV=production
MONGODB_URI=<production MongoDB URI>
JWT_SECRET=<production access-token secret>
JWT_REFRESH_SECRET=<different production refresh-token secret>
JWT_EXPIRES_IN=<approved duration>
JWT_REFRESH_EXPIRES_IN=<approved duration>
ADMIN_EMAIL=<approved administrator email>
ADMIN_PASSWORD=<approved initial administrator password>
NAME_MASK_SALT=<production private salt>
ML_SERVICE_URL=<production private ML URL>
ML_SERVICE_TIMEOUT=<approved timeout>
ALLOWED_ORIGINS=https://<chosen-web-domain>
MAX_FILE_SIZE=<approved limit>
UPLOAD_PATH=<approved storage configuration if applicable>
```

Optional server-only integration variables:

```text
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
TWILIO_MESSAGING_SERVICE_SID
GEMINI_API_KEY
ELEVENLABS_API_KEY
```

Public Web:

```text
REACT_APP_API_URL=https://<chosen-api-domain>/api
REACT_APP_SOCKET_URL=https://<chosen-api-domain>
GENERATE_SOURCEMAP=false
```

Public Mobile:

```text
EXPO_PUBLIC_API_URL=https://<chosen-api-domain>/api
```

**URLs produced:** The actual production Web URL, API URL, ML URL, and mobile store/internal distribution artifacts selected by the deployment owner. Do not add them to source code as hard-coded fallbacks.

**Depends on:** Every preceding step, especially successful staging tests and explicit release approval.

**Verification:**

- Production `GET /health` returns HTTP 200.
- Production backend connects to the intended production MongoDB.
- Production ML `/health` reports `model_loaded: true`.
- Production Web uses the production API and Socket.IO URLs.
- Production CORS allows only the final Web origin.
- Production evidence storage is durable and authorized.
- Smoke tests pass without using production test data that violates retention or privacy requirements.
- Logs, alerts, backups, rollback instructions, and incident contacts are active.

Do not perform this step until the deployment owner has approved the production release and confirmed that the production database, secrets, storage, and domains are correct.

## CAN BE DONE AFTER DEPLOYMENT

These items are not prerequisites for the initial controlled deployment if the staging and production gates above pass, but they should be scheduled:

- Resolve remaining Web dynamic-`require` and bundle-size warnings so strict `CI=true` builds are clean.
- Replace ML train-at-startup with a controlled artifact build and promotion pipeline.
- Complete durable object-storage migration if a temporary persistent volume was approved.
- Add dedicated authorization for chat attachments.
- Add deeper dependency readiness checks for MongoDB and ML separately from `/health`.
- Configure production monitoring dashboards, alert thresholds, log retention, and tracing.
- Configure automated backups and restore drills for MongoDB and object storage.
- Complete app-store metadata, production notification setup, and store rollout procedures.
- Perform periodic security review, dependency updates, and secret rotation.
- Optimize Web bundle splitting and loading performance.

# Final release gate

Production deployment is allowed only when all of the following are true:

- [ ] Required provider accounts/services exist and are accessible.
- [ ] Staging MongoDB is connected and production MongoDB is separately provisioned.
- [ ] ML artifacts are approved, present, and `/health` reports `model_loaded: true`.
- [ ] Backend staging and production variables are configured only server-side.
- [ ] Web `npm ci` and `npm run build` succeed.
- [ ] Web and mobile use the final API URL through environment configuration.
- [ ] Final domains resolve and HTTPS is active.
- [ ] `ALLOWED_ORIGINS` contains only approved browser origins and is not `*`.
- [ ] Evidence storage is durable or an explicitly approved persistent-volume exception exists.
- [ ] Staging end-to-end tests pass, including evidence and Socket.IO authorization.
- [ ] Rollback, backups, monitoring, and incident ownership are documented.
- [ ] The deployment owner explicitly approves Step 15.

**This document does not authorize deployment. It is an execution checklist only.**
