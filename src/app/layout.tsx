import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-noto-sans-jp", display: "swap" });

export const metadata: Metadata = {
  title: "AccountingAcademy",
  description: "会計を原理から、手を動かして学ぶ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={notoSansJp.variable}>
      <body className="min-h-dvh bg-background text-foreground antialiased font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-2">
          本文へ移動
        </a>
        <header className="border-b">
          <nav className="mx-auto flex max-w-4xl items-center gap-5 px-4 py-3 text-sm">
            <Link href="/" className="font-semibold">
              AccountingAcademy
            </Link>
            <Link href="/paths/boki-3" className="text-muted-foreground hover:text-foreground">
              3 級合格パス
            </Link>
            <Link href="/glossary" className="text-muted-foreground hover:text-foreground">
              用語集
            </Link>
          </nav>
        </header>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
