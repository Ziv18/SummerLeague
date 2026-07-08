# ליגת הקיץ 2026 - Summer Hoops League (Hadera)

A small full-stack app for a summer basketball league: everyone can view games,
teams, and rosters. Only admins can create games/teams/players and edit scores.

The site is in Hebrew with RTL layout, and uses your league logo (`public/logo.jpeg`).

Built with Next.js (App Router) + Postgres (your Neon database) + plain SQL
(no ORM). Auth is a signed JWT in an httpOnly cookie; passwords are hashed
with bcrypt.

## What was fixed

The sign-in page error was caused by mixing CommonJS (`require`/`module.exports`)
into files that need standard ES module syntax (`import`/`export`) — specifically
the `"use client"` pages (login/signup), where Next.js statically scans for a
proper `export default` to build the client bundle. Everything has been
converted to `import`/`export` throughout, which is the standard, supported way
to write Next.js App Router code.

## UI library

The interface uses [MUI](https://mui.com) (`@mui/material`) throughout —
`AppBar`, `Card`, `Table`, `TextField`, etc. — with a custom dark theme in
`lib/theme.ts` matching the original scoreboard palette (navy background,
amber accent). Since the whole site is Hebrew, MUI's RTL support is wired up
via `stylis-plugin-rtl` and `@mui/material-nextjs` (the official Next.js App
Router integration for Emotion's SSR cache) in `app/providers.tsx` — this is
the part that's easy to get wrong with MUI + App Router, so it's handled for
you. `app/globals.css` now only carries the Google Fonts import; everything
else is styled through MUI's `sx` prop.

## TypeScript

The whole app (pages, components, API routes, `lib/`, `middleware`) is now
TypeScript (`.ts`/`.tsx`), with shared types for `Team`, `Player`, `Game`, and
the session payload in `lib/types.ts`. Two files are intentionally still plain
JS: `next.config.js` (Next reads this directly, not compiled) and
`scripts/migrate.js` (a standalone Node script that runs outside the Next
build via `npm run migrate`). Run `npm install` to pick up `typescript` and
the `@types/*` packages, then `npx tsc --noEmit` any time you want to
type-check without building.


## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

```bash
cp .env.example .env
```

`.env` already has your Neon `DATABASE_URL` filled in from our conversation.
Also set `JWT_SECRET` to a long random string, e.g. generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important:** since that database password was shared in a chat, it's a good
idea to rotate/reset it in the Neon dashboard once you're set up, so only you
have the working credential.

## 3. Create the database tables

```bash
npm run migrate
```

This runs `schema.sql` against your Neon database (creates `users`, `teams`,
`players`, `games`). Safe to re-run — it won't destroy existing data.

**If you set this up before:** re-run `npm run migrate` now — it adds the new
`manager` role and the `team_id` column used by team managers, without
touching any existing data.

## 4. Run it locally

```bash
npm run dev
```

Visit http://localhost:3000

## 5. Create your admin account

1. Go to `/signup` and create an account (this is always created as a regular
   `user`).
2. Promote yourself to admin directly in the database. Easiest way: open the
   Neon dashboard → SQL Editor → run:

```sql
UPDATE users SET role = 'admin' WHERE username = 'your-username-here';
```

3. Log out and back in (or just refresh) — you'll now see an "Admin" link in
   the nav with tools to add teams, players, games, and scores.

Any other user who signs up afterward stays a regular viewer unless you run
the same `UPDATE` for them.

### Team managers

There's also a `manager` role, scoped to exactly one team. A manager can add
and remove players on their own team's roster (at `/manager`), but can't touch
other teams, games, scores, or admin tools.

To turn an existing user into a manager for a specific team, run in the Neon
SQL editor:

```sql
UPDATE users
SET role = 'manager',
    team_id = (SELECT id FROM teams WHERE name = 'Team Name Here')
WHERE username = 'their-username';
```

They'll see a "ניהול קבוצה" (Manage team) link in the nav after logging back
in, leading to a roster page scoped to just their team.

## 6. Deploy

The easiest path is Vercel (made by the same team as Next.js, free tier is
plenty for this):

1. Push this folder to a GitHub repo.
2. Import it at vercel.com → New Project.
3. Add the two environment variables (`DATABASE_URL`, `JWT_SECRET`) in the
   Vercel project settings.
4. Deploy. Your Neon database already lives in the cloud, so no extra DB setup
   is needed there.

## How it's organized

- `schema.sql` — the 4 tables: `users`, `teams`, `players`, `games`
- `lib/db.js` — Postgres connection pool
- `lib/auth.js` — password hashing + session JWTs
- `middleware.js` — redirects non-admins away from `/admin/*`
- `app/` — public pages (`/`, `/teams`, `/teams/[id]`), auth pages
  (`/login`, `/signup`), admin pages (`/admin/teams`, `/admin/players`,
  `/admin/games`), and the API routes each of those pages call under
  `app/api/`

## Notes / things you may want to change

- Anyone can self-signup as a viewer; only you can promote someone to admin
  (via SQL). If you'd rather admins be invited by another admin instead of
  via raw SQL, that's a small addition — just say the word.
- Deleting a team that already has games scheduled is blocked (you'd delete
  its games first) to avoid orphaning game records.
- There's no password-reset flow yet — if that matters for real users, let me
  know and I'll add an email-based one (needs an email-sending service).
