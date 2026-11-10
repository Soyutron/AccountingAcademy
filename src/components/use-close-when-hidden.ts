"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";

// 対象が display: none の祖先に入っても Radix Popover は閉じず、0×0 のアンカーに付き直して画面左上へ移る。
// IDE のペインは 1024px 未満で選択中以外が隠れるので、回転などで幅が変わると起きる
export function useCloseWhenHidden(trigger: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  const onResize = useEffectEvent((el: HTMLElement) => {
    if (el.getClientRects().length === 0) close();
  });

  useEffect(() => {
    const el = trigger.current;
    if (!open || !el) return;
    const observer = new ResizeObserver(() => onResize(el));
    observer.observe(el);
    return () => observer.disconnect();
  }, [trigger, open]);
}
