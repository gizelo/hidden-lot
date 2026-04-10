"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/constants";
import { updateCategories, signOut } from "@/actions/auth";

const CATEGORY_EMOJIS: Record<string, string> = {
  "Toys & Figures": "🧸",
  "Trading Cards": "🃏",
  "Coins & Currency": "🪙",
  "Stamps & Philately": "📮",
  "Art & Prints": "🎨",
  "Books & Manuscripts": "📚",
  "Vintage Electronics": "📻",
  "Jewelry & Watches": "💍",
  "Clothing & Accessories": "👗",
  "Sports Memorabilia": "⚽",
  "Vinyl & Music": "🎵",
  "Curiosities & Oddities": "🔮",
};

const MAX_CATEGORIES = 5;

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  function toggle(category: string) {
    setSelected((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      if (prev.length >= MAX_CATEGORIES) return prev;
      return [...prev, category];
    });
  }

  async function handleSubmit() {
    if (selected.length === 0) return;
    setPending(true);
    await updateCategories(selected);
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Sign out */}
      <div className="flex justify-end p-4">
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              What are you into? 🪎
            </h1>
            <p className="text-muted-foreground">
              Pick up to {MAX_CATEGORIES} categories that interest you. This
              shapes your feed.
            </p>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((category) => {
              const isSelected = selected.includes(category);
              const isMaxed =
                selected.length >= MAX_CATEGORIES && !isSelected;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggle(category)}
                  disabled={isMaxed}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-sm font-medium transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary scale-[1.02] shadow-sm"
                      : isMaxed
                        ? "border-border bg-muted/30 text-muted-foreground opacity-50 cursor-not-allowed"
                        : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <span className="text-2xl">
                    {CATEGORY_EMOJIS[category] || "📦"}
                  </span>
                  <span>{category}</span>
                </button>
              );
            })}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full text-base"
            disabled={selected.length === 0 || pending}
          >
            {pending
              ? "Saving..."
              : selected.length === 0
                ? "Pick at least one"
                : `Continue (${selected.length} selected)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
