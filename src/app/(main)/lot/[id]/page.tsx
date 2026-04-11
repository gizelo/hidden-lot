import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

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
  const endsAt = lot.ends_at ? new Date(lot.ends_at) : null;
  const priceEur = (lot.current_price_cents / 100).toFixed(2);
  const startingEur = (lot.starting_price_cents / 100).toFixed(2);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Photo */}
      <img
        src={lot.photo_url}
        alt={lot.title}
        className="w-full rounded-2xl object-cover aspect-[4/3]"
      />

      {/* Title + Category */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{lot.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{lot.category}</p>
      </div>

      {/* Price */}
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

      {/* Status + Timer */}
      <div className="flex items-center gap-2">
        <Badge variant={lot.status === "active" ? "default" : "secondary"}>
          {lot.status}
        </Badge>
        {endsAt && lot.status === "active" && (
          <span className="text-sm text-muted-foreground">
            Ends {endsAt.toLocaleString()}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed">{lot.description}</p>

      {/* Rarity */}
      <div className="rounded-xl border border-border p-4 space-y-2">
        <p className="text-sm font-semibold">
          {rarity.emoji} {rarity.label}
        </p>
        {lot.rarity_reasoning && (
          <p className="text-xs text-muted-foreground whitespace-pre-line">
            {lot.rarity_reasoning}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground/70">
          AI guess, not an expert appraisal. Do your own research.
        </p>
      </div>
    </div>
  );
}
