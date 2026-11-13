"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 会計IDE(/units/*)は上下の固定バーで画面を使い切るので出さない。
// 出すと低い画面(844×390など)でページが伸び、固定バーが「記帳する」に重なる
export function SiteFooter() {
  if (usePathname().startsWith("/units/")) return null;
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-4xl gap-5 px-4 py-3 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground">
          プライバシーポリシー
        </Link>
      </div>
    </footer>
  );
}
