-- DEMO ONLY. Round, made-up numbers so the layout can be judged.
-- They are not the shop's prices and not market prices.
-- site_settings.demo_mode = true keeps a "DATA DEMO" notice on the public site.
-- Remove by entering real prices in /admin/harga, then turning demo_mode off.

insert into public.gold_prices (store_id, karat_id, sell_idr, buyback_idr)
select s.id, k.id, v.sell_idr, v.buyback_idr
from (values
  ('24K', 2000000::bigint, 1900000::bigint),
  ('22K', 1800000, 1650000),
  ('18K', 1500000, 1350000),
  ('17K', 1400000, 1250000),
  ('16K', 1300000, 1150000)
) as v (code, sell_idr, buyback_idr)
join public.karats k on k.code = v.code
cross join (select id from public.stores where is_primary) s
on conflict (store_id, karat_id) do update
  set sell_idr = excluded.sell_idr,
      buyback_idr = excluded.buyback_idr;
