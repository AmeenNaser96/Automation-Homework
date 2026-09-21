"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Order } from "@/lib/types";
import { statusBadgeClass, statusLabel, channelLabel } from "@/lib/format";

const TABS: { value: string; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "completed", label: "مكتمل" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "cancelled", label: "ملغي" },
];

function OrdersList() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState(searchParams.get("status") || "all");

  useEffect(() => {
    fetch("/api/orders").then((r) => r.json()).then((j) => setOrders(j.data || []));
  }, []);

  const filtered = tab === "all" ? orders : orders.filter((o) => o.status === tab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-ink">الطلبات</h1>
          <p className="text-muted text-sm mt-1">{filtered.length} من {orders.length} طلب</p>
        </div>
        <Link href="/orders/new" className="btn-primary">+ طلب جديد</Link>
      </div>

      <div className="flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`text-sm px-3.5 py-1.5 rounded-lg transition-colors ${
              tab === t.value ? "bg-panel2 text-ink border border-line" : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-muted text-xs">
              <th className="text-right p-3.5 font-medium">العميل</th>
              <th className="text-right p-3.5 font-medium">التاريخ</th>
              <th className="text-right p-3.5 font-medium">الحالة</th>
              <th className="text-right p-3.5 font-medium">القناة</th>
              <th className="text-right p-3.5 font-medium">الفرع</th>
              <th className="p-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.order_id} className="border-b border-line/60 last:border-0">
                <td className="p-3.5 text-ink">{o.customers?.name || "—"}</td>
                <td className="p-3.5 text-muted">{new Date(o.order_date).toLocaleDateString("ar-JO")}</td>
                <td className="p-3.5"><span className={statusBadgeClass(o.status)}>{statusLabel(o.status)}</span></td>
                <td className="p-3.5 text-muted">{channelLabel(o.sales_channel)}</td>
                <td className="p-3.5 text-muted">{o.branch || "—"}</td>
                <td className="p-3.5">
                  <Link href={`/orders/${o.order_id}`} className="text-signal-500 hover:underline text-sm">
                    عرض التفاصيل
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted text-sm">لا يوجد طلبات بهذه الحالة</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-muted text-sm">جارٍ التحميل…</p>}>
      <OrdersList />
    </Suspense>
  );
}
