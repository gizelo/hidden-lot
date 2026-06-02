# HiddenLot

HiddenLot is a friends-only alpha auction marketplace: upload one item photo, let AI draft the listing, run a short test auction, and hand off manually after the winner is picked.

Alpha is test-mode only. No real payments, Stripe Connect, escrow, chat, watchlists, or disputes are part of this release.

## Local Development

```bash
pnpm dev
pnpm test
pnpm lint
pnpm build
```

The app uses Next.js 16, Supabase, OpenAI, Resend, Tailwind CSS 4, and Vitest.

## Required Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
CRON_SECRET=
OPENAI_API_KEY=
RESEND_API_KEY=
```

Stripe variables may stay empty for alpha unless a Stripe test flow is added later.

## Alpha Launch Checklist

- Apply Supabase migrations through `005_alpha_launch_hardening.sql`.
- Confirm Supabase Auth email confirmation is enabled.
- Configure the `lot-photos` public storage bucket from the migrations.
- Set `NEXT_PUBLIC_SITE_URL` to the deployed app URL so email links point to the right host.
- Set `CRON_SECRET` in Vercel and call `/api/cron/send-emails` with `Authorization: Bearer <CRON_SECRET>`.
- Set `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` in Vercel so the email cron can drain `email_outbox`.
- Run `pnpm test`, `pnpm lint`, and `pnpm build` before creating the draft PR.

## Alpha Manual Smoke Test

1. User A signs up, verifies email, completes onboarding, and creates a 48h lot.
2. User B bids, then User C outbids B.
3. Run the email cron and confirm User B receives the outbid email.
4. Force the auction close with `select public.close_expired_auctions();`.
5. Run the email cron again and confirm winner/seller emails include the other party's email for handoff.
6. Confirm `/profile` shows User A's lot and each bidder's bid history.
