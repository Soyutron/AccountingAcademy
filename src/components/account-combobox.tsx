"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { type AccountInfo, ELEMENTS, matchesAccountQuery } from "@/lib/accounting";
import { ELEMENT_STYLE } from "@/lib/elements";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";

// 仕訳帳の科目入力。候補を 5 要素ごとにまとめ、要素色の見出しで科目名と分類を見分けられるようにする(docs/ide-design.md 8 章)。
// ブラウザの <datalist> は描画を制御できず、科目名と要素名が同じ見た目で並んで紛らわしかった(Issue #17)

interface Props {
  accounts: AccountInfo[];
  value: string;
  onChange: (value: string) => void;
  onCompositionChange?: (composing: boolean) => void;
  "aria-label": string;
  placeholder?: string;
  className?: string;
}

export function AccountCombobox({ accounts, value, onChange, onCompositionChange, placeholder, className, "aria-label": ariaLabel }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const optionId = (accountId: string) => `${id}-${accountId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const query = value.trim();
  const groups = useMemo(() => {
    const matched = query ? accounts.filter((a) => matchesAccountQuery(a, query)) : accounts;
    return ELEMENTS.map((element) => ({ element, items: matched.filter((a) => a.element === element) })).filter((g) => g.items.length > 0);
  }, [accounts, query]);
  const options = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  // 候補が 1 件だけで、それが正式名と完全に一致したら選び終えたとみなして閉じる。別名では閉じず、正式名を見せる
  const shown = open && options.length > 0 && !(options.length === 1 && options[0].name === query);
  const activeIndex = Math.min(active, options.length - 1);
  const activeOption = shown ? options[activeIndex] : undefined;

  useEffect(() => {
    if (activeOption) document.getElementById(`${id}-${activeOption.id}`)?.scrollIntoView({ block: "nearest" });
  }, [activeOption, id]);

  const select = (account: AccountInfo) => {
    onChange(account.name);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 変換中の Enter や矢印は IME のもの。読みで候補が出ていても奪わない
    if (e.nativeEvent.isComposing) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (shown) setActive(Math.min(activeIndex + 1, options.length - 1));
        else {
          setActive(0);
          setOpen(true);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (shown) setActive(Math.max(activeIndex - 1, 0));
        break;
      case "Enter":
        // 候補を確定するだけで、フォーム(記帳する)は送信しない
        if (activeOption) {
          e.preventDefault();
          select(activeOption);
        }
        break;
      case "Escape":
        if (shown) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <Popover open={shown}>
      <PopoverAnchor asChild>
        <Input
          ref={inputRef}
          role="combobox"
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={shown}
          aria-controls={listId}
          aria-activedescendant={activeOption ? optionId(activeOption.id) : undefined}
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          className={className}
          onChange={(e) => {
            onChange(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onCompositionStart={() => onCompositionChange?.(true)}
          onCompositionEnd={() => onCompositionChange?.(false)}
          // onFocus で開くと「行を追加」からのフォーカス移動でも開き、リストが「行を追加」を覆って次の押下が候補に当たる(Issue #104)
          onClick={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        // 横向きのスマホでは上下どちらにも 18rem が無い。固定の高さのままだと画面外にはみ出し、先頭の候補に届かない(Issue #125)
        className="block w-[min(20rem,calc(100vw-2rem))] max-h-[min(18rem,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        // 候補行・余白・スクロールバーを押しても入力欄を blur させない(blur すると一覧が閉じる)。スクロールバーの操作自体は止まらない
        onMouseDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (e.target === inputRef.current) e.preventDefault();
        }}
      >
        <div role="listbox" id={listId} aria-label="科目の候補">
          {groups.map(({ element, items }) => {
            const s = ELEMENT_STYLE[element];
            const groupId = `${id}-group-${element}`;
            return (
              <div key={element} role="group" aria-labelledby={groupId}>
                <div id={groupId} className={`sticky top-0 z-10 flex items-center gap-1 rounded-sm border px-2 py-1 text-[11px] font-semibold ${s.bg} ${s.text} ${s.border}`}>
                  <span aria-hidden>{s.symbol}</span>
                  {s.label}
                </div>
                {items.map((account) => (
                  <div
                    key={account.id}
                    id={optionId(account.id)}
                    role="option"
                    aria-selected={account === activeOption}
                    className={`flex cursor-pointer touch-manipulation items-baseline gap-2 rounded-r-sm border-l-2 px-2 py-1.5 ${s.border} ${account === activeOption ? "bg-accent" : ""}`}
                    onMouseMove={() => setActive(options.indexOf(account))}
                    onClick={() => select(account)}
                  >
                    <span className="shrink-0 text-sm font-medium text-foreground">
                      {account.name}
                      {account.contra && <span className="text-muted-foreground">(控除)</span>}
                    </span>
                    <span className="ml-auto truncate text-xs text-muted-foreground">{account.short}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
