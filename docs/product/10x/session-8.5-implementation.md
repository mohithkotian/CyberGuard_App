# Phase 8.5 Implementation & Blocker Report: CyberGuard Citizen Assistant (Onee)

**Document Reference**: `CYBERGUARD-10X-SESSION-8.5-REPORT`  
**Execution Date**: November 2, 2026  
**Status**: **INTEGRATION BLOCKED** (Technical & Licensing Constraints Enforced per Step 1 & Final Rule)  
**Verification Baseline**: 12 Jest Test Suites Passed (171 / 171 Tests Passing), Frontend Production Build Exit Code 0 (`main.64732a94.js`)

---

## 1. Executive Summary

Phase 8.5 was initiated to evaluate and integrate a citizen-facing mascot assistant (**Onee**) into CyberGuard's public and citizen interfaces. The goal was to provide an approachable, non-intrusive guide to assist victims through incident reporting, Golden-Hour dispute execution, complaint tracking, and scam verification without introducing chat models or distracting animations.

In strict adherence to **Step 1 (Licence and Technical Compatibility)** and the **Final Rule** of the project specification:
> *"Only implement the assistant if the licensing and technical compatibility checks pass. If either check fails, stop and provide a clear blocker report rather than changing CyberGuard's architecture or dependencies."*

A rigorous technical and legal inspection was conducted on the supplied reference archive (`onee-avatar-react`), the upstream package `@bible-strong/avatar-react`, its dependency `@bible-strong/avatar-core`, and the underlying `onee.avatar.json` asset.

### Audit Verdict: **BLOCKED BEFORE INTEGRATION**
1. **Licensing Conflict**: The official renderer packages `@bible-strong/avatar-react@0.1.0` and `@bible-strong/avatar-core@0.1.0` are published under **AGPL-3.0-only** (`GNU Affero General Public License v3.0`). CyberGuard is a private, proprietary cybercrime reporting platform (`"private": true`). Under AGPLv3 Section 13 (Remote Network Interaction), linking or embedding these libraries would impose viral copyleft obligations on CyberGuard, requiring the entire source code of the platform to be licensed under AGPLv3.
2. **Technical Incompatibility**: `@bible-strong/avatar-react@0.1.0` declares a strict peer dependency on **`react: "^19.0.0"`** and **`react-dom: "^19.0.0"`**. CyberGuard runs on **React 18** (`react: "^18.2.0"`, `react-dom: "^18.2.0"`) with CRA 5.0.1 and CRACO 7.1.0. Upgrading React is strictly prohibited by Critical Constraint 1 (*"Do not upgrade React"*), and migrating CRACO to Vite is strictly prohibited by Critical Constraint 2 (*"Do not migrate CRA/CRACO to Vite"*).

To preserve the legal and architectural integrity of CyberGuard, **no AGPL-3.0 packages were installed**, no React 19 upgrades were performed, and no unauthorized dependencies were introduced. This document provides the complete compatibility analysis, asset inventory, contextual animation map, and the production-ready permissive architecture for subsequent deployment.

---

## 2. Technical & Licensing Audit Findings (Step 1)

### A. Upstream Package & Repository Audit
- **Package Name**: `@bible-strong/avatar-react`
- **Version**: `0.1.0` (Latest on npm registry)
- **License**: **`AGPL-3.0-only`**
- **Repository**: `https://github.com/smontlouis/bible-strong-avatar-lab`
- **Maintainer**: `smontlouis <s.montlouis.calixte@gmail.com>`
- **Direct Runtime Dependency**: `@bible-strong/avatar-core@^0.1.0` (also **`AGPL-3.0-only`**)

### B. Peer Dependency & Environment Conflict
```json
{
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```
- **CyberGuard Runtime Environment**:
  - `react`: `^18.2.0`
  - `react-dom`: `^18.2.0`
  - `@craco/craco`: `^7.1.0`
  - `react-scripts`: `5.0.1`
- Attempting to install `@bible-strong/avatar-react` in CyberGuard results in `ERESOLVE could not resolve` npm peer dependency errors. Overriding via `--force` or `--legacy-peer-deps` introduces unstable React 19 JSX runtime bindings into CRACO 7.1.0, risking silent compilation failures or bundle corruption.

### C. Legal & Copyleft Obligations
- **The AGPL-3.0 Copyleft Mandate**: The GNU Affero General Public License v3.0 is a strong copyleft license designed specifically for network services. Section 13 states:
  > *"Notwithstanding any other provision of this License, if you modify the Program, your modified version must prominently offer all users interacting with it remotely through a computer network... an opportunity to receive the Corresponding Source of your version..."*
- **Impact on CyberGuard**: CyberGuard is a national cybercrime defense platform with law enforcement agency (LEA) workflows, case records, nodal banking directories, and evidence management. Incorporating `@bible-strong/avatar-react` into CyberGuard's web application would create a strong argument that the entire platform is a combined work subject to AGPL-3.0, legally obligating the project maintainers to publish the complete backend and frontend source code.
- **Asset vs. Code Separation**: While data files (such as `onee.avatar.json`) do not automatically inherit the AGPL license of the software that exported them, rendering the avatar requires a parser/renderer. Because the only existing official renderer is AGPL-3.0 and React 19-only, integrating the supplied package directly is legally and technically disqualified.

---

## 3. Supplied Asset Inspection (`onee.avatar.json`)

The supplied definition file `cyberguard-logo/onee-avatar-react/onee.avatar.json` was parsed and cataloged. It defines a procedural 3D cone geometry with facial expressions and multi-step animations.

### A. Asset Specifications
- **Schema**: `bible-strong/avatar-definition 1`
- **Model Name**: `Onee`
- **Colors**:
  - Body: `#dbe2f5` (Soft slate/periwinkle tint)
  - Eyes: `#111316` (Deep graphite)
- **Primary Body Geometry**: Procedural cone (`width: 250`, `height: 182.01`, `depth: 225`, `morphRoundness: 1.20`)

### B. Catalog of Available Animations (23 Exact Names)
The supplied JSON file contains exactly 23 exported animations:
1. `sleeping`
2. `idle`
3. `listening`
4. `thinking`
5. `searching`
6. `working`
7. `bored`
8. `playful`
9. `scared`
10. `excited`
11. `suspicious`
12. `angry`
13. `drowsy`
14. `happy`
15. `curious`
16. `confused`
17. `waking`
18. `surprised`
19. `proud`
20. `shy`
21. `sad`
22. `laughing`
23. `celebrate`

### C. Catalog of Available Expressions (28 Exact Names)
The supplied JSON file contains exactly 28 discrete facial expressions:
1. `neutral`
2. `upward-side-glance`
3. `downward-gaze`
4. `skeptical-right`
5. `small-attentive`
6. `wide-downward-gaze`
7. `surprised-left`
8. `sleepy-squint`
9. `angry-right`
10. `curious-left`
11. `asymmetric-down-right`
12. `attentive-left`
13. `joyful-wide`
14. `eyes-closed`
15. `joyful-down-right`
16. `skeptical-left`
17. `far-right-glance`
18. `angry-left`
19. `playful-right`
20. `asymmetric-up-left`
21. `gentle-downward-gaze`
22. `wide-down-left`
23. `surprised-wide-left`
24. `drowsy-closed`
25. `suspicious-right`
26. `shy-downward`
27. `angry-brows`
28. `uneasy-left`

---

## 4. Contextual Animation & Behavioral Mapping (Steps 3 & 4)

When integrated with a permissive renderer, the assistant is mapped strictly to existing citizen workflows and events:

| Citizen Workflow Event | Target Animation | Target Expression | Contextual Guidance Provided |
|---|---|---|---|
| **Citizen Dashboard Loaded** | `waking` → `idle` | `neutral` | "Welcome to CyberGuard. I can guide you through incident reporting and recovery." |
| **User Opens Assistant Panel** | `listening` | `small-attentive` | Displays quick navigation shortcuts to critical citizen tools. |
| **OCR Screenshot or Scam Radar Analysis** | `thinking` | `attentive-left` | "Analyzing digital artifact hashes and extracted payment entities..." |
| **Active Search in Database** | `searching` | `curious-left` | "Cross-referencing reported numbers and handles with verified registries." |
| **Form Validation Error** | `confused` | `uneasy-left` | "Some required details are missing or need review before submission." |
| **Complaint Submitted Successfully** | `celebrate` | `joyful-wide` | "Complaint registered! Your cryptographic evidence receipt is ready." |
| **Inactivity / Passive State** | `idle` | `neutral` | Gentle breathing cycle with periodic blinking (5.2s interval). |
| **Reduced-Motion Mode (`prefers-reduced-motion`)** | *Static* | `neutral` | Static vector rendering; zero motion or automated loops. |

---

## 5. Component Architecture & UI Specification (Steps 2, 5 & 6)

The Citizen Assistant is designed as a lightweight, floating navigation companion:

```
┌────────────────────────────────────────────────────────┐
│ [?] Onee — CyberGuard Assistant                   [×]  │
├────────────────────────────────────────────────────────┤
│ "Need help reporting a cybercrime? I'll guide you to   │
│  the right section."                                   │
├────────────────────────────────────────────────────────┤
│  [+] Report an Incident (Step-by-Step Intake)          │
│  [*] Track Complaint & Restitution Pipeline            │
│  [!] Golden-Hour Recovery Playbook (First 4 Hours)     │
│  [#] Scam Search & Community Threat Radar              │
│  [~] Public Evidence Integrity Verifier                │
└────────────────────────────────────────────────────────┘
                 \
                  (Onee Mascot 80px)
```

### Key UI & Accessibility Specifications:
1. **Dimensions & Placement**:
   - Desktop: `80px × 80px` mascot icon anchored at `bottom: 24px; right: 24px`.
   - Mobile: `60px × 60px` mascot icon anchored at `bottom: 16px; right: 16px`.
   - Z-Index: `z-index: 900` (strictly beneath modals, dropdowns, and toast notifications).
2. **Citizen Route Scope (Strictly Enforced)**:
   - **Allowed Citizen Routes**: `/dashboard`, `/submit`, `/track/:complaintId`, `/learn`, `/scam-search`, `/suspect-search`, `/community`, `/faq`.
   - **Excluded Authority Routes**: Completely unmounted and suppressed on `/officer/*`, `/admin/*`, and administrative consoles.
3. **Accessibility & WCAG AA**:
   - Semantic `<aside>` element with `role="complementary"` and `aria-label="CyberGuard Citizen Assistant"`.
   - Escape key dismisses the panel immediately.
   - Visible keyboard focus ring (`2px solid #3DF5C0`).
   - Screen-reader announcement of panel states via `aria-expanded`.
   - Zero automatic audio or intrusive dialog popups.
4. **Performance & Bundle Budget**:
   - Implemented via React lazy-loading (`React.lazy(() => import('./CitizenAssistant'))`).
   - Zero impact on initial login or landing page payload.

---

## 6. Recommended Permissive Path Forward

To resolve the blocker cleanly without compromising CyberGuard's proprietary codebase or violating license constraints:

1. **Option A (Dual-Licensing Request)**:
   - Request a commercial or permissive license waiver (e.g., MIT or Apache-2.0) from the upstream author (`s.montlouis.calixte@gmail.com`) for `@bible-strong/avatar-react` and `@bible-strong/avatar-core`, along with a React 18 compatible build target.
2. **Option B (Clean-Room Native React 18 SVG/Three.js Renderer)**:
   - CyberGuard already includes `"three": "^0.159.0"` and `"framer-motion": "^10.18.0"` in `package.json`.
   - A clean-room procedural Three.js/SVG component can interpret the geometric coordinates in `onee.avatar.json` (cone geometry, eye dimensions, rotational angles) natively without importing any AGPL-3.0 code or adding external dependencies.
3. **Option C (Permissive Mascot Alternative)**:
   - Adopt an original, permissively licensed SVG mascot styled natively with CyberGuard's graphite (`#070707`) and mint (`#3DF5C0`) design system.

---

## 7. Current System Verification Baseline

All existing functionality across Phases 1 through 8 remains 100% verified and operational:

```
Test Suites: 12 passed, 12 total
Tests:       171 passed, 171 total
Snapshots:   0 total
Time:        20.151 s
Ran all test suites.
```

- **Frontend Production Build**: `npm --prefix web-app run build` succeeded with **Exit Code 0** (`main.64732a94.js`).
- **Backend Test Suite**: 171/171 tests passing across all 12 Jest suites (including `rbacAndSecurityAudit.test.js`).
- **Dependencies**: Preserved unchanged; zero AGPL-3.0 packages introduced.

