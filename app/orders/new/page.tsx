"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Customer, Product } from "@/lib/types";
import { money } from "@/lib/format";

interface ItemRow {
  product_id: string;
  quantity: string;
  unit_price_at_sale_time: string;
  discount: string;
  return_value: string;
}

const emptyRow = (): ItemRow => ({
  product_id: "",
  quantity: "1",
  unit_price_at_sale_time: "",
  discount: "0",
  return_value: "0",
});

export default function NewOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("completed");
  const [channel, setChannel] = useState("online");
  const [branch, setBranch] = useState("");
  const [rows, setRows] = useState<ItemRow[]>([emptyRow()]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then((j) => setCustomers(j.data || []));
    fetch("/api/products").then((r) => r.json()).then((j) => setProducts(j.data || []));
  }, []);

  function updateRow(idx: number, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function onProductChange(idx: number, productId: string) {
    const p = products.find((p) => p.product_id === productId);
    updateRow(idx, {
      product_id: productId,
      unit_price_at_sale_time: p ? String(p.current_unit_price) : "",
    });
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(idx: number) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  const total = rows.reduce((sum, r) => {
    const qty = Number(r.quantity) || 0;
    const price = Number(r.unit_price_at_sale_time) || 0;
    const discount = Number(r.discount) || 0;
    const ret = Number(r.return_value) || 0;
    return sum + qty * price - discount - ret;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validRows = rows.filter((r) => r.product_id);
    if (validRows.length === 0) {
      setError("أضف منتجًا واحدًا على الأقل للطلب");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: customerId,
        status,
        sales_channel: channel,
        branch,
        items: validRows.map((r) => ({
          product_id: r.product_id,
          quantity: r.quantity,
          unit_price_at_sale_time: r.unit_price_at_sale_time,
          discount: r.discount,
          return_value: r.return_value,
        })),
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "تعذّر حفظ الطلب");
      return;
    }
    router.push(`/orders/${json.data.order_id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-ink">طلب جديد</h1>
        <p className="text-muted text-sm mt-1">أنشئ الطلب وأضف عناصره دفعة واحدة</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="panel p-5 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="field-label">العميل</label>
            <select className="field-input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">اختر عميلاً</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">الحالة</label>
            <select className="field-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">قيد الانتظار</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
          <div>
            <label className="field-label">قناة البيع</label>
            <select className="field-input" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="online">متجر إلكتروني</option>
              <option value="branch">فرع</option>
            </select>
          </div>
          {channel === "branch" && (
            <div>
              <label className="field-label">اسم الفرع</label>
              <input className="field-input" value={branch} onChange={(e) => setBranch(e.target.value)} />
            </div>
          )}
        </div>

        <div className="panel overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-line">
            <p className="font-medium text-ink text-sm">عناصر الطلب</p>
            <button type="button" onClick={addRow} className="btn-secondary text-xs px-3 py-1.5">
              + إضافة سطر
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-muted text-xs">
                <th className="text-right p-3 font-medium">المنتج</th>
                <th className="text-right p-3 font-medium w-24">الكمية</th>
                <th className="text-right p-3 font-medium w-32">سعر الوحدة</th>
                <th className="text-right p-3 font-medium w-28">الخصم</th>
                <th className="text-right p-3 font-medium w-28">المرتجع</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b border-line/60 last:border-0">
                  <td className="p-2.5">
                    <select
                      className="field-input"
                      value={row.product_id}
                      onChange={(e) => onProductChange(idx, e.target.value)}
                    >
                      <option value="">اختر منتجًا</option>
                      {products.map((p) => (
                        <option key={p.product_id} value={p.product_id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2.5">
                    <input type="number" min="1" className="field-input" value={row.quantity}
                      onChange={(e) => updateRow(idx, { quantity: e.target.value })} />
                  </td>
                  <td className="p-2.5">
                    <input type="number" step="0.01" min="0" className="field-input" value={row.unit_price_at_sale_time}
                      onChange={(e) => updateRow(idx, { unit_price_at_sale_time: e.target.value })} />
                  </td>
                  <td className="p-2.5">
                    <input type="number" step="0.01" min="0" className="field-input" value={row.discount}
                      onChange={(e) => updateRow(idx, { discount: e.target.value })} />
                  </td>
                  <td className="p-2.5">
                    <input type="number" step="0.01" min="0" className="field-input" value={row.return_value}
                      onChange={(e) => updateRow(idx, { return_value: e.target.value })} />
                  </td>
                  <td className="p-2.5 text-center">
                    <button type="button" onClick={() => removeRow(idx)} className="text-muted hover:text-danger-400" aria-label="حذف السطر">
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 flex items-center justify-between border-t border-line bg-panel2/60">
            <span className="text-sm text-muted">الإجمالي التقديري</span>
            <span className="font-medium text-ink">{money(total)}</span>
          </div>
        </div>

        {error && <p className="text-danger-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button disabled={loading} className="btn-primary">
            {loading ? "جارٍ الحفظ…" : "حفظ الطلب"}
          </button>
        </div>
      </form>
    </div>
  );
}
