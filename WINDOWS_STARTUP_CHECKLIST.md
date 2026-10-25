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

Open the web app at:

```text
http://localhost:3000
```

## Correct startup order

```text
1. MongoDB
2. ML service — port 5003
3. Backend API — port 5002
4. React web app — port 3000
```

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
