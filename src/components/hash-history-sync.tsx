"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// 素の <a href="#…"> が積む履歴は history.state が null で、「戻る」で来ても Next.js は画面を更新しない(Issue #255)。
// ルーターに同じ URL を知らせて、そのエントリに Next.js の state を持たせる
export function HashHistorySync() {
  const router = useRouter();
  useEffect(() => {
    const onHashChange = () => {
      if (window.history.state !== null) return;
      const { pathname, search, hash } = window.location;
      router.replace(`${pathname}${search}${hash}`, { scroll: false });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [router]);
  return null;
}
