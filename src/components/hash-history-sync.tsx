"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// 素の <a href="#…"> が積む履歴はhistory.stateがnullで、「戻る」で来てもNext.jsは画面を更新しない(Issue #255)。
// ルーターに同じURLを知らせて、そのエントリにNext.jsのstateを持たせる
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
