"use client";

import { useLayoutEffect } from "react";
import { restoreSavedTheme, themeBootScript } from "@/themes";

// 動的ルートの notFound() では root layout がクライアントで描画され、インラインスクリプトは実行されない(#135)。
// そこで layout effect でも同じ反映を行い、クライアントでは type を JS 以外にして React の script 警告を避ける
export function ThemeBoot() {
  useLayoutEffect(restoreSavedTheme, []);
  return (
    <script
      type={typeof window === "undefined" ? undefined : "application/json"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeBootScript() }}
    />
  );
}
