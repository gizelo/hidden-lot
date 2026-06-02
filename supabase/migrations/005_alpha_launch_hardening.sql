-- HiddenLot Alpha — launch hardening
-- Verified-email guards, profile visibility for bidders, direct-bid lockout,
-- and post-auction handoff email payloads.

-- ============================================
-- VERIFIED EMAIL HELPER
-- ============================================

create or replace function public.current_user_email_verified()
returns boolean as $$
  select exists (
    select 1
      from auth.users u
     where u.id = auth.uid()
       and u.email_confirmed_at is not null
  );
$$ language sql stable security definer set search_path = public;

revoke all on function public.current_user_email_verified() from public;
grant execute on function public.current_user_email_verified() to authenticated;

-- ============================================
-- BIDDER LOT VISIBILITY HELPER
-- ============================================

create or replace function public.has_bid_on_lot(p_lot_id uuid)
returns boolean as $$
  select exists (
    select 1
      from public.bids b
     where b.lot_id = p_lot_id
       and b.bidder_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

revoke all on function public.has_bid_on_lot(uuid) from public;
grant execute on function public.has_bid_on_lot(uuid) to authenticated;

-- ============================================
-- RLS POLICY HARDENING
-- ============================================

drop policy if exists "Lots are viewable when active or by seller" on public.lots;
create policy "Lots are viewable when active seller winner or bidder"
  on public.lots for select using (
    status = 'active'
    or seller_id = auth.uid()
    or winner_id = auth.uid()
    or public.has_bid_on_lot(id)
  );

drop policy if exists "Authenticated users can create lots" on public.lots;
create policy "Verified users can create lots"
  on public.lots for insert with check (
    auth.uid() = seller_id
    and public.current_user_email_verified()
  );

drop policy if exists "Bids are viewable on visible lots" on public.bids;
create policy "Bids are viewable by bidder or on visible lots"
  on public.bids for select using (
    bidder_id = auth.uid()
    or exists (select 1 from public.lots where lots.id = bids.lot_id)
  );

drop policy if exists "Authenticated users can place bids" on public.bids;
create policy "Bids are inserted through place_bid only"
  on public.bids for insert with check (false);

-- ============================================
-- PLACE BID (verified email + existing atomic validation)
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

  if not public.current_user_email_verified() then
    return jsonb_build_object('ok', false, 'error', 'email_unverified');
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

  v_new_ends := v_lot.ends_at;
  v_cap := v_lot.original_ends_at + interval '30 minutes';
  if v_lot.ends_at - now() <= interval '60 seconds' and v_lot.ends_at < v_cap then
    v_new_ends := least(v_lot.ends_at + interval '60 seconds', v_cap);
    v_extended := v_new_ends <> v_lot.ends_at;
  end if;

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

-- ============================================
-- AUCTION CLOSE EMAIL HANDOFF PAYLOADS
-- ============================================

create or replace function public.close_expired_auctions()
returns int as $$
declare
  v_lot public.lots%rowtype;
  v_winner_id uuid;
  v_winner_email text;
  v_seller_email text;
  v_winning_amount int;
  v_count int := 0;
begin
  for v_lot in
    select * from public.lots
     where status = 'active' and ends_at <= now()
     for update skip locked
  loop
    select b.bidder_id, b.amount_cents
      into v_winner_id, v_winning_amount
      from public.bids b
     where b.lot_id = v_lot.id
     order by b.amount_cents desc, b.created_at asc
     limit 1;

    if v_winner_id is not null then
      update public.lots
         set status = 'ended', winner_id = v_winner_id
       where id = v_lot.id;

      select email into v_winner_email from auth.users where id = v_winner_id;
      select email into v_seller_email from auth.users where id = v_lot.seller_id;

      if v_winner_email is not null then
        insert into public.email_outbox (to_email, type, payload)
        values (v_winner_email, 'auction_won', jsonb_build_object(
          'lot_id', v_lot.id,
          'lot_title', v_lot.title,
          'final_amount_cents', v_winning_amount,
          'seller_email', v_seller_email
        ));
      end if;

      if v_seller_email is not null then
        insert into public.email_outbox (to_email, type, payload)
        values (v_seller_email, 'auction_ended_seller', jsonb_build_object(
          'lot_id', v_lot.id,
          'lot_title', v_lot.title,
          'final_amount_cents', v_winning_amount,
          'winner_id', v_winner_id,
          'winner_email', v_winner_email
        ));
      end if;
    else
      update public.lots set status = 'expired' where id = v_lot.id;
    end if;

    v_count := v_count + 1;
    v_winner_id := null;
    v_winner_email := null;
    v_seller_email := null;
    v_winning_amount := null;
  end loop;

  return v_count;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.close_expired_auctions() from public;
