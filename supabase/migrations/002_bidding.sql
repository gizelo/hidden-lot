-- HiddenLot — Bidding (place_bid RPC, soft-close cap, email outbox)

-- ============================================
-- EMAIL OUTBOX (queue, drained by Vercel Cron)
-- ============================================

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  type text not null check (type in ('outbid', 'auction_won', 'auction_ended_seller')),
  payload jsonb not null default '{}'::jsonb,
  attempts int not null default 0,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create index idx_outbox_pending on public.email_outbox (created_at)
  where sent_at is null;

alter table public.email_outbox enable row level security;
-- No client policies: only service role (admin client) reads/writes.

-- ============================================
-- ORIGINAL_ENDS_AT (immutable anchor for soft-close cap)
-- ============================================

alter table public.lots add column original_ends_at timestamptz;
update public.lots set original_ends_at = ends_at;
alter table public.lots alter column original_ends_at set not null;

-- Force original_ends_at = ends_at on insert; reject changes on update.
create or replace function public.lots_lock_original_ends()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    new.original_ends_at := new.ends_at;
    return new;
  end if;
  if new.original_ends_at is distinct from old.original_ends_at then
    raise exception 'original_ends_at is immutable';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger lots_set_original_ends
  before insert on public.lots
  for each row execute function public.lots_lock_original_ends();

create trigger lots_protect_original_ends
  before update on public.lots
  for each row execute function public.lots_lock_original_ends();

-- ============================================
-- BID INCREMENT (mirrors src/lib/constants.ts:getBidIncrement)
-- ============================================

create or replace function public.bid_increment(current_bid_cents int)
returns int as $$
declare five_pct int;
begin
  if current_bid_cents < 2000 then return 100; end if;
  if current_bid_cents < 10000 then return 200; end if;
  five_pct := round(current_bid_cents * 0.05);
  if current_bid_cents >= 50000 then return greatest(five_pct, 2500); end if;
  return five_pct;
end;
$$ language plpgsql immutable;

-- ============================================
-- PLACE BID (atomic validation + insert + soft-close cap + outbid email)
-- ============================================

create or replace function public.place_bid(p_lot_id uuid, p_amount_cents int)
returns jsonb as $$
declare
  v_uid uuid := auth.uid();
  v_lot public.lots%rowtype;
  v_min int;
  v_new_ends timestamptz;
  v_extended boolean := false;
  v_cap timestamptz;
  v_prev_bidder_id uuid;
  v_prev_bidder_email text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select * into v_lot from public.lots where id = p_lot_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'lot_not_found');
  end if;

  if v_lot.seller_id = v_uid then
    return jsonb_build_object('ok', false, 'error', 'own_lot');
  end if;

  if v_lot.status <> 'active' or v_lot.ends_at <= now() then
    return jsonb_build_object('ok', false, 'error', 'auction_closed');
  end if;

  if v_lot.bid_count = 0 then
    v_min := v_lot.starting_price_cents;
  else
    v_min := v_lot.current_price_cents + public.bid_increment(v_lot.current_price_cents);
  end if;

  if p_amount_cents < v_min then
    return jsonb_build_object('ok', false, 'error', 'below_minimum', 'min_cents', v_min);
  end if;

  -- Soft-close: extend if bid lands in last 60s, capped at original_ends_at + 30 minutes.
  v_new_ends := v_lot.ends_at;
  v_cap := v_lot.original_ends_at + interval '30 minutes';
  if v_lot.ends_at - now() <= interval '60 seconds' and v_lot.ends_at < v_cap then
    v_new_ends := least(v_lot.ends_at + interval '60 seconds', v_cap);
    v_extended := v_new_ends <> v_lot.ends_at;
  end if;

  -- Capture previous high bidder before inserting new bid.
  select b.bidder_id into v_prev_bidder_id
    from public.bids b
   where b.lot_id = p_lot_id
     and b.bidder_id <> v_uid
   order by b.amount_cents desc, b.created_at asc
   limit 1;

  insert into public.bids (lot_id, bidder_id, amount_cents)
  values (p_lot_id, v_uid, p_amount_cents);

  update public.lots
     set current_price_cents = p_amount_cents,
         bid_count = bid_count + 1,
         ends_at = v_new_ends
   where id = p_lot_id;

  if v_prev_bidder_id is not null then
    select email into v_prev_bidder_email from auth.users where id = v_prev_bidder_id;
    if v_prev_bidder_email is not null then
      insert into public.email_outbox (to_email, type, payload)
      values (
        v_prev_bidder_email,
        'outbid',
        jsonb_build_object(
          'lot_id', p_lot_id,
          'lot_title', v_lot.title,
          'new_amount_cents', p_amount_cents
        )
      );
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'new_price_cents', p_amount_cents,
    'new_ends_at', v_new_ends,
    'extended', v_extended
  );
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.place_bid(uuid, int) from public;
grant execute on function public.place_bid(uuid, int) to authenticated;

revoke all on function public.bid_increment(int) from public;
grant execute on function public.bid_increment(int) to authenticated, anon;
