# CyberGuard 10x Audit Verification

## 1. Threat Intelligence
Status: VERIFIED
Evidence:
- `backend/src/utils/threatIntelligence.js:50-52`: The constant `PHISHING_RAW` contains over 200 legitimate global domains, including `google.com`, `apple.com`, `microsoft.com`, `amazon.com`, `reddit.com`, `github.com`, `gitlab.com`, `icicibank.com`, `paytm.com`, `flipkart.com`, `slack.com`, `zoom.us`, and `twitter.com`.
- `backend/src/utils/threatIntelligence.js:52`: Domains are mapped directly into an in-memory set: `const PHISHING_SET = new Set(PHISHING_RAW.split(',').map(d => d.trim().toLowerCase()));`.
- `backend/src/utils/threatIntelligence.js:106-136`: The function `lookupThreat(query)` extracts the domain and checks `PHISHING_SET.has(qDomain)` as well as partial substring matches. For any match, it pushes an entry with `category: 'Phishing & Fake Domain'`, `severity: 'high'`, `riskLevel: 'critical'`, `status: 'BLOCKED'`, and description: `"Blacklisted phishing destination [${domainMatch}]. Reported in multiple credential harvesting and spoofing campaigns."`.
- `backend/src/controllers/complaintsController.js:569`: `threatIntelligence.lookupThreat(trimmed)` is executed on every query submitted to `GET /api/complaints/public-search?q=...`, which powers the public citizen Scam Search (`web-app/src/pages/ScamSearch.js`).

Actual behavior:
Any citizen using Scam Search who types legitimate, ubiquitous domains such as `google.com`, `github.com`, or national banking portals like `icicibank.com` receives a high-severity `BLOCKED` threat alert declaring the site a confirmed phishing destination. This is not a harmless or isolated test fixture; it is an active production code path that misinforms users.

Risk:
Critical product integrity defect. Citizens seeking verification of legitimate banking portals or technology platforms are given false threat warnings, undermining trust in the platform's threat advisory capabilities.

Recommended action:
Purge legitimate domains from `PHISHING_RAW`. Establish an authoritative whitelist (`AUTHORITY_WHITELIST`) for verified financial institutions, government portals, and major services that explicitly returns a verified status rather than routing to phishing blacklists.

---

## 2. Admin Codebase Endpoint
Status: VERIFIED
Evidence:
- `backend/src/routes/admin.js:391-451`: Route `GET /api/admin/codebase` recursively traverses `web-app/src` and `backend/src` using `fs.readdirSync`.
- Authentication & Authorization: `backend/src/routes/admin.js:11` applies `router.use(protect, restrictTo('admin'))`, which verifies JWT signature and requires `req.user.role === 'admin'`.
- Exposed information: The endpoint reads the full text of all files with extensions `.js`, `.jsx`, `.json`, `.md`, `.html`, `.css`, and `.env.example` via `fs.readFileSync(fullPath, 'utf8')`, packing entire source trees and contents into a nested JSON structure.
- Callers / Usages: Searched the entire frontend codebase. Only two references exist: `web-app/src/services/api.js:125` (`getCodebase: () => api.get('/admin/codebase')`) and `web-app/src/pages/DeveloperPage.js:64` (`handleAccessCodebase()`), which renders an experimental file tree in the developer debug sandbox.
- Production dependency: No operational CyberGuard feature (complaint filing, case triage, officer investigation, citizen dashboard, or analytics) utilizes or depends on this endpoint.

Actual behavior:
Any client possessing an administrative JWT can download the complete proprietary frontend and backend source code in a single HTTP request.

Risk:
High security and intellectual property risk. If an administrator's credentials or JWT token are compromised (e.g. via token theft from `localStorage` or session interception), the adversary can immediately exfiltrate the application's entire source code, schemas, routes, and business logic.

Recommended action:
Gate the endpoint strictly behind `process.env.NODE_ENV === 'development'` or eliminate it from production API routes entirely. Source code inspection should remain confined to version control with corporate SSO.

---

## 3. Evidence Upload Security
Status: VERIFIED
Evidence:
- Validation: `backend/src/controllers/complaintsController.js:29-36`: `fileFilter` validates only `file.mimetype` (`['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'text/plain']`). The MIME type is read directly from the client-controlled HTTP `Content-Type` header; there is zero server-side magic byte or buffer signature verification.
- Storage: `backend/src/controllers/complaintsController.js:19-26`: Files are saved to `uploads/evidence` with filename `evidence-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`. The original file extension is preserved verbatim.
- Web root isolation: `backend/src/server.js:115-116` exposes `uploads/chats` and `uploads/avatars` as static directories via `express.static`, but `uploads/evidence` is NOT statically served.
- Retrieval authorization: `backend/src/controllers/complaintsController.js:46-80`: Handled via `GET /api/complaints/:complaintId/evidence/:filename` (`getEvidence`). Access is strictly checked (must be `admin`, assigned officer, or the complaint owner) and enforces directory containment (`filePath.startsWith(evidenceRoot)`).
- Cryptographic hashing: `backend/src/models/Complaint.js:10-17`: `evidenceSchema` records `filename`, `originalName`, `mimetype`, `size`, `url`, and `uploadedAt`. No SHA-256 / SHA-1 cryptographic hash of the file payload is generated or persisted.

Actual behavior:
Uploaded evidence cannot be directly browsed or executed over HTTP by unauthenticated parties. However, an attacker can upload malicious files or weaponized PDFs by simply setting a permitted `Content-Type` header (e.g. `application/pdf`). When investigating officers download these evidence files onto their workstations, they risk malware execution. Furthermore, without stored cryptographic hashes, evidence tamper-resistance cannot be legally established under Indian digital forensics standards (Section 65B Indian Evidence Act / Bharatiya Sakshya Adhiniyam).

Risk:
High. Malware risk for investigating officers reviewing submitted files and absence of cryptographic evidentiary chain-of-custody.

Recommended action:
Implement server-side magic byte validation (inspecting buffer header signatures rather than trusting HTTP headers). Compute and persist a SHA-256 hash for every uploaded evidence file upon receipt. Integrate an asynchronous malware scanning hook (e.g., ClamAV) prior to officer download.

---

## 4. Leak Monitor
Status: VERIFIED
Evidence:
- `web-app/src/pages/LeakMonitor.js:24-28`: `checkBreach` triggers a simulated delay:
  ```javascript
  setTimeout(() => {
    setLoading(false);
    setHasSearched(true);
    setSearchedEmail(email);
  }, 1200);
  ```
- `web-app/src/pages/LeakMonitor.js:31`: Hardcoded check:
  ```javascript
  const isPruthvi = searchedEmail.toLowerCase() === 'pruthvishetty04@gmail.com';
  ```
- `web-app/src/pages/LeakMonitor.js:189-203`: If the email is `pruthvishetty04@gmail.com`, it displays a customized mock profile ("Verified public presence found across Google, GitHub, LinkedIn... Profiles found: 12"). For any other email address, it renders a generic mock verdict: "LOW RISK", "No associated stealer log entries or plaintext credential leaks discovered. Address appears untainted across known dark web repositories."
- Backend API: Zero network requests are dispatched; no backend route exists for credential leak auditing.

Actual behavior:
The feature is an entirely static, client-side simulation. Regardless of whether an entered email address has actually been compromised in public data breaches, the user is presented with a green "LOW RISK" badge and assured that their address is untainted.

Risk:
Deceptive user experience. Citizens whose credentials have genuinely leaked into public pastebins or dark-web databases receive false reassurances of safety, discouraging them from rotating compromised passwords.

Recommended action:
Connect the interface to an authenticated backend proxy using the HaveIBeenPwned (HIBP) k-Anonymity API (transmitting only the first 5 characters of the SHA-1 hash to preserve zero-knowledge privacy). If an external API integration is postponed, display an explicit disclaimer or disable the mock module.

---

## 5. Admin Link Analysis
Status: PARTIALLY VERIFIED
Evidence:
- Frontend (`web-app/src/pages/AdminLinkAnalysis.js:10-81`): The primary tabs (`phones`, `phishing`, `other`) render static client-side constants:
  - `SCAM_PHONES_INDIA`: 9 hardcoded Indian numbers.
  - `SCAM_PHONES_NA`: 100 pseudo-random numbers generated client-side with `Math.random()`.
  - `PHISHING_LINKS`: Domains parsed from `PHISHING_LINKS_RAW`.
  - `OTHER_THREATS`: 9 hardcoded mock threat records.
- Backend API (`backend/src/controllers/analyticsController.js:277-323`): An actual MongoDB aggregation endpoint exists at `GET /api/analytics/link-analysis` (`getLinkAnalysis`). It groups complaints by `ocrData.extracted.phones` and `ocrData.extracted.upis` where count > 1.
- Integration: `AdminLinkAnalysis.js:110-119` calls `analyticsAPI.linkAnalysis()` and sets state `ocrLinks`. However, this real data is only rendered on the 4th tab (`ocr`). The default view and other tabs display hardcoded mock data.
- Relational graph: Despite being titled "Organized Crime Link Analysis", the page contains no interactive graph visualization and does not cross-reference core complaint suspect fields (`suspectInfo.phone`, `suspectInfo.upiId`, `suspectInfo.bankAccount`).

Actual behavior:
The finding is partially verified: the backend does have a real aggregation query for OCR tokens, but the vast majority of the UI and its default tabs display hardcoded mock data rather than an interactive network analysis of MongoDB complaints.

Risk:
Low security risk; moderate operational gap. Investigators do not have an interactive relational tool to connect suspect identifiers across complaints.

Recommended action:
Expand `GET /api/analytics/link-analysis` to aggregate across structured suspect fields (`suspectInfo.phone`, `suspectInfo.upiId`, `suspectInfo.bankAccount`, and suspect names) alongside OCR. Replace the static arrays with dynamic query results and introduce an interactive node-link network visualization (e.g. Cytoscape or Force Graph).

---

## Final Priority

Ranking of verified issues:

| Rank | Issue | Security Severity | User Impact | Ease of Fixing | Risk of Breaking Existing Functionality |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **1** | **Threat Intelligence (`threatIntelligence.js` False Positives)** | Medium | **Critical** | **Very High** | **Zero** |
| **2** | **Admin Codebase Endpoint (`GET /api/admin/codebase`)** | **High** | Low | **Very High** | **Very Low** |
| **3** | **Evidence Upload Security (MIME Validation & File Hashes)** | **High** | High | Medium | Low |
| **4** | **Leak Monitor (Client-Side Simulation)** | Medium | Medium | Medium | Low |
| **5** | **Admin Link Analysis (Static Arrays vs Graph)** | Low | Medium | High Effort | Low |

---

## Single Recommended Fix

### Fix First: Threat Intelligence False-Positive Domains (`backend/src/utils/threatIntelligence.js`)

**Justification**:
1. **Immediate Public Impact**: This is an active, externally reachable flaw on `GET /api/complaints/public-search` powering Scam Search. Any citizen searching for `google.com`, `apple.com`, `github.com`, or major banking sites like `icicibank.com` is told the domain is a blocked phishing threat.
2. **Zero Regression Risk**: Fixing this involves only curating the in-memory domain dataset and separating authority domains from phishing targets. It requires zero database schema migrations, zero breaking API contract modifications, and zero UI rewrites.
3. **Maximum Trust Dividend**: Instantly restores credibility to the public scam intelligence feature.

