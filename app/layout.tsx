import "./globals.css";
import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-arabic",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-plex-mono",
});

export const metadata = {
  title: "مدار للإلكترونيات — نظام المبيعات",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${plexArabic.variable} ${plexMono.variable}`}>
      <body className="font-sans bg-void text-ink min-h-screen">
        <NavBar />
        <ChatWidget />
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
