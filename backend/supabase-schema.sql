-- FLOURISH BEE FARM / DRAFT MANAGED COMMERCE BACKEND
-- Install only in an owner-approved Supabase project after review.
-- NOT EXECUTED BY THE SITE PREVIEW.
-- Uses Supabase Auth for owner logins and Storage for product media.
create extension if not exists pgcrypto;

create table if not exists public.store_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
-- IMPORTANT: An administrator assigns store owner IDs through trusted SQL/server tools.
-- Never expose a client-side flow that can add itself to store_owners.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (length(name) between 2 and 150),
  category text not null check (category in ('Honey','Honeycomb','Specialty Honey','Beeswax & Gifts','Bee Products')),
  season text not null default 'Year-round',
  size_label text,
  short_description text not null,
  long_description text not null default '',
  price_cents integer not null default 0 check (price_cents >= 0),
  stock integer not null default 0 check (stock >= 0),
  status text not null default 'Hidden' check (status in ('Available','Coming Soon','Sold Out','Hidden')),
  featured boolean not null default false,
  publishable boolean not null default false,
  image_paths text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category);
create index if not exists products_status_idx on public.products(status);

create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  customer_email text,
  fulfillment_status text not null default 'new' check (fulfillment_status in ('new','paid','packing','shipped','cancelled','refunded')),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.store_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.store_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0)
);

-- RLS ensures public visitors see approved, non-hidden listings only.
-- Owner access is based on Supabase Auth ID, NOT a browser-only password.
alter table public.store_owners enable row level security;
alter table public.products enable row level security;
alter table public.store_orders enable row level security;
alter table public.store_order_items enable row level security;

drop policy if exists "Owners can view own owner record" on public.store_owners;
create policy "Owners can view own owner record" on public.store_owners for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Public sees approved products" on public.products;
create policy "Public sees approved products" on public.products for select to anon, authenticated
using ((status != 'Hidden' and publishable = true)
       or exists (select 1 from public.store_owners so where so.user_id = auth.uid()));

drop policy if exists "Owner creates products" on public.products;
create policy "Owner creates products" on public.products for insert to authenticated
with check (exists (select 1 from public.store_owners so where so.user_id = auth.uid()));
drop policy if exists "Owner updates products" on public.products;
create policy "Owner updates products" on public.products for update to authenticated
using (exists (select 1 from public.store_owners so where so.user_id = auth.uid()))
with check (exists (select 1 from public.store_owners so where so.user_id = auth.uid()));
drop policy if exists "Owner deletes products" on public.products;
create policy "Owner deletes products" on public.products for delete to authenticated
using (exists (select 1 from public.store_owners so where so.user_id = auth.uid()));

drop policy if exists "Owner can view orders" on public.store_orders;
create policy "Owner can view orders" on public.store_orders for select to authenticated
using (exists (select 1 from public.store_owners so where so.user_id = auth.uid()));
drop policy if exists "Owner can view order items" on public.store_order_items;
create policy "Owner can view order items" on public.store_order_items for select to authenticated
using (exists (select 1 from public.store_owners so where so.user_id = auth.uid()));
-- Webhook processing uses a server-side Supabase service role key; NEVER publish it to the browser.

-- Optional public bucket for approved product images.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('flourish-product-images','flourish-product-images',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "Public reads Flourish product images" on storage.objects;
create policy "Public reads Flourish product images" on storage.objects for select to anon,authenticated
using (bucket_id = 'flourish-product-images');
drop policy if exists "Owner uploads Flourish product images" on storage.objects;
create policy "Owner uploads Flourish product images" on storage.objects for insert to authenticated
with check (bucket_id = 'flourish-product-images' and exists (select 1 from public.store_owners so where so.user_id = auth.uid()));
drop policy if exists "Owner updates Flourish product images" on storage.objects;
create policy "Owner updates Flourish product images" on storage.objects for update to authenticated
using (bucket_id = 'flourish-product-images' and exists (select 1 from public.store_owners so where so.user_id = auth.uid()))
with check (bucket_id = 'flourish-product-images' and exists (select 1 from public.store_owners so where so.user_id = auth.uid()));
drop policy if exists "Owner removes Flourish product images" on storage.objects;
create policy "Owner removes Flourish product images" on storage.objects for delete to authenticated
using (bucket_id = 'flourish-product-images' and exists (select 1 from public.store_owners so where so.user_id = auth.uid()));
