# CyberGuard — Windows Local Run Checklist

Project folder:

```text
C:\Users\Mohith\CyberGuard_App
```

## First-time setup

Run each section once in PowerShell.

### Terminal 1 — Backend dependencies

```powershell
cd C:\Users\Mohith\CyberGuard_App\backend
npm install
```

### Terminal 2 — ML service environment and dependencies

```powershell
cd C:\Users\Mohith\CyberGuard_App\ml-service
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r ..\requirements.txt
```

The repository's dependency file is located at:

```text
C:\Users\Mohith\CyberGuard_App\requirements.txt
```

The ML model files are expected under:

```text
C:\Users\Mohith\CyberGuard_App\ml-service\models
```

Do not run `train_model.py` unless the ML service reports that the model is missing.

### Terminal 3 — React dependencies

```powershell
cd C:\Users\Mohith\CyberGuard_App\web-app
npm install
```

## MongoDB

Check whether the MongoDB Windows service is running:

```powershell
Get-Service MongoDB
```

If the status is `Stopped`, open PowerShell as Administrator and run:

```powershell
net start MongoDB
```

The backend normally connects using the MongoDB URL in:

```text
C:\Users\Mohith\CyberGuard_App\backend\.env
```

## Every-time startup

Start MongoDB first, then open three PowerShell terminals.

### Terminal 1 — Backend API

```powershell
cd C:\Users\Mohith\CyberGuard_App\backend
npm run dev
```

Backend URL:

```text
http://localhost:5002
```

### Terminal 2 — Python ML service

```powershell
cd C:\Users\Mohith\CyberGuard_App\ml-service
.\.venv\Scripts\Activate.ps1
python src\app.py
```

ML service URL:

```text
http://localhost:5003
```

Optional health check:

```powershell
Invoke-RestMethod http://localhost:5003/health
```

### Terminal 3 — React web app

```powershell
cd C:\Users\Mohith\CyberGuard_App\web-app
npm start
```

Web app URL:

```text
http://localhost:3000
```

### Terminal 4 — Expo mobile app (React Native)

```powershell
cd C:\Users\Mohith\CyberGuard_App\mobile-app
npx expo start -c
```

Metro bundler URL:

```text
http://localhost:8081
```

#### Complete iOS / iPhone Startup & Commands:

1. **Local Wi-Fi Mode (Recommended):**
   ```powershell
   npx expo start -c
   ```
   - Open the **Camera app** on your iPhone.
   - Point the lens at the QR code in your terminal.
   - Tap the yellow pop-up banner: **"Open in Expo Go"**.

2. **Safari Direct Deep-Link (If QR doesn't trigger):**
   - Open **Safari** on your iPhone.
   - Type or paste: `exp://192.168.1.148:8081` (replace with your active Wi-Fi IP from `ipconfig`).
   - Tap **Open** when prompted to launch Expo Go.

3. **Cloud Tunnel Mode (When testing across different Wi-Fi / Hotspot):**
   ```powershell
   npx expo start --tunnel
   ```
   - Creates a public proxy tunnel (`exp://*.exp.direct`) that routes through firewalls.

4. **Offline Local Dev Mode:**
   ```powershell
   npx expo start --offline
   ```

5. **Fixing iOS Expo Go Account Mismatch:**
   - **Error:** `iOS ERROR: You're signed in to Expo Go as 'mohithkotian', but not signed in to Expo CLI`
   - **Quick Fix:** On your iPhone, open the **Expo Go** app → Tap the **Profile / Settings** icon in the top right → Tap **Sign Out**. Now scan the QR code again in anonymous local mode without any account restriction.
   - **CLI Login Alternative:** Run `npx expo login` in your terminal to authenticate your PC with the same account.

- Note: Standalone iOS `.ipa` builds require Apple Developer credentials and cloud EAS:
  ```powershell
  npx eas-cli build --platform ios
  ```

## Correct startup order

```text
1. MongoDB (Port 27017)
2. ML service — Port 5003
3. Backend API — Port 5002
4. React web app — Port 3000
5. Mobile app (Expo) — Port 8081/8082
```

## Demo accounts for testing

| Role | Email | Password | Scope |
|---|---|---|---|
| **Citizen (Demo)** | `citizen@test.com` | `Citizen@123` | File & track complaints, browse public radar |
| **Police Officer** | `officer@cyberguard.gov` | `Officer@123` | Investigation desk, status updates, live radar |
| **Cyber Admin** | `admin@cyberguard.gov` | `Admin@12345` | Global admin dashboard, user management |

## Important commands

Do not use `npm run dev` for the React app. This project uses:

```powershell
npm start
```

The main service files are:

```text
C:\Users\Mohith\CyberGuard_App\backend\src\server.js
C:\Users\Mohith\CyberGuard_App\ml-service\src\app.py
C:\Users\Mohith\CyberGuard_App\web-app\package.json
```

## Troubleshooting

If the backend reports `ECONNREFUSED 127.0.0.1:5003`, start the ML service or check `ML_SERVICE_URL` in:

```text
C:\Users\Mohith\CyberGuard_App\backend\.env
```

It should point to:

```env
ML_SERVICE_URL=http://127.0.0.1:5003
```

If the backend reports `MongoServerSelectionError`, start MongoDB and check `MONGO_URI` in the backend `.env` file.
