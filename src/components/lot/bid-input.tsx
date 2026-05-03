"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { placeBid } from "@/actions/bid";
import { useRealtimeLot } from "@/hooks/use-realtime-lot";
import { getNextMinimumBid } from "@/lib/bid-utils";
import { formatPrice } from "@/lib/utils";
import type { Database } from "@/types/database";

type Status = Database["public"]["Enums"]["lot_status"];

export function BidInput({
  lotId,
  initialPriceCents,
  initialBidCount,
  initialEndsAt,
  initialStatus,
  startingPriceCents,
  isSeller,
  isAuthenticated,
}: {
  lotId: string;
  initialPriceCents: number;
  initialBidCount: number;
  initialEndsAt: string | null;
  initialStatus: Status;
  startingPriceCents: number;
  isSeller: boolean;
  isAuthenticated: boolean;
}) {
  const lot = useRealtimeLot(lotId, {
    current_price_cents: initialPriceCents,
    bid_count: initialBidCount,
    ends_at: initialEndsAt,
    status: initialStatus,
  });

  const minNextCents = useMemo(
    () =>
      getNextMinimumBid({
        bid_count: lot.bid_count,
        starting_price_cents: startingPriceCents,
        current_price_cents: lot.current_price_cents,
      }),
    [lot.bid_count, lot.current_price_cents, startingPriceCents]
  );

  const isClosed = lot.status !== "active";

  const [value, setValue] = useState(() => (minNextCents / 100).toFixed(2));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>{" "}
        to place a bid.
      </div>
    );
  }

  if (isSeller) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        This is your lot — you can&apos;t bid on it.
      </div>
    );
  }

  if (isClosed) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        This auction has ended.
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const cents = Math.round(parseFloat(value.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < minNextCents) {
      setError(`Minimum bid is ${formatPrice(minNextCents)}.`);
      return;
    }
    startTransition(async () => {
      const result = await placeBid(lotId, cents);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSuccess(
        result.data.extended
          ? "Bid placed — auction extended by 60s."
          : "Bid placed."
      );
      setValue(((cents + 100) / 100).toFixed(2));
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="text-xs text-muted-foreground">
        Minimum next bid: <span className="font-medium text-foreground">{formatPrice(minNextCents)}</span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            €
          </span>
          <Input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={pending}
            className="h-12 pl-7 text-base"
            aria-label="Bid amount"
          />
        </div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Placing…" : "Place bid"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-primary">{success}</p>}
    </form>
  );
}
