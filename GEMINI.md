# Master UI Guidelines & Design Contract

You are an AI-assisted frontend engineer using the installed design and motion skills:
- Design: `design-taste-frontend`, `high-end-visual-design`, `redesign-existing-projects`, `gpt-taste`, `minimalist-ui`, `impeccable`
- Motion & Interactions: `motion-framer`, `gsap-scrolltrigger`, `gsap-webflow`, `threejs-webgl`, `emil-design-eng`, `animate`

Follow these strict rules:

## 1. Scope Restriction
- **Do NOT change any functionality**.
- Only edit presentation: CSS, layout, spacing, typography, and accessibility.
- Preserve all existing routes, state, data, logic, and APIs.

## 2. Design Direction
- Use the CyberGuard-style theme: graphite/slate neutral backgrounds, teal/cyan accent color, IBM Plex Sans for body text, and IBM Plex Mono for technical text.
- Maintain consistent border radius (no mixing sharp/pill across same component types), consistent color usage, and WCAG-AA contrast.

## 3. Typography
- Headings and UI text use IBM Plex Sans (or Inter where already standardized), with technical readouts in IBM Plex Mono.
- No decorative or novelty fonts (avoid random Poppins, Brush, etc.).
- Follow a consistent scale (heading ~2.5rem desktop, ~1.5rem mobile; body ~1rem).

## 4. Responsive Breakpoints
- Layout must function cleanly at 320px, 390px, 768px, 1024px, and 1440px widths.
- No horizontal scrollbars or cut-off text at any breakpoint.

## 5. Anti-Slop Bans (Strict Anti-Patterns)
Remove all "AI-generated" generic decorative tropes:
- No neon or purple glow effects.
- No background-image gradients or text gradients.
- No gratuitous glassmorphism (blur/glass overlays).
- No fixed 4px left borders as decorative markers.
- No unnecessary nested card styles (no cards-within-cards).
- No hero decoration strips (monocase taglines under hero).
- No photo credit overlays, version footers, locale strips, or random scroll cues.
- No fake UI spinners or lists of dummy elements.

## 6. Buttons & Controls
- Shared design tokens: consistent height (~44-52px), radius (~8px), explicit hover states, focus rings, and high contrast.
- Primary CTA: teal/cyan accent with clear high-contrast text.
- Secondary: slate background with subtle border and readable text.

## 7. Layout Consistency
- Navbar, header, and content containers must share the same max-width and horizontal padding.
- Align content under the main navigation grid.
- Consistent spacing scale (8px, 16px, 24px, 32px, 48px).

## 8. Accessibility
- Maintain semantic HTML, visible keyboard focus rings, and explicit `aria-label`s on icon-only buttons.
- Minimum 4.5:1 text contrast ratio (WCAG-AA).
- Minimum legible label size ≥13px.

## 9. Animation & Motion Guidelines
- Prefer Framer Motion (`motion-framer`) or GSAP (`gsap-scrolltrigger`, `gsap-webflow`) for interaction choreographies and reveals.
- Always respect `prefers-reduced-motion` with graceful static fallbacks.
- Keep motion purposeful and subtle (e.g., drawer transitions, modal pop-ins, chart reveals); strictly no infinite decorative loops or distracting pulse effects.
- Preserve 60fps performance budget (animate composite-only properties: `transform`, `opacity`).

## 10. Verification & Safety
- Run builds (`npm run build`) to ensure zero compile or type errors.
- Run Impeccable design audits (`.gemini/skills/impeccable/scripts/impeccable.cmd detect`).
- Work cleanly and review git status (`git status --short`, `git diff --stat`) before completing tasks.
