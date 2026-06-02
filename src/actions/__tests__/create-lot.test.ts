import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  moderateListingText: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  })),
}));

vi.mock("@/lib/moderation", () => ({
  moderateListingText: mocks.moderateListingText,
}));

vi.mock("@/lib/openai", () => ({
  analyzeItemPhoto: vi.fn(),
}));

import { createLot } from "../lot";

const VALID_INPUT = {
  photoUrl: "https://example.com/photo.jpg",
  title: "Vintage Pocket Radio",
  description: "A small pocket radio with light wear on the casing.",
  category: "Vintage Electronics",
  startingPriceCents: 1500,
  durationHours: 48,
  rarity: "common",
  rarityReasoning: "Standard portable radio\nNo edition markings visible",
};

describe("createLot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-03T12:00:00Z"));
    mocks.getUser.mockReset();
    mocks.from.mockReset();
    mocks.insert.mockReset();
    mocks.select.mockReset();
    mocks.single.mockReset();
    mocks.moderateListingText.mockReset();

    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email_confirmed_at: "2026-05-03T11:00:00Z" } },
    });
    mocks.moderateListingText.mockResolvedValue({ ok: true });
    mocks.single.mockResolvedValue({ data: { id: "lot-1" }, error: null });
    mocks.select.mockReturnValue({ single: mocks.single });
    mocks.insert.mockReturnValue({ select: mocks.select });
    mocks.from.mockReturnValue({ insert: mocks.insert });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects unverified users before moderation or insert", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email_confirmed_at: null } },
    });

    const result = await createLot(VALID_INPUT);

    expect(result).toEqual({ error: "Verify your email before creating a lot." });
    expect(mocks.moderateListingText).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects invalid auction duration before moderation or insert", async () => {
    const result = await createLot({ ...VALID_INPUT, durationHours: 12 });

    expect(result).toEqual({ error: "Invalid auction duration" });
    expect(mocks.moderateListingText).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("inserts the selected duration and matching ends_at", async () => {
    const result = await createLot(VALID_INPUT);

    expect(result).toEqual({ lotId: "lot-1" });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        duration_hours: 48,
        starts_at: "2026-05-03T12:00:00.000Z",
        ends_at: "2026-05-05T12:00:00.000Z",
      })
    );
  });
});
