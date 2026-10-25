# CyberGuard Mobile

The mobile client reads its public backend URL from `EXPO_PUBLIC_API_URL`. Copy `.env.example` to `.env` and replace `YOUR_LAN_IP` with a reachable development, staging, or production API host.

```bash
cp .env.example .env
npx expo start
```

Only the public API base URL belongs in Expo configuration. Do not place MongoDB, JWT, ML, SMTP, Twilio, Gemini, or other backend secrets in this project.

For a production build, provide `EXPO_PUBLIC_API_URL` through the build environment. Production builds do not fall back to a temporary tunnel or local development URL.
