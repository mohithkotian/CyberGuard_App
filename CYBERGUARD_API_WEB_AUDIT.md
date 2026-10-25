# CyberGuard Backend API and Web Application Audit

**Repository:** `mohithkotian/CyberGuard_App`  
**Branch/commit:** `main` / `a260f55`  
**Scope:** Every mounted Express route and the complete React web application under `web-app/src`.

## Audit conventions

The backend is mounted under `/api`. `W` and `M` in the endpoint tables identify direct use by the React web client and Expo mobile client. `Yes` under **Works** means the route is actually mounted and has a controller implementation. It does not mean a live integration was executed; dependencies and MongoDB were not installed in this checkout. `Partial` identifies an implementation that exists but has a known blocker, placeholder behavior, or client contract mismatch. `No` means the referenced endpoint is not an active Express route or the feature is only static/client-side.

The duplicate `backend/src/routes/complaintRoutes.js` file is **not mounted**. The server imports and mounts `backend/src/routes/complaints.js`, so only that file defines the live complaint API.

# 1. Backend API inventory

## Authentication

| Method | Endpoint | Authentication | Role/permission | Body / query / URL parameters | Response | Errors | Controller/service and models | W/M | Works |
|---|---|---|---|---|---|---|---|---|---|
| POST | `/api/auth/register` | Public; auth rate limiter | None in route; controller accepts `role` from body | Body: `name`, `email`, `password`, optional `phone`, optional `role`. No query or URL params. | `201 {status:'success', data:{user, accessToken, refreshToken}}` | Validation `400`; duplicate/invalid Mongoose errors through error handler | `authController.register`; `User`; async welcome email via `emailAgentService` | W, M | Partial: mounted and implemented, but public `role` is not forced to `user`, creating privilege-escalation risk. |
| POST | `/api/auth/login` | Public; auth rate limiter | None | Body: `email`, `password`. | `200` with user and both tokens | `400` validation; `401` invalid/inactive; `423` temporary lock; rate-limit response | `authController.login`; `User`, `TokenBlacklist` not used on login | W, M | Yes, subject to configured MongoDB/JWT secrets. |
| POST | `/api/auth/refresh` | Public route | Intended refresh-token validation, but none implemented | Body is expected by clients as `{refreshToken}`. | Always `200 {status:'success', message:'Token refresh endpoint'}`; no new token data | No meaningful refresh errors | `authController.refreshToken`; no model access | W indirectly, M interceptor | Partial/broken: clients expect `data.accessToken` and `data.refreshToken`, which the route does not return. |
| GET | `/api/auth/me` | Bearer JWT required | Any authenticated user | No body/query; no URL params. | `200 {status:'success', data:{user}}` | `401` missing/invalid/blacklisted token | `authController.getMe`; `User` via `protect` middleware | W, M | Yes. |
| POST | `/api/auth/logout` | Bearer JWT required | Any authenticated user | No required body/query/URL params. | `200 {status:'success', message}` | `401`; blacklist/database failures | `authController.logout`; `User`, `TokenBlacklist` | W, M | Yes, subject to blacklist persistence. |
| PATCH | `/api/auth/update-password` | Bearer JWT required | Any authenticated user | Body: `currentPassword`, `newPassword`. | `200` with new tokens | `400` missing fields; `401` wrong current password; database errors | `authController.updatePassword`; `User` | W through Settings/API, M not exposed in mobile service | Yes, but password policy is weaker than registration policy. |
| POST | `/api/auth/enroll-face` | Bearer JWT required | Controller restricts to one hard-coded system-admin email | Body: `descriptor`, exactly 128 numeric values. | `200` enrollment message | `400` invalid descriptor; `403` non-authorized email; database errors | `authController.enrollFace`; `User` | W component `DeveloperAccessScanner`; M no | Partial: route works for the hard-coded account only. |
| POST | `/api/auth/verify-face` | Bearer JWT required | Any authenticated user with enrolled descriptor | Body: 128-value `descriptor`. | `200` with distance on match; `401` mismatch | `400` invalid descriptor; `404` no enrollment; `401` mismatch | `authController.verifyFace`; `User` | W component; M no | Yes for enrolled users; it is not a login flow because JWT is already required. |

### Disabled authentication routes

The controller contains `verifyEmailOtp`, `generate2FA`, `verify2FA`, `login2FA`, and `disable2FA`, but the corresponding route registrations are commented out. They are **not APIs** in the live server. The web `TwoFactorModal` still calls `authAPI.generate2FA()` and `authAPI.verify2FA()`, but those methods are absent from the current `web-app/src/services/api.js`; the feature is broken/incomplete.

## Users

| Method | Endpoint | Authentication | Role/permission | Body / query / URL parameters | Response | Errors | Controller/service and models | W/M | Works |
|---|---|---|---|---|---|---|---|---|---|
| GET | `/api/users/profile` | Bearer JWT | Any authenticated user | None | `200 {status:'success', data:{user}}` | `401`; database errors | `usersController.getProfile`; `User` | W via Settings/profile; M profile does not call it | Yes. |
| PATCH | `/api/users/profile` | Bearer JWT | Any authenticated user | Multipart body: optional `name`, `phone`, `address`, one image field `avatar`. | `200` updated user | `400` invalid avatar/type/size; validation/database errors | `usersController.updateProfile`, `uploadAvatar`; `User` | W; M no profile update API | Yes, but mobile profile is display/logout only. |
| POST | `/api/users/push-token` | Bearer JWT | Any authenticated user | Body: `token` | `200` registration message | Database errors; no explicit missing-token validation | `usersController.registerPushToken`; `User` | W no visible use; M notification service/API not present in current service | Partial: backend exists, client integration is not wired in the inspected mobile API. |
| GET | `/api/users` | Bearer JWT | No role restriction in route; any authenticated user | None | `200 {status:'success', data:{users}}`, excluding current user | `401`; database errors | `usersController.getAllUsers`; `User` | W `GlobalChat`; M no | Yes, but exposes directory data to all authenticated roles. |

## Complaints

| Method | Endpoint | Authentication | Role/permission | Body / query / URL parameters | Response | Errors | Controller/service and models | W/M | Works |
|---|---|---|---|---|---|---|---|---|---|
| GET | `/api/complaints/track/:complaintId` | Public | None | URL `complaintId` is the public complaint ID. | `200` complaint tracking/status payload | `404` not found; controller/database errors | `complaintsController.trackComplaint`; `Complaint`, populated `User` | W `TrackComplaint`; M `TrackScreen`, `ComplaintDetailScreen` fallback | Yes. |
| GET | `/api/complaints/public/search` | Public | None | Query `q`; minimum/empty query handling is controller-defined | `200` search result list | `400` missing/invalid query; database/search errors | `complaintsController.publicSearch`; `Complaint`; threat-intelligence utility may supplement results | W `ScamSearch`; M no | Yes, subject to search implementation/data. |
| POST | `/api/complaints/analyze` | Public | None | Body: `{text}` | `200` classification result from ML/fallback | `400` missing text; service errors generally fall back | `complaintsController.analyzeDescription`; `mlService` and local fallback; no DB write | W `ForensicScanner`, `CyberReport`; M no | Yes when ML service is available or local fallback executes. |
| POST | `/api/complaints` | Bearer JWT | Any authenticated user | Multipart: `title`, `description`, optional JSON/string `victimDetails`, `suspectInfo`, `location`, optional category/severity/priority/source flags, up to five `evidence` files. | `201 {status:'success', data:{complaint}}` | `400` validation/file type/size; ML/OCR failures are non-fatal; database errors | `complaintsController.createComplaint`; `Complaint`, `User`; `mlService`, `ocrService`, email/SMS services, privacy utility | W `CyberReport`; M `SubmitComplaintScreen` | Partial: mounted and feature-complete, but the controller masks text for classification then persists original title/description, and evidence OCR is asynchronous. |
| GET | `/api/complaints` | Bearer JWT | Any authenticated role; data scope is controller-defined | Query: `page`, `limit`, `status`, `category`, `severity`, `priority`, `isImmediateAction`, `search`, `startDate`, `endDate`, `sortBy`, `sortOrder`, `scope`. | `200` paginated complaints plus total/status counts | `401`; malformed dates/sort values or database errors | `complaintsController.getComplaints`; `Complaint`, populated `User`; `buildComplaintForViewer` | W Dashboard, Community, AdminComplaints, OfficerDashboard, AdminSafety; M Home, Admin | Partial: works as implemented, but ordinary `user` requests without `scope=own` receive the full collection with masking rather than only their own complaints. |
| GET | `/api/complaints/:id` | Bearer JWT | Any authenticated role; viewer shaping applies | URL `id` accepts Mongo ID or complaint ID according to controller | `200 {status:'success', data:{complaint}}` | `401`, `404`, database errors | `complaintsController.getComplaint`; `Complaint`, `buildComplaintForViewer` | W ComplaintDetails; M ComplaintDetailScreen | Yes. |
| PATCH | `/api/complaints/:id/status` | Bearer JWT | `admin` or `officer` via `restrictTo` | URL `id`; body `status`, `message`, optional `actionTaken` | `200` updated complaint/status payload | `401`, `403`, `404`, invalid status/database errors | `complaintsController.updateStatus`; `Complaint`, populated `User`; email/SMS notification services, Socket.IO | W AdminComplaints/AdminSafety/OfficerDashboard; M AdminScreen | Yes, subject to status and user permissions. |
| DELETE | `/api/complaints/:id` | Bearer JWT | `admin` only | URL `id` | `200` deletion message/data | `401`, `403`, `404`, database errors | `complaintsController.deleteComplaint`; `Complaint` | W AdminComplaints; M no | Yes. |

The inactive duplicate route file would have exposed similar complaint endpoints without the public search/analyze routes and with weaker route-level status/deletion restrictions. It has no runtime effect because it is not mounted.

## Evidence

There is no standalone evidence route. Evidence is handled as a nested capability of `POST /api/complaints`:

- Upload field: `evidence`, max five files.
- Allowed types: JPEG, PNG, GIF, WebP, PDF, MP4, and text/plain.
- Default maximum size: 10 MB per file.
- Stored under `uploads/evidence` and represented in `Complaint.evidence` with filename, original name, MIME type, size, and URL.
- The backend exposes `/uploads` as a static directory, so evidence URLs are directly fetchable if the path is known.
- Web: `CyberReport` submits evidence; `ComplaintDetails` displays complaint/evidence content.
- Mobile: `SubmitComplaintScreen` submits multipart evidence; detail screen consumes returned complaint data.
- Status: implemented, but no dedicated evidence download/permission route exists and OCR failures do not fail the complaint request.

## OCR

There is no public OCR endpoint. OCR is launched in the background by complaint creation for uploaded image files only. `ocrService.extractDataFromImage` uses Tesseract.js and extracts raw text, phone-like values, UPI IDs, and account-number-like sequences. The result is persisted into `Complaint.ocrData`, and OCR text may trigger a second ML classification pass.

Because OCR is asynchronous, the `POST /api/complaints` response may precede OCR completion. There is no polling endpoint or explicit OCR job status endpoint. The resulting OCR data becomes visible through complaint detail/admin/analytics responses according to viewer permissions.

## ML

There is no standalone public ML service route in the Express API. ML is reached internally through `mlService` and through two Express endpoints:

| Method | Endpoint | Access | Body | Response | Controller/service | W/M | Works |
|---|---|---|---|---|---|---|---|
| POST | `/api/complaints/analyze` | Public | `{text}` | Category, subcategory, confidence, severity, scores/model metadata | `complaintsController.analyzeDescription` → `mlService.predict` with local rule fallback | W ForensicScanner/CyberReport; M no | Yes, fallback supported |
| POST | `/api/admin/predict` | Admin only through router middleware | `{text}` | ML prediction object | Inline admin route → `mlService.predict` | W `AdminML`; M no | Yes if text supplied |
| GET | `/api/admin/ml-status` | Admin only | None | ML health and model information | Inline admin route → `mlService.healthCheck/getModelInfo` | W AdminDashboard/AdminML; M Admin | Partial: health fallback reports a hybrid/local mode even if remote ML is unavailable |

The Flask service itself exposes `/predict`, `/health`, and `/model-info`; these are not Express endpoints and are not called directly by either client.

## Chat

| Method | Endpoint | Authentication | Role/permission | Body / params | Response | Errors | Controller/models | W/M | Works |
|---|---|---|---|---|---|---|---|---|---|
| GET | `/api/chats/global` | Bearer JWT | Any authenticated user | None | `200 {status:'success', data:{messages}}` | `401`; database errors | `globalChatController.getGlobalMessages`; `GlobalMessage`, populated `User` | W GlobalChat; M no current screen | Yes. |
| POST | `/api/chats/global` | Bearer JWT | Any authenticated user | Multipart or JSON; `content`, optional `attachments` up to five | `201` created global message | `400` attachment errors; database errors | `globalChatController.sendGlobalMessage`; `GlobalMessage`; `chatController.upload` | W GlobalChat; M no current screen | Yes. |
| GET | `/api/chats/private/:userId` | Bearer JWT | Any authenticated user; no explicit target-user authorization beyond query | URL `userId` | `200` messages | `401`; invalid IDs/database errors | `chatController.getPrivateMessages`; `Message`, populated `User` | W GlobalChat; M no | Partial: implemented, but target existence/access validation is weak. |
| POST | `/api/chats/private/:userId` | Bearer JWT | Any authenticated user | URL `userId`; multipart/JSON `content`, `iv`, attachments | `201` created message | Attachment/database errors | `chatController.sendPrivateMessage`; `Message` | W GlobalChat; M no | Partial: implemented, but recipient validation and access policy are not explicit. |
| GET | `/api/chats/:complaintId` | Bearer JWT | Complaint owner, admin, or officer | URL complaint ID or Mongo ID | `200 {messages}`; invalid/missing IDs may return empty list | `403` unauthorized; database errors | `chatController.getMessages`; `Complaint`, `Message`, populated `User` | W SecureChat/ComplaintDetails; M no | Yes for authorized users. |
| POST | `/api/chats/:complaintId` | Bearer JWT | Route is authenticated, but controller does not repeat the owner/officer check used by GET | URL complaint ID; body `content`, `iv`; multipart `attachments` | `201 {message}` | `404` complaint not found; attachment/database errors | `chatController.sendMessage`; `Complaint`, `Message` | W SecureChat; M no | Partial/security concern: any authenticated caller who knows a complaint ID may be able to post. |

Socket.IO also exposes unauthenticated connection/event handlers for complaint rooms, global chat, admin room, user rooms, and private messages. These are not REST endpoints and have no JWT handshake authorization in `server.js`.

## Notifications

There is no notification retrieval or acknowledgement REST route. Notification-related behavior is distributed across:

- `POST /api/users/push-token` for storing mobile notification tokens.
- Complaint creation/status services for email/SMS dispatch.
- Socket.IO events such as `new-complaint`, `complaint-submitted`, `status-update`, and chat events.
- The web `NotificationCenter` uses local Zustand notification state rather than a notification API.

The notification surface is therefore **partial**: token registration exists, but a complete push delivery/notification inbox API does not.

## Admin

All endpoints below are behind `router.use(protect, restrictTo('admin'))` and therefore require an authenticated admin.

| Method | Endpoint | Body / query / URL parameters | Response | Models/services | W/M | Works |
|---|---|---|---|---|---|---|
| GET | `/api/admin/users/stats` | None | Counts for total, role groups, active/suspended, verified, 2FA | `User` counts | W AdminUsers | Yes |
| GET | `/api/admin/users` | Query `page`, `limit`, `role`, `status`, `search` | Paginated user list | `User` | W AdminUsers | Yes |
| GET | `/api/admin/users/:id` | URL `id` | User details | `User`, complaint virtual/count usage | W AdminUsers | Yes |
| POST | `/api/admin/users` | Multipart/JSON user fields, optional avatar | Created user | `User`, avatar upload | W AdminUsers | Yes, subject to admin-only policy |
| PUT/PATCH | `/api/admin/users/:id` | URL `id`; user profile/password/avatar fields | Updated user | `User`, avatar upload | W AdminUsers | Yes |
| POST | `/api/admin/users/:id/reset-password` | URL `id`; body `password` | Reset message | `User` | W AdminUsers | Yes; minimum six characters only |
| DELETE | `/api/admin/users/:id` | URL `id` | Deletion message | `User` | W AdminUsers | Yes, with hard-coded master-account/self-delete exceptions |
| PATCH | `/api/admin/users/:id/role` | URL `id`; body `{role}` | Updated user | `User` | W AdminUsers | Yes |
| PATCH | `/api/admin/users/:id/toggle-status` | URL `id` | Updated user | `User` | W AdminUsers | Yes |
| PATCH | `/api/admin/complaints/:id/assign` | URL complaint `id`; body `{officerId}` | Assigned complaint | `User`, `Complaint` | W AdminComplaints | Yes |
| GET | `/api/admin/ml-status` | None | ML health/model info | `mlService` | W AdminDashboard/AdminML; M Admin | Partial as noted above |
| POST | `/api/admin/predict` | Body `{text}` | Prediction | `mlService` | W AdminML | Yes |
| GET | `/api/admin/system-stats` | None | User/complaint/system statistics | `User`, `Complaint`, OS/process utilities | W AdminDashboard; M Admin | Yes, but system metrics are process/runtime-derived and not a real monitoring backend |
| GET | `/api/admin/codebase` | None | File/source tree metadata | Filesystem only | W DeveloperPage | Yes for local deployment; exposes source metadata to admins |
| GET | `/api/admin/emails` | Query `page`, `limit` | Paginated mail/SMS logs | `MailLog` | W AdminMails | Yes |

## Analytics

The analytics router exposes `/api/analytics/public/map-points` before applying `protect` and `restrictTo('admin','officer')`. All other analytics routes require admin or officer.

| Method | Endpoint | Authentication/permission | Query | Response and models | W/M | Works |
|---|---|---|---|---|---|---|
| GET | `/api/analytics/public/map-points` | Public | None | Anonymized category/severity/priority/location points from `Complaint` | W PublicMap; M no | Yes, but points without coordinates receive randomized Bangalore fallback coordinates |
| GET | `/api/analytics/overview` | JWT; admin/officer | None | Totals, growth, resolution rate, critical count, average resolution days; `Complaint`, `User` | W AdminAnalytics/AdminDashboard; M Admin | Yes |
| GET | `/api/analytics/by-category` | JWT; admin/officer | None | Category totals/resolved/average severity; `Complaint` | W AdminAnalytics | Yes |
| GET | `/api/analytics/trends` | JWT; admin/officer | `months` | Monthly total/resolved/pending/critical trends; `Complaint` | W AdminAnalytics | Yes |
| GET | `/api/analytics/geographic` | JWT; admin/officer | None | State-level distribution; `Complaint` | W AdminAnalytics | Yes |
| GET | `/api/analytics/status-distribution` | JWT; admin/officer | None | Status counts; `Complaint` | W AdminAnalytics | Yes |
| GET | `/api/analytics/financial` | JWT; admin/officer | None | Loss by category and total loss; `Complaint` | W AdminAnalytics | Yes |
| GET | `/api/analytics/map-points` | JWT; admin/officer | None | Detailed complaint map points; `Complaint` | W AdminMap | Yes, with randomized fallback coordinates |
| GET | `/api/analytics/link-analysis` | JWT; admin/officer | None | Repeated phone/UPI links and complaint cases from OCR; `Complaint` | W AdminLinkAnalysis | Yes if OCR data exists |

## Forensics

There is no dedicated `/api/forensics` route. Forensic functionality is implemented through:

- `/api/complaints/analyze` for text/URL/IOC-style analysis from the web `ForensicScanner`.
- Background OCR in complaint creation for image evidence.
- `/api/analytics/link-analysis` for admin/officer repeated phone and UPI links.
- `Complaint.ocrData` and forensic fields returned through complaint APIs.

The web scanner presents multiple tabs, but the active backend capability is the generic complaint text-analysis endpoint. URL/IOC/radar processing is client-driven or uses the same text analyzer rather than a distinct backend forensic service.

## Intelligence

There is no dedicated intelligence API namespace. The following are the actual sources:

- `ScamSearch`: calls `/api/complaints/public/search` and uses static `web-app/src/data/threatIntel.js` lookup data.
- `SuspectSearch`: uses local/client-side logic and static data; no distinct suspect-search Express endpoint was found.
- `LeakMonitor`: is a UI simulation/client-only tool; no leak-monitor endpoint was found.
- `PublicMap`: calls `/api/analytics/public/map-points`.
- `AdminMap`: calls protected `/api/analytics/map-points`.

## JARVIS

| Method | Endpoint | Authentication | Body | Response | Errors | Controller/service | W/M | Works |
|---|---|---|---|---|---|---|---|---|
| POST | `/api/jarvis/chat` | **No authentication middleware** | `{message}` | JSON `{text, source, privacy}`; optionally base64 MP3 audio and `format:'mp3'` when ElevenLabs succeeds | `400` missing message; `500` missing Gemini key or processing failure | `jarvisController.jarvisChat`; Gemini API, optional ElevenLabs API, privacy shield; no DB models | W `JarvisAssistant`/`ChatBot` only if they call this route; M no | Partial: implemented, but publicly callable and requires `GEMINI_API_KEY`; external model/voice credentials are required. |

## Other

- `GET /health` exists in `server.js` before the API mounts and returns `{status:'success', message:'CyberGuard API is running', timestamp}`. It is public and uses no model.
- Static `GET /uploads/*` is exposed by `express.static`; it is not a controller route and does not enforce per-file authorization.
- Socket.IO connection/event handlers are active but are not REST endpoints and currently lack server-side authentication/room authorization.

# 2. Web/desktop application audit

## Route and screen inventory

The React Router configuration is in `web-app/src/App.js`. `ProtectedRoute` checks for a local `user` and `token`, then allows the requested role or any `admin`. It is client-side gating only; backend middleware is authoritative.

| Route | File | Purpose | API calls | State management | Auth / roles | Implementation status, missing or broken functionality |
|---|---|---|---|---|---|---|
| `/` | `pages/Home.js` | Public landing page and navigation | None or navigation links | Local UI state; theme store through shell | Public | Implemented. Mostly presentation; no direct backend workflow. |
| `/login` | `pages/Login.js` | Email/password login | `authAPI.login`; may use auth store | `useAuthStore` | Public | Implemented. Depends on backend JWT response. |
| `/register-choice` | `pages/RegisterChoice.js` | Choose registration path | None | Local state | Public | Implemented presentation. |
| `/register` | `pages/Register.js` | New account registration | `authAPI.register` | Local form state; auth store | Public | Implemented, but backend role-supply vulnerability remains. |
| `/submit` | `components/CyberReport.js` | Full complaint report form, evidence upload and AI analysis | `complaintsAPI.analyze`, `complaintsAPI.create` | Large local form state; auth store; translation/theme stores | Authenticated, any role | Implemented. Missing a dedicated evidence-management API and depends on async OCR after submission. |
| `/dashboard` | `pages/Dashboard.js` | User complaint dashboard and metrics | `complaintsAPI.getAll`; likely status/detail navigation | Local state; auth/theme/notification stores | Authenticated | Implemented. User scope behavior depends on backend query construction. |
| `/officer` | `pages/OfficerDashboard.js` | Officer incident queue and status actions | Complaints list/status; analytics calls through service imports | Local state; auth store | Officer or admin | Implemented. Requires backend officer filtering and status permissions. |
| `/complaint/:complaintId` | `pages/ComplaintDetails.js` | Complaint details and secure chat | `complaintsAPI.getOne`; `chatsAPI.getMessages/sendMessage`; Socket.IO | Local state; auth store | Authenticated; backend viewer masking applies | Implemented. Chat send path lacks the same explicit authorization check as chat retrieval. |
| `/community` | `pages/CommunityComplaints.js` | Masked public/community complaint browser | `complaintsAPI.getAll` | Local state; auth/theme | Authenticated | Implemented. Backend may query all complaints for normal users and mask responses. |
| `/track/:complaintId?` | `pages/TrackComplaint.js` | Public complaint tracking | `complaintsAPI.track` | Local state | Public | Implemented. Optional route parameter supports manual lookup. |
| `/scam-search` | `pages/ScamSearch.js` | Search complaint/threat indicators | `complaintsAPI.publicSearch`; local `threatIntel` lookup | Local state | Public route, includes Navbar | Implemented. No external threat-intelligence service. |
| `/leak-monitor` | `pages/LeakMonitor.js` | Simulated breach/leak monitoring UI | No backend call found | Local state | Public route | Client-only/presentation. Missing real leak-monitor integration. |
| `/threat-map` | `pages/PublicMap.js` | Public anonymized complaint map | `analyticsAPI.publicMapPoints` | Local state; Leaflet | Public | Implemented. Uses randomized fallback coordinates when complaints lack coordinates. |
| `/chat` | `pages/GlobalChat.js` | Global and private messaging | `userAPI.getAll`; `chatsAPI.getGlobal/sendGlobal/getPrivate/sendPrivate`; Socket.IO | Local state, refs; auth and notification stores | Authenticated | Implemented. Socket connection does not attach JWT and server room joins are not authorized. |
| `/admin` | `pages/AdminDashboard.js` | Admin command center and system metrics | `adminAPI.systemStats`, `adminAPI.mlStatus`, analytics/complaint calls as imported | Local state; auth/theme | Admin | Implemented. Runtime metrics are basic OS/process values. |
| `/admin/complaints` | `pages/AdminComplaints.js` | Admin complaint queue, assignment, status, deletion | Complaints list/detail/status/delete; `adminAPI.assignOfficer` | Local state; auth/notifications | Admin | Implemented. Depends on admin backend routes and officer records. |
| `/admin/ml` | `pages/AdminML.js` | ML status and prediction playground | `adminAPI.mlStatus`, `adminAPI.predict` | Local form/result state | Admin | Implemented. Remote ML failure is represented as hybrid fallback rather than hard failure. |
| `/admin/users` | `pages/AdminUsers.js` | User directory and account administration | All admin user endpoints | Large local form/modal state | Admin | Implemented. Supports create/edit/delete/role/status/password operations. |
| `/admin/info` | `pages/AdminUsers.js` | Alias to user/admin information screen | Same as `/admin/users` | Same | Admin | Implemented alias, not a distinct screen. |
| `/admin/analytics` | `pages/AdminAnalytics.js` | Charts and analytical summaries | Overview, category, trends, geographic, status, financial | Local state; Recharts | Admin in web route; backend also allows officer | Implemented. Web route unnecessarily excludes officers despite officer backend access. |
| `/admin/database` | `pages/AdminDatabase.js` | Database/source inspection UI | `adminAPI.getCodebase` and/or admin statistics according to imports | Local state | Admin | Implemented as an admin inspection view; not a general database CRUD API. |
| `/admin/link-analysis` | `pages/AdminLinkAnalysis.js` | Repeated identifier/suspect linkage | `analyticsAPI.linkAnalysis` | Local state; charts/graph-like UI | Admin in web route | Implemented. Backend derives links only from OCR phone/UPI arrays. |
| `/admin/map` | `pages/AdminMap.js` | Detailed complaint map | `analyticsAPI.mapPoints` | Local state; Leaflet | Admin in web route | Implemented. Backend permits officers, but web route excludes them. |
| `/admin/mails` | `pages/AdminMails.js` | Email/SMS delivery log | `adminAPI.getEmails` | Local pagination/filter state | Admin | Implemented. Read-only log viewer. |
| `/admin/safety` | `pages/AdminSafety.js` | Safety/emergency incident view | Complaint list with safety/immediate-action filters; status actions | Local state; auth | Officer or admin in web route | Implemented. Backend analytics/admin scope differs from this route's officer allowance. |
| `/developer` | `pages/DeveloperPage.js` | Developer/system access tools | Admin codebase endpoint and/or face verification via `DeveloperAccessScanner` | Local state; auth | Any authenticated user at route; face enrollment controller restricts one email | Partial. Route is not role-restricted even though it exposes developer/system tools. |
| `/settings` | `pages/Settings.js` | Profile, preferences, security settings | Profile update; password update; 2FA calls referenced by component but routes are disabled | Settings/theme/translation/auth stores; local state | Authenticated | Partial. Profile/password work; 2FA UI is broken/incomplete. |
| `/learn` | `pages/Learn.js` | Cyber-safety education content | No required backend call found | Local state; translation/theme | Authenticated | Implemented as content/UI. |
| `/forensic-scanner` | `pages/ForensicScanner.js` | Text/URL/IOC/radar-style analyzer | `complaintsAPI.analyze` | Local state; translation/theme | Authenticated by route | Partial. Only generic complaint analysis is an actual backend capability; no dedicated forensic/IOC/radar APIs. |
| `/suspect-search` | `pages/SuspectSearch.js` | Suspect search/intelligence UI | No dedicated backend endpoint found; client logic/static data | Local state | Authenticated by Navbar usage but route itself is not wrapped in `ProtectedRoute` | Partial/client-only. Missing a real suspect-search API and route-level auth. |
| `/feedback` | `pages/Feedback.js` | Feedback form/UI | No backend feedback route found | Local form state | Public | Client-only; submission does not have a confirmed server persistence endpoint. |
| `/faq` | `pages/FAQ.js` | FAQ/support content | None | Local state | Public | Implemented content screen. |
| `*` | `pages/NotFound.js` is imported but wildcard redirects to `/` | Fallback navigation | None | None | Public | `NotFound` is not used by the current wildcard; unknown routes redirect home. |

## Major web modules

### Login and registration

`Login`, `Register`, `RegisterChoice`, `useAuthStore`, `ProtectedRoute`, and `authAPI` form the authentication module. Access tokens are persisted in the auth store/API client. The refresh path is wired in the clients but is unusable because the backend refresh controller is a placeholder.

### Dashboard and complaint reporting

`Dashboard`, `CyberReport`, `ComplaintDetails`, `CommunityComplaints`, and `TrackComplaint` cover the core reporting lifecycle. The report form supports nested victim, suspect, location, financial, urgency, category, and evidence fields. AI analysis can be requested before submission. Complaint creation triggers classification, PII processing, evidence persistence, background OCR, email alerts, and Socket.IO notifications.

### Evidence and OCR

Evidence UI exists inside `CyberReport` and `ComplaintDetails`. There is no standalone evidence browser, evidence download authorization, OCR status route, or OCR result endpoint. OCR results are an internal side effect of complaint creation.

### Chat

`GlobalChat` supports global/private conversations. `SecureChat` is embedded in complaint details. Both use REST history/send calls and direct Socket.IO connections. Client-side CryptoJS handling exists, while the backend stores `content` and `iv`; the server does not visibly enforce encryption or validate the cryptographic contract.

### Notifications

`NotificationCenter` and `useNotificationStore` implement a local notification surface. Socket.IO supplies real-time events. There is no server-backed notification inbox. Mobile notification registration is represented in the model/service layer but is not fully wired in the current mobile API module.

### Profile and settings

`Settings`, `userAPI`, and `useSettingsStore` cover profile and preference changes. Avatar upload is supported by the backend. Password update is supported. The 2FA UI references methods that are absent or disabled.

### Administration and analytics

The admin pages cover complaint operations, users, system stats, ML, charts, maps, mail logs, link analysis, database/source inspection, and safety operations. Most admin APIs are implemented and directly consumed. Web role routing is stricter than backend analytics permissions in several places: officers can call analytics routes but are redirected from most `/admin/*` pages.

### Forensics and intelligence

The web app presents forensic scanning, scam search, suspect search, leak monitoring, public map, and link-analysis modules. Only complaint text analysis, public complaint search, map points, and OCR-derived link analysis have confirmed Express implementations. Suspect search and leak monitoring are client-side/static in the inspected branch.

### JARVIS and assistants

`JarvisAssistant`, `ChatBot`, and `VoiceAssistant` are UI assistant components. The confirmed backend JARVIS route is unauthenticated, depends on `GEMINI_API_KEY`, and optionally calls ElevenLabs for audio. The audit found no confirmed mobile JARVIS integration. The route should be protected if it is intended for administrator use, as its own prompt describes.

# 3. Confirmed breakages, missing APIs, and contract risks

1. **Refresh token contract is broken.** Both web/mobile clients expect `data.accessToken` and `data.refreshToken`, but `/api/auth/refresh` returns only a message.
2. **Public role escalation is possible.** Registration accepts the request-body `role` instead of forcing `user`.
3. **2FA UI/API is incomplete.** The controller methods exist, routes are commented out, and the web API service does not expose the methods used by `TwoFactorModal`.
4. **JARVIS is unauthenticated.** The route has no `protect` middleware although the prompt identifies the assistant as helping a system administrator.
5. **Socket.IO is unauthenticated.** Clients join complaint, user, global, and admin rooms without server-side identity or permission checks.
6. **Complaint send-chat authorization is weaker than read-chat authorization.** `getMessages` checks owner/admin/officer, while `sendMessage` only checks that the complaint exists.
7. **No standalone Evidence, OCR, notification inbox, forensic, suspect-search, leak-monitor, or feedback APIs exist.** Frontend references or UI presence must not be interpreted as backend availability.
8. **Public and detailed map endpoints fabricate fallback coordinates.** Missing coordinates are placed near Bangalore with jitter, so map locations are not necessarily incident locations.
9. **Static upload serving has no per-file authorization.** Evidence and avatars are served from `/uploads` as static files.
10. **The web route and backend role matrices differ.** Backend analytics permits officers, while most web analytics/map/link-analysis routes require `admin`; `/admin/safety` is the main officer-facing exception.
11. **Runtime validation remains outstanding.** The repository had no installed `node_modules`, MongoDB, or running ML service during this audit. Full integration tests and browser verification remain necessary.

## Recommended validation order

First fix registration role assignment, refresh-token rotation, JARVIS authentication, Socket.IO authorization, and complaint chat-send authorization. Next define explicit API contracts for evidence/OCR status, notifications, forensics, intelligence, and feedback. Finally install dependencies and run the backend, web build, ML tests, and authenticated browser flows against disposable MongoDB and ML-service instances.

# References

[1]: https://github.com/mohithkotian/CyberGuard_App/tree/a260f55 "CyberGuard repository at the audited commit"

[2]: https://github.com/mohithkotian/CyberGuard_App/blob/a260f55/backend/src/server.js "CyberGuard Express server and route mounts"

[3]: https://github.com/mohithkotian/CyberGuard_App/blob/a260f55/web-app/src/App.js "CyberGuard React route configuration"
