# LMS Frontend (Web Application)

React + TypeScript + Vite + Tailwind v4. Serves Learners and Instructors —
see `../magana/9-1. information_architecture.md` for why this is one app
with role-gated sections rather than two.

## Setup

```
cp .env.example .env   # point VITE_API_URL at your local backend vhost
npm install
npm run dev
```

Requires `backend/` running (see `../backend/README.md`) with at least one
seeded account, since `/sign-in` is the only real destination right now.

## Structure

```
src/
├── app/
│   ├── App.tsx / routes.tsx     # information_architecture.md's Web Application tree, as routes
│   ├── components/
│   │   ├── Layout.tsx            # global chrome (org switcher, notifications, profile menu)
│   │   ├── ProtectedRoute.tsx
│   │   └── ui/                    # design_system.md's component inventory — Button, StatusPill so far
│   ├── context/AuthContext.tsx    # login/logout/me, current session
│   ├── pages/                     # one file per screen in screens.md
│   └── utils/
│       ├── apiBase.ts              # ApiError (mirrors errors.md's envelope), token storage
│       └── api.ts                   # fetch wrapper: If-Match / Idempotency-Key per request_response.md
└── styles/
    ├── colors.css                  # design_system.md's tokens — the one file to re-theme
    ├── fonts.css / theme.css / tailwind.css / index.css
```

## What's real vs. scaffolded

Sign In → session → protected Dashboard is a genuine working slice against
`backend/`'s Identity vertical slice. Every other screen in `screens.md` is
intentionally not built yet — that's Phase 12, once its backing domain
exists in the API (Phase 11).
