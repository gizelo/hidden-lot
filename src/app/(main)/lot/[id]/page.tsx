import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { LotCountdown } from "@/components/lot/lot-countdown";

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

  const rarity = RARITY_DISPLAY[lot.rarity as keyof typeof RARITY_DISPLAY];
  const priceEur = (lot.current_price_cents / 100).toFixed(2);
  const startingEur = (lot.starting_price_cents / 100).toFixed(2);

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
      {/* Media + Title — left column on desktop, first on mobile */}
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

      {/* Auction panel — right column on desktop, second on mobile */}
      <aside className="order-2 space-y-4 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1 lg:self-start">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">&euro;{priceEur}</span>
          {lot.bid_count === 0 && (
            <span className="text-sm text-muted-foreground">
              starting at &euro;{startingEur}
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
      </aside>

      {/* Description — left column below media on desktop, last on mobile */}
      <div className="order-3 lg:col-start-1 lg:row-start-2">
        <p className="text-sm leading-relaxed">{lot.description}</p>
      </div>
      </div>
    </div>
  );
}
