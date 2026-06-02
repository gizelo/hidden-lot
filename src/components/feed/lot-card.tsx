"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";
import type { FeedLot } from "@/actions/feed";

export function LotCard({ lot }: { lot: FeedLot }) {
  const remaining = useCountdown(lot.ends_at);
  const priceEur = (lot.current_price_cents / 100).toFixed(2);

  return (
    <Link
      href={`/lot/${lot.id}`}
      className="group flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-2 transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={lot.photo_url}
          alt={lot.title}
          className="size-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 px-1 pb-1">
        <h3 className="line-clamp-2 text-base font-semibold leading-tight">
          {lot.title}
        </h3>
        <div className="mt-auto space-y-1">
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-lg font-bold">&euro;{priceEur}</span>
            {lot.bid_count > 0 && (
              <span className="text-xs text-muted-foreground">
                {lot.bid_count} bid{lot.bid_count !== 1 && "s"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>{remaining}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
