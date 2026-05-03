import {
  getBidIncrement,
  SOFT_CLOSE_EXTENSION_SECONDS,
  SOFT_CLOSE_MAX_EXTENSION_MINUTES,
  SOFT_CLOSE_WINDOW_SECONDS,
} from "./constants";

export function getNextMinimumBid(lot: {
  bid_count: number;
  starting_price_cents: number;
  current_price_cents: number;
}): number {
  if (lot.bid_count === 0) return lot.starting_price_cents;
  return lot.current_price_cents + getBidIncrement(lot.current_price_cents);
}

export function isInSoftCloseWindow(endsAt: Date, now: Date): boolean {
  const msLeft = endsAt.getTime() - now.getTime();
  return msLeft > 0 && msLeft <= SOFT_CLOSE_WINDOW_SECONDS * 1000;
}

export function computeNewEndsAt(
  endsAt: Date,
  originalEndsAt: Date,
  now: Date
): { endsAt: Date; extended: boolean } {
  if (!isInSoftCloseWindow(endsAt, now)) return { endsAt, extended: false };

  const cap = new Date(
    originalEndsAt.getTime() + SOFT_CLOSE_MAX_EXTENSION_MINUTES * 60 * 1000
  );
  if (endsAt.getTime() >= cap.getTime()) return { endsAt, extended: false };

  const proposed = new Date(endsAt.getTime() + SOFT_CLOSE_EXTENSION_SECONDS * 1000);
  const next = proposed.getTime() < cap.getTime() ? proposed : cap;
  return { endsAt: next, extended: next.getTime() !== endsAt.getTime() };
}
