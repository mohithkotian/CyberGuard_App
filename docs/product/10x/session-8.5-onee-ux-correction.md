# CyberGuard Session 8.5 — Onee Interactive Guide Final UX Correction

**Document Status:** Complete & Verified  
**Date:** November 2026  
**Module:** `web-app` (Frontend Citizen Interactive Walkthrough)  
**Theme:** CyberGuard Restrained Graphite / Mint Accent (`#3DF5C0`) / IBM Plex Typography  

---

## 1. Executive Summary & Core Principle

> **"ONEE IS THE GUIDE. ONEE IS NOT A CHATBOT."**

Onee is an interactive, animated visual character living inside CyberGuard that accompanies citizens through filing cybercrime incident reports. Onee observes form progress, identifies the active target field, scrolls the viewport smoothly, draws focus with a visual pointer and subtle mint highlight, provides concise 1–2 sentence guidance in a compact comic thought bubble, and reacts naturally to citizen input.

All generic chatbot elements, floating AI assistant panels, voice assistance widgets, and launcher buttons ("How can I help?", "Report Crime / Track Status / View Dashboard / Admin Hub") have been completely removed from the citizen reporting workflow.

---

## 2. Current UX Problems Identified & Rectified

| Area | Previous Anti-Pattern | Root Cause | Solution Implemented |
| :--- | :--- | :--- | :--- |
| **Home Page** | Chatbot + Voice Assistant buttons mounted directly under `REPORT INCIDENT` hero CTA. | Legacy `ChatBot.js` and `VoiceAssistant.js` rendered inside `Home.js`. | **Removed completely.** Hero is now clean, focused on the primary `REPORT INCIDENT` action. |
| **Chatbot Popup** | "How can I help?" input box, simulated AI chat replies, and application launcher shortcuts. | `ChatBot.js` mimicking ChatGPT/Copilot. | **Eliminated.** Onee is not an LLM chat widget; it is a contextual form guide. |
| **Citizen Mascot** | Large dialog popup with emergency helpline pill and multi-paragraph greeting popping up on all pages by default. | `CitizenAssistant.js` had `isBubbleOpen = true` and a bulky modal card. | **Replaced with unobtrusive floating character.** Default state is subtle `idle` animation in bottom-right corner; speech bubble is hidden until citizen clicks or hovers Onee. |
| **Complaint Form (`/submit`)** | Artificial "Start Guided Report with Onee" button in section header. | Unnecessary header trigger button. | **Removed.** Guidance starts organically with Onee docked at the active input. |
| **Progression Logic** | Hardcoded timers (`setTimeout(advanceToNext, 1600)`). | Fake timer-based advancement. | **Replaced with 100% state-driven progression.** Advances only on citizen focus or form completion. |
| **Visual Hierarchy** | Floating assistant cards obscuring the form. | Card-inside-card assistant layout. | **Strict hierarchy:** Target element → Directional pointer → Onee mascot → Compact speech bubble. |

---

## 3. Retained & Strengthened Guide Functionality

1. **Avatar Engine**: Official [Bible Strong Avatar Lab export](https://github.com/smontlouis/bible-strong-avatar-lab.git) procedural SVG animation runtime with all 22 verified animation definitions (`idle`, `waking`, `listening`, `searching`, `working`, `excited`, `happy`, `curious`, `confused`, `proud`, `sad`, `celebrate`, etc.).
2. **Dynamic Target Measurement**: `getBoundingClientRect()` measurements computed on focus, resize, and scroll.
3. **Smooth Viewport Centering**: Smooth auto-scroll brings off-screen inputs into comfortable center view before positioning Onee.
4. **Target Focus Ring (Spotlight)**: `#3DF5C0` 2px border around the active field with `pointer-events: none` and gentle pulse.
5. **In-Page Directional Pointer**: Clean SVG directional pointer arrow indicating the target from Onee.
6. **Adaptive Form Recognition**: Dynamic tracking of form state (`title`, `description`, `category`, `incidentDateTime`, `lostMoney`, `transactionReference`, `email`, `mobile`, `evidence`, `consentAgreed`).
7. **Instant Focus Tracking**: `focusin` listener glides Onee immediately to whichever field the citizen clicks.

---

## 4. Visual Hierarchy & Movement Model

```text
┌────────────────────────────────────────────────────────┐
│ CYBERGUARD COMPLAINT FORM                              │
│                                                        │
│   ┌──────────────────────────────┐                     │
│   │ Incident Type / Category    │                     │
│   │ [ UPI / Banking Fraud   ▼ ]  │ ◄── [POINTER ARROW] │
│   └──────────────────────────────┘           ▲         │
│         ▲                                    │         │
│   [MINT SPOTLIGHT RING]                    [ONEE]      │
│   (pointer-events: none)                     ▲         │
│                                              │         │
│                                     [THOUGHT BUBBLE]   │
│                             "Choose the option that    │
│                              best matches."            │
└────────────────────────────────────────────────────────┘
```

### Movement Rules:
- **Desktop**: Onee docks beside the active field (offset by +18px on the right, or left if near the edge).
- **Smooth Repositioning**: CSS transitions (`top 0.4s cubic-bezier(0.16, 1, 0.3, 1), left 0.4s cubic-bezier(0.16, 1, 0.3, 1)`).
- **Mobile (< 768px)**: Onee docks comfortably at the bottom-right corner without covering the centered input.

---

## 5. Animation State Mapping

| User Workflow Stage | Avatar Animation | Purpose |
| :--- | :--- | :--- |
| **Default Floating (Global)** | `idle` | Gentle, unobtrusive breathing motion |
| **Guide Entry (`intro`)** | `waking` | Friendly wake-up greeting to citizen |
| **Headline (`incident-title`)** | `listening` | Patient, attentive posture |
| **Narrative (`incident-description`)** | `searching` | Curious, investigative engagement |
| **Category Selection** | `curious` | Exploring incident type classification |
| **Financial Details** | `thinking` | Thoughtful assistance on loss amount |
| **UTR / Transaction Ref** | `working` | Verification posture |
| **Contact Info** | `listening` | Attentive recording |
| **Evidence Dropzone** | `curious` | Inspecting uploaded files |
| **Review & Declaration** | `proud` | Confident verification |
| **Submit Button** | `excited` | Ready to complete report |
| **Field Completion** | `happy` | Brief positive reinforcement |
| **Validation Error** | `confused` / `sad` | Empathetic guidance back to valid input |

---

## 6. Accessibility & Performance Compliance

- **Non-Blocking Interaction**: All guide overlays, spotlight rings, and pointer arrows use `pointer-events: none`. Form elements remain 100% interactive.
- **Accessible ARIA Labels**: `role="region"` with `aria-label="Onee Guide"`, `aria-live="polite"` status announcements on the speech bubble.
- **Keyboard Dismissal**: Pressing `Escape` minimizes Onee into a quiet bottom-right pill.
- **Motion Reduction**: Full support for `prefers-reduced-motion: reduce`. Disables bobbing, pulses, and transitions.
- **Zero Heavy Dependencies**: No new NPM packages, no LLM API calls, no runtime overhead.

---

## 7. Files Modified / Created

- `web-app/src/pages/Home.js` — Removed legacy `ChatBot` and `VoiceAssistant` components.
- `web-app/src/components/CitizenAssistant.js` — Redesigned into quiet, unobtrusive floating Onee mascot with 1-line speech bubble.
- `web-app/src/components/CyberReport.js` — Removed artificial header start button; form flows organically.
- `web-app/src/components/onee/OneeCompanion.jsx` — Cleaned docked companion with pointer arrow, spotlight ring, and compact speech bubble.
- `web-app/src/components/onee/useOneeGuideEngine.js` — 100% state-driven guide engine without timer progression.
- `web-app/src/components/onee/oneeGuideSteps.js` — Compact 1–2 sentence guidance steps matching natural CyberGuard workflow.
- `web-app/src/components/CitizenAssistant.test.js` — Updated unit tests.
- `web-app/src/components/onee/OneeCompanion.test.js` — Updated unit tests.

