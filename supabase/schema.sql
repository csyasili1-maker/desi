-- EE Desi Delights Supabase schema
-- Run this once in Supabase Dashboard > SQL Editor.
-- Before running the final admin insert, create the admin user in Supabase Auth.

create extension if not exists "pgcrypto";

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  type text not null,
  price integer not null default 0,
  old integer not null default 0,
  size text not null default '500 ml',
  badge text not null default '',
  img text not null default '',
  rating numeric not null default 4.8,
  reviews integer not null default 0,
  description text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  label text not null,
  price integer not null,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image text not null,
  eyebrow text not null,
  title text not null,
  copy text not null,
  cta text not null,
  link text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_name text,
  customer_email text,
  customer_phone text,
  address jsonb not null default '{}'::jsonb,
  subtotal integer not null default 0,
  shipping integer not null default 0,
  packing integer not null default 0,
  discount integer not null default 0,
  total integer not null default 0,
  coupon text,
  payment_method text not null default 'razorpay',
  payment_status text not null default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  status text not null default 'Placed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  size text not null,
  unit_price integer not null,
  qty integer not null,
  line_total integer not null
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists hero_slides_touch_updated_at on public.hero_slides;
create trigger hero_slides_touch_updated_at
before update on public.hero_slides
for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

alter table public.admin_profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_sizes enable row level security;
alter table public.hero_slides enable row level security;
alter table public.site_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Admins can read admin profiles" on public.admin_profiles;
create policy "Admins can read admin profiles"
on public.admin_profiles for select
to authenticated
using (public.is_admin());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (active = true or public.is_admin());

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read product sizes" on public.product_sizes;
create policy "Public can read product sizes"
on public.product_sizes for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage product sizes" on public.product_sizes;
create policy "Admins can manage product sizes"
on public.product_sizes for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active hero slides" on public.hero_slides;
create policy "Public can read active hero slides"
on public.hero_slides for select
to anon, authenticated
using (active = true or public.is_admin());

drop policy if exists "Admins can manage hero slides" on public.hero_slides;
create policy "Admins can manage hero slides"
on public.hero_slides for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
on public.site_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can create orders" on public.orders;
create policy "Anyone can create orders"
on public.orders for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read and update orders" on public.orders;
create policy "Admins can read and update orders"
on public.orders for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can create order items" on public.order_items;
create policy "Anyone can create order items"
on public.order_items for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read order items" on public.order_items;
create policy "Admins can read order items"
on public.order_items for select
to authenticated
using (public.is_admin());

insert into public.products (id, name, type, price, old, size, badge, img, rating, reviews, description, sort_order)
values
  ('cow-ghee', 'Cow Ghee', 'Cow Ghee', 799, 899, '500 ml', 'Best Seller', 'assets/cow-ghee-ee.png', 4.8, 256, 'Pure cow ghee, slow-crafted with an inspired traditional preparation for rich aroma, taste, and purity.', 1),
  ('buffalo-ghee', 'Buffalo Ghee', 'Buffalo Ghee', 699, 799, '500 ml', 'Rich Aroma', 'assets/buffalo-ghee-ee.png', 4.7, 189, 'Thick, creamy buffalo ghee with a deep traditional flavor for sweets, rice, and everyday cooking.', 2)
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  price = excluded.price,
  old = excluded.old,
  size = excluded.size,
  badge = excluded.badge,
  img = excluded.img,
  rating = excluded.rating,
  reviews = excluded.reviews,
  description = excluded.description,
  sort_order = excluded.sort_order;

delete from public.product_sizes where product_id in ('cow-ghee', 'buffalo-ghee');

insert into public.product_sizes (product_id, label, price, is_default, sort_order)
values
  ('cow-ghee', '500 ml', 799, true, 1),
  ('cow-ghee', '1 Litre', 1499, false, 2),
  ('cow-ghee', '2 Litre', 2799, false, 3),
  ('cow-ghee', '5 Litre', 6499, false, 4),
  ('buffalo-ghee', '500 ml', 699, true, 1),
  ('buffalo-ghee', '1 Litre', 1299, false, 2),
  ('buffalo-ghee', '2 Litre', 2449, false, 3),
  ('buffalo-ghee', '5 Litre', 5699, false, 4);

insert into public.hero_slides (image, eyebrow, title, copy, cta, link, sort_order)
values
  ('assets/hero-ghee-food.png', 'Premium Indian Ghee', 'Pure Ghee, Slow-Crafted for Indian Homes', 'Golden aroma, traditional taste, and everyday nourishment in every spoon of EE Desi Delights ghee.', 'Shop Ghee', '#shop', 1),
  ('assets/buffalo-ghee-ee.png', 'Cow & Buffalo Ghee', 'Two Pure Choices for Every Kitchen', 'Choose pure cow ghee or rich buffalo ghee, both slow-crafted for authentic flavor.', 'View Products', '#products', 2),
  ('assets/ghee-gift-hamper-ee.png', 'Festive Bulk Orders', 'Traditional Ghee Gifts with a Premium Finish', 'Create memorable wedding, corporate, and festive hampers with EE Desi Delights green-gold packaging.', 'Bulk Enquiry', '#bulk', 3)
on conflict do nothing;

insert into public.site_settings (key, value)
values
  ('headerLogo', '"assets/logo-transparent.png"'::jsonb),
  ('footerLogo', '"assets/logo-white.png"'::jsonb),
  ('brandName', '"EE Desi Delights"'::jsonb),
  ('razorpayEnabled', 'true'::jsonb),
  ('razorpayKey', '"rzp_test_1DP5mmOlF5G5ag"'::jsonb),
  ('razorpayMerchant', '"EE Desi Delights"'::jsonb),
  ('razorpayCurrency', '"INR"'::jsonb),
  ('supportPhone', '"+91 96666 77434"'::jsonb),
  ('supportEmail', '"eedesidelights@gmail.com"'::jsonb),
  ('address', '"Hyderabad, Telangana, India"'::jsonb),
  ('shippingCharge', '0'::jsonb),
  ('packagingCharge', '20'::jsonb),
  ('couponCode', '"GHEE10"'::jsonb),
  ('couponDiscount', '10'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- After you create the admin user in Supabase Auth, replace the email below and run it.
-- insert into public.admin_profiles (user_id, email, role)
-- select id, email, 'admin'
-- from auth.users
-- where email = 'client-admin@example.com'
-- on conflict (user_id) do update set email = excluded.email, role = 'admin';
