"use client";
import { useEffect, useState } from "react";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  async function load() {
    const res = await fetch("/api/customers");
    const json = await res.json();
    if (res.ok) setCustomers(json.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, city }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "تعذّر حفظ العميل");
      return;
    }
    setName("");
    setCity("");
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-ink">العملاء</h1>
        <p className="text-muted text-sm mt-1">{customers.length} عميل مسجّل</p>
      </div>

      <form onSubmit={handleSubmit} className="panel p-5 flex gap-3 items-end flex-wrap">
        <div className="w-52">
          <label className="field-label">الاسم</label>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="w-52">
          <label className="field-label">المدينة</label>
          <input className="field-input" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <button disabled={loading} className="btn-primary">
          {loading ? "جارٍ الحفظ…" : "إضافة عميل"}
        </button>
        {justAdded && <span className="text-success-400 text-sm">تم الحفظ</span>}
      </form>
      {error && <p className="text-danger-400 text-sm">{error}</p>}

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-muted text-xs">
              <th className="text-right p-3.5 font-medium">الاسم</th>
              <th className="text-right p-3.5 font-medium">المدينة</th>
              <th className="text-right p-3.5 font-medium">تاريخ الإضافة</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.customer_id} className="border-b border-line/60 last:border-0">
                <td className="p-3.5 text-ink">{c.name}</td>
                <td className="p-3.5 text-muted">{c.city || "—"}</td>
                <td className="p-3.5 text-muted">{new Date(c.created_at).toLocaleDateString("ar-JO")}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-muted text-sm">لا يوجد عملاء بعد — أضف أول عميل من الأعلى</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
