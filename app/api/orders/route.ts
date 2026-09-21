import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*, customers(name)")
    .order("order_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

interface IncomingItem {
  product_id: string;
  quantity: number | string;
  unit_price_at_sale_time: number | string;
  discount?: number | string;
  return_value?: number | string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customer_id, status, sales_channel, branch, order_date, items } = body as {
    customer_id: string;
    status: string;
    sales_channel: string;
    branch?: string;
    order_date?: string;
    items?: IncomingItem[];
  };

  if (!customer_id) {
    return NextResponse.json({ error: "customer_id is required" }, { status: 400 });
  }
  if (!["pending", "completed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  if (!["online", "branch"].includes(sales_channel)) {
    return NextResponse.json({ error: "invalid sales_channel" }, { status: 400 });
  }

  // Validate items up front (if provided) before touching the database.
  const cleanItems: {
    product_id: string;
    quantity: number;
    unit_price_at_sale_time: number;
    discount: number;
    return_value: number;
  }[] = [];

  if (items && items.length > 0) {
    for (const it of items) {
      const qty = Number(it.quantity);
      const price = Number(it.unit_price_at_sale_time);
      if (!it.product_id) {
        return NextResponse.json({ error: "each item requires product_id" }, { status: 400 });
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        return NextResponse.json({ error: "each item quantity must be a positive integer" }, { status: 400 });
      }
      if (Number.isNaN(price) || price < 0) {
        return NextResponse.json({ error: "each item unit_price_at_sale_time must be a non-negative number" }, { status: 400 });
      }
      cleanItems.push({
        product_id: it.product_id,
        quantity: qty,
        unit_price_at_sale_time: price,
        discount: Number(it.discount) || 0,
        return_value: Number(it.return_value) || 0,
      });
    }
  }

  const supabase = supabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id,
      status,
      sales_channel,
      branch: sales_channel === "branch" ? branch || null : null,
      order_date: order_date || new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  if (cleanItems.length > 0) {
    const rows = cleanItems.map((it) => ({ ...it, order_id: order.order_id }));
    const { error: itemsError } = await supabase.from("order_items").insert(rows);

    if (itemsError) {
      // Compensate: remove the order we just created so we don't leave an
      // order with zero items dangling from a failed request.
      await supabase.from("orders").delete().eq("order_id", order.order_id);
      return NextResponse.json({ error: `order not saved: ${itemsError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ data: order }, { status: 201 });
}
