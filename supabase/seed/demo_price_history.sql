-- DEMO ONLY. Forty-five days of made-up price history so the chart on /harga-emas
-- can be judged. A smooth wave around the demo prices, not real or market data.
-- Remove before launch, together with the demo prices:
--   delete from public.gold_price_history where changed_by is null;
-- (rows written by a real admin always carry changed_by).

insert into public.gold_price_history (store_id, karat_id, sell_idr, buyback_idr, effective_at, changed_by)
select
  s.id,
  p.karat_id,
  (round(p.sell_idr * (1 + 0.012 * sin(d / 6.0) - 0.0006 * d) / 1000) * 1000)::bigint,
  (round(p.buyback_idr * (1 + 0.012 * sin(d / 6.0) - 0.0006 * d) / 1000) * 1000)::bigint,
  date_trunc('day', now()) - make_interval(days => d) + interval '3 hours',
  null
from public.gold_prices p
join public.stores s on s.id = p.store_id and s.is_primary
cross join generate_series(2, 45) as d
where not exists (
  select 1 from public.gold_price_history h
  where h.changed_by is null and h.effective_at < now() - interval '5 days'
);
