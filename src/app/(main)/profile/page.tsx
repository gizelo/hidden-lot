import Link from "next/link";
import type { ReactNode } from "react";
import { Clock, Gavel, Package, Plus, Trophy } from "lucide-react";
import { CreateLotTrigger } from "@/components/lot/create-lot-modal";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

type ProfileLot = {
  id: string;
  title: string;
  photo_url: string;
  current_price_cents: number;
  bid_count: number;
  ends_at: string | null;
  status: "draft" | "active" | "ended" | "expired";
  winner_id: string | null;
  category: string;
};

type BidRow = {
  lot_id: string;
  amount_cents: number;
  created_at: string;
  lots: ProfileLot | null;
};

type BidSummary = {
  lot: ProfileLot;
  userMaxBidCents: number;
  lastBidAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, category_preferences")
    .eq("id", user?.id ?? "")
    .single();

  const { data: myLots } = await supabase
    .from("lots")
    .select(
      "id, title, photo_url, current_price_cents, bid_count, ends_at, status, winner_id, category"
    )
    .eq("seller_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(24);

  const { data: bidRows } = await supabase
    .from("bids")
    .select(
      "lot_id, amount_cents, created_at, lots!bids_lot_id_fkey(id, title, photo_url, current_price_cents, bid_count, ends_at, status, winner_id, category)"
    )
    .eq("bidder_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(100);

  const bidSummaries = summarizeBids((bidRows ?? []) as unknown as BidRow[]);
  const displayName = profile?.display_name?.trim() || user?.email || "HiddenLot user";
  const categories: string[] = Array.isArray(profile?.category_preferences)
    ? profile.category_preferences
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Profile</p>
          <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
          <div className="flex flex-wrap gap-2">
            {categories.length > 0 ? (
              categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                No categories selected yet.
              </span>
            )}
          </div>
        </div>
        <CreateLotTrigger className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_3px_0_0] shadow-foreground/20 transition-all hover:bg-primary/90 active:translate-y-[3px] active:shadow-none">
          <Plus className="size-4" />
          Create lot
        </CreateLotTrigger>
      </header>

      <section className="space-y-3">
        <SectionHeading
          icon={<Package className="size-5" />}
          title="My lots"
          count={myLots?.length ?? 0}
        />
        {myLots && myLots.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myLots.map((lot) => (
              <ProfileLotCard key={lot.id} lot={lot as ProfileLot} userId={user?.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No lots yet"
            body="Snap one clear photo and let AI draft the listing."
            action={
              <CreateLotTrigger className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_3px_0_0] shadow-foreground/20 transition-all hover:bg-primary/90 active:translate-y-[3px] active:shadow-none">
                <Plus className="size-4" />
                Create your first lot
              </CreateLotTrigger>
            }
          />
        )}
      </section>

      <section className="space-y-3">
        <SectionHeading
          icon={<Gavel className="size-5" />}
          title="My bids"
          count={bidSummaries.length}
        />
        {bidSummaries.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bidSummaries.map((summary) => (
              <BidLotCard
                key={summary.lot.id}
                summary={summary}
                userId={user?.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No bids yet"
            body="Open the feed and place a test bid on something weirdly tempting."
            action={
              <Link
                href="/feed"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_3px_0_0] shadow-foreground/20 transition-all hover:bg-primary/90 active:translate-y-[3px] active:shadow-none"
              >
                Browse feed
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}

function summarizeBids(rows: BidRow[]): BidSummary[] {
  const byLot = new Map<string, BidSummary>();
  for (const row of rows) {
    if (!row.lots) continue;
    const existing = byLot.get(row.lot_id);
    if (!existing) {
      byLot.set(row.lot_id, {
        lot: row.lots,
        userMaxBidCents: row.amount_cents,
        lastBidAt: row.created_at,
      });
      continue;
    }
    existing.userMaxBidCents = Math.max(existing.userMaxBidCents, row.amount_cents);
    if (new Date(row.created_at).getTime() > new Date(existing.lastBidAt).getTime()) {
      existing.lastBidAt = row.created_at;
    }
  }
  return Array.from(byLot.values()).sort(
    (a, b) => new Date(b.lastBidAt).getTime() - new Date(a.lastBidAt).getTime()
  );
}

function SectionHeading({
  icon,
  title,
  count,
}: {
  icon: ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        {icon}
        {title}
      </h2>
      <Badge variant="outline">{count}</Badge>
    </div>
  );
}

function ProfileLotCard({ lot, userId }: { lot: ProfileLot; userId?: string }) {
  const badge = getLotBadge(lot, userId);

  return (
    <Link
      href={`/lot/${lot.id}`}
      className="group grid grid-cols-[104px_minmax(0,1fr)] gap-3 rounded-xl border border-border bg-card p-2 transition-shadow hover:shadow-md"
    >
      <LotThumb lot={lot} />
      <div className="flex min-w-0 flex-col justify-between gap-2 py-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <span className="truncate text-xs text-muted-foreground">
              {lot.category}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
            {lot.title}
          </h3>
        </div>
        <LotMeta lot={lot} />
      </div>
    </Link>
  );
}

function BidLotCard({
  summary,
  userId,
}: {
  summary: BidSummary;
  userId?: string;
}) {
  const { lot } = summary;
  const badge = getBidBadge(summary, userId);

  return (
    <Link
      href={`/lot/${lot.id}`}
      className="group grid grid-cols-[104px_minmax(0,1fr)] gap-3 rounded-xl border border-border bg-card p-2 transition-shadow hover:shadow-md"
    >
      <LotThumb lot={lot} />
      <div className="flex min-w-0 flex-col justify-between gap-2 py-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <span className="truncate text-xs text-muted-foreground">
              Last bid {dateFormatter.format(new Date(summary.lastBidAt))}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
            {lot.title}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Your max</p>
            <p className="font-semibold">{formatPrice(summary.userMaxBidCents)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Current</p>
            <p className="font-semibold">{formatPrice(lot.current_price_cents)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function LotThumb({ lot }: { lot: ProfileLot }) {
  return (
    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={lot.photo_url}
        alt={lot.title}
        className="size-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
    </div>
  );
}

function LotMeta({ lot }: { lot: ProfileLot }) {
  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{formatPrice(lot.current_price_cents)}</span>
        {lot.bid_count > 0 && (
          <span className="text-muted-foreground">
            {lot.bid_count} bid{lot.bid_count !== 1 && "s"}
          </span>
        )}
      </div>
      {lot.ends_at && lot.status === "active" && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="size-3.5" />
          <span>Ends {dateFormatter.format(new Date(lot.ends_at))}</span>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-4 py-12 text-center">
      <Trophy className="size-9 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-base font-semibold">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      </div>
      {action}
    </div>
  );
}

function getLotBadge(lot: ProfileLot, userId?: string): {
  label: string;
  variant: "default" | "secondary" | "outline";
} {
  if (lot.status === "ended" && lot.winner_id) return { label: "Sold", variant: "default" };
  if (lot.status === "expired") return { label: "Expired", variant: "secondary" };
  if (lot.status === "active") return { label: "Active", variant: "outline" };
  if (lot.winner_id === userId) return { label: "Won", variant: "default" };
  return { label: "Draft", variant: "secondary" };
}

function getBidBadge(
  summary: BidSummary,
  userId?: string
): { label: string; variant: "default" | "secondary" | "outline" } {
  const { lot, userMaxBidCents } = summary;
  if (lot.status === "ended" && lot.winner_id === userId) {
    return { label: "Won", variant: "default" };
  }
  if (lot.status !== "active") return { label: "Ended", variant: "secondary" };
  if (userMaxBidCents >= lot.current_price_cents) {
    return { label: "Leading", variant: "default" };
  }
  return { label: "Outbid", variant: "outline" };
}
