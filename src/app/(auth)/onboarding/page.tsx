"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/constants";
import { updateCategories } from "@/actions/auth";

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  function toggle(category: string) {
    setSelected((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }

  async function handleSubmit() {
    if (selected.length === 0) return;
    setPending(true);
    await updateCategories(selected);
  }

  return (
    <div className="space-y-8">
      {/* Logo */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">HiddenLot</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          What are you interested in? Pick at least one.
        </p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((category) => {
          const isSelected = selected.includes(category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => toggle(category)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:border-primary/50"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        className="w-full"
        disabled={selected.length === 0 || pending}
      >
        {pending ? "Saving..." : `Continue (${selected.length} selected)`}
      </Button>
    </div>
  );
}
