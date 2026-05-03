export const CATEGORIES = [
  "Toys & Figures",
  "Trading Cards",
  "Coins & Currency",
  "Stamps & Philately",
  "Art & Prints",
  "Books & Manuscripts",
  "Vintage Electronics",
  "Jewelry & Watches",
  "Clothing & Accessories",
  "Sports Memorabilia",
  "Vinyl & Music",
  "Curiosities & Oddities",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const AUCTION_DURATIONS = [24, 48, 72] as const;
export const DEFAULT_AUCTION_DURATION = 48;

export const SOFT_CLOSE_WINDOW_SECONDS = 60;
export const SOFT_CLOSE_EXTENSION_SECONDS = 60;
export const SOFT_CLOSE_MAX_EXTENSION_MINUTES = 30;

/**
 * Returns the minimum bid increment in cents based on the current bid.
 */
export function getBidIncrement(currentBidCents: number): number {
  if (currentBidCents < 2000) return 100; // under €20 → €1
  if (currentBidCents < 10000) return 200; // €20–100 → €2
  const fivePercent = Math.round(currentBidCents * 0.05);
  if (currentBidCents >= 50000) return Math.max(fivePercent, 2500); // over €500 → 5%, min €25
  return fivePercent; // €100–500 → 5%
}

export const RARITY_TIERS = ["common", "rare", "jackpot"] as const;
export type RarityTier = (typeof RARITY_TIERS)[number];

export const PLATFORM_COMMISSION_RATE = 0.1; // 10%
export const PLATFORM_COMMISSION_MIN_CENTS = 50; // €0.50
