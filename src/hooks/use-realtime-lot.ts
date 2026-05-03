"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type LotState = {
  current_price_cents: number;
  bid_count: number;
  ends_at: string | null;
  status: Database["public"]["Enums"]["lot_status"];
};

export function useRealtimeLot(lotId: string, initial: LotState): LotState {
  const [state, setState] = useState<LotState>(initial);

  useEffect(() => {
    setState(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`lot:${lotId}:state`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lots",
          filter: `id=eq.${lotId}`,
        },
        (payload) => {
          const row = payload.new as LotState;
          setState({
            current_price_cents: row.current_price_cents,
            bid_count: row.bid_count,
            ends_at: row.ends_at,
            status: row.status,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lotId]);

  return state;
}
