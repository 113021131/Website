-- Phase 2: protect the public reservation form, and cap free-text lengths in the
-- database so imports cannot bypass what the admin forms enforce.

-- The public can insert leads directly with the publishable key, so the limit
-- has to live here, not in the web server. Two limits per rolling hour:
--   * 3 reservations per phone number
--   * 60 reservations in total (a flood from many numbers)
create function private.guard_lead_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  same_phone integer;
  everyone integer;
begin
  new.phone := regexp_replace(new.phone, '[^0-9+]', '', 'g');

  select count(*) into same_phone
    from public.leads
   where phone = new.phone
     and created_at > now() - interval '1 hour';
  if same_phone >= 3 then
    raise exception 'lead_rate_limited' using errcode = 'P0001';
  end if;

  select count(*) into everyone
    from public.leads
   where created_at > now() - interval '1 hour';
  if everyone >= 60 then
    raise exception 'lead_rate_limited' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function private.guard_lead_rate() from public, anon, authenticated;

create trigger leads_guard_rate before insert on public.leads
  for each row execute function private.guard_lead_rate();

create index leads_phone_created_idx on public.leads (phone, created_at desc);
create index leads_created_idx on public.leads (created_at desc);

alter table public.products
  add constraint products_name_length check (char_length(name) between 1 and 200),
  add constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120);

alter table public.articles
  add constraint articles_title_length check (char_length(title) between 1 and 200),
  add constraint articles_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  add constraint articles_body_length check (char_length(body_md) <= 60000);

-- Phase 2 ships these two features, so their switches go on. The owner can turn
-- either off again in Admin → Toko.
update public.site_settings
   set feature_flags = feature_flags || '{"reserve": true, "viewer_3d": true}'::jsonb
 where id = 1;
