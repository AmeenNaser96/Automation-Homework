"use client";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/format";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  async function load() {
    const res = await fetch("/api/products");
    const json = await res.json();
    if (res.ok) setProducts(json.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, current_unit_price: price }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "تعذّر حفظ المنتج");
      return;
    }
    setName("");
    setCategory("");
    setPrice("");
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-ink">المنتجات</h1>
        <p className="text-muted text-sm mt-1">{products.length} منتج بالكتالوج</p>
      </div>

      <form onSubmit={handleSubmit} className="panel p-5 flex gap-3 items-end flex-wrap">
        <div className="w-52">
          <label className="field-label">اسم المنتج</label>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="w-40">
          <label className="field-label">الفئة</label>
          <input className="field-input" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="w-36">
          <label className="field-label">السعر الحالي (د.أ)</label>
          <input type="number" step="0.01" min="0" className="field-input" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <button disabled={loading} className="btn-primary">
          {loading ? "جارٍ الحفظ…" : "إضافة منتج"}
        </button>
        {justAdded && <span className="text-success-400 text-sm">تم الحفظ</span>}
      </form>
      {error && <p className="text-danger-400 text-sm">{error}</p>}

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-muted text-xs">
              <th className="text-right p-3.5 font-medium">الاسم</th>
              <th className="text-right p-3.5 font-medium">الفئة</th>
              <th className="text-right p-3.5 font-medium">السعر الحالي</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.product_id} className="border-b border-line/60 last:border-0">
                <td className="p-3.5 text-ink">{p.name}</td>
                <td className="p-3.5 text-muted">{p.category || "—"}</td>
                <td className="p-3.5 text-ink">{money(p.current_unit_price)}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-muted text-sm">لا يوجد منتجات بعد — أضف أول منتج من الأعلى</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
