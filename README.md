# فيزياء مع أ. حسن — Physics Tutoring Booking Platform 🇰🇼

An Arabic-first (RTL) website for a private physics teacher in Kuwait: students book
lessons online in under a minute, and the teacher manages everything from a
mobile-friendly dashboard.

## Features

**For students (no account needed):**
- Arabic landing page with packages, prices (KWD), testimonials, and FAQ
- 4-step booking wizard: lesson type → real available slots → details → confirm
- Booking code (e.g. `PHY-7K3QX`) + status page to track or cancel the booking
- WhatsApp deep links everywhere — the communication rail of Kuwait

**For the teacher:**
- Dashboard: today's lessons, pending requests (approve/decline), weekly load, monthly income
- Bookings list with filters (upcoming / pending / past / cancelled)
- Schedule editor: weekly availability + one-off blocked days (holidays, travel)
- Auto-built student CRM: lessons count, upcoming, total paid, WhatsApp shortcut
- Settings: name/bio/WhatsApp, package prices & durations, auto-confirm toggle, password

## Tech

- **Next.js 14** (App Router, Server Actions) + TypeScript
- **SQLite** (`better-sqlite3`) — zero-config local database at `data/app.db`,
  schema auto-created and seeded on first run
- Self-hosted **Cairo** variable font, hand-written RTL CSS (no UI framework)
- All times are Kuwait local time (`Asia/Kuwait`)

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

## Teacher login

- URL: `/teacher/login` (also linked in the site footer)
- Default password: **`teacher123`** — change it right away from
  **الإعدادات → تغيير كلمة المرور**

## Configuration

Environment variables (all optional):

| Variable | Purpose |
| --- | --- |
| `SESSION_SECRET` | HMAC secret for the teacher session cookie. If unset, a random secret is generated and stored in `data/.session-secret`. |

Everything else (teacher name, WhatsApp number, prices, availability, booking
lead time, auto-confirm) is edited live from the dashboard — no redeploys needed.

## Deployment notes

The app uses a local SQLite file, so deploy it on a host with a persistent disk
(Railway, Fly.io, a VPS, etc.). Back up the `data/` directory — it contains the
entire database.

See [`PRODUCT.md`](./PRODUCT.md) for the product strategy behind the design.
