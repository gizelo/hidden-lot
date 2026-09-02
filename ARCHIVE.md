# HiddenLot archive and product decision record

## Status

HiddenLot was archived on September 2, 2026. The repository is retained as a
product hypothesis, design and engineering prototype, and an honest record of
the decision not to continue development without stronger evidence.

HiddenLot is not a launched marketplace, a validated business, or a source of
observed transaction outcomes.

## Original insight

People often find forgotten objects that may be useful, interesting, or
collectible, but researching, pricing, photographing, and listing them feels
like more work than the uncertain return is worth. HiddenLot explored whether a
photo-first AI listing flow and an entertaining auction feed could turn that
friction into a casual treasure-hunt marketplace.

The intended exchange created value for three parties:

- the seller could turn an ignored object into money with little effort;
- the buyer could discover an unusual object through an entertaining feed;
- the platform could earn a transaction fee while extending the useful life of
  physical goods.

## What was built

The repository contains a friends-only, test-mode alpha with:

- email authentication and onboarding;
- one-photo uploads to Supabase Storage;
- AI-generated listing drafts and an entertainment-oriented rarity label;
- category feed, search, lot detail, profiles, bids, and auction countdowns;
- atomic bid validation, soft-close behavior, and scheduled auction closing;
- an email outbox and manual post-auction contact handoff.

It does not contain a completed real-money marketplace. In particular, real
payments, Stripe Connect, escrow, delivery, refunds, disputes, buyer protection,
seller verification, and production support operations were not implemented.

## Evidence at the decision date

The hosted alpha contained three test accounts, three expired lots, zero bids,
zero queued emails, and seventeen uploaded test images. There were no completed
payments, deliveries, transactions, or measured repeat-use outcomes.

The repository and product work therefore demonstrated implementation ability
and clarified the concept, but did not validate demand, liquidity, willingness
to pay, or a viable acquisition loop.

The test data also exposed an important moderation risk: two of the three
published descriptions contained personal contact information and prohibited
solicitation text. The specific text and personal identifiers were deliberately
excluded from the archive. This small sample is not a rate estimate, but it is
direct evidence that marketplace moderation cannot be treated as a minor or
fully solved feature.

## Why development stopped

### The product was two businesses at once

HiddenLot combined seller convenience with buyer entertainment. Both are
plausible propositions, but neither became a proven primary reason to use the
product. The alpha did not establish that enough interesting supply could be
created at the same time as enough motivated demand.

### Physical goods made the operating model fundamental

The proposed experience depended on real-world payment, delivery, item
condition, non-delivery, fraud, chargebacks, refunds, seller identity, product
safety, and support decisions. Those responsibilities could be reduced with
partners, but not removed while preserving a trusted transaction and a
commission-based business.

### The low-ticket economics were fragile

Illustrative scenarios showed that AI generation was not the primary cost.
Payment fees, payouts, support, fraud, refunds, tax treatment, and marketplace
operations dominated the model. A simple 10% all-inclusive commission was
negative or approximately break-even for much of the intended low-ticket range
before acquisition and operating costs. A viable structure would likely need a
higher blended fee, a fixed component, seller-paid processing, higher average
order value, or some combination of these changes.

These were scenario calculations, not observed unit economics.

### Simplifying to introductions did not solve the right problem

A version that only introduced buyers and sellers would remove payment custody
and most delivery integration, but it would also remove enforceable transaction
fees and buyer protection. Once contact details were exchanged, users could
complete the transaction outside the platform. Upfront listing fees would work
against the low-friction seller proposition, while ads, boosts, and professional
subscriptions would require liquidity and scale first.

That version kept cold start, trust, moderation, fraud, and marketplace
acquisition while weakening the distinctive auction loop and monetization. It
was therefore rejected rather than adopted as the archive scope.

## Decision

**STOP active development and preserve the work for possible future use.**

This is a scope and evidence decision, not a claim that the underlying idea
could never work. It is not a suitable first low-operations product for the
current founder goal: launch quickly, validate willingness to pay, and operate a
small product without logistics, money movement, or continuous marketplace
support.

Existing code is treated as sunk learning rather than a reason to continue.

## Conditions for reconsidering HiddenLot

Do not restart feature development merely because time has passed or new AI
capabilities exist. Reconsider the product only when there is evidence for all
of the following:

1. One launch geography and a clearly reachable first segment.
2. One primary value proposition: seller convenience or buyer entertainment.
3. At least ten committed sellers with specific launch items.
4. A credible source of at least twenty to thirty relevant buyers concentrated
   around the same supply.
5. Evidence that participants are willing to list, bid, pay, exchange the item,
   and accept the actual fees and delivery terms.
6. A payment, dispute, refund, fraud, moderation, and seller-verification model
   owned by a named operator or team.
7. Contribution economics that remain positive after processing, payouts,
   refunds, support, fraud, AI, tax treatment, and acquisition.
8. A qualified review of the applicable marketplace, consumer, product-safety,
   tax-reporting, and data-protection obligations in the chosen market.

## Possible reusable direction

The strongest separable insight is the listing-friction problem. A one-sided
tool could help recurring resellers identify items, prepare listings, research
prices, and adapt inventory across existing marketplaces without operating a
marketplace itself.

This is only a future discovery hypothesis. Generic AI listing generation is
already available from major marketplaces and reseller tools, so a new product
would need a specific underserved workflow and direct evidence from recurring
sellers before implementation.

## Shutdown record

- Source code and migrations: preserved in this repository.
- Hosted Supabase data: a sanitized metadata snapshot and all seventeen test
  images were saved locally before shutdown; no authentication records, email
  addresses, secrets, or listing descriptions were retained.
- Supabase project: retired after the local snapshot was verified.
- Supabase scheduled auction job: stopped with the hosted project.
- Vercel: no linked local project, GitHub deployment, repository webhook, or
  GitHub deployment record was found during shutdown review.
- GitHub Actions and Pages: not configured.
- Stripe and Resend: no configured local secret was found.
- OpenAI: the repository owner is responsible for revoking the personal API key
  that was present only in the ignored local environment file.

## Final technical verification

The archive was checked on September 2, 2026:

- Vitest: 29 tests passed across 5 test files.
- ESLint: passed.
- Production build: failed during Next.js route type checking because
  `src/app/api/cron/send-emails/route.ts` exports `buildEmail`, which is not a
  valid route-module export in the installed Next.js version.

The build failure is retained as known technical debt rather than repaired for
an archived, non-deployed product. A future restart should move the helper out
of the route module or otherwise update the test seam before treating the app as
deployable.

The remote Supabase migration history recorded migrations through the realtime
publication, while the repository also contains
`005_alpha_launch_hardening.sql`. Future recovery must review migration drift
instead of assuming the retired hosted project and local history were identical.

## Recovery outline

If the restart conditions are eventually met:

1. Unarchive and clone the repository.
2. Review this decision record and revalidate every restart condition.
3. Create a new Supabase project and apply the tracked migrations in order.
4. Recreate test users rather than restoring old authentication records.
5. Restore only intentionally reviewed test assets from the local snapshot.
6. Rotate and configure new secrets; never reuse the retired credentials.
7. Resolve the documented product, moderation, payments, delivery, and policy
   gaps before any real-money or public launch.
