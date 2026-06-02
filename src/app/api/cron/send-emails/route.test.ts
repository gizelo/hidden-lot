import { describe, expect, it } from "vitest";
import { buildEmail } from "./route";

describe("buildEmail", () => {
  it("includes seller contact in auction-won emails", () => {
    const email = buildEmail("auction_won", {
      lot_id: "lot-1",
      lot_title: "Pocket Radio",
      final_amount_cents: 2500,
      seller_email: "seller@example.com",
    });

    expect(email?.subject).toBe('You won "Pocket Radio"');
    expect(email?.html).toContain("Seller contact for handover");
    expect(email?.html).toContain("seller@example.com");
    expect(email?.html).toContain("no real payment is taken");
  });

  it("includes winner contact in seller-ended emails", () => {
    const email = buildEmail("auction_ended_seller", {
      lot_id: "lot-1",
      lot_title: "Pocket Radio",
      final_amount_cents: 2500,
      winner_email: "winner@example.com",
    });

    expect(email?.subject).toBe('Your lot "Pocket Radio" sold');
    expect(email?.html).toContain("Winner contact for handover");
    expect(email?.html).toContain("winner@example.com");
    expect(email?.html).toContain("no real payment is processed");
  });
});
