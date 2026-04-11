"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/constants";
import { analyzeLot, createLot } from "@/actions/lot";
import type { LotAnalysis } from "@/lib/openai";
import {
  Loader2,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

const RARITY_DISPLAY = {
  common: { label: "Common", emoji: "⚪", color: "text-muted-foreground" },
  rare: { label: "Rare", emoji: "🔵", color: "text-blue-600" },
  jackpot: { label: "Jackpot", emoji: "🟡", color: "text-amber-500" },
} as const;

export function EditListingStep({
  photoUrl,
  onBack,
  onPublished,
}: {
  photoUrl: string;
  onBack: () => void;
  onPublished: (lotId: string) => void;
}) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<LotAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priceCents, setPriceCents] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function analyze() {
      setAnalyzing(true);
      setAnalyzeError(null);
      const result = await analyzeLot(photoUrl);
      if (cancelled) return;
      if ("error" in result) {
        setAnalyzeError(result.error);
        setAnalyzing(false);
        return;
      }
      setAnalysis(result.data);
      setTitle(result.data.title);
      setDescription(result.data.description);
      setCategory(result.data.category);
      setPriceCents(result.data.suggestedPriceCents);
      setAnalyzing(false);
    }
    analyze();
    return () => {
      cancelled = true;
    };
  }, [photoUrl]);

  async function handlePublish() {
    if (!analysis) return;
    setPublishing(true);
    setPublishError(null);

    const result = await createLot({
      photoUrl,
      title,
      description,
      category,
      startingPriceCents: priceCents,
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

  // Loading state
  if (analyzing) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="relative">
          <Sparkles className="size-10 text-primary animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">AI is analyzing your item...</p>
          <p className="text-xs text-muted-foreground mt-1">
            This takes a few seconds
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (analyzeError) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <AlertTriangle className="size-10 text-destructive" />
        <p className="text-sm text-destructive text-center">{analyzeError}</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 size-4" />
          Try a different photo
        </Button>
      </div>
    );
  }

  if (!analysis) return null;

  const rarity = RARITY_DISPLAY[analysis.rarity];
  const priceEur = (priceCents / 100).toFixed(2);

  return (
    <div className="flex flex-col gap-4">
      {/* Photo + Rarity */}
      <div className="flex gap-3">
        <img
          src={photoUrl}
          alt={title}
          className="size-24 shrink-0 rounded-xl object-cover"
        />
        <div className="flex flex-col justify-center gap-1 min-w-0">
          <span className={`text-sm font-semibold ${rarity.color}`}>
            {rarity.emoji} {rarity.label}
          </span>
          <p className="text-xs text-muted-foreground line-clamp-3">
            {analysis.rarityReasoning}
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground/70">
        AI guess, not an expert appraisal. Do your own research.
      </p>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lot-title" className="text-xs font-medium">
          Title
        </label>
        <Input
          id="lot-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lot-description" className="text-xs font-medium">
          Description
        </label>
        <textarea
          id="lot-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lot-category" className="text-xs font-medium">
          Category
        </label>
        <select
          id="lot-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Price */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lot-price" className="text-xs font-medium">
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
        />
      </div>

      {/* Publish error */}
      {publishError && (
        <p className="text-sm text-destructive">{publishError}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={publishing}
          className="shrink-0"
        >
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
        <Button
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
