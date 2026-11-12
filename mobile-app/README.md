# 🛡️ CyberGuard Mobile App — Startup & Architecture Guide

Native iOS & Android mobile application for the **CyberGuard National Cybercrime Reporting & Forensics Platform**, built with **React Native (Expo SDK 58)**.

---

## ⚡ 1. Quick Start Guide

### Prerequisites
* **Node.js** (v18 or higher)
* **Expo Go** app installed on your iPhone ([App Store](https://apps.apple.com/app/expo-go/id982107779)) or Android ([Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent))
* Phone and computer connected to the same Wi-Fi network

### Step 1: Ensure Backend is Running
In your root terminal:
```powershell
cd c:\Users\Mohith\CyberGuard_App\backend
npm run dev
```
*Backend listens on port `5002`.*

### Step 2: Configure Local IP
Verify your machine's local Wi-Fi IP address:
```powershell
Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Select-Object IPAddress
```
In `mobile-app/.env`, ensure `EXPO_PUBLIC_API_URL` matches your local IP:
```env
EXPO_PUBLIC_API_URL=http://<YOUR_WIFI_IP>:5002/api
```
*(Example: `http://192.168.1.148:5002/api`)*

### Step 3: Launch Expo Dev Server
In a new terminal:
```powershell
cd c:\Users\Mohith\CyberGuard_App\mobile-app
npx expo start -c
```

---

## 📱 2. How to Open on Your Device

### On iPhone (iOS):
1. Ensure your iPhone is on the **same Wi-Fi network**.
2. Open your iPhone's built-in **Camera** app.
3. Point your camera at the QR code in your terminal.
4. Tap the yellow banner: **"Open in Expo Go"**.

### On Android:
1. Open the **Expo Go** app.
2. Tap **"Scan QR code"** and point it at the terminal QR code.

---

## 🔗 3. How to Make a Permanent QR Code & Standalone App

When developing locally, a local IP QR code changes whenever you switch Wi-Fi networks. Here are the 4 official ways to have **permanent access** without regenerating QR codes:

### Method A: Permanent Expo Go Bookmark (No QR Needed)
* Once you open CyberGuard **once** in Expo Go on your iPhone or Android:
* It is permanently pinned on your Expo Go Home Screen under **"Recently in Development"** / **"Projects"**.
* Every subsequent time, simply tap **CyberGuard** inside the Expo Go app. You **never** need to scan the QR code again.

### Method B: Standalone Android APK (100% Standalone & Permanent)
* We have pre-compiled a release APK via EAS Cloud. It is an independent, native Android application that installs directly on any phone without requiring Expo Go, Node.js, or a running PC:
* 📥 **[Download CyberGuard Standalone APK](https://expo.dev/artifacts/eas/wjQx3Mwfza_lLAb3vUbcAj2ezQ3hqDo9oodhtGXk1XM.apk)**
* You can generate a permanent QR code pointing to this direct download URL. Anyone who scans it downloads and installs the app permanently.

### Method C: Global Cloud Tunnel (`--tunnel`)
* If you want a QR code that works **outside your house** (on cellular 5G/4G, coffee shop Wi-Fi, or office networks):
```powershell
npx expo start --tunnel
```
* Generates an `exp://*.exp.direct` cloud tunnel URL that bypasses all local firewall, subnet, and router restrictions.

### Method D: EAS Cloud Hosted Update (Permanent Project Link)
* Publishing an EAS update gives your project a permanent `expo.dev` cloud QR code:
```powershell
npx eas-cli update --branch production --message "Release build"
```
* This creates a permanent URL: `https://expo.dev/@mohithkotian/cyberguard-app` that always serves the latest JavaScript bundle.

---

## 👥 4. Pre-Seeded Working Accounts

Tap any of the 1-tap quick login buttons on the **Profile / Sign In** screen:

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Citizen** | `citizen@test.com` | `Citizen@123` | File cases, track dockets, scam search, community radar, encrypted comms |
| **Officer** | `officer@cyberguard.gov` | `Officer@123` | Master telemetry overview, investigation notes, incident triage |
| **Admin** | `admin@cyberguard.gov` | `Admin@12345` | Full system access, account control, forensic dockets |
| **Admin Alt** | `admin@cybercrime.gov` | `Admin@123456` | Master administrative root access |

---

## 🧭 5. Core Screens & Capabilities

1. **Dashboard (`HomeScreen.js`):**
   * Live incident stream with search & status filter pills (`All`, `Pending`, `Under Review`, `Investigating`, `Resolved`).
   * Emergency **SOS 1930** national cyber fraud direct-dial button.
   * Real-time telemetry: Total Cases, In Triage, Resolved, and 97.4% Detection Accuracy.
2. **File Incident (`SubmitComplaintScreen.js`):**
   * 4-step wizard: Incident Details → Suspect Info → Evidence Upload → Review & File.
   * PII Privacy Shield and ML auto-classification.
   * Multi-file document and photo evidence attachment.
3. **Track Case (`TrackScreen.js`):**
   * Real-time docket lookup by Case ID.
   * Pre-configured quick demo chips: `CMP-628504`, `CMP-888328`, `CMP-873967`, `CMP-299430`.
4. **Scam Radar (`ScamSearchScreen.js`):**
   * Instant verification of suspect phone numbers, UPI handles, bank accounts, and URLs against verified threat records.
5. **Forensics Scanner (`ForensicScannerScreen.js`):**
   * Paste suspicious SMS, emails, or job offers for automated regex IOC extraction (phones, UPIs, URLs) and risk scoring.
6. **Threat Radar (`ThreatRadarScreen.js`):**
   * National cyber threat telemetry and category distribution breakdown.
7. **Secure Comms (`GlobalChatScreen.js`):**
   * Encrypted community communication feed with role badges and optimistic messaging.

---

## 🛠️ 6. Troubleshooting

| Issue | Root Cause | Solution |
|---|---|---|
| **`Network response timed out`** | Computer Wi-Fi IP changed | Run `Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*"` and update `mobile-app/.env`. |
| **`Port 8081 is already in use`** | Previous bundler process was not stopped | Press `Ctrl + C` in the terminal, or run `npx expo start -c` to clear cache and switch ports. |
| **`You need to be signed in to Expo Go`** | Account mismatch on iOS Expo Go | Ensure `npx expo start -c` is run without `--offline`, or log in via `npx expo login`. |
| **`AxiosError: 403 Forbidden`** | Non-admin querying officer telemetry | Fixed: App automatically routes citizens to the public `/api/complaints/public/radar` endpoint. |
