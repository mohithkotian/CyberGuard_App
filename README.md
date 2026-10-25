# CyberGuard AI — Cybercrime Reporting & Forensic Intelligence Platform

[![AI Powered](https://img.shields.io/badge/AI-Machine%20Learning-blueviolet?style=flat-square)](https://github.com)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green?style=flat-square)](https://nodejs.org)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Three.js-cyan?style=flat-square)](https://reactjs.org)
[![Python ML](https://img.shields.io/badge/ML%20Service-Python%20%7C%20Flask%20%7C%20scikit--learn-yellow?style=flat-square)](https://python.org)
[![Security](https://img.shields.io/badge/Security-AES%20%7C%20PII%20Masking%20%7C%20Zero--Trust-red?style=flat-square)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)](#license)

---

## Overview

CyberGuard AI is an AI-powered cybercrime complaint reporting, investigation, and threat intelligence system. It follows a **zero-trust, role-based privacy architecture**: personal identifiable information (PII) is automatically detected and masked, forensic indicators are extracted from evidence via OCR, incidents are classified using an NLP model, and real-time intelligence is delivered to citizens, forensic investigators, and law enforcement agencies.

---

## Key Features

- **AI Cybercrime Classification** — automated NLP categorization into 11 attack vectors (financial fraud, phishing, ransomware, cyberbullying, hacking, identity theft, and others).
- **Zero-Trust Role-Based Privacy Architecture**
  - **Complaint Owner** — full unmasked access to their own filing.
  - **Officer / Admin** — raw case data, forensic link-analysis graphs, and investigation tools.
  - **Community Browser** — PII automatically anonymized (`PERSON_1`, `PHONE_1`, `EMAIL_1`, `CITY_1`) for safe public browsing of threat patterns.
- **OCR Evidence Intelligence** — extraction of bank accounts, UPI IDs, transaction hashes, and phone numbers from evidence screenshots using Tesseract OCR.
- **Threat Heatmaps & Link Analysis** — geospatial attack maps and suspect relationship graphs.
- **Real-Time Communication** — Socket.IO powered notifications, status tracking, and encrypted chat channels.
- **Interactive AI Assistant** — voice-driven navigation, audio alerts, and platform monitoring.
- **Scam Search & Verification** — cross-referencing of suspect UPI IDs, phone numbers, and financial details against a verified threat database.

---

## System Architecture

### 1. High-Level Platform Architecture

```mermaid
graph TD
    subgraph Client Layer
        A[React Web App]
        B[React Native Mobile App]
    end

    subgraph Gateway and Middleware
        C[Node.js Express API Server]
        D[Socket.IO Real-Time Engine]
        E[Privacy Shield and PII Anonymizer]
    end

    subgraph Data and AI Intelligence
        F[(MongoDB Database)]
        G[Python Flask ML Engine]
        H[OCR Processing Engine]
    end

    A <-->|HTTP / WebSockets| C
    B <-->|REST APIs| C
    C <--> D
    C -->|Sanitize and Mask| E
    C <-->|Read / Write| F
    C -->|Classify Text| G
    C -->|Analyze Evidence Screenshots| H
```

### 2. Multi-Tier Role-Based Privacy & Data Masking Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Citizen / Victim
    actor OtherUser as Community Browser User
    actor Admin as Officer / Admin
    participant API as Backend Gateway
    participant Mask as Privacy Shield Engine
    participant DB as MongoDB Database

    User->>API: POST /api/complaints (Filing Incident)
    API->>Mask: Process Text and Detect PII (Aadhaar, PAN, UPI, Phone)
    Mask-->>API: Return Masked Version for model processing
    API->>DB: Store Original Raw Complaint Data

    Note over API,DB: Role-Based Retrieval Matrix

    OtherUser->>API: GET /api/complaints (Community View)
    API->>Mask: Apply Public Anonymization (PERSON_1, PHONE_1)
    API-->>OtherUser: 200 OK (Strictly Masked Data)

    User->>API: GET /api/complaints?scope=own (My Complaints)
    API-->>User: 200 OK (Original Unmasked Filing)

    Admin->>API: GET /api/complaints (Investigation Desk)
    API-->>Admin: 200 OK (Full Unmasked Data and Forensic Metadata)
```

### 3. Complaint Lifecycle & AI Classification Engine

```mermaid
stateDiagram-v2
    [*] --> Submitted : Victim files report
    Submitted --> ML_Classification : PII-masked text sent to Python ML Model
    ML_Classification --> OCR_Analysis : Evidence image uploaded
    OCR_Analysis --> Pending_Review : Category and Severity assigned

    Pending_Review --> Under_Review : Assigned to Law Enforcement Officer
    Under_Review --> Investigating : Forensics and Link Analysis active
    Investigating --> Resolved : Action Taken and Asset Recovery
    Investigating --> Rejected : Fraudulent filing or Duplicate

    Resolved --> [*]
    Rejected --> [*]
```

### 4. AI/ML Classification & OCR Pipeline

```mermaid
flowchart LR
    A[Raw Complaint Text] --> B[Text Preprocessing<br/>Tokenize, Stopword Removal, Lemmatize]
    B --> C[TF-IDF Vectorization]
    C --> D[Logistic Regression Classifier]
    D --> E[Category and Severity Output]

    F[Evidence Screenshot] --> G[Tesseract OCR Engine]
    G --> H[Pattern Extraction<br/>UPI ID, Phone, Account No, Tx Hash]
    H --> I[Forensic Indicator Store]

    E --> J[Complaint Record]
    I --> J
    J --> K[(MongoDB)]
```

### 5. Request/Data Flow Across Services

```mermaid
graph LR
    Client[React Web / Mobile Client] -->|JWT Auth| Gateway[Express API Gateway]
    Gateway -->|Rate Limited, Helmet Secured| Auth[Auth Middleware]
    Auth --> Controller[Complaint / Chat / Analytics Controllers]
    Controller -->|Text| ML[Flask ML Service :5003]
    Controller -->|Image| OCR[OCR Service]
    Controller -->|CRUD| DB[(MongoDB)]
    Controller -->|Events| Socket[Socket.IO Engine]
    Socket -->|Live Updates| Client
```

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Web** | React 18, Three.js, Recharts, Framer Motion, Axios |
| **Frontend Mobile** | React Native, Expo, React Navigation |
| **Backend Core** | Node.js, Express.js, MongoDB, Mongoose, Socket.IO |
| **AI / ML Service** | Python 3.10, Flask, scikit-learn, NLTK, TF-IDF + Logistic Regression |
| **Forensics & OCR** | Tesseract.js / Tesseract OCR, Sharp |
| **Security & Auth** | JWT, bcryptjs, Helmet, Express Rate Limit, PII Masking Shield |

---

## Repository Structure

```text
CyberGuard_App/
├── backend/                   Node.js + Express REST API server
│   ├── src/
│   │   ├── config/            Database and service connections
│   │   ├── controllers/       Complaint, Auth, Chat and Analytics logic
│   │   ├── middleware/        JWT auth and error handling
│   │   ├── models/            MongoDB schemas (Complaint, User, Chat, etc.)
│   │   ├── routes/            Express API route definitions
│   │   ├── services/          OCR, SMS, Email and ML service connectors
│   │   └── utils/             Privacy shield and PII masking utilities
│   └── src/server.js          Entry point and Socket.IO server initialization
│
├── ml-service/                Python Flask AI classification engine
│   ├── src/                   Flask API application
│   ├── models/                Pre-trained TF-IDF vectorizers and ML models
│   └── train_model.py         Model training pipeline script
├── requirements.txt           Python dependencies for the ML service
│
├── web-app/                   React web application
│   ├── public/                Static assets and voices
│   └── src/
│       ├── components/        Navbar, AI Assistant, CyberReport, Scanner
│       ├── pages/              Dashboard, Community, Admin, Forensics, Settings
│       ├── services/           API Axios client and Socket listener
│       └── hooks/               Zustand auth and theme state management
│
└── mobile-app/                React Native Expo mobile app
    └── src/                   Native screens and components
```

---

## Role-Based Access Matrix

| Feature / View | Regular User (Victim) | Community Browser | Police Officer | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| File Complaint | Yes | No | Yes | Yes |
| View Own Filings (Unmasked) | Yes | No | Yes | Yes |
| Community Browser (Masked) | Yes | Yes | Yes | Yes |
| View Other's Raw PII | No | No | Yes | Yes |
| Command Center & Forensics | No | No | Yes | Yes |
| Status Update & Resolution | No | No | Yes | Yes |
| System User Management | No | No | No | Yes |

---

## Quick Start Guide (Local Setup)

### Prerequisites
- Node.js v18+
- Python v3.10+
- MongoDB v7.0+ (local instance or MongoDB Atlas cluster)

### Step 1 — Start MongoDB

On Windows, check the MongoDB service:

```powershell
Get-Service MongoDB
```

If it is stopped, open PowerShell as Administrator and run:

```powershell
net start MongoDB
```

On macOS, use `brew services start mongodb-community@7.0`. On Linux, use `sudo systemctl start mongod`.

### Step 2 — First-time ML Service Setup

```powershell
cd C:\Users\Mohith\CyberGuard_App\ml-service
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r ..\requirements.txt
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet')"
```

The Python dependency file is at `C:\Users\Mohith\CyberGuard_App\requirements.txt`. Do not run `train_model.py` unless the service reports that the model is missing.

### Step 3 — First-time Backend Setup

```powershell
cd C:\Users\Mohith\CyberGuard_App\backend
npm install
```

The backend environment file is `backend\.env`. Confirm that `ML_SERVICE_URL` is set to:

```env
ML_SERVICE_URL=http://127.0.0.1:5003
```

### Step 4 — First-time React Web Setup

```powershell
cd C:\Users\Mohith\CyberGuard_App\web-app
npm install
```

### Step 5 — Start the ML Service

```powershell
cd C:\Users\Mohith\CyberGuard_App\ml-service
.\.venv\Scripts\Activate.ps1
python src\app.py
```

Runs on `http://localhost:5003`. Optional health check:

```powershell
Invoke-RestMethod http://localhost:5003/health
```

### Step 6 — Start the Backend Server

```powershell
cd C:\Users\Mohith\CyberGuard_App\backend
npm run dev
```

Runs on `http://localhost:5002`.

### Step 7 — Start the React Web App

```powershell
cd C:\Users\Mohith\CyberGuard_App\web-app
npm start
```

Runs on `http://localhost:3000`. Open that address in your browser.

### Optional — Start the Mobile App

```powershell
cd C:\Users\Mohith\CyberGuard_App\mobile-app
npm install
npx expo start
```

Scan the QR code with the Expo Go app on iOS or Android.

### Every-time Startup Order

```text
1. MongoDB
2. ML service — port 5003
3. Backend API — port 5002
4. React web app — port 3000
```

Do not use `npm run dev` for the React app; this project uses `npm start`.

---

## Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| Super Admin | `admin@cybercrime.gov` | `Admin@123456` |
| Police Officer | `officer@cybercrime.gov` | `Officer@123456` |
| Test User | `user@cybercrime.gov` | `User@123456` |

---

## Main API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | Public | Register new user account |
| POST | `/api/auth/login` | Public | Login and receive JWT access + refresh tokens |
| POST | `/api/complaints` | Authenticated | Submit new complaint report with evidence |
| GET | `/api/complaints?scope=own` | Authenticated | Get logged-in user's own complaints |
| GET | `/api/complaints?scope=public` | Authenticated | Get all complaints (PII masked for non-owners) |
| GET | `/api/complaints/:id` | Authenticated | Get single complaint detail (role-masked) |
| PATCH | `/api/complaints/:id/status` | Officer / Admin | Update complaint status and add timeline entry |
| GET | `/api/complaints/public/search` | Public | Search suspect phone, UPI, or account numbers |

---

## License

Distributed under the MIT License.
