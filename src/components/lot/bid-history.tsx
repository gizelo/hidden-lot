"use client";

import { useRealtimeBids, type BidRow } from "@/hooks/use-realtime-bids";
import { formatPrice } from "@/lib/utils";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function relativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  return rtf.format(Math.round(diffSec / 86400), "day");
}

export function BidHistory({
  lotId,
  initialBids,
}: {
  lotId: string;
  initialBids: BidRow[];
}) {
  const bids = useRealtimeBids(lotId, initialBids);

  if (bids.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Be the first to bid.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {bids.map((b, i) => (
        <li
          key={b.id}
          className="flex items-center justify-between px-4 py-3 text-sm"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {b.bidder_display_name ?? "Anonymous"}
            </span>
            {i === 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                Leading
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">{formatPrice(b.amount_cents)}</span>
            <span className="text-xs text-muted-foreground">
              {relativeTime(b.created_at)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
