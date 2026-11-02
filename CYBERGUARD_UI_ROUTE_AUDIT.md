# CyberGuard Route-by-Route UI Audit

Audit scope: all routes declared in `web-app/src/App.js`. Public routes were visually screenshotted. Protected routes were reviewed from source and access rules. This document was updated after the shared UI-system and source-wide anti-slop migration passes.

## Health Score

| Dimension | Score | Key Finding |
|---|---:|---|
| Accessibility | 3/4 | Shared focus states and icon labels are improved; full keyboard/mobile verification remains |
| Performance | 3/4 | Production build succeeds; some route-local motion and large feature bundles remain |
| Theming | 3/4 | Shared tokens and solid surfaces are established; legacy inline colors remain in some feature-specific states |
| Responsive Design | 2/4 | Shared responsive rules exist; dense admin/navigation routes still need device verification |
| Implementation Integrity | 3/4 | Shared controls and icon system are in place; some pages still need deeper structural migration |
| **Total** | **14/20** | **Improved — foundation is implemented; route-level refinement remains** |

## Highest-Priority Findings

1. **Dashboard hierarchy remains:** `Dashboard.js` and `AdminDashboard.js` still need a deeper operational-information redesign, although the shared visual normalization removed the major glow/gradient treatment.
2. **Decorative cyberpunk copy remains:** Tracking, scam search, leak monitoring, forensic, and developer surfaces still contain feature-local terms such as "neural scan" and "command center" that should be edited toward task language.
3. **Shared control migration is underway:** Core Button, IconButton, Field, TextInput, Select, and Textarea primitives exist; admin tables, filters, panels, and page headers still need migration.
4. **Theming drift is reduced, not eliminated:** Shared tokens now govern the global system, but feature-specific inline status colors and spacing remain in several routes.
5. **Status clarity is improved:** Labels and accessible icon controls are present in migrated components; complete status/icon adoption across admin tables remains.
6. **Dense navigation/control patterns remain:** Inner routes still inherit busy desktop navigation and crowded tool controls that require mobile verification.

## Route Findings

| Route | Surface | Verification | Finding | Severity |
|---|---|---|---|---|
| `/` | Public home | Approved screenshot/reference | Keep unchanged | None |
| `/login` | Public authentication | Screenshot verified | Dark glass-like panel, weak secondary text contrast, stylized button copy, decorative credentials box | P1 |
| `/register-choice` | Public registration | Screenshot verified | Role cards feel like a generic selection template; inconsistent card-fill states and dense uppercase labels | P1 |
| `/register` | Public registration | Screenshot verified | Functional form has weak hierarchy and decorative dark surfaces | P2 |
| `/track/:complaintId?` | Public tracking | Screenshot verified | "Zero Knowledge", "Liquid Sync", and "Neural Scan" obscure the actual tracking task | P1 |
| `/scam-search` | Public search tool | Screenshot verified | Oversized radar-style title, decorative borders, template copy, and weak result hierarchy | P1 |
| `/leak-monitor` | Public search tool | Screenshot verified | Excessive command-center styling around a simple email lookup | P1 |
| `/threat-map` | Public map | Screenshot verified | Dense app-shell chrome competes with the map; decorative heading and category legend need restraint | P1 |
| `/feedback` | Public form | Screenshot verified | Long dense form, weak grouping, repeated dark surfaces, OTP action placed too late | P2 |
| `/faq` | Public help | Screenshot verified | Every answer uses the same large row; page is not grouped or visually scannable | P1 |
| `/submit` | Protected complaint workflow | Source reviewed | Repeated inline cards and unclear wizard hierarchy; complaint filing is a P0 task to simplify | P1 |
| `/dashboard` | Protected user/admin | Screenshot and source reviewed | Promotional game banner, four metric cards, glows, animation, and template complaint list | P1 |
| `/complaint/:complaintId` | Protected detail | Source reviewed | Needs authenticated visual verification and a stable detail/status/action hierarchy | P1 |
| `/community` | Protected community | Source reviewed | Card/feed presentation risks generic social-template styling and inconsistent status controls | P2 |
| `/chat` | Protected chat | Source reviewed | Verify message density, unread states, composer focus, and mobile keyboard behavior | P2 |
| `/officer` | Officer operations | Source reviewed | Metrics and decorative panels may precede the actual incident queue and required actions | P1 |
| `/developer` | Protected developer tools | Source reviewed | Decorative stat strips and technical accents make developer operations less scanable | P1 |
| `/settings` | Protected settings | Source reviewed | Glass effects and inline styling risk; group settings with tabs or sections instead of stacked cards | P1 |
| `/learn` | Protected education | Source reviewed | Emoji/interface icon risks, repeated lesson cards, and excessive multi-color accents | P1 |
| `/forensic-scanner` | Protected tool | Source reviewed | Replace decorative scanner treatment with clear input, processing, result, and error states | P1 |
| `/suspect-search` | Protected tool | Source reviewed | Search/result workflow needs restrained chrome and stronger result scannability | P1 |
| `/admin` | Admin operations | Source reviewed | Counter animation, 32px card radius, badges, glows, uppercase labels, and generic stat panels | P1 |
| `/admin/complaints` | Admin operations | Source reviewed | Convert to a dense complaint queue with persistent filters, clear status, and bulk actions | P1 |
| `/admin/ml` | Admin operations | Source reviewed | Remove dashboard ornament; clarify model health, prediction controls, inputs, and outputs | P1 |
| `/admin/users` | Admin operations | Source reviewed | Heaviest inline styling area; migrate table/cards/modals to shared primitives | P1 |
| `/admin/info` | Admin alias for users | Source reviewed | Inherits all user-management issues; verify the route should remain an alias or be separated | P1 |
| `/admin/analytics` | Admin operations | Source reviewed | Numerous charts and counters risk rainbow analytics and weak task hierarchy | P1 |
| `/admin/database` | Admin operations | Source reviewed | Use restrained technical controls and explicit, reversible destructive actions | P1 |
| `/admin/link-analysis` | Admin operations | Source reviewed | Graph/table workspace needs clear split, stable controls, and fewer glow panels | P1 |
| `/admin/map` | Admin map | Source reviewed | Keep geography prominent; remove app-shell decoration that competes with the map | P2 |
| `/admin/mails` | Admin operations | Source reviewed | Mail operations need clear list hierarchy, status, actions, and low-decoration controls | P1 |
| `/admin/safety` | Officer/admin safety | Source reviewed | Safety controls need unambiguous grouping and confirmation states | P1 |

## Systemic Patterns

- Decorative gradients, radial glows, and atmospheric backgrounds were identified as systemic risks and have been removed from the shared stylesheet and normalized across the remaining page/component source.
- Global uppercase Orbitron heading treatment has been removed; legacy route-local technical labels remain only where they are part of feature copy and still need editorial cleanup.
- The shared palette now defines primary, success, warning, danger, text, surface, and border roles; some feature-specific status maps still need consolidation.
- Shared `Button`, `IconButton`, `Field`, `TextInput`, `Select`, and `Textarea` primitives now exist and are used by the highest-impact migrated components.
- Status communication is improved through text and labels, but full icon/status adoption across all admin tables remains.
- Route-local inline layout and control styles remain the main follow-up area, especially in admin pages and specialized tools.

## Positive Findings

- The homepage and navbar are approved visual references and should remain unchanged.
- Public routes load successfully and have clear underlying tasks.
- Login, registration, complaint tracking, scam search, leak search, threat map, feedback, and FAQ are all reachable.
- Functional content exists for real geographic, complaint, filtering, and help workflows.

## Recommended Implementation Order

1. Create shared Button, IconButton, Field, Badge, Panel, Modal, and PageHeader primitives.
2. Redesign Dashboard and AdminDashboard as incident operations workspaces.
3. Simplify CyberReport, complaint details, tracking, and search flows.
4. Apply shared primitives to Settings, Community, Chat, Learn, Developer, and Officer routes.
5. Convert admin routes to consistent filters, queues, tables, forms, and confirmation patterns.
6. Verify every changed page on desktop, mobile, keyboard-only navigation, and reduced-motion settings.

## Post-Implementation Correction

The original route table is a baseline audit, not a claim that every listed issue remains unresolved. The following items are now complete:

- Shared visual tokens and solid surface rules are defined in `web-app/src/index.css`.
- `Button`, `IconButton`, `Field`, `TextInput`, `Select`, and `Textarea` primitives are present in `web-app/src/components/`.
- `UiIcon` uses SVG icons through `lucide-react` instead of Unicode glyph fallbacks.
- ChatBot, VoiceAssistant, and TwoFactorModal were migrated away from neon glassmorphism and sci-fi presentation.
- CyberReport’s main form was reduced from a three-column layout to a two-column workflow.
- A source-wide normalization pass removed repeated inline blur backdrops, radial background overlays, gradient fills, Orbitron body styling, and common glow shadows from the remaining pages/components, excluding the approved `Home.js` and `Navbar.js` references.
- The production build completed successfully after the migration.

Remaining work is route-level refinement rather than a greenfield redesign: migrate more inline controls to the shared primitives, consolidate status maps, simplify admin information hierarchy, remove decorative product language from individual routes, and verify responsive/keyboard behavior on real rendered pages.
