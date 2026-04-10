-- HiddenLot Alpha — Initial Schema
-- Tables: profiles, lots, bids
-- Enums: lot_status, rarity_tier

-- ============================================
-- ENUM TYPES
-- ============================================

create type lot_status as enum ('draft', 'active', 'ended', 'expired');
create type rarity_tier as enum ('common', 'rare', 'jackpot');

-- ============================================
-- TABLES
-- ============================================

-- Extends Supabase auth.users with app-specific fields
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  category_preferences text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lots (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  photo_url text not null,
  category text not null,
  starting_price_cents integer not null,
  current_price_cents integer not null,
  rarity rarity_tier not null default 'common',
  rarity_reasoning text,
  status lot_status not null default 'draft',
  duration_hours integer not null default 48,
  starts_at timestamptz,
  ends_at timestamptz,
  winner_id uuid references public.profiles(id),
  bid_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents integer not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_lots_active_ends on public.lots(status, ends_at) where status = 'active';
create index idx_lots_seller on public.lots(seller_id);
create index idx_lots_category on public.lots(category);
create index idx_bids_lot on public.bids(lot_id, created_at desc);
create index idx_bids_bidder on public.bids(bidder_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at on row change
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger lots_updated_at
  before update on public.lots
  for each row execute function public.update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.lots enable row level security;
alter table public.bids enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Lots: anyone can read active lots + seller sees own lots in any status
create policy "Lots are viewable when active or by seller"
  on public.lots for select using (status = 'active' or seller_id = auth.uid());

create policy "Authenticated users can create lots"
  on public.lots for insert with check (auth.uid() = seller_id);

create policy "Sellers can update own lots"
  on public.lots for update using (auth.uid() = seller_id);

-- Bids: readable if the lot is visible, insertable by authenticated users
create policy "Bids are viewable on visible lots"
  on public.bids for select using (
    exists (select 1 from public.lots where lots.id = bids.lot_id)
  );

create policy "Authenticated users can place bids"
  on public.bids for insert with check (auth.uid() = bidder_id);

-- ============================================
-- STORAGE
-- ============================================

insert into storage.buckets (id, name, public)
values ('lot-photos', 'lot-photos', true);

create policy "Anyone can view lot photos"
  on storage.objects for select using (bucket_id = 'lot-photos');

create policy "Authenticated users can upload lot photos"
  on storage.objects for insert with check (
    bucket_id = 'lot-photos' and auth.role() = 'authenticated'
  );
