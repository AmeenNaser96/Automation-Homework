"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Order, OrderItem, Product } from "@/lib/types";
import { money, statusBadgeClass, statusLabel, channelLabel } from "@/lib/format";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [newStatus, setNewStatus] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusSaved, setStatusSaved] = useState(false);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [returnValue, setReturnValue] = useState("0");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editReturnValue, setEditReturnValue] = useState("0");
  const [savingReturn, setSavingReturn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddRow, setShowAddRow] = useState(false);

  async function loadOrder() {
    const res = await fetch(`/api/orders/${orderId}`);
    const json = await res.json();
    if (res.ok) {
      setOrder(json.data);
      setNewStatus(json.data.status);
    }
  }

  async function loadItems() {
    const res = await fetch(`/api/orders/${orderId}/items`);
    const json = await res.json();
    if (res.ok) setItems(json.data);
  }

  async function loadProducts() {
    const res = await fetch("/api/products");
    const json = await res.json();
    if (res.ok) setProducts(json.data);
  }

  useEffect(() => {
    if (orderId) {
      loadOrder();
      loadItems();
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  function onProductChange(id: string) {
    setProductId(id);
    const p = products.find((p) => p.product_id === id);
    if (p) setUnitPrice(String(p.current_unit_price));
  }

  const netTotal = items.reduce((sum, it) => {
    return sum + it.quantity * it.unit_price_at_sale_time - it.discount - it.return_value;
  }, 0);

  async function handleStatusSave() {
    if (!order || newStatus === order.status) return;
    setStatusSaving(true);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    setStatusSaving(false);
    if (res.ok) {
      setOrder(json.data);
      setStatusSaved(true);
      setTimeout(() => setStatusSaved(false), 2000);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        quantity,
        unit_price_at_sale_time: unitPrice,
        discount,
        return_value: returnValue,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "تعذّر إضافة العنصر");
      return;
    }
    setProductId("");
    setQuantity("1");
    setUnitPrice("");
    setDiscount("0");
    setReturnValue("0");
    setShowAddRow(false);
    loadItems();
  }

  function startEditReturn(it: OrderItem) {
    setEditingItemId(it.order_item_id);
    setEditReturnValue(String(it.return_value));
  }

  async function saveReturn(itemId: string) {
    setSavingReturn(true);
    const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ return_value: editReturnValue }),
    });
    setSavingReturn(false);
    if (res.ok) {
      setEditingItemId(null);
      loadItems();
    }
  }

  if (!order) {
    return <p className="text-muted text-sm">جارٍ التحميل…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-lg font-medium text-ink">طلب — {order.customers?.name || "—"}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={statusBadgeClass(order.status)}>{statusLabel(order.status)}</span>
            <span className="text-muted text-sm">{channelLabel(order.sales_channel)}</span>
            {order.branch && <span className="text-muted text-sm">— {order.branch}</span>}
            <span className="text-muted text-sm">{new Date(order.order_date).toLocaleDateString("ar-JO")}</span>
          </div>
        </div>

        <div className="panel p-3 flex items-end gap-2">
          <div>
            <label className="field-label">تغيير الحالة</label>
            <select className="field-input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="pending">قيد الانتظار</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
          <button
            onClick={handleStatusSave}
            disabled={statusSaving || newStatus === order.status}
            className="btn-primary text-sm"
          >
            {statusSaving ? "جارٍ الحفظ…" : "حفظ"}
          </button>
          {statusSaved && <span className="text-success-400 text-sm self-center">تم التحديث</span>}
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-line">
          <p className="font-medium text-ink text-sm">عناصر الطلب</p>
          <button onClick={() => setShowAddRow((s) => !s)} className="btn-secondary text-xs px-3 py-1.5">
            {showAddRow ? "إلغاء" : "+ إضافة عنصر"}
          </button>
        </div>

        {showAddRow && (
          <form onSubmit={handleAddItem} className="p-4 flex gap-3 items-end flex-wrap border-b border-line bg-panel2/60">
            <div className="w-44">
              <label className="field-label">المنتج</label>
              <select className="field-input" value={productId} onChange={(e) => onProductChange(e.target.value)} required>
                <option value="">اختر منتجًا</option>
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="w-20">
              <label className="field-label">الكمية</label>
              <input type="number" min="1" className="field-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
            <div className="w-28">
              <label className="field-label">سعر الوحدة</label>
              <input type="number" step="0.01" min="0" className="field-input" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
            </div>
            <div className="w-24">
              <label className="field-label">الخصم</label>
              <input type="number" step="0.01" min="0" className="field-input" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="w-24">
              <label className="field-label">المرتجع</label>
              <input type="number" step="0.01" min="0" className="field-input" value={returnValue} onChange={(e) => setReturnValue(e.target.value)} />
            </div>
            <button disabled={loading} className="btn-primary">{loading ? "جارٍ الحفظ…" : "إضافة"}</button>
          </form>
        )}
        {error && <p className="text-danger-400 text-sm px-4 pt-3">{error}</p>}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-muted text-xs">
              <th className="text-right p-3 font-medium">المنتج</th>
              <th className="text-right p-3 font-medium">الكمية</th>
              <th className="text-right p-3 font-medium">سعر الوحدة</th>
              <th className="text-right p-3 font-medium">الخصم</th>
              <th className="text-right p-3 font-medium">المرتجع</th>
              <th className="text-right p-3 font-medium">الصافي</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.order_item_id} className="border-b border-line/60 last:border-0">
                <td className="p-3 text-ink">{it.products?.name || "—"}</td>
                <td className="p-3 text-muted">{it.quantity}</td>
                <td className="p-3 text-muted">{money(it.unit_price_at_sale_time)}</td>
                <td className="p-3 text-muted">{money(it.discount)}</td>
                <td className="p-3 text-muted">
                  {editingItemId === it.order_item_id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" step="0.01" min="0"
                        className="field-input w-24 py-1"
                        value={editReturnValue}
                        onChange={(e) => setEditReturnValue(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => saveReturn(it.order_item_id)} disabled={savingReturn} className="text-success-400 text-xs hover:underline">
                        حفظ
                      </button>
                      <button onClick={() => setEditingItemId(null)} className="text-muted text-xs hover:underline">
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEditReturn(it)} className="hover:text-signal-400 flex items-center gap-1.5">
                      {money(it.return_value)}
                      <span className="text-signal-500 text-xs">تسجيل مرتجع</span>
                    </button>
                  )}
                </td>
                <td className="p-3 text-ink">{money(it.quantity * it.unit_price_at_sale_time - it.discount - it.return_value)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted text-sm">لا يوجد عناصر لهذا الطلب بعد</td></tr>
            )}
          </tbody>
        </table>
        <div className="p-4 flex items-center justify-between border-t border-line bg-panel2/60">
          <span className="text-sm text-muted">صافي مبيعات الطلب</span>
          <span className="font-medium text-ink">{money(netTotal)}</span>
        </div>
      </div>
    </div>
  );
}
