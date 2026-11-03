# UI quality gate

Mark **Done** only when every box is ticked for that screen.

## Debate V2 frames (2026-11-03)

Playwright verbatim + screenshot audit: **`npm run test:debate-v2-frames`** (after web export + `npx serve -s -l 4173 dist`).

| Area | No clip/overflow | Verbatim contract | Brand colors | Status |
| --- | --- | --- | --- | --- |
| D1–D10 | ✓ (audit) | ✓ | AGREE coral / DISAGREE teal | **Done** (dev previews + live online) |
| D3/D4/D5 12-player | ✓ | +N chip | ✓ | **Done** (audit PNGs) |
| S1–S3 | ✓ | ✓ | ✓ | **Done** |
| O1–O3 | ✓ | ✓ | ✓ | **Done** |
| A1–A3 | ✓ | ✓ | AUTH_LOOK dark | **Done** |

Artifacts: [`docs/audit/debate-v2/`](audit/debate-v2/)

## Other app screens

| Screen | Status |
| --- | --- |
| /welcome (onboarding) | Needs work |
| /how-it-works | Needs work |
| /choose-mode | Needs work |
| /home | Needs work |
| /debate hub | Partial |

Side-by-side PNG compare to design frames: optional follow-up (`docs/design-frames/debate-v2/` vs audit folder).
