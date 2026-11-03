# CyberGuard — Skill Architecture

> Maintained by the `skill-architect` skill. Re-run after major feature additions or stack changes.
> Last updated: 2026-11-02

---

## 1. Project Capability Map

Derived from live repository inspection (November 2026).

### Frontend (web-app — React 18, CRA/CRACO, Framer Motion, Recharts, Zustand, React Hook Form)

| Capability | Status | Notes |
|---|---|---|
| React component development | Covered | React 18, Lucide icons |
| Routing | Covered | react-router-dom v6 |
| State management | Covered | Zustand |
| Forms & validation | Covered | react-hook-form |
| UI design & consistency | Covered | Multiple design skills |
| Data visualization | Covered | Recharts + `dataviz` skill |
| Animation & motion | Covered | Framer Motion + many skills |
| Accessibility auditing | Partially | `impeccable audit` covers basics; no dedicated a11y skill |
| Frontend testing | Not Covered | No React Testing Library or Playwright skill |
| Performance auditing | Not Covered | No Lighthouse/perf skill |
| Map rendering | Covered | React-Leaflet |
| Three.js / 3D | Covered | @react-three/fiber + skill |
| Face detection | Covered | @vladmandic/face-api |
| OCR (client-side) | Covered | tesseract.js |

### Backend (Node.js, Express 4, MongoDB/Mongoose, Winston, Socket.io)

| Capability | Status | Notes |
|---|---|---|
| REST API design | Covered | Express routes + middleware |
| JWT authentication | Covered | jsonwebtoken |
| TOTP / 2FA | Covered | speakeasy + qrcode |
| RBAC | Covered | auth middleware |
| Input sanitization | Covered | express-mongo-sanitize, xss-clean, hpp |
| Rate limiting | Covered | express-rate-limit |
| Security headers | Covered | helmet |
| File upload / OCR | Covered | multer + tesseract.js |
| Email / SMS notifications | Covered | nodemailer + twilio |
| WebSocket real-time | Covered | socket.io |
| Cron jobs | Covered | node-cron |
| Structured logging | Covered | winston |
| API contract / OpenAPI | Not Covered | No schema validation or Swagger generation |
| API security testing | Not Covered | No automated API fuzzing or injection testing |
| Unit + integration tests | Partially | Jest + supertest present; coverage incomplete |
| Observability / tracing | Not Covered | No APM, no distributed tracing |
| Database indexing analysis | Not Covered | No Mongoose/MongoDB query optimization skill |

### ML Service (Python FastAPI, scikit-learn / custom classifier)

| Capability | Status | Notes |
|---|---|---|
| Complaint classification | Covered | classifier.py + preprocessor.py |
| Model training pipeline | Covered | train_model.py, generate_dataset.py |
| FastAPI REST interface | Covered | app.py |
| ML service integration | Covered | mlService.js in backend |
| Python code review | Not Covered | No Python-specific skill |
| ML testing / drift detection | Not Covered | No ML test skill |

### Mobile (Expo SDK 54, React Native 0.81, Reanimated 4, React Navigation)

| Capability | Status | Notes |
|---|---|---|
| Expo app development | Covered | expo start, all core packages |
| Navigation | Covered | React Navigation v6 |
| Push notifications | Covered | expo-notifications |
| Image / document picker | Covered | expo-image-picker, expo-document-picker |
| Animations | Covered | react-native-reanimated |
| Charts | Covered | react-native-chart-kit |
| Expo animation skill | Covered | animate-expo skill |
| iOS UI patterns | Covered | apple-design skill |
| Swift development | Not Relevant | Project uses Expo, not native Swift |
| Expo testing (Jest) | Not Covered | No Expo-specific test skill |

### Security (Domain-Critical)

| Capability | Status | Notes |
|---|---|---|
| Static security audit | Covered | `security-review` skill |
| Code review | Covered | `code-review` skill |
| Dependency vulnerability check | Not Covered | No `npm audit` / `snyk` automation skill |
| OWASP top-10 testing | Partially | `security-review` is manual, no automated testing |
| Secrets scanning | Not Covered | No pre-commit secrets scan skill |
| Threat modeling | Not Covered | No structured threat modeling skill |

### Operations / Deployment (Render free tier, Railway, Docker-less)

| Capability | Status | Notes |
|---|---|---|
| Render deployment | Covered | render.yaml, Procfile |
| Railway deployment | Covered | railway.json |
| Environment config | Covered | dotenv + envVars |
| Health checks | Covered | /health endpoint |
| Container definition | Not Present | No Dockerfile found |
| CI/CD pipeline | Not Covered | No .github/workflows detected |
| Monitoring / alerting | Not Covered | No APM, no structured error reporting |

---

## 2. Existing Skill Inventory

Sourced from `skills-lock.json`, `~/.claude/skills/`, and `~/.claude/settings.json`.

### User-level skills (~/.claude/skills/)

| Skill | Source | Category | Version | License | Project Relevance |
|---|---|---|---|---|---|
| `impeccable` | Built-in (Apache 2.0) | UI/UX, Design System | 4.8.0 | Apache 2.0 | **High** — primary UI design skill |
| `avoid-ai-design` | ungspirit (MIT) | UI/Frontend | 0.4.0 | MIT | **High** — active design requirement |
| `skill-architect` | Custom (this project) | Meta/Tooling | 1.0.0 | MIT | **High** — this skill |

### Project-level skills (skills-lock.json, ~/.claude/skills/ via lock)

| Skill | Source | Category | License Known | Project Relevance |
|---|---|---|---|---|
| `animate` | emilkowalski/skills | Animation | MIT | **High** — Framer Motion used |
| `animate-expo` | emilkowalski/skills | Mobile/Animation | MIT | **High** — Expo app exists |
| `animation-performance` | emilkowalski/skills | Animation/Perf | MIT | Medium |
| `animation-vocabulary` | emilkowalski/skills | Animation | MIT | Low |
| `apple-design` | emilkowalski/skills | Mobile/Design | MIT | Medium — iOS UI patterns |
| `ask-sonner` | emilkowalski/skills | Frontend/Toast | MIT | Low — project uses react-hot-toast |
| `break-ui` | emilkowalski/skills | QA/Frontend | MIT | Medium |
| `design-taste-frontend` | Leonxlnx/taste-skill | UI/Design | MIT | Medium |
| `emil-design-eng` | emilkowalski/skills | Design Engineering | MIT | Medium |
| `find-animation-opportunities` | emilkowalski/skills | Animation | MIT | Low |
| `gpt-taste` | Leonxlnx/taste-skill-classics | UI/Design | MIT | Low — overlaps impeccable |
| `gsap-scrolltrigger` | freshtechbro/claudedesignskills | Animation | Unknown | Low — project uses Framer Motion |
| `gsap-webflow` | francesco-castronuovo/... | Animation | Unknown | None — not a Webflow project |
| `high-end-visual-design` | Leonxlnx/taste-skill-classics | UI/Design | MIT | Low — overlaps impeccable |
| `improve-animations` | emilkowalski/skills | Animation | MIT | Medium |
| `material-design-3-ui` | skydashnet/... | UI/Design System | Unknown | None — project uses custom theme |
| `minimalist-ui` | Leonxlnx/taste-skill | UI/Design | MIT | Low — overlaps impeccable |
| `mobile-native` | emilkowalski/skills | Mobile | MIT | High |
| `motion-framer` | freshtechbro/claudedesignskills | Animation | Unknown | High — Framer Motion is the primary motion lib |
| `pick-ui-library` | emilkowalski/skills | Frontend | MIT | Low — library already chosen |
| `prototype` | emilkowalski/skills | Frontend | MIT | Medium |
| `redesign-existing-projects` | Leonxlnx/taste-skill | UI/Design | MIT | Low — overlaps impeccable |
| `remove-animations` | emilkowalski/skills | Animation | MIT | Low |
| `review-animations` | emilkowalski/skills | Animation | MIT | Medium |
| `tailwind-expert` | Ortus-Solutions/skills | Frontend/CSS | Unknown | None — project does not use Tailwind |
| `threejs-webgl` | freshtechbro/claudedesignskills | 3D/WebGL | Unknown | Medium — three.js is in web-app |
| `ui-animation` | mblode/agent-skills | Animation | Unknown | Low — overlaps animate |
| `write-swift` | emilkowalski/skills | Mobile/iOS | MIT | None — Expo project, not Swift |

### Built-in Claude Code skills (always available, no install needed)

| Skill | Category | Relevance |
|---|---|---|
| `code-review` | Code Quality | **High** |
| `security-review` | Security | **High** |
| `simplify` | Code Quality | High |
| `dataviz` | Data Visualization | High |
| `run` | DevEx | High |
| `update-config` | DevEx/Config | Medium |
| `loop` | Automation | Medium |
| `claude-api` | AI Integration | Medium |
| `workflow-authoring` | Automation | Medium |
| `fewer-permission-prompts` | DevEx | Medium |
| `keybindings-help` | DevEx | Low |
| `init` | Project Setup | Low |
| `animate` | Animation | High (duplicated with lock) |
| `mobile-native` | Mobile | High (duplicated with lock) |
| `improve-animations` | Animation | Medium (duplicated) |
| `remove-animations` | Animation | Low (duplicated) |
| `apple-design` | Mobile/Design | Medium (duplicated) |
| `write-swift` | iOS | None (duplicated) |
| `find-animation-opportunities` | Animation | Low (duplicated) |
| `animation-performance` | Animation | Low (duplicated) |
| `animation-vocabulary` | Animation | None (duplicated) |
| `ask-sonner` | Frontend | Low (duplicated) |
| `break-ui` | QA | Medium (duplicated) |
| `emil-design-eng` | Design Eng | Medium (duplicated) |

---

## 3. Redundancy Analysis

### UI/Design cluster (7 skills, 3–4 redundant)

`impeccable` (v4.8, Apache 2.0) covers: audit, critique, polish, shape, harden, animate, bolder, quieter, colorize, layout, typeset, accessibility, mobile, iOS, Android, DESIGN.md generation.

`avoid-ai-design` (v0.4, MIT) covers: detect and remove AI-generated design patterns, with a zero-dependency scanner script. **Non-redundant** with impeccable — it runs a code-level scanner that impeccable does not have.

`design-taste-frontend` — subjective UI taste guidance. Redundant with impeccable's direction-setting workflow.

`minimalist-ui` — minimalist aesthetic skill. Redundant given impeccable's `distill` and `quieter` commands.

`high-end-visual-design` — premium/luxury design aesthetic. Redundant given impeccable's `bolder` and direction system.

`gpt-taste` — another taste/aesthetic skill. Redundant.

`redesign-existing-projects` — overlaps impeccable's redesign workflow entirely.

**Verdict:** Keep `impeccable` + `avoid-ai-design`. Mark the other 5 as IGNORE (remove if desired).

### Animation cluster (12+ skills)

Core need: Framer Motion (web) + Reanimated (mobile).

`animate` — covers Framer Motion web animations. **Keep.**
`animate-expo` — covers Expo/Reanimated mobile. **Keep.**
`motion-framer` — covers Framer Motion. **Redundant with `animate`.** Remove.
`improve-animations` — audits and improves existing animations. **Keep** (different job than animate).
`review-animations` — reviews animation quality. **Partially redundant** with improve-animations. Low priority keep.
`animation-performance` — performance guidance for animations. **Keep** (unique focus on 60fps).
`animation-vocabulary` — vocabulary/naming guide. Low value. **Remove.**
`find-animation-opportunities` — discovers where to add motion. Low value. **Remove.**
`remove-animations` — strips animations. Low value. **Remove.**
`gsap-scrolltrigger` — GSAP-specific. Project uses Framer Motion, not GSAP. **Remove.**
`gsap-webflow` — Webflow-specific. Project is not on Webflow. **Remove.**
`ui-animation` — generic animation. Redundant with `animate`. **Remove.**
`threejs-webgl` — Three.js/WebGL. Project uses @react-three/fiber. **Keep** (Three.js is in web-app).

### Non-relevant skills

`write-swift` — project uses Expo, not native Swift. **Remove.**
`tailwind-expert` — project uses plain CSS, not Tailwind. **Remove.**
`material-design-3-ui` — project uses custom teal/slate theme. **Remove.**
`gsap-webflow` — Webflow-only. **Remove.**
`pick-ui-library` — library already chosen (Lucide + custom). **Remove.**
`ask-sonner` — project uses react-hot-toast, not Sonner. **Remove.**

---

## 4. Capability Gaps (Priority Ordered)

### P0 — Critical

| Gap | Why Critical |
|---|---|
| **Dependency vulnerability scanning** | Security-sensitive domain (citizen data, evidence). npm audit is manual; no skill automates it. |
| **Secrets scanning** | JWT secrets, API keys (Gemini, Twilio, MongoDB URI) in env. No pre-commit guard skill. |

### P1 — High Value

| Gap | Why High Value |
|---|---|
| **API documentation generation** | Backend has 9 route files; no OpenAPI/Swagger skill. Integration with ML service and mobile app requires clear contracts. |
| **Frontend testing** | No React Testing Library or Playwright skill. CyberReport, TwoFactorModal, and auth flows have no frontend test coverage skill. |
| **CI/CD pipeline** | No GitHub Actions or CI skill. Render deploys manually. |
| **Python/ML code review** | Backend ml-service is Python FastAPI; no skill covers Python-specific quality or FastAPI best practices. |

### P2 — Useful

| Gap | Why Useful |
|---|---|
| **Observability / structured error reporting** | Render free tier has cold starts; winston logs exist but no APM or error aggregation skill. |
| **MongoDB performance / indexing** | Complaint queries, analytics, and graph analysis at scale need index strategy guidance. |
| **Accessibility dedicated audit** | `impeccable audit` covers basics but a dedicated a11y skill (axe-core workflow) would be more thorough. |

### P3 — Optional

| Gap | Why Optional |
|---|---|
| **Threat modeling** | Security domain would benefit, but `security-review` covers manual review already. |
| **Expo testing** | Jest + Expo exists; no structured Expo test skill, but test patterns are documented. |

---

## 5. Scoring Methodology

| Dimension | Weight |
|---|---|
| Project Relevance | 2× |
| Skill Quality | 1× |
| Maintenance | 1× |
| Compatibility | 1× |
| Unique Capability | 1.5× |
| Security Confidence | 1.5× |

**Total weight = 8. Threshold for recommendation = 3.5 weighted average.**

Penalties: −1.0 redundant, −0.5 stale (>6 months), −0.5 complex config, −1.5 AGPL/GPL.

---

## 6. Rejected Candidates

| Candidate | Reason for Rejection |
|---|---|
| Additional GSAP skills | Project uses Framer Motion; GSAP redundant |
| Webflow-specific skills | Project not on Webflow |
| Tailwind-specific skills | Project does not use Tailwind |
| Swift/native iOS skills | Project uses Expo cross-platform |
| Material Design skills | Project has its own theme; MD3 not used |
| Sonner toast skill | Project uses react-hot-toast |

---

## 7. Future Skill Discovery Process

Run `skill-architect` again when:

1. A new major dependency is added (e.g., adopting Playwright, switching to Next.js)
2. A new service is added (e.g., Redis caching, PostgreSQL)
3. Deployment target changes
4. Security audit reveals a new attack surface
5. More than 3 months since last skill audit

The skill reads live repository state each run. It does not rely on cached snapshots.

---

## 8. License and Security Considerations

| Skill Source | License Status |
|---|---|
| `emilkowalski/skills` | MIT — safe |
| `Leonxlnx/taste-skill` | MIT — safe |
| `freshtechbro/claudedesignskills` | **License not confirmed in lock file** — verify before adoption |
| `francesco-castronuovo/gsap-webflow-skill` | **License not confirmed** — flagged for removal |
| `skydashnet/material-design-3-ui-skill` | **License not confirmed** — flagged for removal |
| `mblode/agent-skills` | **License not confirmed** — flagged for removal |
| `Ortus-Solutions/skills` | **License not confirmed** — flagged for removal |
| Built-in Claude Code skills | Anthropic — safe |

**Action required:** Before next deployment, verify licenses for the 5 flagged sources above. If unconfirmed, treat as IGNORE and remove from skills-lock.json.
