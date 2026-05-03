"use server";

import { createClient } from "@/lib/supabase/server";
import { analyzeItemPhoto, type LotAnalysis } from "@/lib/openai";
import { moderateListingText } from "@/lib/moderation";
import { CATEGORIES, RARITY_TIERS, type RarityTier } from "@/lib/constants";

export async function analyzeLot(
  photoUrl: string
): Promise<{ data: LotAnalysis } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const analysis = await analyzeItemPhoto(photoUrl);
    return { data: analysis };
  } catch (err) {
    console.error("[analyzeLot] Error:", err);
    return { error: "Failed to analyze photo. Please try again." };
  }
}

export async function createLot(input: {
  photoUrl: string;
  title: string;
  description: string;
  category: string;
  startingPriceCents: number;
  rarity: string;
  rarityReasoning: string;
}): Promise<{ lotId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Validate
  if (!input.photoUrl.trim()) {
    return { error: "Photo is required" };
  }
  if (!input.title.trim()) {
    return { error: "Title is required" };
  }
  if (!input.description.trim()) {
    return { error: "Description is required" };
  }
  if (!CATEGORIES.includes(input.category as (typeof CATEGORIES)[number])) {
    return { error: "Invalid category" };
  }
  if (input.startingPriceCents < 100) {
    return { error: "Starting price must be at least €1.00" };
  }
  if (!RARITY_TIERS.includes(input.rarity as RarityTier)) {
    return { error: "Invalid rarity tier" };
  }

  const moderation = await moderateListingText(input.title, input.description);
  if (!moderation.ok) {
    return { error: moderation.reason };
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("lots")
    .insert({
      seller_id: user.id,
      photo_url: input.photoUrl,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      starting_price_cents: input.startingPriceCents,
      current_price_cents: input.startingPriceCents,
      rarity: input.rarity as RarityTier,
      rarity_reasoning: input.rarityReasoning,
      status: "active",
      duration_hours: 24,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Failed to create lot. Please try again." };
  }

  return { lotId: data.id };
}
