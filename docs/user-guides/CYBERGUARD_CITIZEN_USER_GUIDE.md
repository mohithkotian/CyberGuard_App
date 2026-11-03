# CyberGuard — Citizen User Guide

> **Emergency?** Call immediately — do not wait to file an online report.
> - **National Cybercrime Helpline (Golden Hour — financial fraud):** `1930`
> - **National Emergency (Police / Fire / Ambulance):** `112`
> - **Women Cyber Distress Helpline:** `1091`
> - **National Childline:** `1098`

Welcome to **CyberGuard**, an advanced cybercrime intelligence and incident management platform designed to help citizens report cybercrimes, preserve digital evidence, and collaborate directly with authorized law enforcement officers and bank nodal authorities across India.

---

## 1. What CyberGuard Is

CyberGuard is a full-stack digital portal that bridges victims of cyber incidents, law enforcement officers, and financial institutions. It structures citizen statements into legally valid electronic dossiers under the **Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023** and **Bharatiya Sakshya Adhiniyam (BSA), 2023**, enabling rapid investigation and golden-hour asset preservation.

---

## 2. What Problems CyberGuard Solves

1. **Confusion During Reporting:** Victims often struggle to know what details police need (e.g., UTR vs UPI ID, timestamps, sender headers).
2. **Delayed Golden-Hour Intervention:** Siphoned funds are rapidly laundered through multi-layered mule accounts within hours. CyberGuard accelerates bank nodal lien requisitions under Section 106/107 BNSS.
3. **Inadmissible Digital Evidence:** Screenshots and digital logs often lack forensic chain-of-custody. CyberGuard enforces SHA-256 integrity hashing and Section 63 BSA compliance.
4. **Lack of Transparency:** Citizens rarely receive updates after lodging a cyber report. CyberGuard provides end-to-end tracking from submission to FIR and judicial charge sheet filing.

---

## 3. Who Uses CyberGuard

- **Citizens (Victims & Informants):** Report incidents, track status, analyze suspicious links/SMS, and receive safety alerts.
- **Investigating Officers (Cyber Police):** Review dossiers, verify evidence hashes, dispatch statutory directives, and consolidate interstate syndicates.
- **Bank & Telecom Nodal Officers:** Receive automated, cryptographically signed freeze notices and CDR preservation directives.
- **System Administrators:** Monitor platform health, machine learning threat models, and access security audits.

---

## 4. How to Register and Log In

1. Navigate to the CyberGuard homepage (`/`).
2. Click **Register** (`/register-choice` or `/register`).
3. Select your role as **Citizen**.
4. Enter your full name, email address, 10-digit mobile number, and secure password.
5. Once registered, log in at `/login`.
6. You will be redirected to your **Citizen Dashboard** (`/dashboard`).

---

## 5. How to Report a Cybercrime

1. Click **Report Incident** in the navigation bar or top banner (`/submit`).
2. Notice **Onee — CyberGuard Assistant** in the bottom-right corner. Onee guides you through each field step by step.
3. Fill in each section as Onee highlights it:
   - **Incident Category & Sub-Category**
   - **Incident Details & Date/Time**
   - **Financial Loss & UTR Reference** (if money was lost)
   - **Evidence & Forensic Attachments**
   - **Declaration & Review**
4. Click **Submit Report**.
5. You will immediately receive a unique **Case ID** (e.g. `CG-2026-XXXX`).

---

## 6. What Information to Enter

| Field | Description | Where to Find It | Why It Is Mandatory |
|---|---|---|---|
| **Incident Title** | Short summary (min 5 characters), e.g. "Unauthorized UPI debit via fake electricity SMS". | Incident overview. | Identifies case subject for police triage. |
| **Category** | Primary statutory category (Financial Fraud, Phishing, Ransomware, Identity Theft, Women/Child Safety, etc.). | Dropdown menu. | Routes case to specialized police cell. |
| **Incident Date/Time** | Exact date and time when the transaction or threat took place. | Bank SMS, call log, chat timestamp. | Establishes police jurisdiction under BNSS 173. |
| **Financial Loss (INR)** | Exact amount debited in Indian Rupees. | Bank passbook or banking app. | Mandatory for inter-bank freeze requisitions. |
| **UTR / RRN Reference** | 12-digit Unique Transaction Reference for UPI/IMPS/NEFT transfers. | Bank debit SMS or transfer receipt. | **Critical:** Banks cannot freeze stolen funds without the UTR. |
| **Suspect Point of Contact** | Suspect phone number, UPI handle (`fraud@upi`), Telegram username, or website URL. | Caller ID, message sender, payment app. | Cross-referenced against national fraud syndicates. |
| **Narrative Description** | Detailed chronological statement (min 20 characters). | Your factual account. | Foundation of police statement under BNSS 173. |

> **Tip:** You can open Onee Assistant's **Draft Helper** tab to auto-generate a structured, professional incident description from your confirmed facts.

---

## 7. How to Upload Evidence

- **Supported Formats:** JPG, JPEG, PNG, WEBP, PDF, MP4, and TXT.
- **Limits:** Maximum 5 files (or 4 files if attaching National ID proof); maximum 10MB per file.
- **Best Practices:**
  - Take **full, unedited screenshots** that include the battery bar, timestamp, sender handle, and URL.
  - Export chat conversations without modifying or renaming files.
  - Upload PDF account statements downloaded directly from your bank.
- **Privacy Precautions:**
  - **NEVER upload passwords, ATM PINs, UPI PINs, or CVV numbers.**
  - If uploading Aadhaar, please mask the first 8 digits.

---

## 8. How to Use Scam Search and Forensic Scanner

### Scam Search (`/scam-search`)
Before making payments or responding to unknown callers:
1. Enter the suspect's phone number, UPI ID, or URL into Scam Search.
2. View community incident reports and verified risk ratings.
3. Report newly discovered scam handles to protect other citizens.

### Forensic Scanner (`/forensic-scanner`)
1. Paste suspicious SMS messages, email bodies, or website links.
2. The scanner extracts urgency triggers, suspicious payment gateways, and impersonation flags.
3. Use the **Pre-fill Complaint** button to transfer scan results directly into a new report.

---

## 9. How to Track a Complaint

1. Click **Track Complaint** (`/track`) in the navigation bar.
2. Enter your **Case ID** (sent to your registered email and mobile upon submission).
3. View the live investigation timeline:
   - **Pending:** Received in nodal dispatch queue.
   - **Under Investigation:** Assigned to an Investigating Officer (IO).
   - **Action Initiated:** Inter-bank lien freeze notices (BNSS 106/107) or telecom directives issued.
   - **FIR Registered:** Formal First Information Report filed under BNSS Section 173.
   - **Charge Sheet Filed:** Investigation concluded and submitted to the jurisdictional magistrate.

---

## 10. What Officer-Facing Features Do

Authorized police officers utilize specialized internal tools:
- **Evidence Vault:** Verifies SHA-256 tamper-proof file hashes and generates statutory Section 63 BSA electronic evidence certificates.
- **Bank Nodal Directory:** Automatically generates Section 106/107 BNSS fund preservation notices dispatched directly to beneficiary banks.
- **Telecom Requisitions:** Generates Section 20 Telecommunications Act subscriber and CDR preservation notices.
- **Link & Syndicate Analysis:** Graph networks clustering multi-state mule accounts and suspect phone numbers.

---

## 11. What CyberGuard Can and Cannot Do

### What CyberGuard CAN Do:
- Rapidly structure and transmit legally compliant electronic complaints to cyber police cells.
- Calculate statutory timelines and golden-hour asset preservation notices.
- Preserve cryptographic chain of custody for digital evidence.
- Provide real-time tracking of case milestones.

### What CyberGuard CANNOT Do:
- **It is not an immediate emergency rescue service.** If you are in immediate physical danger, dial **112**.
- **It does not directly execute bank fund reversals.** Fund reversals require statutory magistrate orders under Section 503 BNSS.
- **It does not provide private confidential bank balances or officer personal contacts.**
- **Onee Assistant is an automated guidance guide**, not an authorized police officer or judge.

---

## Emergency Numbers Across India

- **National Cybercrime Helpline (Financial Fraud Golden Hour):** `1930`
- **National Emergency Number (Police / Fire / Ambulance):** `112`
- **Women Cyber Distress Helpline:** `1091`
- **National Childline:** `1098`

