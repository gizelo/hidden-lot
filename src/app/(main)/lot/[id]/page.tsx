import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, HelpCircle, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { LotCountdown } from "@/components/lot/lot-countdown";
import { BidInput } from "@/components/lot/bid-input";
import { BidHistory } from "@/components/lot/bid-history";
import { formatPrice } from "@/lib/utils";
import type { BidRow } from "@/hooks/use-realtime-bids";

const RARITY_DISPLAY = {
  common: { label: "Common", emoji: "⚪" },
  rare: { label: "Rare", emoji: "🔵" },
  jackpot: { label: "Jackpot", emoji: "🟡" },
} as const;

export default async function LotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lot } = await supabase
    .from("lots")
    .select("*")
    .eq("id", id)
    .single();

  if (!lot) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bidsData } = await supabase
    .from("bids")
    .select("id, bidder_id, amount_cents, created_at, profiles!bids_bidder_id_fkey(display_name)")
    .eq("lot_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const initialBids: BidRow[] = (bidsData ?? []).map((b) => ({
    id: b.id,
    bidder_id: b.bidder_id,
    amount_cents: b.amount_cents,
    created_at: b.created_at,
    bidder_display_name:
      (b.profiles as unknown as { display_name: string } | null)?.display_name ??
      null,
  }));

  let winnerName: string | null = null;
  if (lot.status === "ended" && lot.winner_id) {
    const { data: winner } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", lot.winner_id)
      .single();
    winnerName = winner?.display_name ?? null;
  }

  const rarity = RARITY_DISPLAY[lot.rarity as keyof typeof RARITY_DISPLAY];
  const isSeller = user?.id === lot.seller_id;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link
        href="/feed"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        <span>Back</span>
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        {/* Media + Title */}
        <div className="order-1 space-y-4 lg:col-start-1 lg:row-start-1">
          <img
            src={lot.photo_url}
            alt={lot.title}
            className="w-full rounded-2xl object-cover aspect-[4/3]"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              {lot.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{lot.category}</span>
              <span className="text-muted-foreground/40">·</span>
              <Link
                href="/about#rarity"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
              >
                <span>
                  {rarity.emoji} {rarity.label}
                </span>
                <HelpCircle className="size-3 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>

        {/* Auction panel */}
        <aside className="order-2 space-y-4 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1 lg:self-start">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(lot.current_price_cents)}</span>
            {lot.bid_count === 0 && (
              <span className="text-sm text-muted-foreground">
                starting at {formatPrice(lot.starting_price_cents)}
              </span>
            )}
            {lot.bid_count > 0 && (
              <span className="text-sm text-muted-foreground">
                {lot.bid_count} bid{lot.bid_count !== 1 && "s"}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={lot.status === "active" ? "default" : "secondary"}>
              {lot.status}
            </Badge>
            {lot.ends_at && lot.status === "active" && (
              <LotCountdown endsAt={lot.ends_at} />
            )}
          </div>

          {lot.status === "active" && (
            <BidInput
              lotId={lot.id}
              initialPriceCents={lot.current_price_cents}
              initialBidCount={lot.bid_count}
              initialEndsAt={lot.ends_at}
              initialStatus={lot.status}
              startingPriceCents={lot.starting_price_cents}
              isSeller={isSeller}
              isAuthenticated={!!user}
            />
          )}

          {lot.status === "ended" && (
            <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-4 text-sm">
              <Trophy className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="font-medium">
                  Won by {winnerName ?? "an anonymous bidder"}
                </p>
                <p className="text-muted-foreground">
                  Final price {formatPrice(lot.current_price_cents)}
                </p>
              </div>
            </div>
          )}

          {lot.status === "expired" && (
            <div className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
              No bids — this auction expired.
            </div>
          )}
        </aside>

        {/* Description */}
        <div className="order-3 space-y-6 lg:col-start-1 lg:row-start-2">
          <p className="text-sm leading-relaxed">{lot.description}</p>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Bid history</h2>
            <BidHistory lotId={lot.id} initialBids={initialBids} />
          </div>
        </div>
      </div>
    </div>
  );
}
