# HiddenLot — Claude Code Rules

Product vision and scope live in `VISION.md`. This file defines how to build it.

## Project

Casual AI-powered auction marketplace. Alpha phase (v0.1) — "show friends" release. 5–20 testers, Stripe test mode, no real money.

## Stack

- **Framework:** Next.js 16 (App Router, TypeScript 6, `src/` directory)
- **Styling:** Tailwind CSS 4 + shadcn/ui (CLI v4)
- **Database & Auth:** Supabase (PostgreSQL, RLS, Auth, Storage, Realtime)
- **AI:** OpenAI API (GPT-4o mini with Vision, Moderation API)
- **Payments:** Stripe (test mode only in alpha)
- **Email:** Resend (plain HTML, no React Email library)
- **Hosting:** Vercel
- **Testing:** Vitest
- **Package manager:** pnpm

## Project Structure

```
src/
  app/
    (auth)/           # auth routes: login, register, verify-email
    (main)/           # authenticated app routes
      layout.tsx      # shared layout with header/nav
      feed/           # auction feed (home)
      lot/[id]/       # lot detail + bid
      create/         # create listing flow
      profile/        # user profile, my lots, my bids
    api/
      webhooks/
        stripe/       # Stripe webhook handler
  components/
    ui/               # shadcn/ui primitives (Button, Input, Card, Badge, etc.)
    lot/              # LotCard, BidInput, BidHistory, RarityBadge, AuctionTimer
    layout/           # Header, Footer, MobileNav
  lib/
    supabase/
      client.ts       # browser Supabase client (createBrowserClient)
      server.ts       # server Supabase client (createServerClient with cookies)
      admin.ts        # service-role client for webhooks/cron
      middleware.ts    # auth/session helper used by src/proxy.ts
    stripe.ts         # Stripe client init
    openai.ts         # OpenAI client init
    utils.ts          # pure utility functions
    constants.ts      # bid increments, durations, categories list
  types/
    database.ts       # auto-generated from Supabase (npx supabase gen types)
  hooks/              # custom React hooks (useCountdown, useRealtimeBids, etc.)
  actions/            # Server Actions (createLot, placeBid, etc.)
supabase/
  migrations/         # numbered SQL migrations (source of truth for schema)
  seed.sql            # test data
```

## Architecture Rules

### Server vs. Client

- Server Components by default. Add `'use client'` only when the component needs browser APIs, event handlers, or hooks.
- **Server Actions** (`src/actions/`) for all mutations: create lot, place bid, update profile, etc. No API routes except webhooks.
- Data fetching happens in Server Components or Server Actions, never from client-side `fetch` to our own API.

### Supabase

- **RLS is mandatory.** Every table must have Row Level Security policies. Never bypass RLS from the frontend — use the `admin.ts` service-role client only in webhooks, cron jobs, and server-side admin operations.
- **Migrations are the schema source of truth.** Schema changes = new migration file. Never modify the database manually.
- Types are generated from Supabase: `npx supabase gen types typescript --local > src/types/database.ts`. Regenerate after every migration.
- Auth uses Supabase Auth. No custom auth. Email + password only.

### Stripe

- **Alpha = test mode only.** All Stripe code uses test keys. No real charges, no Connect onboarding.
- Stripe webhook handler at `src/app/api/webhooks/stripe/route.ts`. Verify webhook signatures.

### OpenAI

- Vision API call lives in a single Server Action (`src/actions/analyzeLot.ts`). Prompt is in `src/lib/openai.ts` or a dedicated prompt file.
- Moderation API is called when seller edits a description before re-publishing.
- AI is a listing assistant, NOT an appraiser. Never use words like "valued at", "worth", "authenticated" in prompts or UI.

### Styling

- Tailwind CSS only. No CSS modules, no styled-components, no inline `style={}`.
- shadcn/ui for all primitives (Button, Input, Card, Dialog, Badge, etc.). Install components as needed with `npx shadcn@latest add <component>`.
- Light theme only. No dark mode toggle, no `dark:` variants.
- Mobile-first: design for 320px minimum, scale up.

## Naming Conventions

- **Files/folders:** kebab-case (`lot-card.tsx`, `create-lot.ts`)
- **Components:** PascalCase (`LotCard`, `BidInput`)
- **Functions/variables:** camelCase (`placeBid`, `currentBid`)
- **Database tables:** snake_case, plural (`lots`, `bids`, `profiles`)
- **Database columns:** snake_case (`starting_price`, `created_at`)
- **Env vars:** `NEXT_PUBLIC_` prefix only for client-visible values. Server secrets have no prefix.
- **Server Actions:** named exports, verb-first (`createLot`, `placeBid`, `updateProfile`)

## Alpha Scope — What's IN

Only build what's listed here. Everything else is deferred.

- Email + password auth with email verification
- Category selection onboarding (12 categories)
- Listing creation: 1 photo → OpenAI Vision → title, description, category, price, rarity tier → seller edits → set duration → publish
- Rarity Tier shown to seller at creation (Common/Rare/Jackpot + reasoning + disclaimer). NOT on feed cards.
- Feed: reverse-chronological, category filter, text search
- Lot detail: photo, description, bid history, current bid, timer, bid input, rarity tier with disclaimer
- Stepped bid increments (see VISION.md)
- Soft-close (+60s in last 60s)
- Auction end via scheduled job, winner determination
- My Lots and My Bids in profile
- Email notifications: outbid, auction won, auction ended (via Resend)
- Stripe test mode for bid flow
- Moderation API check on edited descriptions

## Alpha Scope — What's OUT

Do not build, suggest, or plan for these until explicitly asked:

- Rarity badges on feed cards (beta)
- Real payments / Stripe Connect (beta)
- Multi-photo uploads (beta)
- Chat (beta)
- Want List (beta)
- Watchlist (beta)
- Personalized feed ranking (v1.0)
- Buy Now (v1.0)
- Dispute flow (beta)
- Admin dashboard (beta)
- Shill bidding protection (beta)
- Dark mode (v1.0)
- i18n / multi-language (never planned)
- Multi-currency (v1.0)
- Mobile app (v1.0)
- In-app notifications (v1.0)
- Rating/review system

## Code Quality

- No comments unless logic is genuinely non-obvious. No JSDoc on simple functions.
- No dead code, no commented-out code, no TODO comments without a linked issue.
- Validate at system boundaries (user input, external APIs). Trust internal code.
- Error handling: show user-friendly messages in the UI. Log details server-side. No silent swallows.
- All prices stored in cents (integer) in the database. Display as EUR with 2 decimals in the UI.

## Testing

**Vitest** for unit and integration tests. Test what breaks the product, skip what doesn't.

**Test:**
- Auction business logic: bid increment calculation, soft-close rules, winner determination, minimum bid validation
- Server Actions: createLot, placeBid — valid input passes, invalid input rejects, auth/RLS enforced
- OpenAI response parsing: mock AI responses, verify JSON parsing handles edge cases and malformed output

**Don't test:**
- UI components (too volatile in alpha, visual check is faster)
- E2E flows (expensive to maintain for 5 testers)
- Stripe webhooks (manual verification in test mode)

Test files live next to the code they test: `bid-utils.ts` → `bid-utils.test.ts`. Server Action tests go in `src/actions/__tests__/`.

## Commands

```bash
pnpm dev              # local dev server
pnpm build            # production build
pnpm lint             # ESLint
pnpm test             # run Vitest
pnpm test:watch       # Vitest in watch mode
pnpm supabase:gen     # regenerate database types
pnpm supabase:migrate # run pending migrations
```

## Environment Variables

```
# .env.local (never commit)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
CRON_SECRET=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
```
