"use client";

import { useLayoutEffect } from "react";
import { restoreSavedTheme, themeBootScript } from "@/themes";

// 動的ルートのnotFound()ではroot layoutがクライアントで描画され、インラインスクリプトは実行されない(#135)。
// そこでlayout effectでも同じ反映を行い、クライアントではtypeをJS以外にしてReactのscript警告を避ける
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
