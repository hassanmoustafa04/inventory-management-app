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

## Deployment

Needs a host with a **persistent volume** — it keeps the database and every
uploaded file on disk. Railway takes about ten minutes; Vercel cannot run this
without migrating to Postgres/Turso and blob storage first.

Full instructions, including the volume mount that makes or breaks it, are in
[`DEPLOY.md`](./DEPLOY.md). `DATA_DIR` overrides where data is written and
defaults to `./data`. **Back up that directory** — it holds the database *and*
every uploaded file.

See [`PRODUCT.md`](./PRODUCT.md) for the strategy behind the design.

## First-run setup (for the teacher)

Log in at `/teacher/login` with the default password **`teacher123`**, then follow
**التجهيز** (`/teacher/setup`) — a seven-step checklist whose progress is derived
from real data, not tickboxes:

1. Change the password (the default is public knowledge)
2. Add the WhatsApp number — every contact button on the site uses it
3. Write the bio shown on the landing page
4. Set the weekly teaching hours, then confirm them
5. Review prices and disable any package that doesn't apply
6. Upload the first real files
7. Delete the eight demo files that ship with the site

The dashboard shows a progress banner until all seven are done.

### Uploading many files at once

`/teacher/resources/bulk` takes a whole folder of PowerPoints in one go: pick the
subject, level, type, and access tier once, select every file, and each becomes a
resource titled after its filename. They upload as **drafts** by default —
invisible to the public until published from the library, so titles can be
tidied first. Arabic filenames are preserved (multipart filenames arrive
Latin-1-decoded and are repaired on the way in; see `repairFileName`).
