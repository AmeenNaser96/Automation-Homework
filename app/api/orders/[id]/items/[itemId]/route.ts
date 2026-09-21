import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const body = await req.json();
  const { return_value } = body as { return_value: number | string };

  const val = Number(return_value);
  if (Number.isNaN(val) || val < 0) {
    return NextResponse.json({ error: "return_value must be a non-negative number" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("order_items")
    .update({ return_value: val })
    .eq("order_item_id", itemId)
    .eq("order_id", id) // safety: item must belong to this order
    .select("*, products(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
