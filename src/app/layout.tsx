import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { fontVariables } from "@/themes/fonts";
import { DEFAULT_THEME } from "@/themes";
import { ThemeBoot } from "@/components/theme-boot";
import { ThemeSwitcher } from "@/components/theme-switcher";

export const metadata: Metadata = {
  title: { template: "%s | AccountingAcademy", default: "AccountingAcademy" },
  description: "会計を原理から、手を動かして学ぶ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // サーバーは既定テーマ・ライトで描き、<head> のスクリプトが描画前に localStorage の設定で属性を置き換える。
    // その差分は意図したものなので suppressHydrationWarning
    <html lang="ja" className={fontVariables} data-theme={DEFAULT_THEME} data-mode="light" suppressHydrationWarning>
      <head>
        <ThemeBoot />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-2">
          本文へ移動
        </a>
        <header className="border-b">
          <nav className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2 text-sm sm:gap-5">
            {/* 狭い幅では語が割れるリンクの代わりにブランド名を省略して収める */}
            <Link href="/" className="truncate font-heading font-bold">
              AccountingAcademy
            </Link>
            <Link href="/paths/boki-3" className="whitespace-nowrap text-muted-foreground hover:text-foreground">
              3 級合格パス
            </Link>
            <Link href="/glossary" className="whitespace-nowrap text-muted-foreground hover:text-foreground">
              用語集
            </Link>
            <span className="flex-1" />
            <ThemeSwitcher />
          </nav>
        </header>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
