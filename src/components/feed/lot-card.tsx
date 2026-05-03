"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";
import type { FeedLot } from "@/actions/feed";
import type { RarityTier } from "@/lib/constants";

const RARITY_CHIP = {
  rare: {
    label: "Rare",
    emoji: "🔵",
    className: "bg-blue-500/90 text-white",
  },
  jackpot: {
    label: "Jackpot",
    emoji: "🟡",
    className: "bg-amber-400/95 text-amber-950 shadow-sm shadow-amber-500/40",
  },
} as const;

function RarityChip({ rarity }: { rarity: RarityTier }) {
  if (rarity === "common") return null;
  const chip = RARITY_CHIP[rarity];
  return (
    <span
      className={`absolute right-2 top-2 inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold backdrop-blur-sm ${chip.className}`}
    >
      <span>{chip.emoji}</span>
      <span>{chip.label}</span>
    </span>
  );
}

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
        <RarityChip rarity={lot.rarity} />
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
