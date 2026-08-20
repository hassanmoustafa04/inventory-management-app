# منصة IGCSE — Arabic Learning Hub & Tutoring Platform 🇰🇼

An Arabic-first (RTL) platform for an IGCSE teacher in Kuwait: a public library
of teaching resources, lesson booking, and a curated teacher network — with a
mobile-friendly dashboard that runs all of it.

## Features

### Public
- **Landing page** — hub positioning, featured resources, packages, FAQ
- **Resource library** (`/resources`) — filter by subject / level / type, full-text
  search, four access tiers, download counters
- **Resource pages** — details, gated download, cross-sell to a lesson, related files
- **Booking wizard** (`/book`) — 4 steps against real availability, no account needed
- **Booking status page** (`/booking/[code]`) — track or cancel with the booking code
- **Teacher network** (`/teachers`) — approved contributors and how to apply

### Members (`/auth/register`)
- Free student accounts unlock the `member` tier instantly
- Teacher applications go to a review queue; approval unlocks the `teacher` tier
- `/me` — access tiers, download history, bookings (matched by phone), submissions
- Approved teachers can submit resources (`/me/upload`) for review

### Owner dashboard (`/teacher`)
- Today's lessons, pending booking requests, monthly income, library stats
- Bookings with filters and one-tap confirm / decline / complete
- **Library** — upload, edit, feature, delete resources; per-file download counts
- **Review queue** — approve teachers, inspect and publish/reject submissions
- Weekly availability + blocked days, student CRM, live settings

### Access tiers

| Tier | Unlocked by |
| --- | --- |
| `public` | everyone, no account |
| `member` | any free account |
| `student` | automatically, once the member has a confirmed/completed booking |
| `teacher` | owner approval of a teacher application |

Enforced server-side on the download route — a direct API call to a gated file
returns 403, and pending submissions are invisible to the public entirely.

## Tech

- **Next.js 14** (App Router, Server Actions) + TypeScript
- **SQLite** (`better-sqlite3`) at `data/app.db`, schema created and seeded on
  first run — including 8 sample resources with real downloadable files
- Uploads stored in `data/uploads/` (25 MB limit; PDF/PPT/DOC/XLS/ZIP/images),
  served only through an access-checked route with path-traversal protection
- Self-hosted **Cairo** variable font, hand-written RTL CSS, no UI framework
- All times are Kuwait local (`Asia/Kuwait`)

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Production: `npm run build && npm start`

## Logins

- **Owner dashboard**: `/teacher/login` — default password **`teacher123`**
  (change it immediately in الإعدادات → تغيير كلمة المرور)
- **Members**: `/auth/register` — students are active instantly, teachers wait
  for approval

## Configuration

| Variable | Purpose |
| --- | --- |
| `SESSION_SECRET` | HMAC secret for session cookies. If unset, a random secret is generated at `data/.session-secret`. |

Teacher name, bio, WhatsApp number, prices, availability, and booking rules are
all edited live from the dashboard.

## Deployment notes

Uses a local SQLite file and local uploads, so deploy on a host with a
persistent disk (Railway, Fly.io, a VPS). **Back up the whole `data/`
directory** — it holds the database *and* every uploaded file.

See [`PRODUCT.md`](./PRODUCT.md) for the strategy behind the design.
