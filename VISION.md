# HiddenLot

> **Unhide your lot.**
> _Your junk, someone's jackpot._ — marketing

HiddenLot is a casual, AI-powered auction marketplace where people turn forgotten things into someone else's treasure. Upload a photo of something from your drawer, attic, or garage — the AI writes the listing, suggests a starting price, and turns it into an auction lot. Buyers scroll, bid, and occasionally walk away with quirky finds they didn't know they needed.

This document is the source of truth for product vision and scope. Technical and implementation details live elsewhere.

---

## Positioning

HiddenLot is a **casual entertainment marketplace**, not a professional auction house. The reference vibe is closer to Whatnot, TikTok Shop, or a scrollable treasure-hunt feed than to eBay or Christie's. Users come to play, discover, and occasionally score — not to do serious appraisal work.

The core loop is simple: sellers post quirky stuff with one tap, buyers scroll a personalized feed, place low-friction bids on things that catch their eye, and every now and then something lands on their doorstep. The format is the fun.

**Taglines:**

- Primary (product, brand, hero): **Unhide your lot.**
- Marketing (ads, social): **Your junk, someone's jackpot.**

---

## The Problem

Millions of interesting, unusual, or niche-desirable objects sit forgotten in drawers, attics, and garages. Owners don't know what they have or don't want to bother researching, photographing, and listing on eBay. At the same time, people scrolling their phones love stumbling onto unusual finds — but existing marketplaces are either generic flea-market grids (eBay, Vinted) or inaccessible elite auction houses (Christie's, Sotheby's).

There is no fun, low-friction way to turn unknown stuff into a small auction and let the internet decide what it's worth.

## The Solution

HiddenLot removes every step that makes listing annoying and replaces it with a one-tap flow powered by AI:

1. The seller uploads a photo of an item.
2. AI generates a title, description, category, and a suggested starting price.
3. The seller reviews, edits if needed, and publishes.
4. Buyers discover the lot in a personalized, scrollable feed.
5. Bids happen live, auctions are short, and the format feels like a game.
6. The winner pays, the seller ships, the platform takes a commission.

**What the AI is not:** an appraiser, an authenticator, or a grading authority. It is a listing assistant that also provides an entertainment-oriented rarity guess (see Rarity Tier). The suggested price is a starting point, not a valuation. The rarity tier is an AI hunch, not a certified grade. This matters both for user expectations and for legal positioning.

---

## How It Works

### For Sellers

1. **Snap a photo.** Take or upload a photo of the item. Alpha: one photo. Beta and beyond: up to three photos per lot.
2. **AI writes the listing.** The platform sends the image to OpenAI's Vision API with a structured prompt and receives a JSON object containing item name, a 2–3 sentence description in a neutral product-page tone, a category from the 12 predefined categories, a suggested starting price in EUR, and a **Rarity Tier** (Common / Rare / Jackpot). The seller sees the rarity tier prominently — this is the "wow" moment that answers "is this worth posting?"
3. **Review and publish.** The seller sees the AI-generated listing and can edit the title, description, or starting price. The rarity tier is assigned by AI and cannot be edited by the seller. If the description is edited, it is re-checked through the OpenAI Moderation API before the lot can go live. Once approved, the seller picks an auction duration (24h / 48h / 72h, default 48h) and publishes.

### For Buyers

1. **Personalized feed.** On registration, the user picks categories of interest. The feed is assembled from those categories plus, over time, behavioral signals. Matching lots surface higher.
2. **Scroll and bid.** Each card shows the photo, title, current bid, time remaining, number of bids, and a **Rarity Tier badge** for Rare (blue) and Jackpot (gold) lots — Common lots have no badge, keeping the feed clean and making colored badges stand out. Tapping opens the full lot page with more photos, description, rarity tier with AI reasoning, bid history, and a prominent bid input.
3. **Place bids quickly.** Minimum bids follow a stepped increment schedule (see Auction Mechanics). Alpha uses Stripe test mode; beta and beyond use real Stripe Connect.
4. **Watchlist lots.** Users can save lots to a watchlist and get notified before auctions end or when outbid.
5. **Win and receive.** When the auction closes, the highest bidder wins. Payment is captured, the seller ships, and the buyer confirms receipt. Funds are released to the seller minus the platform commission.

---

## Auction Mechanics

- **Duration.** 24 / 48 / 72 hours. Default 48h. No 7-day auctions — they kill the casual vibe.
- **Stepped bid increments.** Dynamic, based on current bid:
  - under €20 → €1 step
  - €20–100 → €2 step
  - €100–500 → 5% step
  - over €500 → 5% step, minimum €25
- **Soft-close.** If a bid is placed in the last 60 seconds, the auction timer is extended by 60 seconds. Prevents pure sniping without dragging the format out.
- **Payment holds.** Alpha: Stripe test mode, no real funds. Beta: real Stripe Connect with deferred charge at auction end (see Payments).
- **No-bid expiry.** If no bids are placed during the auction window, the listing expires. The seller can relist at any time.
- **Buy Now (v1.0 — not in alpha or beta).** Sellers can optionally set a Buy Now price on any auction. A buyer hitting Buy Now ends the auction immediately and wins the lot. If organic bidding exceeds 50% of the Buy Now price, the Buy Now option is removed and the lot becomes a pure auction.

---

## AI Engine

The AI engine has two core functions from day one. A third (semantic Want List matching) lands in v1.0.

### 1. Listing Generation

The seller's photo is sent to OpenAI's Vision API with a strict prompt that returns a JSON object:

- `title` — short item name
- `description` — 2–3 sentences, neutral, informative, product-page tone
- `category` — one of the 12 predefined categories
- `suggested_starting_price_eur` — rough guidance, explicitly non-authoritative
- `rarity_tier` — one of `common`, `rare`, `jackpot` (see Rarity Tier section)
- `rarity_reasoning` — 2–3 bullet points explaining why this tier was assigned (visible to users as "Why this tier?")

The prompt explicitly instructs the model to:

- describe the item factually without superlatives or guarantees
- never claim authenticity or certified value — the rarity tier is an AI guess, not an expert grade
- include only text that describes the item
- never include URLs, promotions, contact info, or external references
- stay within a family-friendly, product-page tone
- default to `common` for the rarity tier; assign `rare` only with a specific visible reason (edition markings, apparent age, identifiable collector brand); assign `jackpot` only when multiple strong visual indicators are present — when in doubt, go lower

### 2. Rarity Tier

The Rarity Tier is an AI-assigned label that signals how interesting or collectible an item might be. It serves two purposes: (1) it gives the seller the "wow" moment during listing creation — "this might actually be worth something," and (2) it gives buyers an attention hook on cards in the feed.

**Three tiers, inspired by loot-box / trading-card game aesthetics:**

| Tier        | Color           | Meaning                                                                                                         | AI assignment frequency |
| ----------- | --------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Common**  | Gray (no badge) | Ordinary items, mass-produced, widely available                                                                 | ~70–80% of listings     |
| **Rare**    | Blue            | Identifiable reason to believe this is uncommon — visible edition markings, apparent age, known collector brand | ~15–25% of listings     |
| **Jackpot** | Gold            | Multiple strong visual indicators of high collectibility — should feel genuinely special                        | ~2–5% of listings       |

**Display rules:**

- **Seller creation flow:** shown prominently after AI analysis. E.g., `🟡 JACKPOT — this might be worth something!` with a small disclaimer: `AI guess, not an expert appraisal.`
- **Feed cards (beta+):** Rare and Jackpot lots display a colored badge on the card. Common lots have no badge — this keeps the feed clean and makes colored badges pop.
- **Lot detail page:** full tier display with the AI's reasoning bullets and a visible disclaimer.
- **Alpha:** Rarity Tier is shown to the seller at listing creation only. Badges on feed cards are not displayed until beta, giving time to validate AI calibration.

**Hard rules:**

- The seller **cannot edit** the Rarity Tier. AI assigns it, and it stays.
- If the seller edits the description, the Rarity Tier is **recalculated** from the updated description + original photo.
- The feed **cannot be sorted or filtered by Rarity Tier**. This prevents gaming — sellers optimizing photos to trick the AI into higher tiers. Feed sorting is by relevance, recency, and auction timer only.
- The disclaimer `AI guess, not an expert appraisal. Do your own research.` is **always visible** wherever the tier is displayed.

**Calibration monitoring (ongoing from alpha):**

- Track the distribution of tiers across all listings. If Jackpot exceeds ~5% or Rare exceeds ~25%, the AI prompt needs tightening.
- In beta, track sell-through rate by tier. If Jackpot lots don't sell at a meaningfully higher rate than Common lots, the signal is broken and needs recalibration.

### 3. Content Moderation

- **Alpha:** edited descriptions are passed through OpenAI's Moderation API before publishing. If flagged, the lot cannot go live until the description is fixed.
- **Beta:** adds a second GPT pass with a strict "is this a proper item description?" check that rejects off-topic content, contact info, ads, and anything that is not a factual product description.

### 4. Want List Matching (v1.0)

In v1.0, new listings are compared against users' Want List entries using text embeddings. Matches trigger email notifications and boost the lot in the matched user's feed. Beta ships a simpler keyword-matching placeholder.

### Categories

Twelve categories, curated for the casual treasure-hunt vibe and deliberately trimmed of anything that creates logistical or legal nightmares (vehicles, antique furniture):

1. Toys & Figures
2. Trading Cards
3. Coins & Currency
4. Stamps & Philately
5. Art & Prints
6. Books & Manuscripts
7. Vintage Electronics
8. Jewelry & Watches
9. Clothing & Accessories
10. Sports Memorabilia
11. Vinyl & Music
12. Curiosities & Oddities

---

## Payments & Escrow

The payment architecture intentionally differs by phase. Jurisdiction and escrow obligations are real, and we do not guess at them.

### Alpha — Stripe Test Mode

No real money moves. The bid flow runs through Stripe test mode using test cards, so the mechanics are real but the funds are fake. This sidesteps every legal question about money transmission, escrow licensing, and jurisdictional compliance during initial testing. Users are told explicitly that alpha is a test environment.

### Beta — Stripe Connect with Destination Charges

Sellers connect a Stripe Connect Express account. On auction win:

- A charge is created with `transfer_data[destination]` set to the seller's connected account, so funds are routed to the seller without living on the platform balance.
- The platform commission is deducted via `application_fee_amount`.
- Payout is held pending buyer confirmation of receipt. If the buyer confirms, payout is released. If the buyer does not confirm within 14 days of the seller marking the item shipped, payout is released automatically.
- If the buyer opens a dispute before auto-release, the payout is frozen and resolved manually by platform admins.

This architecture minimizes money-transmission exposure by keeping funds off the platform balance.

### Commission

**10% of the final sale price, with a €0.50 minimum.** Stripe processing fees are absorbed into this commission — the seller sees a clean "10% platform fee, minimum €0.50". The minimum fee ensures the platform does not lose money on low-ticket lots.

### Disputes

- **Alpha:** no dispute mechanism (test mode, no real money).
- **Beta:** "Problem with order" button on every won lot freezes payout and sends the case to a manual admin queue handled by the platform operator.
- **v1.0:** admin dashboard with case management, structured dispute categories, evidence upload, and basic automation for clear-cut cases.

---

## User Accounts

### Registration

Email and password. Email verification required before creating a listing or placing a bid.

### Public Profile

- Display name
- Avatar (optional)
- Total completed sales (counter, no reviews)

There is no rating system. Trust is built through the payment and dispute mechanisms, not through reputation scores. In v1.0, a lightweight optional feedback toggle ("transaction went smoothly / had issues") may be added as a soft signal without becoming a full rating system.

### Private Profile

- Email and password
- Category preferences (editable at any time)
- Want List entries
- Connected Stripe account (beta+)
- Notification preferences

---

## Chat

- **Alpha:** no chat. Post-auction coordination (shipping address, tracking) happens via email exchange initiated by the platform.
- **Beta:** text-only chat thread on every lot, powered by Supabase Realtime. Pre-auction: buyers can ask questions. Post-auction: buyer and seller coordinate shipping.
- **v1.0:** moderation tools, report button, basic content filters on chat messages.

---

## Notifications

Email is the only notification channel across alpha and beta. In-app and push notifications are v1.0 territory.

**Alpha (minimum viable):**

- Outbid
- Auction won (buyer)
- Auction ended with winning bid (seller)

**Beta (full set):**

- All alpha events
- Watchlist: auction ending soon
- Want List match (keyword-based)
- Item shipped
- Receipt confirmed / funds released
- New chat message
- Dispute opened / resolved

**v1.0:**

- Want List match (semantic)
- In-app notification center
- Push notifications (if a mobile app is built)

---

## Design Principles

- **Light theme only.** No dark mode in alpha or beta. Dark mode is v1.0 at earliest.
- **Mobile-first, fully responsive.** Everything works from 320px to 1440px+.
- **Content-first layout.** Item photos dominate every view. Chrome is minimal.
- **Neutral palette, single accent.** One accent color for CTAs and interactive elements.
- **Casual, game-like tone.** Microcopy is playful but never cringey. The product should feel like a scrollable game, not a spreadsheet.

---

## Technical Stack

- **Framework:** Next.js (App Router, Server Actions, TypeScript)
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Supabase Auth, Supabase Storage, Supabase Realtime)
- **AI:** OpenAI API (GPT-4 Vision for listing generation, Moderation API for content filtering, text embeddings for semantic Want List in v1.0)
- **Payments:** Stripe (test mode in alpha, Stripe Connect with destination charges in beta+)
- **Email:** Resend
- **Hosting:** Vercel
- **Language:** English only
- **Currency:** EUR only in alpha and beta. Multi-currency considered for v1.0.

---

## Phased Scope

Three phases, each a self-contained release. The goal of each phase is explicit, and features not listed in a phase are explicitly deferred.

### Alpha (v0.1) — "Show friends"

**Goal:** prove the core loop (AI listing → auction → win) works as a UX. Audience: 5–20 friends and early testers. Stripe test mode only, no real money, no legal exposure.

**Included:**

- Email + password auth with email verification
- Category selection onboarding
- Listing creation: 1 photo → AI-generated title, description, category, suggested price, **Rarity Tier** → optional edit of title/description/price (Moderation API re-check on edit; rarity tier recalculated if description changes) → set duration (24/48/72h) → publish
- **Rarity Tier shown to seller at listing creation** (Common / Rare / Jackpot with AI reasoning + disclaimer). Not displayed on feed cards in alpha — calibration validation first.
- Reverse-chronological feed with category filter and text search
- Lot detail page with photo, description, bid history, current bid, timer, bid input
- Stepped bid increments, Stripe test mode for bid authorizations
- Soft-close (+60s in last 60s)
- Auction end via scheduled job, winner determination, winning email
- "My lots" and "My bids" in profile
- Critical email notifications only (outbid, auction won, auction ended)
- OpenAI Moderation API on edited descriptions
- Light theme, mobile-first responsive

**Explicitly out of alpha:**

- Rarity Tier badges on feed cards (deferred to beta pending calibration)
- Real payments and escrow
- Multi-photo listings
- Chat
- Want List
- Personalized (behavioral) feed ranking
- Dispute flow
- Watchlist
- Admin dashboard
- Shill bidding protection
- Landing page polish
- Buy Now option

### Beta (v0.5) — "Show on LinkedIn, take real money"

**Goal:** look and behave like a real product. Take real payments. Handle real problems manually. Audience: public launch to LinkedIn network and wider.

**Added on top of alpha:**

- **Rarity Tier badges on feed cards** (Rare = blue badge, Jackpot = gold badge, Common = no badge)
- Up to 3 photos per lot
- Real Stripe Connect with destination charges and `application_fee_amount`
- Full escrow-like flow: charge on win → seller marks shipped → buyer confirms → payout (minus 10% / €0.50 min)
- 14-day auto-release if buyer silent after seller marks shipped
- "Problem with order" button → payout freeze → manual admin resolution
- Watchlist with "auction ending soon" notifications
- Want List (keyword-based matching) with email alerts
- Text chat on every lot (Supabase Realtime)
- Prohibited items policy and a simple report-listing flow
- Basic shill bidding protection (block bids from same device/IP as seller)
- Landing page: hero, how-it-works, featured auctions
- Second GPT moderation pass on descriptions
- Minimal admin area: disputes, reports, user bans
- Full email notification set

**Explicitly out of beta:**

- Personalized feed ranking beyond category selection
- Semantic (embedding-based) Want List matching
- In-app notifications
- Buy Now option
- Shipping label integration
- Mobile app
- Dark mode

### v1.0 — "It's working, scale it"

**Goal:** turn the product into something sustainable and growth-ready.

**Added on top of beta:**

- Personalized feed ranking (behavioral signals: views, clicks, bid history). Approach: OpenAI `text-embedding-3-small` on lot title + description at creation, stored in Supabase `pgvector`. User interest vector = rolling average of embeddings of lots they clicked/bid on. Feed ranking blends cosine similarity with recency. A simpler v0.2 precursor (category weights + click tracking via `user_interactions` table) may ship during beta if the pure-chronological feed hurts engagement.
- Semantic Want List matching via OpenAI embeddings
- Buy Now option on auctions (hybrid mode; disappears if bids exceed 50% of Buy Now)
- In-app notification center
- Optional lightweight feedback signal ("smooth / had issues") — not full reviews
- Prohibited items auto-detection via AI moderation pipeline
- Full admin dashboard: disputes, reports, moderation queue, user management
- Shipping label integration (DPD / DHL / similar)
- Advanced anti-fraud detection
- Multi-currency (EUR, GBP, USD) and jurisdiction-aware payout logic
- Visual similarity search (upload a photo to find similar items)
- Feed card gamification badges beyond rarity: 🔥 Hot (bid spike), ✨ Fresh (<1h old), ⏰ Ending soon (<1h left), ⚠️ Last chance (<15m), 📈 Climbing (price well above starting). One badge per card, prioritized urgency > popularity > rarity.
- Mobile application consideration (React Native or native)
- Dark mode

---

## Open Decisions (to revisit)

These are deliberately not decided in this document and should be resolved before the phase that depends on them.

- **Legal jurisdiction and operating entity.** Deferred until beta because alpha has no real money. Current owner is based in Germany but may relocate. Final decision needed before beta launch.
- **Stripe Connect account type.** Express vs. Standard. Leaning Express for alpha→beta transition, subject to target countries.
- **Exact fee structure beyond 10% + €0.50 minimum.** May need adjustment once real volume data exists.
- **Shipping cost split.** Chat-negotiated in alpha and beta; integrated labels in v1.0. The default split of shipping cost between buyer and seller is a product decision deferred to beta.
- **Prohibited items list.** Needs concrete legal review before beta. Placeholder list in beta, legally-reviewed list before real-money launch.
- **Name and branding finalization.** HiddenLot is the working name. Domain availability and trademark check required before any public marketing.
- **Rarity Tier calibration.** Monitor tier distribution and sell-through rates from alpha onward. If the AI assigns Jackpot to >5% of listings or Rare to >25%, tighten the prompt. If Jackpot lots don't sell at a higher rate than Common lots in beta, the signal is broken.

---

## What This Document Is Not

- Not a technical design document. Architecture, database schema, API contracts, and component structure live elsewhere.
- Not a business plan. Go-to-market, funding, and financial modeling are separate.
- Not a commitment device. Scope in later phases will shift as alpha and beta reveal real user behavior. The ordering of priorities matters more than the exact feature list in v1.0.
