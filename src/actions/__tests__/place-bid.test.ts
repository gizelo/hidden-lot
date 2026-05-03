import { describe, it, expect, vi, beforeEach } from "vitest";

const rpcMock = vi.fn();
const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    rpc: rpcMock,
  })),
}));

import { placeBid } from "../bid";

const VALID_LOT = "11111111-1111-1111-1111-111111111111";

describe("placeBid", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    getUserMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("rejects unauthenticated callers without hitting the RPC", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const result = await placeBid(VALID_LOT, 1000);
    expect(result).toEqual({ error: "Sign in to place a bid." });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("rejects amounts below 100 cents without hitting the RPC", async () => {
    const result = await placeBid(VALID_LOT, 50);
    expect("error" in result).toBe(true);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("returns success payload on ok=true RPC response", async () => {
    rpcMock.mockResolvedValue({
      data: {
        ok: true,
        new_price_cents: 1500,
        new_ends_at: "2026-05-03T12:30:00Z",
        extended: true,
      },
      error: null,
    });
    const result = await placeBid(VALID_LOT, 1500);
    expect(result).toEqual({
      data: {
        newPriceCents: 1500,
        newEndsAt: "2026-05-03T12:30:00Z",
        extended: true,
      },
    });
  });

  it("maps below_minimum with min_cents to a friendly message", async () => {
    rpcMock.mockResolvedValue({
      data: { ok: false, error: "below_minimum", min_cents: 1600 },
      error: null,
    });
    const result = await placeBid(VALID_LOT, 1500);
    expect(result).toEqual({ error: "Minimum bid is €16.00." });
  });

  it("maps own_lot to a friendly message", async () => {
    rpcMock.mockResolvedValue({
      data: { ok: false, error: "own_lot" },
      error: null,
    });
    const result = await placeBid(VALID_LOT, 1500);
    expect(result).toEqual({ error: "You can't bid on your own lot." });
  });

  it("maps auction_closed to a friendly message", async () => {
    rpcMock.mockResolvedValue({
      data: { ok: false, error: "auction_closed" },
      error: null,
    });
    const result = await placeBid(VALID_LOT, 1500);
    expect(result).toEqual({ error: "This auction has ended." });
  });

  it("returns generic error when the RPC itself errors out", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    const result = await placeBid(VALID_LOT, 1500);
    expect(result).toEqual({ error: "Couldn't place bid. Try again." });
  });
});
