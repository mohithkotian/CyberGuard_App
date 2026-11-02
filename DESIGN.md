# CyberGuard UI contract

## Direction
CyberGuard is an incident-response console, not a sci-fi demo. The interface should feel calm, credible, and operational: people need to report, triage, investigate, and resolve incidents quickly.

## Surfaces
Use opaque layered surfaces instead of decorative glass. `--bg` is the page canvas, `--bg-card` is a working surface, and `--bg-popover` is an elevated overlay. Do not nest more than two bordered surfaces.

## Color roles
- Primary action: cyan `#28B7E8`
- Success: teal `#2EBF8F`
- Warning: amber `#D8A43A`
- Danger: coral `#D96464`
- Text: `#EEF5F7`, secondary `#A8BBC3`, muted `#7E929B`
- Borders: subtle cool gray-blue, never neon by default

## Type
Inter is the working face for body copy, navigation, controls, and data. Orbitron is reserved for the product mark and rare technical labels. Headings use sentence case and do not default to uppercase.

## Components
All interactive controls should converge on shared Button, IconButton, Field, Badge, Panel, Modal, and PageHeader primitives. Icon-only controls require accessible labels. Status is always communicated with text in addition to color.

## Motion
Use motion only to clarify state changes. No repeated entrance animation on every card, no infinite decorative pulse, and always honor `prefers-reduced-motion`.

## Anti-patterns removed
- Decorative gradients and full-screen glows
- Backdrop blur as a default card treatment
- Nested rounded glass cards
- Unicode/emoji icons as UI controls
- Every heading being uppercase Orbitron
- Rainbow metric cards and decorative stat strips
- Arrow glyphs stapled to every CTA
