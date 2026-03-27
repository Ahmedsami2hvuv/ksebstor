import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KSEB STOR",
  description: "متجر احترافي متكامل مرتبط بنظام الطلبات الأساسي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="text-xl font-black text-indigo-700">
              KSEB STOR
            </Link>
            <nav className="flex items-center gap-4 text-sm font-semibold">
              <Link href="/">المتجر</Link>
              <Link href="/cart">السلة</Link>
              <Link href="/checkout">الدفع</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
