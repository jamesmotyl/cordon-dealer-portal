# Cordon Dealer Portal (v1)

A basic Dealer Management Portal for Cordon — lead tracking with a Cordon-review approval
workflow, built to prove the process before the full Portal section (Farmer Portal + Dealer
Portal) is designed.

This is intentionally **functional over polished**: it proves the lead → review → approval →
active pipeline workflow. No email notifications, no commission calculation/invoicing yet.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM + Postgres (Vercel Postgres, Supabase, or Neon all work)
- NextAuth (Credentials provider, JWT sessions)

## Data model

- **User** — `role` is `ADMIN` (Cordon staff) or `DEALER`.
- **Lead** — company/contact info, `status` (lifecycle) and `approvalState` (Cordon's review
  decision) are tracked separately. A `commission` field exists on the model but is unused —
  it's a stubbed extension point for phase 2 commission tracking.
- **ActivityLog** — one row per change (who did what, when), shown on each lead's detail panel.

### Approval workflow

1. A dealer submits a lead → `approvalState = PENDING`, `status = PENDING_REVIEW`. It does not
   appear in the dealer's active pipeline yet.
2. An admin reviews it from the approval queue (`/admin`, filter by "Pending") and picks one of:
   - **Approved — Exclusive to Dealer** → `approvalState = APPROVED_EXCLUSIVE`,
     `status = NOT_CONTACTED`. The lead is now active in the dealer's pipeline.
   - **Already in Discussion** → `approvalState = IN_DISCUSSION`, `status = IN_HOUSE`. Stays with
     Cordon. Admin can attach free-text notes explaining why.
3. Admin can later override an `IN_DISCUSSION` lead and transfer it to the dealer →
   `approvalState = TRANSFERRED`, `status = NOT_CONTACTED`, with notes on why.
4. Every decision is timestamped (`approvedAt`, `approvedById`) and logged in `ActivityLog`.
   Dealers can see their leads' approval state at all times (Pending / Approved / In Discussion /
   Transferred).

## Getting started locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables** — copy `.env.example` to `.env` and fill in:

   | Variable | Description |
   | --- | --- |
   | `DATABASE_URL` | Postgres connection string (pooled, if your provider distinguishes) |
   | `DIRECT_URL` | Direct (non-pooled) Postgres connection string, used for migrations. Set to the same value as `DATABASE_URL` if your provider only gives you one URL. |
   | `NEXTAUTH_SECRET` | Random secret for NextAuth session signing — generate with `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `http://localhost:3000` locally; your deployed URL in production |

3. **Push the schema and seed test data**

   ```bash
   npm run db:push
   npm run db:seed
   ```

   This creates one admin and two dealer accounts, plus a handful of sample leads covering each
   approval state:

   | Role | Email | Password |
   | --- | --- | --- |
   | Admin | `admin@cordon.ai` | `admin123` |
   | Dealer | `dealer1@example.com` | `dealer123` |
   | Dealer | `dealer2@example.com` | `dealer123` |

   Change these passwords (or re-run the seed with new ones) before using this anywhere but a
   local/demo environment.

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` — you'll be redirected to `/login`, then to `/dealer` or
   `/admin` depending on the account's role.

## Deploying to Vercel

1. Push this repo to GitHub (or your git host of choice) and import it into Vercel.
2. Provision a Postgres database — [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   or [Supabase](https://supabase.com) both work. Copy the connection string(s) it gives you.
3. In the Vercel project's **Settings → Environment Variables**, add `DATABASE_URL`,
   `DIRECT_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` (set to your production URL, e.g.
   `https://dealer-portal.vercel.app`).
4. Deploy. `vercel.json` runs `prisma generate && next build` on build.
5. Push the schema to the production database once (from your machine, with `DATABASE_URL`
   pointed at production):

   ```bash
   npm run db:push
   npm run db:seed
   ```

## Project structure

```
prisma/schema.prisma       Data model (User, Lead, ActivityLog)
prisma/seed.ts             Seed script — admin + 2 dealers + sample leads
src/lib/auth.ts            NextAuth config (Credentials provider)
src/lib/prisma.ts          Prisma client singleton
src/middleware.ts          Route protection for /dealer and /admin by role
src/app/login/             Login page
src/app/dealer/            Dealer dashboard
src/app/admin/             Admin dashboard (full live list + approval queue)
src/app/api/leads/         Lead CRUD + approve/transfer actions
src/components/            Header, lead table, lead detail/approval panel, forms
```

## Extension points (phase 2+)

- `Lead.commission` is defined in the schema but not read or written anywhere — wire up
  commission calculation/invoicing here.
- No email/notification hooks yet — the `ActivityLog` model already captures every event that
  would trigger one.
- Auth is Credentials-only; swapping in an OAuth/SSO provider is a NextAuth config change in
  `src/lib/auth.ts` and doesn't require schema changes (`User.passwordHash` would just go unused
  for SSO accounts).
- The Cordon wordmark in `src/components/CordonLogo.tsx` is a text placeholder — drop the real
  SVG into that component when it's available.
