# CyberGuard Mobile Application Deep Audit

**Repository:** `mohithkotian/CyberGuard_App`  
**Audited branch/commit:** `main` / `a260f55`  
**Application:** `mobile-app`  
**Scope:** Existing Expo React Native source only. No implementation changes, package installation, refactors, or runtime modifications were made.

## Executive conclusion

The mobile application is a dark-themed Expo React Native client with a working high-level authentication/navigation structure, complaint feed, public complaint tracking, complaint submission form, basic complaint detail view, profile display/logout, and a limited admin command center. It shares the Express/MongoDB backend with the web application.

The current mobile client is **not release-ready**. The most important blockers are a hard-coded local-tunnel API default, a refresh-token contract that cannot work with the backend placeholder, an admin/officer role mismatch, a complaint-detail screen with missing imports/props, and a complaint submission flow that can submit before the final review step. Push notification registration calls a method that is not defined in the mobile API export, so token registration is currently ineffective.

The mobile app does not contain mobile equivalents for most web intelligence, forensic, JARVIS, analytics, link-analysis, safety, learning, or feedback features. Those omissions are not necessarily defects; several are better suited to the web/admin surface. They are documented explicitly below rather than inferred from web functionality.

# 1. Mobile architecture and project structure

## Runtime and configuration

| Item | Finding |
|---|---|
| Framework | Expo SDK `^54.0.0` with React Native `0.81.5` |
| React | `19.1.0` |
| Entry point | `mobile-app/App.js`, configured through Expo's `node_modules/expo/AppEntry.js` |
| Navigation | React Navigation native stack plus bottom tabs |
| State | Zustand auth store; most screen state is local React state |
| Networking | Axios client in `src/services/api.js` |
| Persistence | AsyncStorage for `user`, `accessToken`, and `refreshToken` |
| Notifications | `expo-notifications`, `expo-device`; setup invoked from `App.js` |
| File selection | `expo-document-picker`; no active camera or image-picker import in mobile source |
| Styling | Shared constants in `src/utils/theme.js`, with substantial inline styles |
| Environment | `process.env.API_URL` is read, but no mobile `.env` or documented Expo public-variable configuration was found |
| Default API | `https://cybercrime-repair-test.loca.lt/api` |
| Deep linking | No `linking` configuration or deep-link handlers found |
| Assets | `assets/icon.png`, `adaptive-icon.png`, `favicon.png`, and `splash.png` |
| Build profiles | EAS development, preview APK, production Android App Bundle, and iOS profiles exist |

## Complete file/module map

```text
mobile-app/
├── App.js                                  Expo entry and push-registration bootstrap
├── app.json                                Expo app, platform, permission, asset, and plugin config
├── babel.config.js                         Expo Babel preset
├── eas.json                                EAS build/submit profiles
├── package.json                            Dependencies and Expo scripts
├── package-lock.json                       Locked dependency graph
├── assets/
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash.png
└── src/
    ├── components/
    │   ├── CyberBackground.js              Animated cyber-network background
    │   └── HeroSection.js                  Home hero/navigation/CTA section
    ├── hooks/
    │   └── useAuthStore.js                 Zustand auth, persistence, hydration, logout
    ├── navigation/
    │   └── AppNavigator.js                 Auth stack, main stack, bottom tabs, role tab
    ├── screens/
    │   ├── AdminScreen.js                  Limited command center and status updates
    │   ├── ComplaintDetailScreen.js        Complaint detail/timeline view
    │   ├── HomeScreen.js                   Complaint feed and report CTA
    │   ├── LoginScreen.js                  Email/password login
    │   ├── ProfileScreen.js                User summary and logout
    │   ├── RegisterScreen.js               Account registration
    │   ├── SubmitComplaintScreen.js        Multi-step complaint/evidence form
    │   └── TrackScreen.js                  Public complaint tracking
    ├── services/
    │   ├── api.js                          Axios client and endpoint wrappers
    │   └── notifications.js                 Expo permission/token/local notification helpers
    └── utils/
        └── theme.js                        Colors, shared styles, status colors
```

## Existing dependencies versus actual usage

The package includes `expo-document-picker`, `expo-image-picker`, `expo-notifications`, `expo-device`, charting, SVG, and Socket.IO. In the inspected source, `expo-document-picker` and notification packages are used. `expo-image-picker`, chart-kit, Socket.IO, and several other capabilities are declared but have no active mobile implementation in the current `src` tree.

# 2. Navigation audit

## Root navigator

`App.js` wraps the application in `SafeAreaProvider`, registers push notifications on mount, sets a light status bar over the dark theme, and renders `AppNavigator`.

`AppNavigator` hydrates the Zustand auth store before rendering navigation. While hydration is pending it shows a full-screen activity indicator. It then renders a native stack with conditional auth state:

- Without a hydrated `user`: `Login` and `Register`.
- With a `user`: `Main` and `ComplaintDetail`.

There is no drawer navigator, no deep-link configuration, and no explicit navigation state persistence beyond the auth store.

## Route map

| Screen | Navigation route | Required auth | Required role | Parameters | Notes |
|---|---|---:|---|---|---|
| `LoginScreen` | `Login` | No | None | None | Auth stack; no visible link from login to register in the inspected screen |
| `RegisterScreen` | `Register` | No | None | None | Navigates back to `Login` |
| `UserTabs` | `Main` | Yes | Any authenticated user | None | Contains Home, Submit, Track, conditional Admin, Profile |
| `HomeScreen` | `Home` tab | Yes | Any authenticated user | None | Complaint feed; navigates to detail and submit |
| `SubmitComplaintScreen` | `Submit` tab | Yes | Any authenticated user | None | Multi-step form and multipart submit |
| `TrackScreen` | `Track` tab | Yes because it is inside `Main` | Any authenticated user | None | UI says no login required, but navigator places it behind auth |
| `AdminScreen` | `Admin` tab | Yes | Intended admin/officer | None | Added when `isAdmin()` returns true; that function returns true for `admin` and `officer` |
| `ProfileScreen` | `Profile` tab | Yes | Any authenticated user | None | Display-only profile plus logout |
| `ComplaintDetailScreen` | `ComplaintDetail` stack | Yes because it is only registered in authenticated branch | Any authenticated user | `{complaintId}` | Uses Mongo ID or public complaint ID to choose API |

The `Admin` tab role gate is implemented as `isAdmin() => ['admin','officer'].includes(user.role)`. However, the backend `/api/admin/*` router requires `admin`, while analytics allow `admin` and `officer`. Therefore officers can enter the mobile admin screen but its admin system/ML calls are unauthorized.

# 3. Screen-by-screen audit

Status values are **IMPLEMENTED**, **PARTIAL**, **PLACEHOLDER**, **BROKEN**, or **MISSING**.

## LoginScreen

- **File/route:** `src/screens/LoginScreen.js` → `Login`.
- **Purpose:** Email/password authentication.
- **UI:** `SafeAreaView`, animated `CyberBackground`, keyboard-aware scroll view, email/password inputs, gradient login button.
- **API/state:** Calls `useAuthStore.login`, which calls `POST /api/auth/login`; local email/password/loading state.
- **Auth/role:** Public; successful auth causes the conditional navigator to switch to `Main`.
- **Loading/error:** Button label changes to `AUTHENTICATING...`; errors use `Alert`.
- **Validation:** Requires non-empty email and password only. Email format and password policy are delegated to backend.
- **File/camera:** None.
- **Status:** **IMPLEMENTED**, subject to the backend/JWT/API URL blockers. Registration navigation is not visible on this screen, although the route exists.

## RegisterScreen

- **File/route:** `src/screens/RegisterScreen.js` → `Register`.
- **Purpose:** Create an account.
- **UI:** Name, email, optional phone, password, confirmation, submit button, login link.
- **API/state:** Calls `useAuthStore.register` → `POST /api/auth/register`; local form/loading state.
- **Auth/role:** Public; successful registration immediately enters the authenticated navigation tree.
- **Loading/error:** Button label changes; errors use `Alert`.
- **Validation:** Name required/minimum two characters, basic `@` check, password minimum eight characters, confirmation equality. It does not enforce uppercase/lowercase/number even though backend registration validation does.
- **File/camera:** None.
- **Status:** **PARTIAL**. The client contract works for ordinary users, but backend registration accepts a caller-supplied role and must be treated as a critical shared-backend blocker. There is no OTP verification flow.

## HomeScreen

- **File/route:** `src/screens/HomeScreen.js` → `Home` tab.
- **Purpose:** Authenticated complaint feed and quick report entry.
- **UI:** `HeroSection`, refreshable scroll view, complaint cards, status badges, category/date/AI match indicator, empty state.
- **API/state:** Calls `complaintsAPI.getAll({limit: 50})`; local complaints/loading/refreshing state; auth store for user/logout/admin label.
- **Auth/role:** Authenticated; backend response scope is role-dependent. The client does not pass `scope:'own'`, so ordinary users rely on backend masking behavior rather than an own-only query.
- **Loading/empty/error:** Loading text and empty state exist. Fetch errors are logged but not surfaced to the user.
- **Navigation:** Complaint card passes `complaintId` to `ComplaintDetail`; report CTA goes to `Submit`.
- **Status:** **PARTIAL**. Core feed is present, but error feedback is weak and the query does not explicitly request the user's own complaints.

## SubmitComplaintScreen

- **File/route:** `src/screens/SubmitComplaintScreen.js` → `Submit` tab.
- **Purpose:** Multi-step complaint submission with evidence.
- **UI:** Four conceptual steps: Details, Victim Info, Evidence, Submit. It includes title, description, date, anonymity, financial loss/type, state/district, suspect email/phone, file list, remove attachment, review summary, and submit controls.
- **API/state:** Calls only `complaintsAPI.create` → `POST /api/complaints`; local step/form/files/loading state. It does not call `/api/complaints/analyze` before submission.
- **Auth/role:** Authenticated; backend accepts any authenticated role.
- **Validation:** Step 0 validates title length 10, description length 50, and date. Other fields have no substantive validation. Backend requires title 2–300, description 3–5000, and parses nested values.
- **Multipart:** Appends `title`, `description`, `source:'mobile'`, `isAnonymous`, JSON `victimDetails`, JSON `suspectInfo`, JSON `location`, and each selected document under `evidence`.
- **Evidence:** Uses `DocumentPicker.getDocumentAsync({multiple:false})` once per selection, enforces a five-file client limit, allows removal, and uses the picker MIME type or `application/octet-stream` fallback.
- **Loading/error:** Activity indicator while submit; `Alert` on failure. No upload progress or file-size/type preflight.
- **Critical behavior:** The `Quick Submit` button is rendered on steps 0–2 and calls `handleSubmit` immediately. It can submit an incomplete form before the final review step. The `Next Step` button also exists, so there are two conflicting flows.
- **Status:** **PARTIAL/BROKEN**. The multipart field names align with backend evidence handling, but the premature-submit path, lack of ML pre-analysis, lack of camera/image picker, and limited validation materially affect correctness.

## ComplaintDetailScreen

- **File/route:** `src/screens/ComplaintDetailScreen.js` → `ComplaintDetail` with `{complaintId}`.
- **Purpose:** Load a complaint by Mongo ID or public complaint ID and display summary, AI classification, and timeline.
- **API/state:** Chooses `complaintsAPI.getOne` for a 24-character hex ID, otherwise `complaintsAPI.track`; local complaint/loading state.
- **Auth/role:** Authenticated stack route, but the public tracking fallback is also called with the authenticated client.
- **UI:** Summary card, status/category, AI classification confidence, timeline, loading and not-found states.
- **Navigation:** Intended back navigation to Home.
- **Status:** **BROKEN** in the inspected source. The JSX uses `SafeAreaView`, `TouchableOpacity`, and `navigation`, but the file imports only `View`, `Text`, `ScrollView`, and `Alert`, and the component signature is `{ route }` rather than `{ route, navigation }`. This causes undefined component/prop failures when rendered. It also does not display evidence, assigned officer, priority, action taken, suspect/victim details, or chat.

## TrackScreen

- **File/route:** `src/screens/TrackScreen.js` → `Track` tab.
- **Purpose:** Public complaint tracking by complaint ID.
- **UI:** Complaint ID input, track button, status/category/severity summary, timeline.
- **API/state:** Calls `complaintsAPI.track` → `GET /api/complaints/track/:complaintId`; local ID/loading/complaint state.
- **Auth/role:** UI says no login required, but route is nested under authenticated `Main`; the Axios client will attach a token when available.
- **Loading/empty/error:** Activity indicator during tracking, Alert on not found, no-result state before search.
- **Validation:** Requires non-empty trimmed ID only.
- **Status:** **PARTIAL**. Backend endpoint is public and the screen is functionally present, but the navigation placement contradicts its no-login product behavior.

## ProfileScreen

- **File/route:** `src/screens/ProfileScreen.js` → `Profile` tab.
- **Purpose:** Show local user identity and terminate session.
- **UI:** Initial avatar, name, role badge, ID/email/active status, logout button.
- **API/state:** Uses `useAuthStore`; logout calls `POST /api/auth/logout` through the store. No profile fetch/update.
- **Auth/role:** Authenticated, any role.
- **Loading/empty/error:** None; uses locally persisted user object.
- **Status:** **PARTIAL**. It is a display/logout screen, not a profile/settings implementation. Avatar, name, phone, address, password, preferences, theme, language, and security settings are missing.

## AdminScreen

- **File/route:** `src/screens/AdminScreen.js` → conditional `Admin` tab.
- **Purpose:** Limited mobile command center.
- **UI:** Overview and complaints tabs, metric cards, system health bars, ML status card, incident stream, refresh control, complaint status action dialog.
- **API/state:** Calls `analyticsAPI.overview`, `complaintsAPI.getAll({limit:50})`, `adminAPI.systemStats`, `adminAPI.mlStatus`, and `complaintsAPI.updateStatus`; local overview/complaints/health/ML/tab/error/refresh state.
- **Auth/role:** UI gate allows admin and officer; backend admin system/ML routes allow admin only, while analytics and complaint status allow officers.
- **Loading/empty/error:** Promise settlement permits partial data; refresh control; error state if both core requests fail; empty complaint state.
- **Placeholder behavior:** `AUDIT`, `ALERT`, `OPTIMIZE`, and `PURGE` buttons call `handleAction`, which displays a success alert without making an API request or changing state. `UPTIME 99.9%`, `ACCURACY 97.4%`, and `Models: 4 Active` are hard-coded display values.
- **Status:** **PARTIAL**. Complaint listing/status updates and overview are real; system protocol controls and several metrics are placeholders. Officer access is broken for admin-only calls.

# 4. Authentication audit

## Login success

1. `LoginScreen` performs minimal local validation.
2. `useAuthStore.login` calls `POST /api/auth/login`.
3. It expects `data.data.user`, `accessToken`, and `refreshToken`.
4. It writes all three values to AsyncStorage.
5. It updates Zustand `user` and `token`.
6. `AppNavigator` re-renders from the auth branch into `Main`.

## Registration success

The sequence mirrors login through `POST /api/auth/register`. The mobile form does not send a role, so normal registration defaults to the backend's default role unless a caller tampers with the request. The shared backend still accepts an explicit role, which is a critical security defect.

## App restart

`AppNavigator` calls `hydrate()` once. Hydration reads `user` and `accessToken` from AsyncStorage and marks the store hydrated. It does not validate the token with `/api/auth/me`, compare the persisted user with the server, or proactively refresh an expired access token. A stale local user/token pair can therefore render the authenticated navigation until an API call fails.

## Token attachment

Every Axios request asynchronously reads `accessToken` from AsyncStorage and attaches `Authorization: Bearer <token>` when present. The client also sends `Bypass-Tunnel-Reminder: true` and a custom `User-Agent: ExpoApp`, which are development-tunnel workarounds rather than production concerns.

## Token expiry and 401

On a `401`, the interceptor reads `refreshToken` and calls `POST /api/auth/refresh`. It expects `data.data.accessToken` and `data.data.refreshToken`, stores them, updates the original request header, and retries once. The backend currently returns only `{status:'success', message:'Token refresh endpoint'}`. Therefore the interceptor receives missing token fields, enters its catch block, removes all auth storage, and rejects the original request. The user is effectively logged out on token expiry.

## Refresh failure

The interceptor removes `accessToken`, `refreshToken`, and `user`, but it does not update the Zustand store directly. The navigation tree may remain based on the stale in-memory `user` until a later store action or app restart.

## Logout

`ProfileScreen` asks for confirmation, then calls the store's `logout`. The store calls `POST /api/auth/logout` but suppresses errors, removes all three AsyncStorage values, and clears Zustand `user`/`token`. Navigation returns to the unauthenticated stack because the store state changes.

## `/api/auth/me`, password, face, OTP/2FA

- `authAPI.getMe` exists but is not called by the current mobile screens/store.
- Password update is not exposed in the mobile API service or UI.
- Face enrollment/verification is not exposed in the mobile API service or UI.
- OTP/email verification is not exposed; the backend route is disabled.
- 2FA is not exposed; backend routes are disabled.

# 5. Mobile API client inventory

| Mobile function | HTTP | Endpoint | Request | Response assumption | Backend status |
|---|---:|---|---|---|---|
| `authAPI.register` | POST | `/api/auth/register` | JSON registration fields | Expects user plus access/refresh tokens | Mounted; partial because backend permits caller role |
| `authAPI.login` | POST | `/api/auth/login` | `{email,password}` | Expects user plus access/refresh tokens | Mounted and compatible |
| `authAPI.logout` | POST | `/api/auth/logout` | Bearer token; no body | Ignores response | Mounted and compatible |
| `authAPI.getMe` | GET | `/api/auth/me` | Bearer token | Defined but unused | Mounted and compatible |
| Refresh interceptor | POST | `/api/auth/refresh` | `{refreshToken}` | Expects `data.accessToken` and `data.refreshToken` nested under `data` | **Broken placeholder**; response does not match |
| `complaintsAPI.create` | POST | `/api/complaints` | Multipart fields and `evidence` files | Expects `data.data.complaint` | Mounted; mostly compatible |
| `complaintsAPI.getAll` | GET | `/api/complaints` | Query object, commonly `{limit:50}` | Expects `data.data.complaints` | Mounted; query does not request own scope |
| `complaintsAPI.getOne` | GET | `/api/complaints/:id` | URL ID | Expects `data.data.complaint` | Mounted and compatible |
| `complaintsAPI.track` | GET | `/api/complaints/track/:id` | URL complaint ID | Expects `data.data.complaint` | Public mounted endpoint; route placement is inconsistent |
| `complaintsAPI.updateStatus` | PATCH | `/api/complaints/:id/status` | `{status}` in AdminScreen | Expects success/no detailed contract | Mounted; admin/officer only |
| `analyticsAPI.overview` | GET | `/api/analytics/overview` | None | Expects `data.data.overview` | Mounted; admin/officer |
| `analyticsAPI.byCategory` | GET | `/api/analytics/by-category` | None | Defined but unused in mobile | Mounted; admin/officer |
| `analyticsAPI.trends` | GET | `/api/analytics/trends` | Query `months` | Defined but unused in mobile | Mounted; admin/officer |
| `adminAPI.systemStats` | GET | `/api/admin/system-stats` | None | Expects `data.data.health` | Mounted; admin only |
| `adminAPI.mlStatus` | GET | `/api/admin/ml-status` | None | Expects `data.data` | Mounted; admin only |
| `adminAPI.getUsers` | GET | `/api/admin/users` | None | Defined but unused in current screens | Mounted; admin only |
| Push registration call | POST intended | `/api/users/push-token` | Expo token | `notifications.js` calls `authAPI.registerPushToken?.(token)` | Backend exists, but `authAPI.registerPushToken` is undefined; call is skipped by optional chaining |

## Endpoint/environment risks

1. The default URL is a hard-coded localtunnel endpoint. It is not a stable production configuration and may expire or route to the wrong backend.
2. The comment says to replace with a LAN IP, but the actual default is HTTPS localtunnel and there is no documented environment setup for Expo public variables.
3. There is no localhost/127.0.0.1 default in the active mobile API file, which avoids the common device-loopback failure, but the current tunnel is still a development dependency.
4. The client sets multipart content type manually. React Native often needs the runtime-generated boundary; this should be verified in a device build.
5. Refresh response assumptions are definitively incompatible with the backend.
6. `adminAPI.systemStats` assumes `data.data.health`; this matches the current admin route's intended response only if the controller returns that exact nested object.
7. The mobile service has no wrappers for analyze, public map, public search, chats, push-token, profile, password, face, or JARVIS APIs.

# 6. Complaint system trace

## Submission path

```text
SubmitComplaintScreen
  → local form/file state
  → FormData construction
  → POST /api/complaints
  → auth middleware
  → multer evidence upload
  → nested-field parsing
  → express-validator checks
  → PII masking for classification input
  → ML service request with local rule fallback
  → complaint creation in MongoDB
  → admin/user Socket.IO events and email alert
  → asynchronous OCR for image evidence
  → OCR-derived data and possible second ML classification update
  → returned complaint payload
  → Alert with complaint ID/category
  → navigation to Home
```

## Mobile/backend field compatibility

- `title` and `description` are compatible.
- `source:'mobile'` is accepted.
- `isAnonymous` is converted from string to boolean by the backend.
- `victimDetails` is JSON stringified and parsed by the backend. It sends `financialLoss`, `lossType`, and `incidentDate`; the backend model expects its own financial-loss structure, so exact persistence depends on the schema.
- `suspectInfo` is JSON stringified and parsed.
- `location` sends `{state,district}`. The backend/web model primarily uses city/state/coordinates conventions, so district may not populate the expected display fields.
- Files are sent under `evidence`, matching the backend field name.
- The fallback MIME `application/octet-stream` is not in the backend evidence allowlist and will be rejected if the document picker does not supply a recognized MIME type.

## Missing mobile complaint capabilities

The mobile form does not call the backend analyze endpoint before submission, does not offer category/subcategory selection, severity, priority, immediate-action/safety flags, modus operandi, relationship with victim, coordinates, or a true date picker. It has no OCR status or result view, no evidence upload progress, and no retry/resume behavior.

# 7. Evidence, camera, and file upload

| Capability | Current state |
|---|---|
| Camera | **MISSING** in source despite Android CAMERA permission and iOS camera description |
| Image picker | Dependency/configuration exists, but no active `expo-image-picker` usage found |
| File picker | **IMPLEMENTED** through `expo-document-picker` |
| Multiple files | **PARTIAL**: max five total is enforced by repeated single-file selection; picker itself uses `multiple:false` |
| MIME types | Passed through from picker; unknown values fall back to `application/octet-stream`, which backend may reject |
| Multipart | **IMPLEMENTED** with field `evidence` |
| Permissions | Document picker handles its own flow; camera/photo permission behavior is not implemented explicitly |
| Preview | **PARTIAL**: filename list only; no image/video/PDF preview |
| Remove attachment | **IMPLEMENTED** locally before submission |
| Upload errors | **PARTIAL**: one generic Alert; no per-file error, progress, retry, or cleanup UI |
| Large files | **MISSING** client preflight; backend defaults to 10 MB per evidence file |
| Backend authorization | **WEAK**: static `/uploads` serving is exposed without per-file authorization |

# 8. Complaint tracking and details

The mobile app supports a list, public tracking, a detail summary, status, category, severity, and timeline. It does not currently render priority, assigned officer, action taken, evidence, victim/suspect details, location, financial loss, or complaint chat.

`HomeScreen` opens details using the public complaint ID. `ComplaintDetailScreen` chooses the authenticated detail endpoint only when the route parameter resembles a Mongo ObjectId; otherwise it uses public tracking. That is a reasonable compatibility strategy, but the screen's missing imports/`navigation` prop currently prevent reliable rendering.

# 9. Chat and Socket.IO

## Current mobile implementation

No mobile screen imports `socket.io-client` or defines a Socket.IO connection. The dependency exists in `package.json`, but there is no mobile global chat, private chat, complaint chat, message history, attachment messaging, reconnect, cleanup, or notification listener implementation.

## Backend comparison

The backend has:

- REST complaint chat history/send under `/api/chats/:complaintId`.
- REST global history/send under `/api/chats/global`.
- REST private history/send under `/api/chats/private/:userId`.
- Socket.IO events for `join-chat`, `chat-message`, `join-global`, `global-message`, `join-admin`, `join-room`, `join-user`, and `private-message`.

The mobile app consumes none of these. The backend's Socket.IO handlers also lack JWT handshake/room authorization, which is a shared backend blocker for any future mobile chat implementation.

# 10. Notifications

`App.js` calls `registerForPushNotifications()` once at startup. The notification service:

1. Returns `null` on simulator/non-device.
2. Reads existing notification permission.
3. Requests permission if needed.
4. Creates an Android notification channel.
5. Obtains an Expo push token.
6. Attempts `authAPI.registerPushToken?.(token)`.
7. Provides `scheduleLocalNotification`.

The backend route is `POST /api/users/push-token`, but the mobile `authAPI` object does not define `registerPushToken`. Optional chaining makes the call silently do nothing. There is no notification state store, notification inbox, response listener, navigation-on-tap handler, or server push delivery implementation in the mobile project.

**Status:** **PARTIAL/BROKEN**. Permission/channel/token acquisition is present; backend registration and end-to-end delivery are not.

# 11. Profile and settings

| Capability | Mobile state | Backend availability |
|---|---|---|
| Display name/email/role | Present from persisted user | `/api/auth/me` and `/api/users/profile` exist |
| Avatar | Initial-based avatar only | Profile update/avatar upload exists, but mobile does not expose it |
| Name update | Missing | `/api/users/profile` supports it |
| Phone update | Missing | `/api/users/profile` supports it |
| Address update | Missing | `/api/users/profile` supports it |
| Password update | Missing | `/api/auth/update-password` exists |
| Preferences | Missing | No clear shared mobile preference API |
| Theme | Fixed dark design constants | No mobile theme store or toggle |
| Language | Missing | Web has translation store; mobile has none |
| 2FA/OTP | Missing | Backend routes disabled |
| Face verification | Missing | Backend routes exist but require JWT and are not exposed in mobile |
| Logout | Implemented | `/api/auth/logout` exists |

# 12. Admin mobile audit

## Exists on mobile

- Admin/officer-gated tab attempt.
- Overview totals through analytics overview.
- Complaint list through general complaint API.
- Basic complaint status update dialog.
- Admin system stats call.
- Admin ML status call.
- Pull-to-refresh and partial-data handling.

## Backend available but mobile missing

- Admin user directory, user stats, user detail, create/update/delete, role change, activation toggle, and password reset.
- Complaint assignment to officer.
- ML prediction playground.
- Admin codebase viewer.
- Mail log viewer.
- Category, trend, geography, status, financial, map-point, and link-analysis analytics beyond overview.
- Public/detailed map UI.

## Not suitable for the current mobile surface without a dedicated product decision

- Large database/source inspection.
- Full admin user-management forms and password operations.
- Dense analytics dashboards and link-analysis visualizations.
- Mail-log investigation.
- Developer/system codebase tools.

## Role defect

`isAdmin()` returns true for officers, so officers receive the Admin tab. `AdminScreen` then calls `/api/admin/system-stats` and `/api/admin/ml-status`, both protected by `restrictTo('admin')`. Those calls fail for officers. The screen should either be admin-only or use a separate officer capability set; this audit does not change it.

## Placeholder controls

The mobile admin protocol buttons labeled `AUDIT`, `ALERT`, `OPTIMIZE`, and `PURGE` only display a local success Alert. They do not map to backend APIs and are **PLACEHOLDER** controls.

# 13. Web-to-mobile feature matrix

| Web feature | Backend API | Mobile existing | Mobile required | Notes |
|---|---|---|---|---|
| Authentication | `/auth/register`, `/login`, `/logout`, `/me` | Yes: login/register/logout; `/me` unused | Token validation and real refresh | Refresh endpoint is broken |
| Complaint reporting | `POST /complaints` | Yes | Fix submit flow and validation | Quick Submit can bypass review |
| Complaint tracking | `GET /complaints/track/:id` | Yes | Move public tracking outside auth stack | Current Track tab is authenticated |
| Complaint details | `GET /complaints/:id` or public track | Partial; screen currently broken | Fix imports/props and expand fields | No evidence/chat/action details |
| Evidence | Multipart `POST /complaints` | Partial document picker | Camera, previews, MIME/size checks, progress | Backend accepts up to five files |
| OCR | Background side effect of complaint upload | No UI/status | OCR status/result view if product requires it | No OCR route exists |
| ML analysis | `/complaints/analyze`, admin `/admin/predict` | No pre-analysis call | Optional mobile analysis preview | Submission still triggers backend ML |
| Community | `GET /complaints` with masking behavior | No distinct community mode | Decide whether feed should be own-only or masked community | Home calls generic list |
| Public tracking | `/complaints/track/:id` | Yes in code, wrong navigator placement | Public entry point/deep link | No deep links configured |
| Scam search | `/complaints/public/search` plus static threat data | Missing | Optional lightweight search screen | Backend is reusable |
| Threat map | `/analytics/public/map-points` | Missing | Optional map screen | Map fallback coordinates need product review |
| Chat | `/chats/*` and Socket.IO | Missing | Mobile chat if required | Backend Socket.IO auth must be fixed first |
| Notifications | `/users/push-token`, Socket.IO events | Partial startup setup | Register token, listeners, tap routing, inbox | Current API method is undefined |
| Profile | `/users/profile`, `/auth/me` | Display/logout only | Edit profile/avatar | Backend available |
| Settings | Password/2FA/profile APIs | Missing | Mobile settings screen | 2FA routes are disabled |
| JARVIS | `/jarvis/chat` | Missing | Not recommended as baseline mobile feature | Route is unauthenticated and credential-dependent |
| Forensics | Generic `/complaints/analyze`, OCR/link analysis | Missing | Only if simplified mobile workflow is approved | No dedicated forensic API |
| Suspect search | No confirmed endpoint | Missing | Backend/API design required first | Web version is client/static logic |
| Leak monitor | No endpoint | Missing | Backend/provider integration required | Web version is client-only |
| Admin | `/admin/*`, analytics | Limited command center | Keep narrow; fix role gate | Do not clone full desktop admin |
| Analytics | `/analytics/*` | Overview only | Small KPI summaries if needed | Full dashboards remain web-focused |
| Safety | Complaint filters/status/admin safety page | Missing distinct mobile screen | Optional urgent queue for officers | Backend complaint filters reusable |
| Link analysis | `/analytics/link-analysis` | Missing | Web-focused; mobile summary only if needed | Dense investigation UI is not mobile-first |
| Learning | Web static `Learn` page | Missing | Optional content module | No required backend API |
| Feedback | Web UI, no confirmed backend route | Missing | API must be defined first | Do not assume persistence |

# 14. Mobile UI/UX architecture

## Design language

The existing mobile design uses a cyber-security control-room aesthetic:

- **Primary background:** navy `#0A0F1E`.
- **Cards:** translucent dark blue with rounded corners, thin cyan borders, and shadows/elevation.
- **Primary accent:** electric blue `#00B4FF`.
- **Secondary accent:** cyan/green `#00FFD1`.
- **State colors:** success `#00C896`, warning/orange `#FF6B35`, danger/red `#FF5252`, muted blue-gray `#5A6480`.
- **Typography:** bold uppercase labels, letter spacing, large high-contrast headings, monospace identifiers.
- **Buttons:** rounded primary filled buttons, outlined secondary buttons, gradient login action.
- **Forms:** dark translucent inputs with cyan borders or underlines and high-contrast text.
- **Navigation:** native stack plus hidden bottom-tab bar; screen-specific back buttons are rendered inside content.
- **Background:** `CyberBackground` uses SVG geometry and pan interaction; `HeroSection` uses gradients and animated visual elements.
- **Loading:** activity indicators, text labels such as `SYNCING DATA...`, and pull-to-refresh.
- **Errors:** primarily `Alert` dialogs; some screens show inline empty/error cards.
- **Theme:** configured as dark in Expo and effectively hard-coded dark; there is no light/system theme switch.

The design is visually coherent, but inline styling is widespread and screen behavior is not yet consistent. Some screens use emoji as operational icons, and the bottom tab bar is hidden, which makes navigation depend on custom in-content controls and may reduce discoverability.

# 15. Platform responsibilities

## Shared between web and mobile

These capabilities use the shared backend and should have consistent contracts:

- Authentication and role handling.
- Complaint creation, classification, storage, and tracking.
- Complaint detail and timeline data.
- Evidence upload and privacy rules.
- Status updates for authorized personnel.
- Optional chat and notifications.
- Public tracking and safe PII masking.

## Web-focused

The existing project context supports keeping these primarily on web/admin:

- Large analytics dashboards and multi-chart exploration.
- Database/source inspection and developer tools.
- Mail-log review.
- Dense forensic/link-analysis visualizations.
- Suspect and leak-monitor research workspaces until real backend services exist.
- Full user administration and password/role management.

## Mobile-focused

These are appropriate mobile priorities based on the current implementation:

- Quick complaint reporting.
- Camera/image evidence capture.
- Push notifications and notification tap routing.
- Public complaint tracking.
- Compact complaint timeline/detail.
- Field-officer status updates and an urgent safety queue.
- Lightweight chat after Socket.IO authorization is addressed.

# 16. Blockers

## Critical

1. **Broken refresh-token contract.** Mobile expects token data that `/api/auth/refresh` does not return; expired sessions are cleared and requests fail.
2. **Public registration role escalation in the shared backend.** Mobile registration is exposed to the same vulnerable endpoint.
3. **Complaint detail source errors.** `ComplaintDetailScreen` references missing imports and an undefined `navigation` variable, preventing reliable rendering.
4. **Admin/officer authorization mismatch.** Officers can enter the Admin tab but call admin-only endpoints.
5. **Hard-coded development tunnel as default API.** The mobile app is coupled to an unstable external tunnel unless build-time configuration is supplied.

## High

1. **Premature complaint submission.** `Quick Submit` invokes final submission on intermediate steps.
2. **Push token is not registered.** `authAPI.registerPushToken` is undefined and optional chaining suppresses the failure.
3. **No camera/image picker implementation** despite permissions/dependencies.
4. **No mobile chat implementation** despite Socket.IO dependency and backend chat APIs.
5. **No evidence preview, upload progress, type/size preflight, or retry.**
6. **Public tracking is placed behind authenticated navigation.**
7. **Home feed does not explicitly request own complaints** and silently hides fetch errors.
8. **Backend Socket.IO authorization is absent**, blocking safe future mobile chat/notifications.

## Medium

1. `/api/auth/me` is defined but not used during hydration.
2. Password, profile editing, avatar, address, 2FA, face, language, and theme settings are absent.
3. Mobile complaint fields do not fully map to the backend's location/financial/category structures.
4. No OCR status/result UI exists because the backend provides no OCR status route.
5. Admin metrics and protocol actions contain hard-coded or local-only values.
6. The app has no deep linking for complaint tracking or notification navigation.
7. Mobile API wrappers omit public search, analyze, map, chats, profile, and push-token APIs.

## Low

1. Hidden bottom-tab bar reduces discoverability.
2. Emoji/icon choices are inconsistent with native accessibility conventions.
3. Most errors use generic Alerts rather than inline field-level feedback.
4. No formal mobile test suite or device-build verification was present in the repository.

# 17. Exact implementation roadmap

This is an analysis roadmap only; no code was changed during this audit.

## Phase 1: Shared correctness and security

1. Force public registration to `role:'user'` in the backend.
2. Implement and validate refresh-token rotation, then align mobile/web interceptors with the exact response shape.
3. Add authenticated Socket.IO handshake and room/event authorization.
4. Correct the complaint detail imports and navigation prop.
5. Decide whether `AdminScreen` is admin-only or split into an officer-safe command view.
6. Replace the hard-coded mobile tunnel with an explicit development/staging/production configuration strategy.

## Phase 2: Mobile complaint reliability

1. Remove final submission from intermediate steps and make the four-step flow deterministic.
2. Align mobile fields with the backend complaint schema, including location, financial loss, category, severity, priority, and safety flags.
3. Add client-side MIME/size checks, previews, upload progress, and retry behavior.
4. Add camera/image-picker support only after platform permission requirements are specified.
5. Add a clear post-submit detail navigation path and error recovery.

## Phase 3: Mobile identity and notifications

1. Register Expo push tokens through a real `userAPI`/`authAPI` method.
2. Add notification listeners, tap routing, and a minimal notification state model.
3. Hydrate with `/api/auth/me` and handle stale/invalid local sessions.
4. Add profile edit/avatar/password screens against existing backend APIs.
5. Decide whether face/2FA/OTP are product requirements; do not expose UI until backend routes are enabled and tested.

## Phase 4: Mobile feature parity by priority

1. Public tracking and complaint details.
2. Officer safety queue and authorized status updates.
3. Compact community/scam search only if privacy and API requirements are approved.
4. Lightweight map and analytics summaries if operationally useful.
5. Chat only after Socket.IO security and message contracts are complete.
6. Keep database inspection, full analytics, developer tools, link analysis, JARVIS, and leak-monitor research on web/admin unless a separate mobile product decision is made.

## Phase 5: Verification

1. Install dependencies only in a controlled development environment.
2. Run Expo type/syntax/build checks and test on Android and iOS targets.
3. Validate login, restart, expiration, refresh, logout, complaint submission, five-file upload, rejected MIME, oversized file, tracking, detail, admin role, officer role, and notification flows.
4. Test against the shared backend with MongoDB and the ML service running.
5. Verify all endpoint response assumptions against actual server responses, not only wrapper names.

# References

[1]: https://github.com/mohithkotian/CyberGuard_App/tree/a260f55 "CyberGuard repository at the audited commit"

[2]: https://github.com/mohithkotian/CyberGuard_App/blob/a260f55/mobile-app/src/navigation/AppNavigator.js "CyberGuard mobile navigation"

[3]: https://github.com/mohithkotian/CyberGuard_App/blob/a260f55/mobile-app/src/services/api.js "CyberGuard mobile API client"

[4]: https://github.com/mohithkotian/CyberGuard_App/blob/a260f55/backend/src/server.js "CyberGuard backend route mounts"
