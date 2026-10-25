# CyberGuard Phase 1.1 Runtime Validation

**Repository:** `mohithkotian/CyberGuard_App`  
**Validation scope:** Runtime validation of Phase 1 only  
**Phase 2 status:** Not started  
**Source changes during validation:** One minimal JSX-closure fix in `mobile-app/src/screens/ComplaintDetailScreen.js`, directly exposed by Expo bundling. No feature work, redesign, or unrelated refactoring was performed.

## Dependency installation

Existing lockfiles were inspected before installation.

| Project | Result | Details |
|---|---|---|
| Backend | **PASS** | `npm ci --no-audit --no-fund` completed successfully. Existing package versions were used. npm emitted deprecation warnings for packages including `multer` 1.x, `xss-clean`, `glob`, and `supertest` 6.x. |
| Mobile | **PASS** | `npm ci --no-audit --no-fund` completed successfully. Expo reported compatibility recommendations for existing package patch versions; no versions were changed. |
| Web | **PARTIAL** | `npm ci` stopped because the existing package-lock is out of sync with `package.json`; it reported missing `yaml@2.9.1` from the lockfile. `npm install --package-lock=false` then installed dependencies for validation without changing the lockfile or package manifests. |
| ML service | **PASS** | Existing root `requirements.txt` was installed. No ML source or model was modified. |

No dependency manifest or lockfile was changed by validation. `node_modules` directories are ignored by git.

### Backend

**NOT RUN for application runtime.**

The backend process started and loaded its Express modules, routes, middleware, and configuration. It then correctly stopped while connecting to MongoDB:

```text
MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017
```

The environment has no `mongosh`, no `mongo` CLI, no Docker installation, no MongoDB process, and no listener on port `27017`. Because the backend exits when database connection fails, authenticated endpoint runtime tests could not proceed.

### Authentication

**NOT RUN end-to-end.**

The backend could not remain running without MongoDB, so login, registration, `/api/auth/me`, logout, and authenticated API requests could not be exercised through HTTP.

Static/syntax validation passed for the modified backend and mobile JavaScript. The mobile Android bundle also completed successfully after the ComplaintDetailScreen JSX fix.

### Registration security

**NOT RUN against the live backend.**

The malicious requests using `role: 'admin'` and `role: 'officer'` were not sent because the backend could not start without MongoDB.

The implementation was source-verified: public registration now ignores the request role and explicitly creates `role: 'user'`. Existing privileged users are not modified by this code path.

### Refresh token

**NOT RUN end-to-end.**

Login and token refresh require the backend and MongoDB, which were unavailable.

The implementation was source-verified: `/api/auth/refresh` now validates the submitted JWT, verifies the active user and stored refresh token, rotates both tokens, returns the expected `data.accessToken` and `data.refreshToken` structure, and rejects invalid or expired tokens with `401` through the existing error middleware.

The web client’s existing interceptor and mobile Axios interceptor both expect this same response shape.

### Mobile

**PARTIAL / PASS for bundle and startup validation.**

Validated:

- `npm ci` completed for the existing mobile dependency set.
- Expo Metro started successfully with:

  ```text
  exp://127.0.0.1:8081
  ```

- Android Expo export completed successfully:

  ```text
  Android Bundled ... (1389 modules)
  Exported: dist
  ```

- The Expo export initially exposed an unterminated JSX tree in `ComplaintDetailScreen.js`. This was directly caused by the Phase 1 screen edit: the new `SafeAreaView` wrapper had not been closed. The smallest safe fix was adding `</SafeAreaView>`. The Android export was rerun successfully afterward.
- Mobile JavaScript syntax validation passed.
- Mobile API configuration was statically verified to read `EXPO_PUBLIC_API_URL`/`API_URL`, contain no localtunnel URL, and reject missing configuration in production through the `!__DEV__` guard.
- No `.env` secret file was added.

Not validated on a device or emulator:

- Login screen rendering in Expo Go
- Registration interaction
- Persisted authentication across an actual app restart
- `/api/auth/me` hydration against a running backend
- Logout over HTTP
- ComplaintDetailScreen interaction/back navigation on a device
- Submission interaction through Review
- Admin/officer runtime behavior
- Actual Expo push-token registration

The mobile bundle confirms module resolution and JSX compilation, not complete device behavior.

### Web

**PARTIAL / PASS for production build.**

The web production build completed successfully:

```text
Compiled with warnings.
The build folder is ready to be deployed.
```

Warnings:

- Two existing critical-dependency warnings caused by dynamic `require` usage.
- Existing large bundle-size warning.

When run with `CI=true`, the same existing warnings are promoted to errors and the build exits non-zero. Without CI warning promotion, the optimized build succeeds.

Not validated end-to-end because no backend/MongoDB service was available:

- Login
- Registration
- Authenticated requests
- Refresh interceptor against live HTTP responses
- Complaint creation/retrieval
- Admin access
- Officer access

No web source files were modified during Phase 1 or Phase 1.1.

### Complaint flow

**NOT RUN end-to-end.**

The complete path could not be tested because MongoDB was unavailable and the backend exits before opening its HTTP listener.

The following were not exercised through a real client request:

```text
Mobile/Web
→ Login
→ Create complaint
→ Review
→ Submit
→ Backend
→ MongoDB
→ Retrieve complaint
→ Complaint details
```

The mobile Android bundle confirms that the complaint submission and detail screen modules compile into the Expo bundle. It does not prove the database or API flow.

### Evidence upload

**NOT RUN.**

Multipart evidence upload requires a running backend, MongoDB, and a client runtime. No device/emulator or running backend was available.

The mobile bundle includes the upload code, but MIME validation, multipart boundaries, file persistence, file-size limits, and retrieval were not runtime-tested.

### MongoDB

**FAIL / BLOCKED BY ENVIRONMENT.**

No MongoDB server or Docker installation was available. The backend connection attempt to `mongodb://127.0.0.1:27017/cybercrime_db` returned:

```text
ECONNREFUSED 127.0.0.1:27017
```

No database data was created or modified.

### ML service

**PARTIAL.**

The Flask ML service started successfully after installing the existing requirements. These endpoints returned HTTP 200:

- `GET /health`
- `GET /model-info`

The service reported:

```json
{
  "status": "ok",
  "model_loaded": false,
  "model_version": "2.0.0-PRO"
}
```

Prediction was not validated because the model assets are absent:

```text
ml-service/models/classifier.pkl: missing
ml-service/models/vectorizer.pkl: missing
```

As a result, `/predict` would return the service’s model-not-loaded response. The ML model was not modified or retrained.

## Tests and checks performed

### Passed

- Backend `npm ci`
- Mobile `npm ci`
- Web dependency installation using `npm install --package-lock=false` after stale-lockfile failure
- ML Python requirements installation
- Backend and mobile JavaScript syntax checks
- Python compilation checks for ML service files
- `git diff --check`
- Expo Metro startup
- Expo Android bundle/export
- Web production build without CI warning promotion
- ML `/health` endpoint
- ML `/model-info` endpoint
- Static mobile API URL/prod fallback assertion
- Confirmation that no dependency manifests or lockfiles changed
- Confirmation that no `.env` secret file was added

### Directly fixed during validation

One Phase 1 regression was found by Expo bundling:

- **File:** `mobile-app/src/screens/ComplaintDetailScreen.js`
- **Problem:** The `SafeAreaView` added during Phase 1 was not closed, producing `Unterminated JSX contents` during Android bundling.
- **Fix:** Added the missing closing `</SafeAreaView>` tag.
- **Verification:** Reran `npx expo export --platform android`; export completed successfully.

### Remaining issues

1. MongoDB is unavailable, so the backend cannot remain running for endpoint tests.
2. Authentication, registration security HTTP tests, refresh rotation tests, logout, complaint APIs, and push-token endpoint tests remain unexecuted.
3. No Android emulator, iOS simulator, or physical device is attached, so screen interactions and device persistence are unverified.
4. Expo reports existing package compatibility recommendations for patch versions; no versions were changed during this validation.
5. Web `package-lock.json` is out of sync with `package.json` because `yaml@2.9.1` is missing from the lockfile. Validation used `--package-lock=false` and did not repair the lockfile.
6. Web build succeeds without CI warning promotion but fails under `CI=true` because existing critical-dependency warnings are treated as errors.
7. ML model files are absent, so classification prediction could not be validated.
8. Evidence upload could not be exercised without backend/database/client runtime services.
9. Socket.IO authentication and mobile chat remain intentionally unimplemented and belong to a later phase.
10. Push notification delivery and device-level notification navigation remain unvalidated and incomplete by design.

## Remaining security issues

The following were not expanded or changed in Phase 1.1:

- Socket.IO handshake, room, and event authorization remains unresolved.
- `/api/jarvis/chat` remains an unauthenticated backend route pending a separate security decision.
- Static `/uploads` serving does not provide per-file authorization.
- PII masking has a fail-open concern in its error path.
- Push-token format validation remains limited.
- OTP/2FA routes remain disabled while related controller/client code exists.
- Deployment configuration inconsistencies identified in the earlier audits remain unchanged.

## Current validation conclusion

Phase 1.1 runtime validation is **PARTIAL**.

Successfully verified:

- Existing dependencies can be installed for backend and mobile.
- Expo Metro starts.
- The mobile Android bundle compiles after fixing one directly related JSX regression.
- The web production build succeeds outside CI warning promotion.
- The ML service starts and serves health/model metadata.
- No secrets or dependency manifest changes were introduced.

Not verified because of environmental blockers:

- MongoDB-backed backend runtime.
- Live authentication and refresh-token flows.
- Registration role-security HTTP tests.
- Complaint creation/retrieval/evidence upload.
- Push-token persistence.
- Device/emulator screen interaction and persistence.
- ML prediction with an actual model.

Phase 2 has not been started.
