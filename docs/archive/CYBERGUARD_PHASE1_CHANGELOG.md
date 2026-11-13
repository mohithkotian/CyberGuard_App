# CyberGuard Phase 1 Changelog

**Phase:** Shared Backend + Web + Mobile Stabilization  
**Repository:** `mohithkotian/CyberGuard_App`  
**Branch baseline:** `main` at `a260f55`  
**Scope:** Authentication contract, registration security, mobile API configuration, complaint detail, submission flow, role compatibility, push-token registration, and basic mobile error/session handling.

No Socket.IO/mobile-chat implementation, advanced mobile feature, broad UI redesign, or new database architecture was added.

## 1. Files changed

| File | Reason |
|---|---|
| `backend/src/controllers/authController.js` | Force public registrations to the normal `user` role and implement refresh-token validation/rotation. |
| `mobile-app/src/services/api.js` | Replace the temporary tunnel default with Expo-configurable public API URL handling and add the push-token wrapper. |
| `mobile-app/src/hooks/useAuthStore.js` | Validate persisted sessions with `/api/auth/me`, clear invalid sessions, preserve offline state on network failure, and trigger push registration only after authentication. |
| `mobile-app/App.js` | Remove pre-auth push-token registration from application startup. |
| `mobile-app/src/screens/ComplaintDetailScreen.js` | Add missing imports and the navigation prop required by the existing screen. |
| `mobile-app/src/screens/SubmitComplaintScreen.js` | Remove the intermediate-step Quick Submit action so submission occurs only from Review. |
| `mobile-app/src/screens/AdminScreen.js` | Prevent officers from calling/rendering admin-only system and ML panels; preserve shared analytics and complaint-status behavior. |
| `mobile-app/.env.example` | Document the public Expo API URL configuration without secrets. |
| `mobile-app/README.md` | Explain development/staging/production API URL setup and prohibit backend secrets in the mobile project. |

Existing audit reports were not rewritten as part of Phase 1. No `.env` file, secret, database credential, JWT secret, or API key was added.

## 2. Bugs fixed

### Public registration role escalation

The backend previously destructured `role` from the public registration request and passed it into `User.create`. The controller now ignores any caller-supplied role and explicitly creates public registrations with `role: 'user'`. Existing admin/officer records are not modified.

### Refresh-token placeholder

The backend refresh controller previously returned a success message without validating a token. It now:

1. Requires a submitted refresh token.
2. Verifies it with `JWT_REFRESH_SECRET` or the existing JWT fallback.
3. Loads the active user and selected stored refresh token.
4. Rejects missing, mismatched, invalid, expired, or inactive sessions with `401`.
5. Issues a new access token and refresh token through the existing `generateTokens` helper.
6. Stores the rotated refresh token on the user.
7. Returns the user summary plus `data.accessToken` and `data.refreshToken`, matching both web and mobile client expectations.

Logout behavior remains based on clearing the stored refresh token and blacklisting the access token.

### Mobile stale-session hydration

Mobile hydration previously trusted locally persisted user/token values indefinitely. It now calls `/api/auth/me` when local session values exist. A `401` clears the stored session. A successful request refreshes the stored user and captures any access token updated by the Axios refresh interceptor. A non-401 network failure preserves the local session so temporary connectivity loss does not create a navigation loop.

### Mobile API configuration

The mobile client now reads `EXPO_PUBLIC_API_URL`, with `API_URL` retained as a compatibility fallback. Production builds throw a configuration error instead of silently using a development URL. Development falls back to `http://localhost:5002/api`, and `.env.example` documents that a physical device should use a reachable LAN/staging URL.

The temporary localtunnel URL was removed from source.

### Complaint detail runtime crash

`ComplaintDetailScreen` used `SafeAreaView`, `TouchableOpacity`, and `navigation` without importing or receiving them. The existing layout and identifier-selection logic were preserved; the missing imports and `{ navigation }` prop were added.

### Premature complaint submission

`SubmitComplaintScreen` exposed a `Quick Submit` button on the Details, Victim Information, and Evidence steps. That button called the final submit handler before review. It was removed. The existing four-step flow now presents the final submit action only on the Review step.

### Admin/officer mismatch

The existing role gate intentionally allows both admins and officers into the mobile Admin tab. The backend, however, restricts `/api/admin/*` to admins while allowing officers to use analytics and complaint status routes. The screen now calls system/ML admin endpoints only for `user.role === 'admin'` and hides the placeholder system-protocol and admin system panels from officers. Backend authorization was not weakened.

### Push-token registration

`notifications.js` attempted to call an undefined `authAPI.registerPushToken` method. The wrapper now calls `POST /api/users/push-token` with `{token}`. Registration is triggered after login, registration, and successful authenticated hydration. Startup no longer requests a push token before authentication. Push registration remains non-critical and failures are intentionally suppressed after the authentication flow has already succeeded.

## 3. API contract changes

### `POST /api/auth/register`

The request may still contain an arbitrary `role` field, but the server ignores it for public registration. The response contract is unchanged.

### `POST /api/auth/refresh`

The endpoint now requires:

```json
{
  "refreshToken": "<stored refresh token>"
}
```

Successful response:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "role": "user"
    },
    "accessToken": "<new access token>",
    "refreshToken": "<new refresh token>"
  }
}
```

Invalid, expired, missing, mismatched, or inactive-user refresh tokens return `401` through the existing error handler.

### `POST /api/users/push-token`

The mobile client now uses the existing backend endpoint with:

```json
{
  "token": "<Expo push token>"
}
```

The backend stores it in the authenticated `User.notificationTokens` array.

## 4. Web impact

The web client already used the same refresh request and response fields, so the backend implementation now satisfies the existing web interceptor contract. Web registration continues to work for ordinary users and cannot assign a privileged role through the public request body.

The web client still contains wrappers for disabled OTP/2FA routes, but those routes were outside this phase and were not enabled. Existing web Socket.IO behavior was not changed.

The web client continues to use backend-enforced admin/officer permissions. No backend authorization was relaxed to accommodate mobile.

## 5. Mobile impact

Mobile now has:

- Server-controlled public registration role.
- Refresh-token rotation compatible with the existing Axios interceptor.
- Authenticated hydration through `/api/auth/me`.
- Invalid-session cleanup without an intentional navigation loop.
- Configurable API URL for development/staging/production.
- Working complaint-detail imports/back navigation contract.
- Review-gated complaint submission.
- Admin-only system/ML panel handling.
- Push-token API wrapper and post-auth registration attempt.

Mobile still does not implement chat, Socket.IO, advanced notifications, profile editing, password settings, camera capture, or advanced administrative features. Those remain outside Phase 1.

## 6. Tests and checks executed

| Check | Result |
|---|---|
| `node --check` over all `backend/src` and mobile JavaScript files | Passed |
| Python `py_compile` over ML service files | Passed |
| `git diff --check` | Passed |
| Secret-file scan for non-example `.env` files | No non-example `.env` files found |
| Backend Jest suite | Not run: backend dependencies are not installed and no application test files were found |
| Web build/test | Not run: web dependencies are not installed |
| Expo/mobile build or device test | Not run: mobile dependencies are not installed and no emulator/device is attached |
| MongoDB integration test | Not run: no database service was started |
| ML-service integration test | Not run: no ML service was started |
| Full refresh/login/complaint runtime flow | Not run: required dependencies and services are unavailable |

The successful syntax checks do not prove runtime or device behavior. In particular, multipart upload, Expo environment substitution, JWT rotation against MongoDB, and navigation rendering require dependency-backed testing.

## 7. Remaining blockers

1. **Runtime validation is still required.** Dependencies, MongoDB, and the ML service were not installed or started.
2. **Mobile development URL requires environment setup.** A physical device must receive a reachable LAN/staging URL through `EXPO_PUBLIC_API_URL`; the development fallback is only suitable for an emulator running alongside the backend.
3. **Push delivery is not a complete notification system.** Token registration is wired, but notification inbox state, response listeners, navigation, and server delivery remain future work.
4. **Socket.IO remains unauthenticated.** This was documented and deliberately not expanded in Phase 1.
5. **Mobile complaint detail remains intentionally minimal.** Evidence, assigned officer, action taken, chat, and richer complaint fields are future work.
6. **Mobile profile/settings remain incomplete.** Existing backend profile/password endpoints are not exposed in this phase.
7. **The backend deployment entry-point inconsistency identified in the earlier audit remains unchanged because deployment configuration was explicitly outside this phase.**
8. **Public static upload authorization remains a backend security follow-up.** It was not part of the listed Phase 1 stabilization changes.

## 8. Socket.IO follow-up required

The dedicated Chat phase should:

1. Add Socket.IO handshake authentication using the same JWT verification rules as REST `protect`.
2. Reject expired, blacklisted, invalid, missing, or inactive-user socket sessions.
3. Authorize `join-chat` against complaint ownership, assigned officer, and admin role.
4. Restrict `join-admin` to admins.
5. Restrict `join-room`/`join-user` so a client cannot subscribe to another user's room.
6. Validate sender identity for `private-message` instead of trusting client-provided sender data.
7. Apply authorization to `chat-message` and `global-message` event paths.
8. Define one message/attachment encryption contract shared by web and mobile.
9. Add server-side rate limits, payload validation, disconnect cleanup, and client reconnection behavior.
10. Only then add mobile chat screens and notification navigation.

## 9. Recommended Phase 2

Proceed to a dedicated **Chat and Notifications** phase only after installing dependencies and exercising the Phase 1 authentication and complaint flows against MongoDB and the ML service. Phase 2 should begin with Socket.IO authentication/authorization and a shared message contract, followed by mobile chat, notification listeners, push delivery, and notification navigation. Do not begin advanced mobile intelligence or UI redesign before those shared contracts are stable.
