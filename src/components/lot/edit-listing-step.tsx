"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AUCTION_DURATIONS,
  CATEGORIES,
  DEFAULT_AUCTION_DURATION,
} from "@/lib/constants";
import { createLot } from "@/actions/lot";
import type { LotAnalysis } from "@/lib/openai";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";

const RARITY_DISPLAY = {
  common: { label: "Common", emoji: "⚪", color: "text-muted-foreground" },
  rare: { label: "Rare", emoji: "🔵", color: "text-blue-600" },
  jackpot: { label: "Jackpot", emoji: "🟡", color: "text-amber-500" },
} as const;

export function EditListingStep({
  photoUrl,
  analysis,
  onBack,
  onPublished,
}: {
  photoUrl: string;
  analysis: LotAnalysis;
  onBack: () => void;
  onPublished: (lotId: string) => void;
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [title, setTitle] = useState(analysis.title);
  const [description, setDescription] = useState(analysis.description);
  const [category, setCategory] = useState<string>(analysis.category);
  const [priceCents, setPriceCents] = useState(analysis.suggestedPriceCents);
  const [durationHours, setDurationHours] = useState(DEFAULT_AUCTION_DURATION);

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);

    const result = await createLot({
      photoUrl,
      title,
      description,
      category,
      startingPriceCents: priceCents,
      durationHours,
      rarity: analysis.rarity,
      rarityReasoning: analysis.rarityReasoning,
    });

    if ("error" in result) {
      setPublishError(result.error);
      setPublishing(false);
      return;
    }

    onPublished(result.lotId);
    router.push(`/lot/${result.lotId}`);
  }

  const rarity = RARITY_DISPLAY[analysis.rarity];
  const priceEur = (priceCents / 100).toFixed(2);
  const reasoningBullets = analysis.rarityReasoning
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      {/* Photo + Rarity */}
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={title}
          className="size-28 shrink-0 rounded-xl object-cover"
        />
        <div className="flex min-w-0 flex-col justify-center gap-2">
          <span className={`text-base font-semibold ${rarity.color}`}>
            {rarity.emoji} {rarity.label}*
          </span>
          {reasoningBullets.length > 0 && (
            <ul className="space-y-0.5 text-sm text-muted-foreground">
              {reasoningBullets.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground/60">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Asterisk footnote */}
      <p className="text-xs text-muted-foreground/70">
        * AI guess, not an expert appraisal. Do your own research.
      </p>

      {/* Title */}
      <div className="flex flex-col gap-2">
        <label htmlFor="lot-title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="lot-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="h-11 text-base md:text-base"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label htmlFor="lot-description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="lot-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={4}
          className="w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2">
        <label htmlFor="lot-category" className="text-sm font-medium">
          Category
        </label>
        <select
          id="lot-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Price */}
      <div className="flex flex-col gap-2">
        <label htmlFor="lot-price" className="text-sm font-medium">
          Starting price (EUR)
        </label>
        <Input
          id="lot-price"
          type="number"
          min="1"
          step="0.50"
          value={priceEur}
          onChange={(e) => {
            const cents = Math.round(Number(e.target.value) * 100);
            if (cents >= 0) setPriceCents(cents);
          }}
          className="h-11 text-base md:text-base"
        />
      </div>

      {/* Duration */}
      <div className="flex flex-col gap-2">
        <label htmlFor="lot-duration" className="text-sm font-medium">
          Auction duration
        </label>
        <div className="grid grid-cols-3 gap-2">
          {AUCTION_DURATIONS.map((hours) => (
            <button
              key={hours}
              id={hours === AUCTION_DURATIONS[0] ? "lot-duration" : undefined}
              type="button"
              onClick={() => setDurationHours(hours)}
              className={`h-11 rounded-lg border text-sm font-medium transition-colors ${
                durationHours === hours
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-muted"
              }`}
              aria-pressed={durationHours === hours}
            >
              {hours}h
            </button>
          ))}
        </div>
      </div>

      {publishError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{publishError}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={publishing}
          className="shrink-0"
        >
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
        <Button
          size="lg"
          onClick={handlePublish}
          disabled={publishing || !title.trim() || !description.trim() || priceCents < 100}
          className="flex-1"
        >
          {publishing ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Publishing...
            </>
          ) : (
            "Publish"
          )}
        </Button>
      </div>
    </div>
  );
}
