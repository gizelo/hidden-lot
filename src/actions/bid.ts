"use server";

import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

type PlaceBidSuccess = {
  newPriceCents: number;
  newEndsAt: string;
  extended: boolean;
};

type RpcResponse = {
  ok: boolean;
  error?: string;
  min_cents?: number;
  new_price_cents?: number;
  new_ends_at?: string;
  extended?: boolean;
};

export async function placeBid(
  lotId: string,
  amountCents: number
): Promise<{ data: PlaceBidSuccess } | { error: string }> {
  if (!Number.isInteger(amountCents) || amountCents < 100) {
    return { error: "Enter a valid bid amount." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to place a bid." };

  const { data, error } = await supabase.rpc("place_bid", {
    p_lot_id: lotId,
    p_amount_cents: amountCents,
  });

  if (error) {
    console.error("[placeBid] RPC error:", error);
    return { error: "Couldn't place bid. Try again." };
  }

  const res = data as unknown as RpcResponse;
  if (!res?.ok) {
    return { error: mapErrorCode(res?.error, res?.min_cents) };
  }

  return {
    data: {
      newPriceCents: res.new_price_cents!,
      newEndsAt: res.new_ends_at!,
      extended: res.extended ?? false,
    },
  };
}

function mapErrorCode(code: string | undefined, minCents?: number): string {
  switch (code) {
    case "unauthenticated":
      return "Sign in to place a bid.";
    case "lot_not_found":
      return "Lot not found.";
    case "own_lot":
      return "You can't bid on your own lot.";
    case "auction_closed":
      return "This auction has ended.";
    case "below_minimum":
      return minCents != null
        ? `Minimum bid is ${formatPrice(minCents)}.`
        : "Bid too low.";
    default:
      return "Couldn't place bid. Try again.";
  }
}
