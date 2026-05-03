"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { fetchFeedLots, type FeedCursor, type FeedLot } from "@/actions/feed";
import { CategoryChips } from "./category-chips";
import { SearchInput } from "./search-input";
import { LotCard } from "./lot-card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeedClient({
  initialLots,
  initialCursor,
}: {
  initialLots: FeedLot[];
  initialCursor: FeedCursor | null;
}) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lots, setLots] = useState<FeedLot[]>(initialLots);
  const [cursor, setCursor] = useState<FeedCursor | null>(initialCursor);
  const [isPending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const initialRef = useRef(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reload when filter or search changes (skip initial mount)
  useEffect(() => {
    if (initialRef.current) {
      initialRef.current = false;
      return;
    }
    const reqId = ++requestIdRef.current;
    startTransition(async () => {
      const result = await fetchFeedLots({
        category: category === "All" ? undefined : category,
        search: debouncedSearch || undefined,
      });
      if (reqId !== requestIdRef.current) return;
      setLots(result.lots);
      setCursor(result.nextCursor);
    });
  }, [category, debouncedSearch]);

  const loadMore = useCallback(async () => {
    if (loadingMore || isPending || !cursor) return;
    const reqId = ++requestIdRef.current;
    setLoadingMore(true);
    const result = await fetchFeedLots({
      category: category === "All" ? undefined : category,
      search: debouncedSearch || undefined,
      cursor,
    });
    if (reqId !== requestIdRef.current) {
      setLoadingMore(false);
      return;
    }
    setLots((prev) => [...prev, ...result.lots]);
    setCursor(result.nextCursor);
    setLoadingMore(false);
  }, [loadingMore, isPending, cursor, category, debouncedSearch]);

  // Infinite scroll sentinel
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !cursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  return (
    <div className="flex flex-col gap-4">
      <SearchInput value={search} onChange={setSearch} />
      <CategoryChips value={category} onChange={setCategory} />

      {lots.length === 0 && !(isPending || loadingMore) ? (
        <EmptyState
          hasFilters={category !== "All" || debouncedSearch.length > 0}
          onReset={() => {
            setCategory("All");
            setSearch("");
          }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {lots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="flex justify-center py-4">
        {(isPending || loadingMore) && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="text-7xl">{hasFilters ? "🔍" : "🪎"}</span>
      <div className="space-y-1">
        <p className="text-xl font-bold">
          {hasFilters ? "Nothing here yet" : "The feed is empty"}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {hasFilters
            ? "Nothing matches your filters right now."
            : "New lots will show up here as people post them."}
        </p>
      </div>
      {hasFilters && (
        <Button variant="outline" size="lg" onClick={onReset}>
          See all lots
        </Button>
      )}
    </div>
  );
}
