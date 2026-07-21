# CLAUDE.md — SafeSeizure Project

Guidance for Claude Code (and any contributor) working in this repo.
SafeSeizure is a low-cost wearable seizure-alert system (Arduino Nano 33 BLE
Sense + TinyML) with a Flutter caregiver app, and a future doctor web
dashboard. It handles **health data for a vulnerable population** — treat
every default as "protect the patient" first.

---

## 1. Design System

Match the reference mockup style exactly. Do not substitute a generic
Material/iOS default theme.

### Colors
| Token | Hex | Use |
|---|---|---|
| `bg-canvas` | `#A79A8C` | Outer app background / marketing frame only, not in-app |
| `bg-screen` | `#FFFFFF` → `#FDEEE0` (gradient) | Screen background, top-to-bottom soft peach fade |
| `accent-primary` | `#F2A742` | Primary buttons, active pill filters, icon circles, chart bars, highlight callouts |
| `accent-primary-dark` | `#D98C2B` | Pressed/hover state of primary |
| `text-heading` | `#1A1A1A` | Headings, primary values |
| `text-secondary` | `#8A8A8A` | Labels, captions, meta text |
| `surface-card` | `#FFFFFF` | Cards, sheets |
| `border-subtle` | `#ECECEC` | Card outlines, inactive pill borders |
| `status-green` | `#3FB56A` | Monitoring / safe state |
| `status-amber` | `#F2A742` | Suspected state (reuse primary) |
| `status-red` | `#E5484D` | Alarm state |

### Typography
- Font family: Inter, SF Pro, or system sans (rounded, humanist) — never a
  serif or a default browser font.
- Headings: bold, large (24–32px), `text-heading`.
- Body/labels: regular weight, `text-secondary`, smaller (12–14px).
- Data values: bold, `text-heading`, paired directly under a small gray label.

### Components
- **Cards**: white, 20–24px corner radius, soft shadow (`0 4px 16px rgba(0,0,0,0.06)`), no visible border.
- **Icon-in-circle**: amber filled circle (~40px) with a white line icon inside — recurring motif for every stat/category tile.
- **Pill filters**: active = filled `accent-primary` with white text; inactive = white background, thin `border-subtle`, dark text.
- **Buttons**: primary = solid amber, white text, fully rounded; secondary = white fill, dark border/text.
- **Status indicator**: green / amber / red dot or badge — used for Monitoring / Suspected / Alarm states. This maps directly to SafeSeizure's state machine (Section 4.3 of the proposal) — don't reuse it for anything else.
- **Bottom sheet**: drag-handle bar at top, used for supplementary/expandable data (e.g. seizure diary entries).
- **Bottom nav**: max 5 icons, active icon sits inside a dark filled pill.

### Do
- Keep every screen's status bar mock consistent if building marketing mockups.
- Use the label-over-value pattern for all metrics (small gray label, bold black value).

### Don't
- Don't introduce a second accent color — amber is the single brand accent.
- Don't use hard black (`#000`) — use `text-heading` (`#1A1A1A`).

---

## 2. Data & Privacy Rules (Non-negotiable)

SafeSeizure stores seizure events, timestamps, and (in the roadmap dashboard)
patient location and medical notes. This is sensitive health data under
Rwanda's Law No. 058/2021 and general good practice.

- **Never commit real patient data.** No real names, real seizure logs, real
  location traces, or real medical notes in the repo, fixtures, screenshots,
  or commit messages — synthetic/mock data only (e.g. "Jackson Wang",
  "#RM-00852" style placeholders are fine).
- **No secrets in code.** API keys, BLE pairing secrets, Firebase/Supabase
  keys, doctor-dashboard auth tokens, Edge Impulse project keys — all go in
  environment variables, never hardcoded.
- **`.gitignore` must always include** (create/verify this file):
  ```
  .env
  .env.*
  *.pem
  *.key
  google-services.json
  GoogleService-Info.plist
  /build/
  /.dart_tool/
  *.ei_project
  /data/patient_exports/
  *.db
  *.sqlite
  ```
- **Before every commit/push**, scan the diff for: patient identifiers,
  location coordinates, phone numbers, medical notes, hardcoded credentials.
  If found, stop and flag it instead of committing.
- **Location data is opt-in and revocable** per the proposal — never wire it
  to always-on tracking by default in code or mock data.
- **No PHI in logs.** Debug/print statements must not log seizure event
  content, patient name, or GPS coordinates — log event *types* and
  timestamps only if needed.
- When scaffolding the doctor dashboard, default every new endpoint to
  authenticated + role-restricted access; never scaffold an open/public
  route for patient data "to test faster."

## 3. Repo hygiene

- Keep the wearable firmware (Arduino/TinyML), the Flutter app, and the
  (future) dashboard in clearly separated top-level folders
  (`/firmware`, `/app`, `/dashboard`).
- Don't check in trained model binaries or exported Edge Impulse libraries
  unless explicitly requested — they're large and reproducible from the
  Edge Impulse project.
- README should always state clearly: "SafeSeizure is a proof-of-concept,
  not a certified medical device" — keep this framing anywhere the project
  is described publicly (README, App Store copy, dashboard footer).

## 4. Folder Structure

Top-level layout — three independent workstreams that stay separated:

```
safeseizure/
├── firmware/                  # Arduino Nano 33 BLE Sense / TinyML
│   ├── src/                   # Arduino sketch(es), state machine logic
│   ├── models/                # Exported Edge Impulse library (gitignored — see below)
│   ├── data/                  # Raw motion-capture samples used for training
│   │   └── README.md          # Must state: synthetic/simulated data only, no real patient recordings
│   └── docs/                  # Wiring diagrams, pin mappings, hardware notes
│
├── app/                        # Flutter caregiver app
│   ├── lib/
│   │   ├── screens/            # One folder per screen (pairing, home, alarm, diary, profile)
│   │   ├── widgets/             # Shared components (status_badge, event_card, pill_filter, etc.)
│   │   ├── services/           # BLE service, notifications, local storage
│   │   ├── models/              # Data classes (SeizureEvent, DeviceState, Patient)
│   │   ├── theme/                # Centralized colors/typography — pulls from Section 1 of this file
│   │   └── main.dart
│   ├── test/
│   └── assets/
│       └── mock_data/           # Synthetic seizure diary entries for dev/demo — never real logs
│
├── dashboard/                  # Doctor web dashboard (roadmap — scaffold only when started)
│   ├── frontend/
│   ├── backend/
│   │   └── .env.example         # Committed template only; real .env is gitignored
│   └── docs/
│       └── DATA_PROTECTION.md   # Consent flow, encryption approach, Rwanda Law 058/2021 notes
│
├── design/                     # Design system + Stitch/Figma exports
│   ├── STITCH_PROMPT.md
│   └── style-guide.md           # Mirrors Section 1 tokens so design + code never drift
│
├── docs/                        # Project-level docs
│   └── SafeSeizure_Proposal.md  # Source-of-truth proposal, kept in sync with any scope changes
│
├── .gitignore
├── CLAUDE.md
└── README.md
```

**Rules for this structure:**
- A file only lives at the top level if it's genuinely project-wide
  (`.gitignore`, `CLAUDE.md`, `README.md`). Everything else belongs inside
  one of the four workstream folders.
- `firmware/data/` and `app/assets/mock_data/` are the only places sample
  seizure data should exist, and both must be synthetic — flag anything
  that looks like a real, timestamped patient log for review before it's
  added here.
- New Flutter screens go under `app/lib/screens/<screen_name>/`, matching
  the six screens defined in `design/STITCH_PROMPT.md`, so the design and
  code stay screen-for-screen aligned.
- Nothing under `dashboard/backend/` should contain real `.env` values —
  only `.env.example` with placeholder keys is committed.
- When scaffolding a new top-level folder outside this structure, check
  with the project owner first rather than improvising a new convention.