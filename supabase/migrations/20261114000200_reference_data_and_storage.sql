-- Reference rows the app needs to boot, plus storage buckets.
-- Every shop fact is a TODO_OWNER placeholder until the owner supplies it.

insert into public.stores (slug, name, tagline, address, city, province, postal_code, landmarks, maps_url, phone, whatsapp, email, google_review_url, is_primary)
values ('utama', 'Toko Sinar Mas', 'TODO_OWNER', 'TODO_OWNER', 'TODO_OWNER', 'TODO_OWNER', 'TODO_OWNER', 'TODO_OWNER', 'TODO_OWNER', 'TODO_OWNER', 'TODO_OWNER', 'TODO_OWNER', 'TODO_OWNER', true);

insert into public.site_settings (id) values (1);

-- purity_percent stays null: the shop states its own kadar per karat.
insert into public.karats (code, label, sort_order) values
  ('24K', 'Emas 24 Karat', 10),
  ('22K', 'Emas 22 Karat', 20),
  ('18K', 'Emas 18 Karat', 30),
  ('17K', 'Emas 17 Karat', 40),
  ('16K', 'Emas 16 Karat', 50);

insert into public.categories (slug, name, sort_order) values
  ('cincin', 'Cincin', 10),
  ('kalung', 'Kalung', 20),
  ('gelang', 'Gelang', 30),
  ('anting', 'Anting', 40),
  ('liontin', 'Liontin', 50),
  ('rantai', 'Rantai', 60),
  ('mas-kawin', 'Mas Kawin', 70),
  ('perhiasan-anak', 'Perhiasan Anak', 80);

-- Storage: public read through the CDN URL, admin-only writes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images', 'product-images', true, 5242880, array['image/webp', 'image/jpeg', 'image/png']),
  ('product-models', 'product-models', true, 10485760, array['model/gltf-binary', 'model/vnd.usdz+zip', 'application/octet-stream'])
on conflict (id) do nothing;

create policy product_assets_admin_select on storage.objects for select to authenticated
  using (bucket_id in ('product-images', 'product-models') and (select private.is_admin()));
create policy product_assets_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images', 'product-models') and (select private.is_admin()));
create policy product_assets_admin_update on storage.objects for update to authenticated
  using (bucket_id in ('product-images', 'product-models') and (select private.is_admin()))
  with check (bucket_id in ('product-images', 'product-models') and (select private.is_admin()));
create policy product_assets_admin_delete on storage.objects for delete to authenticated
  using (bucket_id in ('product-images', 'product-models') and (select private.is_admin()));
