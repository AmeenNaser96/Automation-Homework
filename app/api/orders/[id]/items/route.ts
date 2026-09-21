import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("order_items")
    .select("*, products(name)")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { product_id, quantity, unit_price_at_sale_time, discount, return_value } = body;

  if (!product_id) {
    return NextResponse.json({ error: "product_id is required" }, { status: 400 });
  }
  const qty = Number(quantity);
  const price = Number(unit_price_at_sale_time);
  if (!Number.isInteger(qty) || qty <= 0) {
    return NextResponse.json({ error: "quantity must be a positive integer" }, { status: 400 });
  }
  if (Number.isNaN(price) || price < 0) {
    return NextResponse.json({ error: "unit_price_at_sale_time must be a non-negative number" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("order_items")
    .insert({
      order_id: id,
      product_id,
      quantity: qty,
      unit_price_at_sale_time: price,
      discount: Number(discount) || 0,
      return_value: Number(return_value) || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
