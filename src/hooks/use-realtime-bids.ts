"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type BidRow = {
  id: string;
  bidder_id: string;
  amount_cents: number;
  created_at: string;
  bidder_display_name: string | null;
};

export function useRealtimeBids(
  lotId: string,
  initialBids: BidRow[]
): BidRow[] {
  const [bids, setBids] = useState<BidRow[]>(initialBids);

  useEffect(() => {
    setBids(initialBids);
  }, [initialBids]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`lot:${lotId}:bids`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `lot_id=eq.${lotId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            bidder_id: string;
            amount_cents: number;
            created_at: string;
          };
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", row.bidder_id)
            .single();
          setBids((prev) => {
            if (prev.some((b) => b.id === row.id)) return prev;
            return [
              {
                id: row.id,
                bidder_id: row.bidder_id,
                amount_cents: row.amount_cents,
                created_at: row.created_at,
                bidder_display_name: profile?.display_name ?? null,
              },
              ...prev,
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lotId]);

  return bids;
}
