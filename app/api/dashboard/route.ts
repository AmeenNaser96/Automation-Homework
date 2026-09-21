import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function netOf(it: { quantity: number; unit_price_at_sale_time: number; discount: number; return_value: number }) {
  return it.quantity * it.unit_price_at_sale_time - it.discount - it.return_value;
}

interface CompletedItemRow {
  quantity: number;
  unit_price_at_sale_time: number;
  discount: number;
  return_value: number;
  product_id: string;
  products: { name: string } | null;
  orders: {
    order_date: string;
    status: string;
    sales_channel: string;
    customer_id: string;
    customers: { name: string } | null;
  };
}

export async function GET() {
  const supabase = supabaseAdmin();

  const [
    { count: customersCount },
    { count: productsCount },
    { count: totalOrders },
    { count: pendingOrders },
    { count: completedOrders },
    { count: cancelledOrders },
  ] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: ordersThisMonth } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("order_date", monthStart);

  // One query drives every money metric: net sales, monthly trend, channel
  // breakdown, top products, and top customers — all from completed orders.
  const { data: completedItemsRaw, error: itemsError } = await supabase
    .from("order_items")
    .select("quantity, unit_price_at_sale_time, discount, return_value, product_id, products(name), orders!inner(order_date, status, sales_channel, customer_id, customers(name))")
    .eq("orders.status", "completed");

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  const completedItems = (completedItemsRaw || []) as unknown as CompletedItemRow[];

  const buckets: { key: string; label: string; net: number; isCurrent: boolean }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), label: ARABIC_MONTHS[d.getMonth()], net: 0, isCurrent: i === 0 });
  }
  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));

  let netSalesTotal = 0;
  let totalReturns = 0;
  const channelNet: Record<string, number> = { online: 0, branch: 0 };
  const productAgg = new Map<string, { name: string; net: number }>();
  const customerAgg = new Map<string, { name: string; net: number }>();

  for (const it of completedItems) {
    const net = netOf(it);
    netSalesTotal += net;
    totalReturns += it.return_value;
    channelNet[it.orders.sales_channel] = (channelNet[it.orders.sales_channel] || 0) + net;

    const key = monthKey(new Date(it.orders.order_date));
    const bucket = bucketByKey.get(key);
    if (bucket) bucket.net += net;

    const pName = it.products?.name || "منتج محذوف";
    const pEntry = productAgg.get(it.product_id) || { name: pName, net: 0 };
    pEntry.net += net;
    productAgg.set(it.product_id, pEntry);

    const cId = it.orders.customer_id;
    const cName = it.orders.customers?.name || "عميل محذوف";
    const cEntry = customerAgg.get(cId) || { name: cName, net: 0 };
    cEntry.net += net;
    customerAgg.set(cId, cEntry);
  }

  const channelTotal = (channelNet.online || 0) + (channelNet.branch || 0);
  const channelBreakdown = [
    { channel: "online", label: "متجر إلكتروني", net: channelNet.online || 0, sharePct: channelTotal > 0 ? ((channelNet.online || 0) / channelTotal) * 100 : 0 },
    { channel: "branch", label: "فرع", net: channelNet.branch || 0, sharePct: channelTotal > 0 ? ((channelNet.branch || 0) / channelTotal) * 100 : 0 },
  ];

  const topProducts = [...productAgg.values()].sort((a, b) => b.net - a.net).slice(0, 5);
  const topCustomers = [...customerAgg.values()].sort((a, b) => b.net - a.net).slice(0, 5);

  const averageOrderValue = (completedOrders || 0) > 0 ? netSalesTotal / (completedOrders as number) : 0;

  // Growth: last FULL month vs the one before it (index 4 vs 3; index 5 is the
  // current, still-incomplete month, so it's excluded from growth on purpose).
  const lastFull = buckets[4]?.net ?? 0;
  const monthBefore = buckets[3]?.net ?? 0;
  const growthPct = monthBefore > 0 ? ((lastFull - monthBefore) / monthBefore) * 100 : null;

  const { data: recentOrdersRaw, error: recentError } = await supabase
    .from("orders")
    .select("order_id, order_date, status, sales_channel, customers(name)")
    .order("order_date", { ascending: false })
    .limit(6);

  if (recentError) return NextResponse.json({ error: recentError.message }, { status: 500 });

  const recentIds = (recentOrdersRaw || []).map((o) => o.order_id);
  const itemsByOrder = new Map<string, number>();
  if (recentIds.length > 0) {
    const { data: recentItems } = await supabase
      .from("order_items")
      .select("order_id, quantity, unit_price_at_sale_time, discount, return_value")
      .in("order_id", recentIds);
    for (const it of recentItems || []) {
      itemsByOrder.set(it.order_id, (itemsByOrder.get(it.order_id) || 0) + netOf(it));
    }
  }

  const recentOrders = (recentOrdersRaw || []).map((o) => ({
    order_id: o.order_id,
    order_date: o.order_date,
    status: o.status,
    sales_channel: o.sales_channel,
    customer_name: (o as unknown as { customers: { name: string } | null }).customers?.name || "—",
    net: itemsByOrder.get(o.order_id) || 0,
  }));

  return NextResponse.json({
    data: {
      customersCount: customersCount || 0,
      productsCount: productsCount || 0,
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      completedOrders: completedOrders || 0,
      cancelledOrders: cancelledOrders || 0,
      ordersThisMonth: ordersThisMonth || 0,
      netSalesTotal,
      averageOrderValue,
      totalReturns,
      growthPct,
      channelBreakdown,
      topProducts,
      topCustomers,
      monthly: buckets,
      recentOrders,
    },
  });
}
