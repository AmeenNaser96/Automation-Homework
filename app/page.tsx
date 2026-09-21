"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { money, statusBadgeClass, statusLabel } from "@/lib/format";

interface DashboardData {
  customersCount: number;
  productsCount: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  ordersThisMonth: number;
  netSalesTotal: number;
  averageOrderValue: number;
  totalReturns: number;
  growthPct: number | null;
  channelBreakdown: { channel: string; label: string; net: number; sharePct: number }[];
  topProducts: { name: string; net: number }[];
  topCustomers: { name: string; net: number }[];
  monthly: { key: string; label: string; net: number; isCurrent: boolean }[];
  recentOrders: {
    order_id: string;
    order_date: string;
    status: string;
    customer_name: string;
    net: number;
  }[];
}

function Kpi({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <div className="panel p-5 h-full">
      <p className="text-muted text-[13px]">{label}</p>
      <p className="text-[26px] font-medium text-ink mt-2 kpi-number">{value}</p>
    </div>
  );
  return href ? <Link href={href} className="block hover:border-line transition-colors">{content}</Link> : content;
}

function TrendChart({ data }: { data: DashboardData["monthly"] }) {
  const max = Math.max(...data.map((d) => d.net), 1);
  const hasCurrent = data.some((d) => d.isCurrent);
  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-ink font-medium text-[15px]">اتجاه صافي المبيعات — آخر 6 أشهر</p>
        <span className="text-muted text-xs">د.أ</span>
      </div>
      <div className="flex items-end gap-4 h-40">
        {data.map((d) => {
          const h = Math.max((d.net / max) * 100, 2);
          return (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="kpi-number text-[11px] text-muted">{d.net > 0 ? Math.round(d.net) : ""}</span>
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${h}%`,
                  background: d.isCurrent
                    ? "linear-gradient(180deg, rgba(79,209,232,0.55), rgba(79,209,232,0.15))"
                    : "linear-gradient(180deg, #F0B673, #C98B3E)",
                  opacity: d.isCurrent ? 1 : 0.92,
                }}
              />
              <span className="text-[11.5px] text-muted">{d.label}</span>
            </div>
          );
        })}
      </div>
      {hasCurrent && <p className="text-muted text-[11.5px] mt-4">* الشهر الحالي لسا غير مكتمل</p>}
    </div>
  );
}

function ChannelPanel({ data }: { data: DashboardData["channelBreakdown"] }) {
  return (
    <div className="panel p-6">
      <p className="text-ink font-medium text-[15px] mb-5">المبيعات حسب القناة</p>
      <div className="space-y-4">
        {data.map((c) => (
          <div key={c.channel}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-ink">{c.label}</span>
              <span className="text-muted kpi-number">{money(c.net)} · {c.sharePct.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-panel2 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${c.sharePct}%`, background: c.channel === "online" ? "#4FD1E8" : "#E0A458" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankList({ title, items, emptyText }: { title: string; items: { name: string; net: number }[]; emptyText: string }) {
  const max = Math.max(...items.map((i) => i.net), 1);
  return (
    <div className="panel p-6">
      <p className="text-ink font-medium text-[15px] mb-5">{title}</p>
      {items.length === 0 ? (
        <p className="text-muted text-sm">{emptyText}</p>
      ) : (
        <div className="space-y-3.5">
          {items.map((it, idx) => (
            <div key={it.name + idx} className="flex items-center gap-3">
              <span className="text-muted text-xs w-4">{idx + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-ink truncate">{it.name}</span>
                  <span className="text-muted kpi-number text-[12.5px]">{money(it.net)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-panel2 overflow-hidden">
                  <div className="h-full rounded-full bg-copper-500" style={{ width: `${(it.net / max) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((j) => setData(j.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium text-ink">لوحة التحكم</h1>
          <p className="text-muted text-sm mt-1">نظرة شاملة على العملاء والمنتجات والمبيعات</p>
        </div>
        <div className="flex gap-2">
          <Link href="/customers" className="btn-secondary text-sm">+ عميل</Link>
          <Link href="/products" className="btn-secondary text-sm">+ منتج</Link>
          <Link href="/orders/new" className="btn-primary text-sm">+ طلب جديد</Link>
        </div>
      </div>

      {!data ? (
        <p className="text-muted text-sm">جارٍ التحميل…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Kpi label="إجمالي العملاء" value={String(data.customersCount)} href="/customers" />
            <Kpi label="إجمالي المنتجات" value={String(data.productsCount)} href="/products" />
            <Kpi label="إجمالي الطلبات" value={String(data.totalOrders)} href="/orders" />
            <Kpi label="طلبات قيد الانتظار" value={String(data.pendingOrders)} href="/orders?status=pending" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Kpi label="صافي المبيعات (الإجمالي)" value={money(data.netSalesTotal)} />
            <Kpi label="متوسط قيمة الطلب" value={money(data.averageOrderValue)} />
            <Kpi label="قيمة المرتجعات (الإجمالي)" value={money(data.totalReturns)} />
            <Kpi
              label="نمو المبيعات (آخر شهرين كاملين)"
              value={data.growthPct === null ? "غير قابل للحساب" : `${data.growthPct >= 0 ? "+" : ""}${data.growthPct.toFixed(1)}%`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><TrendChart data={data.monthly} /></div>
            <ChannelPanel data={data.channelBreakdown} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RankList title="أعلى 5 منتجات بصافي المبيعات" items={data.topProducts} emptyText="لا يوجد طلبات مكتملة بعد" />
            <RankList title="أعلى 5 عملاء بصافي المبيعات" items={data.topCustomers} emptyText="لا يوجد طلبات مكتملة بعد" />
          </div>

          <div className="panel overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <p className="text-ink font-medium text-[15px]">آخر الطلبات</p>
              <Link href="/orders" className="text-signal-500 hover:underline text-sm">عرض الكل</Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-muted text-xs">
                  <th className="text-right p-3.5 font-medium">العميل</th>
                  <th className="text-right p-3.5 font-medium">التاريخ</th>
                  <th className="text-right p-3.5 font-medium">الحالة</th>
                  <th className="text-right p-3.5 font-medium">الصافي</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.order_id} className="border-b border-line/60 last:border-0">
                    <td className="p-3.5 text-ink">
                      <Link href={`/orders/${o.order_id}`} className="hover:text-signal-400">{o.customer_name}</Link>
                    </td>
                    <td className="p-3.5 text-muted">{new Date(o.order_date).toLocaleDateString("ar-JO")}</td>
                    <td className="p-3.5"><span className={statusBadgeClass(o.status)}>{statusLabel(o.status)}</span></td>
                    <td className="p-3.5 kpi-number text-ink">{money(o.net)}</td>
                  </tr>
                ))}
                {data.recentOrders.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted text-sm">لا يوجد طلبات بعد</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
