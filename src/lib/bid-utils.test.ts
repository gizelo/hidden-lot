import { describe, it, expect } from "vitest";
import {
  getNextMinimumBid,
  isInSoftCloseWindow,
  computeNewEndsAt,
} from "./bid-utils";

describe("getNextMinimumBid", () => {
  it("returns starting price when no bids yet", () => {
    expect(
      getNextMinimumBid({
        bid_count: 0,
        starting_price_cents: 500,
        current_price_cents: 500,
      })
    ).toBe(500);
  });

  it("returns current + increment with at least one bid", () => {
    expect(
      getNextMinimumBid({
        bid_count: 1,
        starting_price_cents: 500,
        current_price_cents: 1500,
      })
    ).toBe(1600);
  });

  it("respects ladder increment at €100+ tier", () => {
    expect(
      getNextMinimumBid({
        bid_count: 5,
        starting_price_cents: 500,
        current_price_cents: 12000,
      })
    ).toBe(12600);
  });
});

describe("isInSoftCloseWindow", () => {
  const now = new Date("2026-05-03T12:00:00Z");

  it("is true when ends_at is within 60s ahead", () => {
    const endsAt = new Date(now.getTime() + 30_000);
    expect(isInSoftCloseWindow(endsAt, now)).toBe(true);
  });

  it("is false when ends_at is more than 60s ahead", () => {
    const endsAt = new Date(now.getTime() + 90_000);
    expect(isInSoftCloseWindow(endsAt, now)).toBe(false);
  });

  it("is false once ends_at has passed", () => {
    const endsAt = new Date(now.getTime() - 1_000);
    expect(isInSoftCloseWindow(endsAt, now)).toBe(false);
  });

  it("is true at exactly 60s remaining", () => {
    const endsAt = new Date(now.getTime() + 60_000);
    expect(isInSoftCloseWindow(endsAt, now)).toBe(true);
  });
});

describe("computeNewEndsAt", () => {
  const t0 = new Date("2026-05-03T12:00:00Z");

  it("does not extend when bid lands outside soft-close window", () => {
    const endsAt = new Date(t0.getTime() + 5 * 60_000);
    const now = t0;
    const out = computeNewEndsAt(endsAt, endsAt, now);
    expect(out.extended).toBe(false);
    expect(out.endsAt).toEqual(endsAt);
  });

  it("extends by 60s when bid is within last 60s", () => {
    const original = new Date(t0.getTime() + 10 * 60_000);
    const endsAt = original;
    const now = new Date(original.getTime() - 30_000);
    const out = computeNewEndsAt(endsAt, original, now);
    expect(out.extended).toBe(true);
    expect(out.endsAt.getTime() - endsAt.getTime()).toBe(60_000);
  });

  it("clamps extension to original_ends_at + 30 minutes (cap)", () => {
    const original = new Date(t0.getTime() + 10 * 60_000);
    // already pushed to 29:30 past original
    const endsAt = new Date(original.getTime() + (29 * 60 + 30) * 1000);
    const now = new Date(endsAt.getTime() - 30_000);
    const out = computeNewEndsAt(endsAt, original, now);
    expect(out.extended).toBe(true);
    expect(out.endsAt.getTime()).toBe(original.getTime() + 30 * 60_000);
  });

  it("does not extend once cap is already reached", () => {
    const original = new Date(t0.getTime() + 10 * 60_000);
    const endsAt = new Date(original.getTime() + 30 * 60_000); // exactly at cap
    const now = new Date(endsAt.getTime() - 30_000);
    const out = computeNewEndsAt(endsAt, original, now);
    expect(out.extended).toBe(false);
    expect(out.endsAt).toEqual(endsAt);
  });
});
