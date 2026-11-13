-- Toko Sinar Mas: core schema, RLS, audit triggers.
-- Money is integer Rupiah (bigint). Weight is numeric(8,3) grams. Timestamps are UTC (timestamptz).

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.admin_role as enum ('owner', 'staff');
create type public.product_status as enum ('draft', 'published', 'sold', 'out_of_stock');
create type public.labour_fee_type as enum ('per_gram', 'fixed', 'percent');
create type public.lead_kind as enum ('reservation', 'inquiry');
create type public.lead_status as enum ('new', 'contacted', 'done');
create type public.article_status as enum ('draft', 'published');
create type public.rounding_mode as enum ('none', 'up', 'nearest');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.admin_users (
  id bigint generated always as identity primary key,
  email text not null unique check (email = lower(email)),
  role public.admin_role not null default 'staff',
  user_id uuid unique references auth.users (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table public.admin_users is 'Email allowlist for /admin. user_id is linked automatically once that email is confirmed in Supabase Auth.';

create table public.stores (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  tagline text,
  address text,
  city text,
  province text,
  postal_code text,
  landmarks text,
  maps_url text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  phone text,
  whatsapp text,
  email text,
  opening_hours jsonb,
  social_links jsonb not null default '{}'::jsonb,
  google_review_url text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.stores.whatsapp is 'Digits only with country code, e.g. 6281234567890.';
comment on column public.stores.opening_hours is 'Array of {"day":1-7 (1=Senin),"open":"09:00","close":"17:00","closed":false}.';
create unique index stores_single_primary_idx on public.stores (is_primary) where is_primary;

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  timezone text not null default 'Asia/Jakarta',
  rounding_mode public.rounding_mode not null default 'up',
  rounding_step_idr bigint not null default 1000 check (rounding_step_idr > 0),
  default_labour_fee_type public.labour_fee_type not null default 'per_gram',
  default_labour_fee_value numeric(14,2) not null default 0 check (default_labour_fee_value >= 0),
  price_stale_hours integer not null default 24 check (price_stale_hours > 0),
  feature_flags jsonb not null default '{"tryon": false, "viewer_3d": false, "reserve": false}'::jsonb,
  trust_texts jsonb not null default '{}'::jsonb,
  review_card_url text,
  demo_mode boolean not null default true,
  updated_at timestamptz not null default now()
);
comment on column public.site_settings.demo_mode is 'While true the public site shows a DEMO data notice. Turn off once real prices and products are in.';

create table public.karats (
  id bigint generated always as identity primary key,
  code text not null unique,
  label text not null,
  purity_percent numeric(5,2) check (purity_percent > 0 and purity_percent <= 100),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.gold_prices (
  id bigint generated always as identity primary key,
  store_id bigint not null references public.stores (id) on delete cascade,
  karat_id bigint not null references public.karats (id) on delete restrict,
  sell_idr bigint not null check (sell_idr > 0),
  buyback_idr bigint not null check (buyback_idr >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  unique (store_id, karat_id)
);
comment on table public.gold_prices is 'Current price per gram per karat. Each karat is priced on its own; nothing is derived from 24K.';

create table public.gold_price_history (
  id bigint generated always as identity primary key,
  store_id bigint not null references public.stores (id) on delete cascade,
  karat_id bigint not null references public.karats (id) on delete restrict,
  sell_idr bigint not null,
  buyback_idr bigint not null,
  effective_at timestamptz not null default now(),
  changed_by uuid references auth.users (id) on delete set null
);

create table public.categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text,
  category_id bigint references public.categories (id) on delete set null,
  karat_id bigint not null references public.karats (id) on delete restrict,
  weight_g numeric(8,3) not null check (weight_g > 0),
  size_options text[] not null default '{}',
  occasions text[] not null default '{}',
  labour_fee_type public.labour_fee_type not null default 'per_gram',
  labour_fee_value numeric(14,2) not null default 0 check (labour_fee_value >= 0),
  price_on_request boolean not null default false,
  status public.product_status not null default 'draft',
  is_featured boolean not null default false,
  is_demo boolean not null default false,
  video_url text,
  model_glb_path text,
  model_usdz_path text,
  model_poster_path text,
  tryon_enabled boolean not null default false,
  tryon_asset_ref text,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) stored
);

create table public.product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt text not null default '',
  width integer,
  height integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.leads (
  id bigint generated always as identity primary key,
  kind public.lead_kind not null default 'reservation',
  product_id bigint references public.products (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (char_length(phone) between 6 and 20),
  preferred_date date,
  note text check (char_length(note) <= 1000),
  consent boolean not null check (consent),
  status public.lead_status not null default 'new',
  source_path text,
  handled_by uuid references auth.users (id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.articles (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  excerpt text,
  body_md text not null default '',
  cover_path text,
  status public.article_status not null default 'draft',
  published_at timestamptz,
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id bigint generated always as identity primary key,
  author_name text not null,
  body text not null,
  rating smallint check (rating between 1 and 5),
  source_name text not null,
  source_url text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table public.testimonials is 'Entered by hand from a real, linkable source. Never fabricated.';

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  diff jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (foreign keys, catalog filters, slugs are already unique)
-- ---------------------------------------------------------------------------
create index gold_prices_karat_id_idx on public.gold_prices (karat_id);
create index gold_prices_updated_by_idx on public.gold_prices (updated_by);
create index gold_price_history_lookup_idx on public.gold_price_history (store_id, karat_id, effective_at desc);
create index gold_price_history_karat_id_idx on public.gold_price_history (karat_id);
create index gold_price_history_changed_by_idx on public.gold_price_history (changed_by);
create index products_catalog_idx on public.products (category_id, karat_id, weight_g) where status <> 'draft';
create index products_karat_id_idx on public.products (karat_id);
create index products_status_sort_idx on public.products (status, sort_order, id);
create index products_featured_idx on public.products (sort_order) where is_featured and status <> 'draft';
create index products_occasions_idx on public.products using gin (occasions);
create index products_search_idx on public.products using gin (search);
create index product_images_product_idx on public.product_images (product_id, sort_order);
create index leads_status_idx on public.leads (status, created_at desc);
create index leads_product_id_idx on public.leads (product_id);
create index leads_handled_by_idx on public.leads (handled_by);
create index articles_published_idx on public.articles (published_at desc) where status = 'published';
create index articles_author_id_idx on public.articles (author_id);
create index audit_log_created_idx on public.audit_log (created_at desc);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);

-- ---------------------------------------------------------------------------
-- Helper functions (private schema is not exposed through the Data API)
-- ---------------------------------------------------------------------------
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.is_active
  );
$$;

create function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.is_active
      and au.role = 'owner'
  );
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Link an allowlisted email to its auth user once the email is confirmed.
create function private.link_admin_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.admin_users
     set user_id = null
   where user_id = new.id
     and email <> lower(coalesce(new.email, ''));

  if new.email is not null and new.email_confirmed_at is not null then
    update public.admin_users
       set user_id = new.id
     where email = lower(new.email)
       and user_id is null;
  end if;
  return new;
end;
$$;

create function private.link_admin_from_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email := lower(trim(new.email));
  if tg_op = 'INSERT' or new.email is distinct from old.email then
    select u.id into new.user_id
      from auth.users u
     where lower(u.email) = new.email
       and u.email_confirmed_at is not null
     limit 1;
  end if;
  return new;
end;
$$;

-- Stamp who changed a price and when; the client cannot spoof either.
create function private.stamp_gold_price()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$$;

create function private.record_gold_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.sell_idr = old.sell_idr
     and new.buyback_idr = old.buyback_idr then
    return new;
  end if;

  insert into public.gold_price_history (store_id, karat_id, sell_idr, buyback_idr, effective_at, changed_by)
  values (new.store_id, new.karat_id, new.sell_idr, new.buyback_idr, new.updated_at, new.updated_by);

  insert into public.audit_log (actor_id, action, entity, entity_id, diff)
  values (
    new.updated_by,
    lower(tg_op),
    'gold_prices',
    new.id::text,
    jsonb_build_object(
      'karat_id', new.karat_id,
      'old', case when tg_op = 'UPDATE'
                  then jsonb_build_object('sell_idr', old.sell_idr, 'buyback_idr', old.buyback_idr) end,
      'new', jsonb_build_object('sell_idr', new.sell_idr, 'buyback_idr', new.buyback_idr)
    )
  );
  return new;
end;
$$;

create function private.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_id text;
begin
  if tg_op = 'DELETE' then
    row_id := (to_jsonb(old) ->> 'id');
  else
    row_id := (to_jsonb(new) ->> 'id');
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id, diff)
  values (
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    row_id,
    jsonb_build_object(
      'old', case when tg_op <> 'INSERT' then to_jsonb(old) - 'search' end,
      'new', case when tg_op <> 'DELETE' then to_jsonb(new) - 'search' end
    )
  );
  return coalesce(new, old);
end;
$$;

-- Policies that mix public and admin access are evaluated for anon too, so anon
-- needs to be able to call the two checks (they return false without a session).
revoke execute on all functions in schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_owner() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create trigger admin_users_link before insert or update of email on public.admin_users
  for each row execute function private.link_admin_from_allowlist();

create trigger auth_users_link_admin after insert or update of email, email_confirmed_at on auth.users
  for each row execute function private.link_admin_from_auth();

create trigger stores_set_updated_at before update on public.stores
  for each row execute function private.set_updated_at();
create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function private.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function private.set_updated_at();
create trigger articles_set_updated_at before update on public.articles
  for each row execute function private.set_updated_at();

create trigger gold_prices_stamp before insert or update on public.gold_prices
  for each row execute function private.stamp_gold_price();
create trigger gold_prices_record after insert or update on public.gold_prices
  for each row execute function private.record_gold_price();

create trigger stores_audit after insert or update or delete on public.stores
  for each row execute function private.audit_row();
create trigger site_settings_audit after insert or update or delete on public.site_settings
  for each row execute function private.audit_row();
create trigger karats_audit after insert or update or delete on public.karats
  for each row execute function private.audit_row();
create trigger products_audit after insert or update or delete on public.products
  for each row execute function private.audit_row();
create trigger admin_users_audit after insert or update or delete on public.admin_users
  for each row execute function private.audit_row();
create trigger articles_audit after insert or update or delete on public.articles
  for each row execute function private.audit_row();

-- ---------------------------------------------------------------------------
-- Privileges: start from nothing, grant only what each role needs.
-- RLS below narrows these further.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.stores, public.site_settings, public.karats, public.gold_prices,
  public.gold_price_history, public.categories, public.products,
  public.product_images, public.articles, public.testimonials
to anon, authenticated;

grant insert on public.leads to anon, authenticated;

grant select, update, delete on public.leads to authenticated;
grant select on public.audit_log, public.admin_users to authenticated;
grant insert, update, delete on
  public.stores, public.karats, public.gold_prices, public.categories,
  public.products, public.product_images, public.articles,
  public.testimonials, public.admin_users
to authenticated;
grant update on public.site_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.stores enable row level security;
alter table public.site_settings enable row level security;
alter table public.karats enable row level security;
alter table public.gold_prices enable row level security;
alter table public.gold_price_history enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.leads enable row level security;
alter table public.articles enable row level security;
alter table public.testimonials enable row level security;
alter table public.audit_log enable row level security;

-- admin_users: admins can see the list; only the owner changes it.
create policy admin_users_select on public.admin_users for select to authenticated
  using ((select private.is_admin()));
create policy admin_users_insert on public.admin_users for insert to authenticated
  with check ((select private.is_owner()));
create policy admin_users_update on public.admin_users for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));
create policy admin_users_delete on public.admin_users for delete to authenticated
  using ((select private.is_owner()));

-- stores, site_settings, karats: public read, owner write.
create policy stores_select on public.stores for select to anon, authenticated using (true);
create policy stores_insert on public.stores for insert to authenticated
  with check ((select private.is_owner()));
create policy stores_update on public.stores for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));
create policy stores_delete on public.stores for delete to authenticated
  using ((select private.is_owner()));

create policy site_settings_select on public.site_settings for select to anon, authenticated using (true);
create policy site_settings_update on public.site_settings for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy karats_select on public.karats for select to anon, authenticated using (true);
create policy karats_insert on public.karats for insert to authenticated
  with check ((select private.is_owner()));
create policy karats_update on public.karats for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));
create policy karats_delete on public.karats for delete to authenticated
  using ((select private.is_owner()));

-- gold_prices: public read; owner and staff set prices; only the owner deletes a row.
create policy gold_prices_select on public.gold_prices for select to anon, authenticated using (true);
create policy gold_prices_insert on public.gold_prices for insert to authenticated
  with check ((select private.is_admin()));
create policy gold_prices_update on public.gold_prices for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy gold_prices_delete on public.gold_prices for delete to authenticated
  using ((select private.is_owner()));

-- gold_price_history: public read (price chart); written only by trigger.
create policy gold_price_history_select on public.gold_price_history for select to anon, authenticated using (true);

-- categories: public sees active ones; admins see and edit all.
create policy categories_select on public.categories for select to anon, authenticated
  using (is_active or (select private.is_admin()));
create policy categories_insert on public.categories for insert to authenticated
  with check ((select private.is_admin()));
create policy categories_update on public.categories for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy categories_delete on public.categories for delete to authenticated
  using ((select private.is_owner()));

-- products: drafts are admin-only; sold and out-of-stock stay publicly visible.
create policy products_select on public.products for select to anon, authenticated
  using (status <> 'draft' or (select private.is_admin()));
create policy products_insert on public.products for insert to authenticated
  with check ((select private.is_admin()));
create policy products_update on public.products for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy products_delete on public.products for delete to authenticated
  using ((select private.is_admin()));

create policy product_images_select on public.product_images for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status <> 'draft'
    )
    or (select private.is_admin())
  );
create policy product_images_insert on public.product_images for insert to authenticated
  with check ((select private.is_admin()));
create policy product_images_update on public.product_images for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy product_images_delete on public.product_images for delete to authenticated
  using ((select private.is_admin()));

-- leads: the public can only add a new lead, and only with consent. No public read.
create policy leads_insert on public.leads for insert to anon, authenticated
  with check (consent and status = 'new' and handled_by is null and handled_at is null);
create policy leads_select on public.leads for select to authenticated
  using ((select private.is_admin()));
create policy leads_update on public.leads for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy leads_delete on public.leads for delete to authenticated
  using ((select private.is_owner()));

-- articles and testimonials: public sees published; admins manage.
create policy articles_select on public.articles for select to anon, authenticated
  using (status = 'published' or (select private.is_admin()));
create policy articles_insert on public.articles for insert to authenticated
  with check ((select private.is_admin()));
create policy articles_update on public.articles for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy articles_delete on public.articles for delete to authenticated
  using ((select private.is_admin()));

create policy testimonials_select on public.testimonials for select to anon, authenticated
  using (is_published or (select private.is_admin()));
create policy testimonials_insert on public.testimonials for insert to authenticated
  with check ((select private.is_admin()));
create policy testimonials_update on public.testimonials for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy testimonials_delete on public.testimonials for delete to authenticated
  using ((select private.is_admin()));

-- audit_log: admins read; written only by triggers.
create policy audit_log_select on public.audit_log for select to authenticated
  using ((select private.is_admin()));
