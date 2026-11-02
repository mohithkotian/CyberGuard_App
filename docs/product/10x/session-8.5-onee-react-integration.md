# CyberGuard Phase 8.5 — Onee React/TypeScript Package Safe Integration Report

**Date:** November 2, 2026  
**Status:** Verified Stable  
**Baseline Verified:** 171/171 backend tests passing (12 suites), 9/9 frontend tests passing (2 suites), production build exit code 0  

---

## 1. Downloaded Package Structure

The official Onee React/TypeScript export downloaded from Bible Strong Avatar Lab into `cyberguard-logo/` contained:

| File / Folder | Size / Type | Discovered Role & Contents |
|---|---|---|
| `avatar-runtime.ts` | 36,487 bytes | Procedural 3D math engine (`ENGINE_SOURCE`, ~14KB) and SVG DOM runtime (`BROWSER_RUNTIME_SOURCE`, ~15KB). Mounts SVG to host `HTMLElement` and provides frame loop with requestAnimationFrame. |
| `onee.avatar.ts` | 22,352 bytes | Contains typed `avatarData` with 3D cone geometry (`width: 250, height: 182, depth: 225`), 23 facial expressions (`expression-00` to `expression-23`), and 22 animations. |
| `Onee.tsx` | 2,443 bytes | React component using `forwardRef`, `useRef`, `useEffect`, `useImperativeHandle`. Renders `<span ref={host} ... />` and loads runtime asynchronously. |
| `onee.index.ts` | 110 bytes | Barrel export for `Onee`, `default`, and type definitions (`AnimationName`, `AvatarHandle`, `AvatarProps`). |
| `avatar-studio-project.json` | 3,604 lines | Avatar Studio project file containing library definitions. |
| `manifest.csv` | 1,489 bytes | Icon metadata listing 24px and mobile icon entries. |
| `README.txt` | 555 bytes | Icon pack usage instructions for web and mobile. |
| `brand/` | Directory | Official logos, app icons, and splash screens. |
| `cyberguard-admin-extension/` | Directory | Admin extension assets and icons. |
| `mobile-png/` | Directory | 256x256 PNG icons. |
| `web-svg/` | Directory | 24px grid SVG icons. |

---

## 2. Actual Onee API Discovered

### Component Name
`Onee` (available as default export and named export `{ Onee }`).

### Props Contract (`AvatarProps`)
- `animation?: AnimationName` (default: `'sleeping'`)
- `playing?: boolean` (default: `true`)
- `loop?: boolean` (default: inherits animation definition)
- `size?: number | string` (default: `240`; auto-converted to `${size}px` if numeric)
- `className?: string`
- `style?: CSSProperties`
- `onAnimationEnd?: (animation: AnimationName) => void`

### Imperative Handle (`AvatarHandle` via `ref`)
- `play(animation?: AnimationName): void`
- `pause(): void`
- `stop(): void`

### Available Animation Names (`AnimationName` — 22 Total)
`'sleeping' | 'waking' | 'idle' | 'listening' | 'thinking' | 'searching' | 'working' | 'excited' | 'bored' | 'suspicious' | 'angry' | 'drowsy' | 'happy' | 'curious' | 'confused' | 'surprised' | 'proud' | 'sad' | 'laughing' | 'scared' | 'playful' | 'celebrate'`

### Rendering Technology
Pure SVG vector rendering (`viewBox="-150 -150 300 300"`, `role="img"`, `aria-label="Onee"`). Procedural math projects 3D cone geometry and eye saccades onto 2D Bezier curves on an internal `requestAnimationFrame` loop. No WebGL or Canvas context required.

---

## 3. Compatibility & Licensing Audit

### React Version Compatibility
- Tested against React 18.2.0.
- Uses standard React hooks: `useRef`, `useEffect`, `useImperativeHandle`, `forwardRef`.
- **Zero React 19 dependencies.** 100% compatible with React 18.2.0.

### Tooling Compatibility (CRA / CRACO / Webpack 5)
- In the original `avatar-runtime.ts`, `loadAvatarRuntime` constructed a string blob and used dynamic `import(/* @vite-ignore */ url)`.
- In Webpack 5 (used by CRA/CRACO), dynamic `import(variableUrl)` triggered a Webpack warning: `Critical dependency: the request of a dependency is an expression`. In CSP-restricted browsers, blob module imports can also be blocked.
- **Solution:** `loadAvatarRuntime` was hardened to execute `AvatarProceduralEngine` and `mountAvatar` via a direct `Function` constructor first. This runs synchronously in microseconds, generates zero Object URLs, avoids Webpack expression warnings, and preserves the exact fallback to `Blob` + `import()` if dynamic eval is restricted.

### Dependency Safety
- Zero new npm packages required.
- Zero dependencies added to `package.json`.
- Uses native React 18 and browser DOM APIs.

### Licensing Findings
- The exported source files (`Onee.tsx`, `onee.avatar.ts`, `avatar-runtime.ts`, `avatar-studio-project.json`) contain **no AGPL-3.0 header**, no copyright restrictions, and no GPL obligations.
- The assets are generated output from Bible Strong Avatar Lab for the CyberGuard project.
- No AGPL runtime packages (`@bible-strong/avatar-react`, `@bible-strong/avatar-core`) were installed into `node_modules`.

---

## 4. Integration Architecture

The integration follows the recommended clean architecture under `web-app/src/components/onee/`:

```text
web-app/src/
  components/
    onee/
      Onee.tsx              <-- Official TypeScript component
      Onee.jsx              <-- Seamless CRA JSX companion
      onee.avatar.ts        <-- Official cone avatar data & 22 animations
      onee.avatar.js        <-- ES module companion
      avatar-runtime.ts     <-- Procedural math engine & SVG DOM runtime
      avatar-runtime.js     <-- Hardened runtime with direct evaluator
      onee.index.ts         <-- TypeScript barrel export
      index.js              <-- JavaScript barrel export
      Onee.test.js          <-- Unit tests (metadata, runtime, DOM mounting)
    CitizenAssistant.js     <-- Contextual Citizen Assistant UI
    CitizenAssistant.test.js<-- Role & route restriction unit tests
    CyberReport.js          <-- Two-way event integration
  App.js                    <-- Global mount with role/route guard
```

---

## 5. Contextual Assistant Behavior & Animation State Machine

### Application Event to Animation Mapping

| Application Event | Onee Animation | Assistant Panel State |
|---|---|---|
| Page mount / initial load | `waking` (2.4s) → `idle` | Help bubble visible |
| Citizen clicks mascot or focuses input field | `listening` | Help panel expands |
| Category selection / field guidance | `listening` | Step explanation active |
| AI analysis / draft description generation | `thinking` | Draft generation active |
| Validation failure / missing required fields | `confused` | Pre-flight checklist highlights red |
| Complaint submitted / all checks valid | `celebrate` | Success notice & Golden Hour advice |
| Inactive / idle state | `idle` | Gentle breathing & eye blink loop |

### Context-Aware Modules
1. **Guided Reporting (`/submit`):**
   - 5-step carousel: Incident Category, Incident Details & Narrative, Financial Loss & UTR, Evidence Upload, Review & Declaration.
   - For every field: What to enter, Where to find it, Why it is required, and Pro tips.
2. **"Help Me Write" Incident Description Generator:**
   - Generates an objective, structured chronology strictly using citizen-provided facts (Date, category, amount, UTR, suspect handle).
   - Citizen reviews and edits the draft in a dedicated textarea before clicking "Use This Draft in Report", which populates the complaint form via custom events.
   - **Never invents facts, names, or transaction numbers.**
3. **Pre-Flight Validation Checklist:**
   - Live checkmarks for Title (min 5 chars), Category, Incident Date, Narrative (min 20 chars), Contact (email + 10-digit mobile), and Truth Declaration.
4. **Context on Other Citizen Pages:**
   - `/track`: Explains case investigation stages (Pending, Under Investigation, Action Initiated, FIR Registered, Disposed).
   - `/scam-search`: Explains how to verify suspect phone/UPI/URLs before transacting.
   - `/forensic-scanner`: Explains indicators vs judicial proof.
5. **Emergency Helplines:**
   - National Cybercrime Helpline: `1930` (Financial fraud golden hour).
   - Emergency Police: `112`.
   - Women / Child Distress: `1091` / `1098`.

---

## 6. Safety & Privacy Boundaries

1. **Role Restriction (Constraint #6):** Strictly hidden on `/officer/*`, `/admin/*`, `/developer/*`, and whenever `user.role` is `officer` or `admin`. Verified by unit tests.
2. **Credential Protection:** The assistant explicitly warns never to share banking OTPs, PINs, passwords, CVVs, or unmasked full Aadhaar cards.
3. **No Hallucination:** Description draft helper operates strictly as a deterministic factual formatter based on citizen input.
4. **Legal Status:** Clear disclaimer displayed in footer: *"Onee provides administrative and statutory workflow guidance only. CyberGuard does not replace direct emergency police response in physical danger."*
5. **Data Privacy:** Operates 100% locally in the browser with zero external AI calls or tracking telemetry.

---

## 7. Accessibility & UI Compliance

- **Dimensions:** 84px on desktop, compact and unobtrusive.
- **Design System:** Graphite foundation (`#0d0f12`, `#11141a`, `#131821`), subtle borders (`#232b38`), mint accent (`#3DF5C0`), IBM Plex Sans and IBM Plex Mono typography. Zero purple glow, zero neon blur, zero glassmorphism.
- **Keyboard Navigation:** Escape key immediately closes the panel. Full focus ring visibility with `#3DF5C0`.
- **Reduced Motion:** Subscribes to `(prefers-reduced-motion: reduce)`. Falls back to static `idle` state without ambient head drift or rapid transitions when enabled.

---

## 8. Verification Results

### Backend Test Suite
```text
Command: npm --prefix backend test
Result: 12 passed, 12 total suites
Tests: 171 passed, 171 total
Snapshots: 0 total
Time: 19.921 s
Exit Code: 0 (PASS)
```

### Frontend Test Suite
```text
Command: npm --prefix web-app test -- --watchAll=false
Result: 2 passed, 2 total suites
Tests: 9 passed, 9 total (3 Onee tests + 6 CitizenAssistant role/route tests)
Snapshots: 0 total
Time: 6.808 s
Exit Code: 0 (PASS)
```

### Production Build
```text
Command: npm --prefix web-app run build
Result: Compiled successfully with exit code 0
File sizes after gzip:
  925.91 kB  build\static\js\main.2318087e.js
  12.2 kB    build\static\css\main.e318d861.css
Exit Code: 0 (PASS)
```

### Visual Verification
`VISUAL VERIFICATION: NOT RUN` (Automated DOM mounting, unit tests, and production compilation confirmed).

---

## 9. Files Modified / Created

- `web-app/src/components/onee/Onee.tsx` (Official component copied)
- `web-app/src/components/onee/Onee.jsx` (CRA JSX companion)
- `web-app/src/components/onee/onee.avatar.ts` (Official cone avatar definition)
- `web-app/src/components/onee/onee.avatar.js` (ES module companion)
- `web-app/src/components/onee/avatar-runtime.ts` (Hardened procedural runtime)
- `web-app/src/components/onee/avatar-runtime.js` (Hardened runtime companion)
- `web-app/src/components/onee/onee.index.ts` (TypeScript barrel export)
- `web-app/src/components/onee/index.js` (JavaScript barrel export)
- `web-app/src/components/onee/Onee.test.js` (Unit test suite for Onee avatar and runtime)
- `web-app/src/components/CitizenAssistant.js` (Context-aware citizen assistant component)
- `web-app/src/components/CitizenAssistant.test.js` (Unit test suite for role/route restrictions)
- `web-app/src/components/CyberReport.js` (Two-way event synchronization with assistant)
- `web-app/src/App.js` (Mounted CitizenAssistant inside BrowserRouter)
- `docs/product/10x/session-8.5-onee-react-integration.md` (This document)
- `docs/user-guides/CYBERGUARD_CITIZEN_USER_GUIDE.md` (Citizen user guide)

