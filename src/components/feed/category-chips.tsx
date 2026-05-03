"use client";

import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ALL = "All";
const CHIPS = [ALL, ...CATEGORIES] as const;

export function CategoryChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (category: string) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-2">
        {CHIPS.map((cat) => {
          const active = cat === value;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              className={cn(
                "h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
