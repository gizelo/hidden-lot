-- HiddenLot — Auction close cron
-- close_expired_auctions(): flips active→ended/expired, sets winner_id, queues emails.
-- Scheduled via pg_cron every minute.

create extension if not exists pg_cron;

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
      if v_winner_email is not null then
        insert into public.email_outbox (to_email, type, payload)
        values (v_winner_email, 'auction_won', jsonb_build_object(
          'lot_id', v_lot.id,
          'lot_title', v_lot.title,
          'final_amount_cents', v_winning_amount
        ));
      end if;

      select email into v_seller_email from auth.users where id = v_lot.seller_id;
      if v_seller_email is not null then
        insert into public.email_outbox (to_email, type, payload)
        values (v_seller_email, 'auction_ended_seller', jsonb_build_object(
          'lot_id', v_lot.id,
          'lot_title', v_lot.title,
          'final_amount_cents', v_winning_amount,
          'winner_id', v_winner_id
        ));
      end if;
    else
      update public.lots set status = 'expired' where id = v_lot.id;
    end if;

    v_count := v_count + 1;
    v_winner_id := null;
    v_winning_amount := null;
  end loop;

  return v_count;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.close_expired_auctions() from public;

select cron.schedule(
  'close-expired-auctions',
  '* * * * *',
  $$select public.close_expired_auctions()$$
);
