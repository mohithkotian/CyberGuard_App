# CyberGuard Codebase Examination

**Repository:** `mohithkotian/CyberGuard_App`  
**Branch examined:** `main` at commit `a260f55` (`origin/main`)  
**Examination date:** 2026-09-18

## Executive Summary

CyberGuard is a multi-client cybercrime reporting and investigation platform composed of a Node.js/Express API, MongoDB/Mongoose persistence, a Python Flask classification service, a React web client, and an Expo React Native mobile client. The platform supports account registration and login, complaint submission and tracking, evidence uploads with OCR, ML-assisted category/severity classification, role-based administration, analytics, complaint chat, global chat, forensic/link-analysis views, threat intelligence views, and push-notification token registration.

The repository is currently syntactically valid for the checked JavaScript and Python source files. Dependencies were not installed in the checkout, so full runtime, unit-test, and production-build verification was not performed.

## Repository and Runtime Topology

| Area | Location | Implementation | Primary responsibility |
|---|---|---|---|
| Backend API | `backend/src` | Node.js, Express, Socket.IO | Authentication, complaints, users, chats, analytics, admin operations, OCR and ML orchestration |
| Persistence | Backend models | MongoDB, Mongoose | Users, complaints, messages, global messages, mail logs, reports, token blacklist and supporting records |
| ML service | `ml-service/src` | Flask, scikit-learn, NLTK, joblib | Text preprocessing and cybercrime category/severity prediction |
| Web client | `web-app/src` | React 18, React Router, Zustand | Public pages, reporting, dashboards, admin command center, analytics, forensic and intelligence tools |
| Mobile client | `mobile-app/src` | Expo/React Native, React Navigation, Zustand | Mobile login, home feed, complaint submission, tracking, profiles, details and admin views |

The backend mounts its API under `/api` and starts Socket.IO on the same HTTP server. The ML service is intended to run separately, normally on port `5001`, while the backend defaults to port `5000`.

## Authentication and Authorization

Authentication uses JWT access and refresh tokens, bcrypt password hashing, and a MongoDB-backed token blacklist for logout. The `protect` middleware reads Bearer tokens, checks blacklist membership, verifies the JWT, and loads the current user. Account records include login-attempt and lock fields, active status, email OTP fields, optional 2FA fields, optional face-descriptor fields, and mobile notification tokens.

Implemented authentication routes include:

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create an account and issue tokens |
| POST | `/api/auth/login` | Public | Password login and issue tokens |
| POST | `/api/auth/refresh` | Public | Refresh-token endpoint currently implemented as a placeholder response |
| GET | `/api/auth/me` | Authenticated | Return current user |
| POST | `/api/auth/logout` | Authenticated | Clear refresh token and blacklist access token |
| PATCH | `/api/auth/update-password` | Authenticated | Change password and issue new tokens |
| POST | `/api/auth/enroll-face` | Authenticated | Store a face descriptor |
| POST | `/api/auth/verify-face` | Authenticated | Verify a face descriptor |

The 2FA route definitions are currently commented out even though the user model and frontend contain 2FA-related code. Email OTP verification is also commented out at the route layer.

Roles are `user`, `officer`, `admin`, and `education`. Admin routes use `protect` plus `restrictTo('admin')`. Analytics routes allow `admin` and `officer`. Complaint status updates allow `admin` and `officer`, while complaint deletion is admin-only. Web `ProtectedRoute` also performs client-side role gating, but the backend remains the authoritative enforcement layer.

## Backend API Inventory

### Complaints

The complaint subsystem supports authenticated creation, multipart evidence upload, text analysis, listing, detail retrieval, public search, tracking, status updates, and admin deletion. Complaint visibility is centralized in `complaintVisibility.js`: owners, admins, assigned officers, and unassigned officers receive the original representation; other viewers receive masked title/description and reduced location information.

Relevant endpoints include:

- `POST /api/complaints`
- `POST /api/complaints/analyze`
- `GET /api/complaints`
- `GET /api/complaints/:id`
- `GET /api/complaints/track/:complaintId`
- `GET /api/complaints/public/search`
- `PATCH /api/complaints/:id/status`
- `DELETE /api/complaints/:id`

Complaint records include a generated complaint ID, owner and assigned officer references, title and description, category/subcategory, confidence and score data, severity, workflow status, financial-loss fields, incident date, location, victim/suspect details, evidence, timeline, source, anonymity, priority, tags, internal notes, and forensic indicators.

### Administration and analytics

Admin functionality covers user directory management, user creation and editing, role/status changes, password resets, deletion, officer assignment, ML status and prediction, system statistics, codebase information, and mail logs. Analytics cover overview, category, trends, geography, status distribution, financial analysis, map points, public map points, and link analysis.

### Communications

The chat layer supports complaint-scoped messages, private user messages, and global messages. Messages can include uploaded files and are modeled with encrypted-content and initialization-vector fields. Socket.IO exposes rooms for complaint chats, global chat, admin, and user-specific channels. The server also emits complaint/status and message events through the Socket.IO instance.

### Integrations and services

- **ML:** Axios client calls the Flask `/predict`, `/model-info`, and `/health` endpoints. Backend classification falls back to a local rule-based NLP classifier when the ML service is unavailable.
- **OCR:** Tesseract.js extracts raw text, phone numbers, UPI IDs, and account-number-like sequences from uploaded evidence.
- **Notifications:** Email, SMS/Twilio, and push-token registration are represented in the backend and mobile client.
- **Security middleware:** Helmet, CORS, Mongo sanitize, XSS cleanup, HPP, compression, JSON/urlencoded limits, logging, and rate limiting are configured in the server.

## Data Models

| Model | Key data |
|---|---|
| `User` | Identity, email/password, phone, role, verification/active state, lock state, refresh/reset/OTP secrets, 2FA secret, face descriptor, avatar, notification tokens |
| `Complaint` | Incident narrative, classification, severity/status, users, evidence, timeline, location, victim/suspect information, financial impact, priority, tags and forensic indicators |
| `Message` | Complaint/private recipient references, sender, encrypted content, IV, attachment metadata, read state |
| `GlobalMessage` | Global chat messages and sender metadata |
| `Report` | A second report-like complaint schema with timeline and evidence structures |
| `MailLog` | Email delivery/logging records |
| `NameMapping` | Hashed names and pseudonyms for masking |
| `TokenBlacklist` | Revoked JWTs with expiry-based cleanup |
| `Counter` | Counter state for generated identifiers |

`User` hashes passwords in a Mongoose pre-save hook and indexes email, role, and creation time. `Complaint` indexes include complaint ID, user/status/category/severity and text-search-related fields according to the schema implementation.

## ML Pipeline

The Python service preprocesses text with tokenization, stopword removal, and lemmatization, then uses a TF-IDF representation and classifier artifacts generated by the training pipeline. The training scripts generate a broad cybercrime dataset and persist model/vectorizer artifacts. The Flask service exposes prediction and health/model-information endpoints. The Node backend maps raw categories into display categories and supplies a deterministic rule-based fallback containing category, subcategory, confidence, and severity.

## Web Application Screens and Functionality

The React web application routes include public home, login, registration and registration-choice flows; authenticated dashboard, complaint submission, complaint tracking/details, community complaints, settings, learn, feedback, FAQ, global chat, and support/intelligence pages; and role-protected administration pages.

Major web screens/components include:

- **Dashboard and reporting:** user dashboard, submit complaint, track complaint, complaint details, community complaints.
- **Administration:** admin dashboard, complaint management, users, analytics, database, mail logs, map, link analysis, ML, safety, and system information.
- **Intelligence and forensics:** forensic neural scanner, scam search, suspect search, leak monitor, public map, threat-intelligence data, and developer access scanner.
- **Communication and assistance:** secure complaint chat, global chat, Jarvis assistant, chatbot, voice assistant, notification center, and 2FA modal.
- **Cross-cutting state/UI:** Zustand stores for authentication, theme, settings, notifications, and translation; Axios API client; Socket.IO client; protected routing; PII/name masking utilities.

## Mobile Application Screens and Functionality

The Expo app has an unauthenticated login/register stack and authenticated bottom tabs for Home, Submit, Track, optional Admin, and Profile. It also includes complaint detail navigation. The mobile client supports complaint feeds, complaint submission with attachments, tracking, profile management, admin incident views, notifications, API token persistence through AsyncStorage, and token refresh handling.

The mobile source on the examined branch is less feature-complete than the newer `upstream/main` branch: `upstream/main` contains a later modernization commit adding or revising threat radar, forensic scanner, global chat, scam search, and several mobile screens. Those upstream changes were not part of the examined `origin/main` commit.

## Verification Performed

- Confirmed repository identity and remotes: `origin` is `mohithkotian/CyberGuard_App`; `upstream` is `pruthvi0412/CyberGuard_App`.
- Confirmed clean working tree on the checked-out branch.
- Ran `node --check` over all files under `backend/src`; no syntax errors were reported.
- Ran Python bytecode compilation over ML service Python files; no syntax errors were reported.
- Confirmed backend, web, and mobile `node_modules` directories were absent, so dependency-backed builds and tests were not run.

## Notable Risks and Follow-up Items

1. **Registration accepts a caller-supplied role.** `authController.register` destructures `role` from the request body and passes it to `User.create`, while the public registration validator does not constrain or remove it. A public caller could potentially register as `admin` or `officer`. Registration should force `role: 'user'`; elevated roles should be provisioned only through protected admin workflows.
2. **Refresh-token rotation is not implemented.** `/api/auth/refresh` returns a success message but does not validate the submitted refresh token or issue new tokens. Both clients contain refresh logic, so expired access-token recovery will not work as intended.
3. **Deployment entry points are inconsistent.** The root `Procfile` points to `python3 backend/src/app.py`, but the backend entry point present in the repository is `backend/src/server.js`. The root `railway.json` also starts the ML service, while the ML service has its own deployment configuration. Deployment configuration should be consolidated and tested.
4. **Frontend/backend route drift exists in the checked branch.** The web client calls `/admin/predict`, which maps to the backend's `/api/admin/predict` and is valid, but several API calls and screen behaviors depend on legacy/admin aliases. The mobile client points by default to a local-tunnel URL, making environment configuration mandatory for a clean deployment.
5. **Socket.IO authentication is not visible in the server setup.** The server accepts room-join and message events, but the inspected `server.js` does not show a JWT handshake middleware or server-side authorization check for room membership. Complaint/private/admin rooms should be authenticated and authorization-checked server-side.
6. **PII masking error handling contradicts its safety comment.** `maskResponse.js` says it should fail safe, but its exception path sends the original unmasked response. A masking failure should fail closed or return an error rather than risk disclosure.
7. **2FA and OTP are partially implemented but disabled.** Models, controllers, and client components exist, but route registration is commented out. This creates misleading UI/API expectations and should be either completed and enabled or removed from active product paths.
8. **Testing coverage is not operationally verified.** Jest configuration/dependencies and a coverage directory exist, but no normal unit/integration test files were found for the application modules. Install dependencies and run backend tests, web build/tests, and ML prediction tests before release.
9. **Sensitive operational defaults are present in examples.** The environment example contains a predictable-looking admin password and placeholder secrets. Although it is an example file, production setup must reject defaults and require strong secrets at startup.
10. **The checked branch is behind its configured upstream.** `upstream/main` contains a later merge with significant mobile feature changes. Before implementing new work, decide whether `origin/main` is intentionally the product baseline or whether the upstream changes should be merged selectively.

## Recommended Next Step

Before feature development, prioritize the public-registration role vulnerability, refresh-token implementation, deployment entry-point correction, and Socket.IO authorization. Then install dependencies and run the backend, web, mobile, and ML validation suites against a disposable MongoDB/ML environment.
