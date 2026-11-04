# CyberGuard Master Upgrade & Comprehensive Architecture Report

**Date:** November 2, 2026  
**System:** CyberGuard — AI-Assisted National Cybercrime Reporting, Threat Intelligence & Case Redressal Platform  
**Target Architecture:** React 18 (CRA/CRACO), Node.js / Express, MongoDB / Mongoose, FastAPI ML Microservice  
**Audit Status:** Comprehensive Legal, Security, RBAC & Architecture Audit Completed across Phases 1–8  
**Phase 8.5 Status:** Citizen Assistant (Onee) Compatibility Audit Completed — Integration Blocked (Licensing & React Version Constraints Enforced)  
**Test Baseline:** **171 passed, 171 total** across **12 Jest test suites** | Frontend Production Build: **Exit Code 0** (`main.64732a94.js`)

---

## 1. Executive Summary & Product Horizon

CyberGuard has matured from a simple incident intake form into an institutional-grade, legally rigorous cybercrime defense platform adhering to the latest Indian legal and procedural frameworks:
- **Bharatiya Nyaya Sanhita (BNS), 2023**: Penal provisions including Section 111 (Organized Crime Lead Analysis), Section 318(4) (Cheating & Dishonestly Inducing Delivery of Property), Section 319 (Cheating by Personation).
- **Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023**: Procedural authorities including Section 106 (Statutory Bank Debit Freeze Directive), Section 107 (Attachment, Forfeiture & Restoration of Proceeds of Crime), Section 173(1) (Mandatory Zero FIR Jurisdictional Transfer), Section 242 & 246 (Joint Trial & Consolidation of Serial Syndicate Offences), Section 31 & 45 (Inter-Jurisdictional Police Powers), and Section 503 (Magistrate Property Restitution & Escrow Release).
- **Bharatiya Sakshya Adhiniyam (BSA), 2023 / Indian Evidence Act (IEA)**: Section 63(4) BSA / Section 65B(4) IEA Electronic Record Certificate Draft with SHA-256 cryptographic hashes and full chain-of-custody tracking.
- **Information Technology Act, 2000 & Telecommunications Act, 2023**: Section 66C & 66D (Identity Theft & Computer Personation), Section 67C & DoT Unified License Condition 39.20 (Mandatory 24-Month CDR/IPDR Preservation), Section 94 BNSS & Section 79(3)(b) (Statutory Emergency Requisitions & 24-Hour P0 Intermediary Takedowns).

---

## 2. Complete Phase-by-Phase Implementation Inventory

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               CYBERGUARD 8-PHASE VALUE MATRIX                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Golden-Hour Playbook, RBI Dispute Generator, Evidence Receipt, Real Milestones          │
│ Phase 2: Syndicate Surge Velocity Alerts, Bank Nodal Directory, Community Scam Radar             │
│ Phase 3: Payment Screenshot OCR & UTR Extractor, Phishing Sandbox, Magistrate Restitution Docket │
│ Phase 4: Telecom Requisitions, Sec 503 Restitution Petition, Multi-Layer Mule Fund Flow Trail    │
│ Phase 5: P0 Sextortion Emergency Containment, Zero FIR Inter-Agency Transfer, Cryptographic Seal │
│ Phase 6: Static Heuristic Artifact Inspection (ISO/IEC 27037), BSA 63 Certificate Draft          │
│ Phase 7: Officer Fast-Triage Command Matrix, Batch Statutory Enforcement, Escrow Pipeline        │
│ Phase 8: Cross-Jurisdiction Syndicate Visual Graph, Master BNS 111 Dossier, Telecom Requisitions │
│ Phase 8.5: Citizen Assistant (Onee) Compatibility Audit & Permissive Architecture Specification   │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Breakdown of Implemented Phases

| Phase | Capability | Key Modules & Endpoints | Statutory Foundation & Reality Classification |
|---|---|---|---|
| **Phase 1** | **Golden-Hour & Restitution Foundations** | [`CyberReport.js`](file:///c:/Users/Mohith/CyberGuard_App/web-app/src/components/CyberReport.js), [`Dashboard.js`](file:///c:/Users/Mohith/CyberGuard_App/web-app/src/pages/Dashboard.js), [`complaintsController.js`](file:///c:/Users/Mohith/CyberGuard_App/backend/src/controllers/complaintsController.js) | Real-time 4-hour countdown; automated RBI Dispute Memo generator; verifiable Evidence Receipt with SHA-256 seal. *(Fully Functional)* |
| **Phase 2** | **Surge Alerts & Bank Nodal Directory** | [`bankNodalDirectory.js`](file:///c:/Users/Mohith/CyberGuard_App/backend/src/utils/bankNodalDirectory.js), [`AdminLinkAnalysis.js`](file:///c:/Users/Mohith/CyberGuard_App/web-app/src/pages/AdminLinkAnalysis.js), `GET /api/analytics/syndicate-surges` | Live registry of 45+ Indian banks & PSPs with verified nodal emails; cross-district surge velocity detection alerts; auto-drafted Section 106 BNSS freeze notices. *(Fully Functional)* |
| **Phase 3** | **OCR Extractor & Magistrate Docket** | [`ocrService.js`](file:///c:/Users/Mohith/CyberGuard_App/backend/src/services/ocrService.js), [`ScamSearch.js`](file:///c:/Users/Mohith/CyberGuard_App/web-app/src/pages/ScamSearch.js), `GET /:id/magistrate-docket` | Automatic extraction of 12-digit UTRs and IFSCs from payment screenshots; headless phishing domain analyzer; official Section 503 BNSS court property release docket. *(Fully Functional)* |
| **Phase 4** | **Telecom Directives & Mule Trail** | [`complaintsController.js`](file:///c:/Users/Mohith/CyberGuard_App/backend/src/controllers/complaintsController.js), [`ComplaintDetails.js`](file:///c:/Users/Mohith/CyberGuard_App/web-app/src/pages/ComplaintDetails.js) | Section 94 BNSS & Sec 67C IT Act CDR/tower location telecom requisitions; sworn citizen indemnity undertaking; visual multi-layer mule account money trail. *(Protected Workflow)* |
| **Phase 5** | **P0 Emergency Containment & Zero FIR** | `POST /p0-emergency-action`, `GET /zero-fir-transfer`, `POST /security/verify-integrity` | 4-step immediate defense checklist for sextortion victims; Section 173(1) BNSS Zero FIR transfer memo to jurisdictional police stations; public SHA-256 evidence integrity checker. *(Fully Functional)* |
| **Phase 6** | **Static Inspection & BSA Sec 63 Certificate** | [`artifactForensics.js`](file:///c:/Users/Mohith/CyberGuard_App/backend/src/utils/artifactForensics.js), [`section65bGenerator.js`](file:///c:/Users/Mohith/CyberGuard_App/backend/src/utils/section65bGenerator.js), [`statementNormalizer.js`](file:///c:/Users/Mohith/CyberGuard_App/backend/src/utils/statementNormalizer.js) | Static APK/PDF inspection sandbox (ISO/IEC 27037) computing Shannon entropy and dangerous permissions; Section 63(4) BSA / Section 65B(4) IEA Electronic Record Certificate Draft; conversational voice statement normalizer. *(Fully Functional)* |
| **Phase 7** | **Officer Fast-Triage & Citizen Restitution** | [`OfficerDashboard.js`](file:///c:/Users/Mohith/CyberGuard_App/web-app/src/pages/OfficerDashboard.js), `POST /batch-enforcement`, `POST /:id/restitution-milestone` | Command Matrix with urgent Golden-Hour & P0 queues; multi-case batch Section 106 BNSS bank debit freezes (bounded by officer assignment); 5-stage Citizen Restitution & Escrow tracking pipeline. *(Strictly Protected)* |
| **Phase 8** | **Syndicate Visual Graph & Master Dossier** | [`syndicateConsolidator.js`](file:///c:/Users/Mohith/CyberGuard_App/backend/src/utils/syndicateConsolidator.js), [`telecomRequisition.js`](file:///c:/Users/Mohith/CyberGuard_App/backend/src/utils/telecomRequisition.js), [`AdminLinkAnalysis.js`](file:///c:/Users/Mohith/CyberGuard_App/web-app/src/pages/AdminLinkAnalysis.js) | Interactive topological SVG network graph with pan/zoom/filter; Section 111 BNS Potential Syndicate Assessment Dossier Draft; Proposed Telecom Requisition Drafts for DoT / TAFCOP / CEIR dispatch. *(Fully Functional)* |
| **Phase 8.5**| **Citizen Assistant Compatibility Audit** | [`session-8.5-implementation.md`](file:///c:/Users/Mohith/CyberGuard_App/docs/product/10x/session-8.5-implementation.md), `cyberguard-logo/onee-avatar-react` | Audited upstream `@bible-strong/avatar-react` package licensing and React 19 peer dependencies; enforced strict project constraints; documented asset inventory (23 animations, 28 expressions) and clean-room permissive architecture. *(Audit Complete / Blocked)* |

---

## 3. Comprehensive Legal & RBAC Audit Remediations

Following an exhaustive audit of all statutory citations and API authorization paths, the following remediations were implemented:

### Legal Accuracy & Terminology Corrections
1. **Section 107 BNSS 2023**: Accurately re-characterized as **"Attachment, Forfeiture or Restoration of Property (Proceeds of Crime)"** under judicial supervision, eliminating previous inaccurate claims of "centralized inter-state police command". Added **Sections 242 & 246 BNSS 2023** (joint trial and clubbing of serial offences) and **Sections 31 & 45 BNSS 2023** (inter-jurisdictional police pursuit).
2. **Mandatory 2-Year CDR Retention**: Purged erroneous references to "Rule 414 Indian Telegraph Rules" (which actually governs telephone connection fees). Replaced with genuine statutory authority: **DoT Unified License Condition 39.20 read with Section 67C Information Technology Act, 2000**.
3. **BSA Section 63 Electronic Evidence Certificates**: Rebranded output from "court-admissible sworn affidavit" to **"Section 63(4) BSA / Section 65B(4) IEA Electronic Evidence Certificate Draft"**. Added clear legal notice that final evidentiary admissibility is subject to judicial inspection and formal execution under oath (*Anvar P.V.* & *Arjun Panditrao Khotkar*).
4. **Section 111 BNS Lead Analysis**: Rebranded syndicate output to **"Potential Syndicate Assessment Dossier Draft (Sec 111 BNS Lead Analysis)"**, clarifying that statutory organized crime charges require proof of multiple prior charge-sheets and judicial cognizance.
5. **Static Heuristic Inspection (ISO/IEC 27037)**: Renamed "Malware Detonation Sandbox" to **"Static Heuristic Artifact Inspection Sandbox"**, accurately describing Shannon entropy, APK manifest parsing, and PDF exploit signature analysis without misrepresenting it as dynamic hypervisor detonation.

### Server-Side RBAC & Security Enhancements
1. **Elimination of Rate Limit Whitelist**: Removed the hardcoded email bypass in `server.js:129-135`. All login attempts are now strictly rate limited.
2. **Unified Access Control (`checkComplaintAccess`)**: Enforced server-side checks across:
   - `getRestitutionStatus`: Neutralized IDOR; citizens cannot view other citizens' restitution or financial settlement details.
   - `generateRestitutionPetition`: Neutralized IDOR; prevents unauthorized extraction of victim PII.
   - `getMoneyTrail`: Restricts multi-layer mule account details to authorized parties.
   - `issueEmergencyTakedownNotice`: Enforces ownership/assignment before logging takedown notices.
   - `issueBankFreezeNotice`, `generateFIRDraft`, `generateMagistrateDocket`, `issueTelecomRequisitionNotice`, `generateZeroFIRTransfer`: Strict officer-only assignment enforcement.
   - `batchEnforcement`: Rejects requests where an officer attempts to operate on complaints outside their jurisdiction.
3. **Chat Security**: Enforced ownership/assignment validation on `POST /api/chats/:complaintId` (`sendMessage`), preventing unauthorized cross-complaint message injection.
4. **Artifact Quarantine Route Protection**: Mounted `optionalAuth` on `POST /api/security/detonate-artifact`, requiring authenticated ownership/officer role before attaching quarantine events to any complaint.
5. **Client-Side Threat Intel Sanitization**: Synchronized `web-app/src/data/threatIntel.js` with `AUTHORITY_DOMAINS` whitelist, preventing false-positive phishing flags on legitimate domains (`google.com`, `apple.com`, `icicibank.com`, `amazon.com`, `github.com`).

---

## 4. Phase 8.5 Citizen Assistant (Onee) Technical & Licensing Audit

Pursuant to Step 1 and the Final Rule of Phase 8.5:
1. **Licensing Blocker**:
   - Upstream renderer `@bible-strong/avatar-react@0.1.0` and `@bible-strong/avatar-core@0.1.0` are published under **AGPL-3.0-only**.
   - Under AGPLv3 Section 13, embedding this runtime in CyberGuard creates copyleft obligations requiring the platform's proprietary and law enforcement code to be released under AGPL-3.0.
   - Per project instructions (*"Do not silently introduce AGPL code into CyberGuard"*), the integration was blocked prior to package installation.
2. **Technical Environment Blocker**:
   - `@bible-strong/avatar-react` declares strict peer dependencies on `react: "^19.0.0"` and `react-dom: "^19.0.0"`.
   - CyberGuard is standard on React 18 (`18.2.0`), CRA 5.0.1, and CRACO 7.1.0. Upgrading to React 19 is strictly prohibited by Critical Constraint 1.
3. **Permissive Path Forward**:
   - The asset structure of `onee.avatar.json` was parsed (23 animations, 28 expressions).
   - A clean-room architecture specification using native Three.js/SVG without AGPL dependencies was authored in [`docs/product/10x/session-8.5-implementation.md`](file:///c:/Users/Mohith/CyberGuard_App/docs/product/10x/session-8.5-implementation.md).

---

## 5. Verification & Testing Evidence

### 1. Automated Backend Test Suite
```
Test Suites: 12 passed, 12 total
Tests:       171 passed, 171 total
Snapshots:   0 total
Time:        20.151 s
Ran all test suites.
```
- **100% Pass Rate** across all 12 suites, including the newly authored `rbacAndSecurityAudit.test.js` verifying IDOR rejections, officer batch boundaries, rate limiter security, and legal statutory citations.

### 2. Frontend Production Build
```
Creating an optimized production build...
Compiled successfully.
File sizes after gzip:
  904.59 kB  build\static\js\main.64732a94.js
  12.2 kB    build\static\css\main.e318d861.css
```
- **Exit Code 0**: Zero compile errors, zero broken imports, and zero TypeScript/JSX bundling failures.

### 3. Design System Compliance
- Maintained exact CyberGuard design contract: graphite neutral backgrounds (`#070707`, `#0d0d0d`, `#141414`), IBM Plex Sans for UI copy, IBM Plex Mono for technical readouts, mint `#3DF5C0` status accent, and zero decorative AI slop (no gradients, no purple/neon glows).
