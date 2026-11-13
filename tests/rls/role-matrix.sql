-- Role matrix check: anonymous, signed-in non-admin, staff, owner.
-- Run in the Supabase SQL editor. It ALWAYS ends with an error on purpose:
-- the final RAISE rolls everything back and prints the results in the message.
--
-- Expected (Phase 0, verified 2026-11-13):
--   linked_admins=2
--   anon_products_visible=1 anon_lead_insert=ok
--   stranger_price_updates=0 stranger_leads_visible=0 stranger_drafts_visible=0 stranger_admins_visible=0
--   staff_price_updates=5 staff_settings_updates=0 staff_self_promote=0 staff_leads_visible=1
--   owner_settings_updates=1 owner_drafts_visible=1
--   history_rows_by_staff=5 prices_stamped_staff=5

do $$
declare
  owner_id uuid := gen_random_uuid();
  staff_id uuid := gen_random_uuid();
  stranger_id uuid := gen_random_uuid();
  result text := '';
  n int;
begin
  insert into public.admin_users (email, role) values ('owner-check@example.com', 'owner'), ('staff-check@example.com', 'staff');
  insert into auth.users (id, email, email_confirmed_at) values (owner_id, 'owner-check@example.com', now());
  insert into auth.users (id, email, email_confirmed_at) values (staff_id, 'staff-check@example.com', now());
  insert into auth.users (id, email, email_confirmed_at) values (stranger_id, 'stranger@example.com', now());
  select count(*) into n from public.admin_users where user_id in (owner_id, staff_id); result := result || ' linked_admins=' || n;

  insert into public.products (slug, name, karat_id, weight_g, status) select 'draft-check', 'Draft', id, 1, 'draft' from public.karats limit 1;
  insert into public.products (slug, name, karat_id, weight_g, status) select 'pub-check', 'Pub', id, 1, 'published' from public.karats limit 1;

  execute 'set local role anon';
  select count(*) into n from public.products where slug in ('draft-check', 'pub-check'); result := result || ' | anon_products_visible=' || n;
  insert into public.leads (name, phone, consent) values ('RLS check', '081234567890', true);
  result := result || ' anon_lead_insert=ok';
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', stranger_id, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  update public.gold_prices set sell_idr = sell_idr + 1; get diagnostics n = row_count; result := result || ' | stranger_price_updates=' || n;
  select count(*) into n from public.leads; result := result || ' stranger_leads_visible=' || n;
  select count(*) into n from public.products where slug = 'draft-check'; result := result || ' stranger_drafts_visible=' || n;
  select count(*) into n from public.admin_users; result := result || ' stranger_admins_visible=' || n;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', staff_id, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  update public.gold_prices set sell_idr = sell_idr + 1000; get diagnostics n = row_count; result := result || ' | staff_price_updates=' || n;
  update public.site_settings set demo_mode = false; get diagnostics n = row_count; result := result || ' staff_settings_updates=' || n;
  update public.admin_users set role = 'owner' where email = 'staff-check@example.com'; get diagnostics n = row_count; result := result || ' staff_self_promote=' || n;
  select count(*) into n from public.leads where name = 'RLS check'; result := result || ' staff_leads_visible=' || n;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  update public.site_settings set demo_mode = false; get diagnostics n = row_count; result := result || ' | owner_settings_updates=' || n;
  select count(*) into n from public.products where slug = 'draft-check'; result := result || ' owner_drafts_visible=' || n;
  execute 'reset role';

  select count(*) into n from public.gold_price_history where changed_by = staff_id; result := result || ' | history_rows_by_staff=' || n;
  select count(*) into n from public.gold_prices where updated_by = staff_id; result := result || ' prices_stamped_staff=' || n;

  raise exception 'ROLLED_BACK:%', result;
end $$;
