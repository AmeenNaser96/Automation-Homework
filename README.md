# مدار للإلكترونيات — Sales System (MVP)

Next.js (App Router, API routes as backend) + Supabase (Postgres).
Basic CRUD for Customers, Products, Orders, and Order Items — the
foundation the AI sales agent (n8n + RAG) will connect to later.

## 1. Set up Supabase

1. Create a project at https://supabase.com (if you haven't already).
2. Open **SQL Editor** and run the contents of `sql/schema.sql`.
3. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (⚠️ never commit or expose this)

## 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the three values from step 1.

## 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — add a customer, a product, an order, then
order items, and confirm everything shows up in Supabase's Table Editor.

## 4. Push to GitHub

```bash
git init
git add .
git commit -m "Initial Madar sales system (Next.js + Supabase)"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## 5. Deploy on Vercel

1. https://vercel.com → **New Project** → Import your GitHub repo.
2. Vercel auto-detects Next.js — no build config changes needed.
3. Under **Environment Variables**, add the same 3 keys from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy. Every push to `main` will redeploy automatically.

## Business rules (documented, per project policy)

- **Currency:** JOD
- **Timezone:** Asia/Amman
- **Counted order status:** `completed` only (`pending` and `cancelled` excluded from sales calculations — enforced later at the query/view level, not in this MVP UI)
- **Sale date:** order creation date (`order_date`)
- **Returns:** deducted from the original order via `order_items.return_value`
- **Historical price:** always stored in `order_items.unit_price_at_sale_time`, never derived from `products.current_unit_price`

## What's NOT in this phase (comes with automation)

- Aggregation views/RPCs for totals, comparisons, growth %
- RAG documents + vector store
- n8n agent, router, chat interface

## Project structure

```
app/
  api/customers/route.ts       GET, POST
  api/products/route.ts        GET, POST
  api/orders/route.ts          GET, POST (creates order + items together)
  api/orders/[id]/items/route.ts   GET, POST (add more items later)
  customers/page.tsx           UI: list + add customer
  products/page.tsx            UI: list + add product
  orders/page.tsx              UI: read-only list + link to new order
  orders/new/page.tsx          UI: create order + its items in one form
  orders/[id]/page.tsx         UI: order detail, items table, optional add-item panel
components/
  NavBar.tsx                   top navigation (active-link aware)
lib/
  supabaseAdmin.ts             server-only Supabase client (service role)
  types.ts                     shared TypeScript types
  format.ts                    currency + status label/badge helpers
sql/
  schema.sql                   full DB schema + documented business rules + required grants
```
