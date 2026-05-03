"use server";

import { createClient } from "@/lib/supabase/server";
import type { RarityTier } from "@/lib/constants";

export type FeedLot = {
  id: string;
  photo_url: string;
  title: string;
  current_price_cents: number;
  bid_count: number;
  ends_at: string | null;
  category: string;
  created_at: string;
  rarity: RarityTier;
};

export type FeedCursor = { createdAt: string; id: string };

const PAGE_SIZE = 20;

export async function fetchFeedLots(input: {
  category?: string;
  search?: string;
  cursor?: FeedCursor;
}): Promise<{ lots: FeedLot[]; nextCursor: FeedCursor | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("lots")
    .select(
      "id, photo_url, title, current_price_cents, bid_count, ends_at, category, created_at, rarity"
    )
    .eq("status", "active")
    .gt("ends_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE);

  if (user) {
    query = query.neq("seller_id", user.id);
  }

  if (input.category && input.category !== "All") {
    query = query.eq("category", input.category);
  }

  if (input.search && input.search.trim().length > 0) {
    const term = input.search.trim().replace(/[%_,()]/g, "");
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (input.cursor) {
    const { createdAt, id } = input.cursor;
    query = query.or(
      `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`
    );
  }

  const { data, error } = await query;

  if (error || !data) {
    return { lots: [], nextCursor: null };
  }

  const lots = data as FeedLot[];
  const nextCursor =
    lots.length === PAGE_SIZE
      ? { createdAt: lots[lots.length - 1].created_at, id: lots[lots.length - 1].id }
      : null;

  return { lots, nextCursor };
}
