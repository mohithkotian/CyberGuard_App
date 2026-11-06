# CyberGuard Incident Classification Taxonomy & Labeling Guidelines

**Document Version:** 2.0  
**Effective Date:** November 2026  
**Status:** Canonical Reference Standard  

This document defines the strict inclusion and exclusion boundaries for the 13 canonical cybercrime incident categories in the CyberGuard classification framework.

---

## 1. Classification Principles

1. **Specific Over General:** When an incident matches a specialized category (e.g., cryptocurrency investment fraud), classify under the specialized class (`crypto_fraud`) rather than the broader class (`online_fraud` or `financial_fraud`).
2. **Primary Intent / Harm:** The label must reflect the core mechanism of harm or intrusion. An incident involving an infostealer malware that steals passwords belongs to `hacking`, whereas extortion demanding payment for a decryptor belongs to `ransomware`.
3. **Safety Priority:** Incidents involving direct gender-based violence, intimate extortion (NCII), or threats to women belong to `women_child_safety`. Any sexual solicitation, grooming, or abuse of minors belongs strictly to `child_exploitation`.

---

## 2. Category Definitions, Inclusions, and Exclusions

### 1. `phishing`
* **Definition:** Deceptive communication designed to trick victims into disclosing credentials, financial credentials, or private information via spoofed portals or social engineering lures.
* **Includes:** Spear-phishing emails, smishing (SMS), vishing (voice calls pretending to be bank/tech support), fake login landing pages (Microsoft 365, Google, banking), fake OTP verification portals.
* **Excludes:** Direct unauthorized debits without credential lures (`financial_fraud`); marketplace fake goods (`online_fraud`).

### 2. `financial_fraud`
* **Definition:** Direct unauthorized monetary theft, banking fraud, payment card compromise, or fraudulent account debits.
* **Includes:** Unauthorized IMPS/NEFT/RTGS debits, UPI fraudulent collect requests, malicious QR code debit scams, credit/debit card cloning, skimming, unauthorized ATM withdrawals, SIM swap fraud directly tied to bank drainage.
* **Excludes:** Crypto wallet draining or DeFi rugpulls (`crypto_fraud`); marketplace non-delivery where buyer willingly paid for a listing (`online_fraud`).

### 3. `identity_theft`
* **Definition:** Unauthorized acquisition and misuse of an individual's personal identity or credentials to impersonate them or secure fraudulent services.
* **Includes:** Forged Aadhaar/PAN loan applications, synthetic identity creation, impersonating military/law-enforcement personnel to build trust, fraudulent digital signature certificate (DSC) acquisition, unauthorized opening of bank accounts or SIM cards in another person's name.
* **Excludes:** Deepfake sexual morphing of victims (`women_child_safety`); simple credential theft via phishing (`phishing`).

### 4. `cyberbullying`
* **Definition:** Online harassment, toxic trolling, defamation, public humiliation, or coordinated abuse among peers or in general public forums.
* **Includes:** Defamatory social media campaigns, fake chat leaks, coordinated harassment on Reddit/X, workplace smear campaigns, doxxing of addresses without physical stalking threats.
* **Excludes:** Gender-based sexual violence, rape threats, and intimate image extortion (`women_child_safety`); grooming or sexual solicitation of minors (`child_exploitation`).

### 5. `hacking`
* **Definition:** Unauthorized intrusion, exploit execution, malware infection, vulnerability exploitation, or unauthorized system modification.
* **Includes:** Server compromises, SQL injection, zero-day exploits, web defacement, infostealer malware (RedLine, Vidar), keyloggers, mobile spyware (Pegasus-style), kernel rootkits, Remote Access Trojans (RATs), container breakouts.
* **Excludes:** File encryption accompanied by extortion/ransom notes (`ransomware`); volumetric network traffic attacks (`network_attacks`).

### 6. `ransomware`
* **Definition:** Malicious software that restricts access to files or computing systems via cryptographic encryption and demands ransom payment for recovery.
* **Includes:** LockBit, BlackCat, Ryuk, WannaCry infections, ESXi host encryption, double extortion schemes where attackers encrypt storage arrays and threaten darknet leaks for non-payment.
* **Excludes:** Non-encrypting malware, pure data theft, adware, botnets, cryptominers, or keyloggers (`hacking`).

### 7. `data_breach`
* **Definition:** Unauthorized release, exposure, exfiltration, or darknet posting of bulk confidential records from an organization or database.
* **Includes:** Leaked customer databases, medical records dumps, biometric data exposures, exposed cloud storage buckets containing PII, corporate merger document leaks.
* **Excludes:** Individual user credential compromise via phishing (`phishing`); individual device malware infections (`hacking`).

### 8. `online_fraud`
* **Definition:** Commercial deception, deceptive online commerce, counterfeit services, and fraudulent transactional listings.
* **Includes:** Fake e-commerce websites, non-delivery of purchased goods, counterfeit appointment/recruitment letters, fake visa processing fees, vacation package booking scams, apartment rental listing scams, fake courier parcel redelivery fees.
* **Excludes:** Direct unauthorized bank debits via malicious QR codes (`financial_fraud`); crypto investment scams (`crypto_fraud`); matrimonial fraud (`women_child_safety`).

### 9. `child_exploitation`
* **Definition:** Any cyber-enabled sexual solicitation, grooming, distribution of illicit media, or predatory abuse involving minors.
* **Includes:** Child Sexual Abuse Material (CSAM) distribution, grooming across gaming lobbies (Roblox, Discord), online pedophilic extortion of teenagers, coercion of minors into sharing explicit media.
* **Excludes:** General peer bullying in schools without sexual abuse (`cyberbullying`).

### 10. `women_child_safety`
* **Definition:** Gender-based online violence, intimate extortion, non-consensual sexual imagery, persistent cyberstalking of women, and matrimonial deception.
* **Includes:** Non-Consensual Sharing of Intimate Images (NCII) / "revenge porn", AI deepfake pornographic morphing of women, persistent physical/online cyberstalking with geolocation tracking, rape or acid attack threats, matrimonial website scams (Shaadi.com / Jeevansathi frauds).
* **Excludes:** General peer defamation (`cyberbullying`); CSAM involving minors (`child_exploitation`).

### 11. `network_attacks`
* **Definition:** Attacks targeting network infrastructure, routing protocols, perimeter security, or service availability via traffic volume or protocol abuse.
* **Includes:** Distributed Denial of Service (DDoS), SYN flood, UDP amplification, DNS cache poisoning, BGP route hijacking, SSL stripping Man-in-the-Middle (MitM) attacks.
* **Excludes:** Web application vulnerabilities like SQL injection (`hacking`).

### 12. `crypto_fraud`
* **Definition:** Fraudulent schemes, smart contract exploits, or social engineering specifically involving cryptocurrencies, blockchain assets, or Web3 platforms.
* **Includes:** Fake crypto exchanges, DeFi liquidity rugpulls, fake smart contract permit draining, airdrop phishing draining crypto wallets, fake celebrity YouTube doubling streams, pump-and-dump token scams.
* **Excludes:** Standard fiat currency bank fraud (`financial_fraud`).

### 13. `other`
* **Definition:** Non-cybercrime communications, IT helpdesk inquiries, portal usability feedback, general awareness inquiries, or out-of-scope non-actionable text.
* **Includes:** Hardware issues (printers, cables), operating system upgrade help, Wi-Fi router password inquiries, forgotten password reset inquiries, cyber safety pamphlet requests, website feedback.
* **Excludes:** Any actionable cyber incident matching categories 1–12.
