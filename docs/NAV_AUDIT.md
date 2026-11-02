# Navigation audit

Tab roots (no back): `/home`, `/decks`, `/journey`, `/profile`, `/play` (redirect).

| Route | Tab root? | Back control | Fallback parent | Design back? |
|-------|-----------|--------------|-----------------|--------------|
| `/welcome` | no | ScreenHeader / Back | `/auth/welcome` | Onboarding frame |
| `/how-it-works` | no | Back | `/welcome` | Onboarding |
| `/choose-mode` | no | Back | `/how-it-works` | Onboarding |
| `/auth/*` | no | Back / Cancel | auth welcome or home | Accounts frames |
| `/groups` | no | Back | `/home` | Groups flow |
| `/groups/create` | no | Cancel | `/groups` | New group modal |
| `/groups/join` | no | Back | `/groups` | Join code |
| `/groups/[id]` | no | Back | `/groups` | Group profile |
| `/groups/[id]/lobby` | no | **ScreenHeader** | `/groups/[id]` | B5 Group Lobby |
| `/debate` | no | Back | `/home` | Learn hub style |
| `/debate/*` | no | Back / Exit | `/debate` | Game frames |
| `/setup`, `/game/*` | no | Back | `/play` or `/home` | Gameplay |
| `/learn/*` | no | Back | `/learn` or parent | Study frames |
| `/community`, `/share` | no | Back | `/home` | Social |
| `/deck/[id]` | no | Back | `/decks` | Decks |

Implementation: shared `ScreenHeader` + `goBackOr(fallback)`. Lobby clears Realtime Presence on back.

Screenshots of routes that lacked back before this pass: `docs/audit/nav/` (Playwright capture).
