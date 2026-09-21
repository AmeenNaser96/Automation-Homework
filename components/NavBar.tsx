"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/customers", label: "العملاء" },
  { href: "/products", label: "المنتجات" },
  { href: "/orders", label: "الطلبات" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-10">
        <div className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="2.4" fill="#E0A458" />
            <g className="orbit-ring">
              <ellipse cx="13" cy="13" rx="11" ry="4.2" stroke="#E0A458" strokeWidth="1.2" />
            </g>
            <ellipse cx="13" cy="13" rx="4.2" ry="11" stroke="#4FD1E8" strokeWidth="0.8" opacity="0.55" transform="rotate(35 13 13)" />
          </svg>
          <span className="font-medium text-[15px] tracking-tight text-ink">مدار للإلكترونيات</span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative text-sm px-3.5 py-2 rounded-lg transition-colors ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
                {active && (
                  <span className="absolute right-3.5 left-3.5 -bottom-[17px] h-[2px] bg-copper-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
