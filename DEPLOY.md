# Deploying — getting a live link

The app keeps its SQLite database and every uploaded file on disk, so it needs a
host with a **persistent volume**. Railway is the quickest route to a working URL.

> **Vercel will not work as-is.** Its serverless filesystem is read-only apart
> from `/tmp` and is wiped between requests, so the database and all uploaded
> PowerPoints would disappear. Vercel also caps request bodies at 4.5 MB, below
> a typical presentation. Moving to Vercel means migrating to Postgres/Turso and
> Vercel Blob — a real refactor, not a config change.

## Railway (~10 minutes)

1. Sign in at **railway.app** with GitHub.
2. **New Project → Deploy from GitHub repo** → pick this repo and the branch
   `claude/physics-tuition-booking-arabic-1bo29k` (or `main` once merged).
   Railway detects Next.js and runs `npm ci && npm run build` on its own.
3. Open the service → **Variables** → add **`PORT` = `3000`**.
   This matters: Railway otherwise injects its own port (often 8080) while the
   generated domain routes to a different one, and the mismatch shows up as
   *"Application failed to respond"*. `next start` follows `PORT`, so pinning it
   makes both sides agree. (`SESSION_SECRET` is optional — if unset, a secret is
   generated once and kept on the volume.)
4. Open **Settings → Volumes → Add Volume**, mount path **`/app/data`**.
   This is the single step that matters — it is where the database and every
   uploaded file live. Without it, everything resets on each deploy.
5. **Settings → Networking → Generate Domain** to get a public URL.
6. Visit `https://<your-domain>/teacher/login` and sign in with `teacher123`,
   then work through **التجهيز**.

### Custom domain

Add it under **Settings → Networking → Custom Domain**, then point a CNAME at
the value Railway shows. A domain like `physics-mona.com` reads better in a
WhatsApp message than a `.up.railway.app` URL.

## Fly.io (alternative)

A Dockerfile is provided at `deploy/Dockerfile` (it sets `DATA_DIR=/data`):

```bash
fly launch --dockerfile deploy/Dockerfile
fly volumes create data --size 3
# in fly.toml:
#   [[mounts]]
#   source = "data"
#   destination = "/data"
fly deploy
```

## Node version

The runtime is pinned to **Node 22** via `.nvmrc` and `package.json` engines.
This is deliberate: `better-sqlite3` downloads a prebuilt native binary at
install time, and no prebuild exists for Node 24, so a newer runtime forces a
source build that fails without a compiler toolchain. Railpack reads both files.

## Troubleshooting

**"Application failed to respond" (502)** — the container is not serving on the
port the domain targets. Check `PORT` is set to `3000` in Variables and that the
domain's target port is also `3000`.

**Build fails immediately (a few seconds)** — usually the wrong branch. The app
lives on `main`; older commits there had no `app/` directory and `next build`
exits at once.

**Build fails while installing `better-sqlite3`** — the Node version drifted off
22. Confirm `.nvmrc` is present and the builder reports `node@22`.

## Storage settings

`DATA_DIR` controls where the database and uploads are written. It defaults to
`./data`, which is why mounting the Railway volume at `/app/data` needs no
configuration. Set `DATA_DIR` explicitly if the volume is mounted elsewhere.

## Backups

The volume holds everything — her database *and* her PowerPoints. Take a copy
periodically:

```bash
railway run tar czf - /app/data > backup-$(date +%F).tar.gz
```

## Sizing

A 1–3 GB volume is plenty to start; a PowerPoint is a few MB and the upload cap
is 25 MB per file. Watch usage in Railway's metrics and grow the volume when the
library does.
