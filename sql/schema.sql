-- ============================================================
-- Madar Electronics (مدار للإلكترونيات) — Sales System Schema
-- Run this once in Supabase SQL Editor.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- Enums ----------
do $$ begin
  create type order_status as enum ('pending', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sales_channel_type as enum ('online', 'branch');
exception when duplicate_object then null; end $$;

-- ---------- Customers ----------
create table if not exists customers (
  customer_id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text,
  created_at timestamptz not null default now()
);

-- ---------- Products ----------
create table if not exists products (
  product_id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  current_unit_price numeric(12,2) not null default 0 check (current_unit_price >= 0),
  created_at timestamptz not null default now()
);

-- ---------- Orders ----------
create table if not exists orders (
  order_id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(customer_id) on delete restrict,
  order_date timestamptz not null default now(),   -- creation date (per project's default policy)
  completed_at timestamptz,                         -- optional, if you later distinguish creation vs completion
  status order_status not null default 'pending',
  sales_channel sales_channel_type not null,
  branch text,                                      -- e.g. branch name; null for online orders
  created_at timestamptz not null default now()
);

-- ---------- Order Items ----------
-- Historical sale price is stored here, never derived from products.current_unit_price.
create table if not exists order_items (
  order_item_id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(order_id) on delete cascade,
  product_id uuid not null references products(product_id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_at_sale_time numeric(12,2) not null check (unit_price_at_sale_time >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  return_value numeric(12,2) not null default 0 check (return_value >= 0),
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

-- ---------- Indexes ----------
create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_date on orders(order_date);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_product on order_items(product_id);

-- ============================================================
-- Documented business rules (per project default policy):
-- - Currency: JOD (adjust if needed)
-- - Timezone: Asia/Amman
-- - Counted order statuses: 'completed' only (cancelled excluded, pending excluded from sales totals)
-- - Sale date = order_date (order creation date)
-- - Returns are deducted from the original order (return_value field on order_items)
-- - Taxes: not tracked separately in this MVP (net sales excludes tax handling)
-- ============================================================

-- ============================================================
-- Required as of April 2026: Supabase no longer auto-grants
-- Data API access to service_role (or anon/authenticated) on
-- new tables. Without this, every API call from the app fails
-- with "permission denied for table ...".
-- ============================================================
grant select, insert, update, delete on table public.customers to service_role;
grant select, insert, update, delete on table public.products to service_role;
grant select, insert, update, delete on table public.orders to service_role;
grant select, insert, update, delete on table public.order_items to service_role;
