-- Dynamic pricing and richer product records.
--
-- 1. site_settings.pricing: the tunable parts of the price formula (benchmark,
--    manual adjustment, source, markup, buyback, tax). Read by src/lib/pricing/settings.ts;
--    an empty object means "use the built-in demonstration defaults".
-- 2. products: SKU, English texts, gross weight, gemstones, material cost, markup,
--    a manual price that recalculation never touches, and free-form specifications.
-- 3. karats: the karats the shop may carry, each with a purity, plus the inactive
--    "REF" row whose gold_prices entry stores the 24K reference price per gram.
--    Its history and "who changed it" come from the existing gold_prices triggers.
--
-- No new tables, so the existing privileges and RLS policies already cover everything
-- (site_settings: owner update; products and karats: admin write; public read).

alter table public.site_settings
  add column if not exists pricing jsonb not null default '{}'::jsonb;
comment on column public.site_settings.pricing is
  'Pricing settings (benchmarkIdr, adjustmentPercent, source, sourceUrl, retrievedAt, simulated, perGramStepIdr, defaultMarkupPercent, taxPercent, buybackPercent, buybackPercentByKarat, buybackDeductionIdr). Empty = built-in defaults.';

alter table public.products
  add column if not exists sku text,
  add column if not exists name_en text,
  add column if not exists description_en text,
  add column if not exists gross_weight_g numeric(8,3) check (gross_weight_g is null or gross_weight_g > 0),
  add column if not exists gemstone_details text,
  add column if not exists gemstone_details_en text,
  add column if not exists material_cost_idr bigint not null default 0 check (material_cost_idr >= 0),
  add column if not exists markup_percent numeric(5,2) check (markup_percent is null or (markup_percent >= 0 and markup_percent <= 100)),
  add column if not exists manual_price_idr bigint check (manual_price_idr is null or manual_price_idr > 0),
  add column if not exists specs jsonb not null default '[]'::jsonb;

create unique index if not exists products_sku_idx on public.products (sku) where sku is not null;

comment on column public.products.weight_g is 'Net gold weight in grams: what the gold value is calculated from.';
comment on column public.products.gross_weight_g is 'Weight of the finished piece including stones, in grams. Null when it equals the net gold weight.';
comment on column public.products.material_cost_idr is 'Gemstones and other non-gold material, Rupiah per item.';
comment on column public.products.markup_percent is 'Retail markup for this product. Null = site_settings.pricing.defaultMarkupPercent.';
comment on column public.products.manual_price_idr is 'A price the shop has set by hand. When present it is shown as is and is never recalculated.';
comment on column public.products.specs is 'Array of {"label_id","label_en","value_id","value_en"}.';

comment on table public.gold_prices is
  'Current price per gram per karat. Rows are recalculated from the 24K reference (the row of the inactive karat REF) × karats.purity_percent whenever the reference or a purity is saved in /admin/rumus.';

insert into public.karats (code, label, purity_percent, sort_order, is_active) values
  ('REF', 'Acuan emas murni 24K (per gram)', 100.00, 0, false),
  ('23K', 'Emas 23 Karat', 95.80, 15, true),
  ('21K', 'Emas 21 Karat', 87.50, 25, true),
  ('14K', 'Emas 14 Karat', 58.50, 60, true),
  ('10K', 'Emas 10 Karat', 41.70, 70, true)
on conflict (code) do nothing;

-- Starting purities only where the shop has not stated its own yet.
update public.karats k
   set purity_percent = v.purity
  from (values ('24K', 99.90), ('22K', 91.60), ('18K', 75.00), ('17K', 70.80), ('16K', 66.70)) as v (code, purity)
 where k.code = v.code
   and k.purity_percent is null;
