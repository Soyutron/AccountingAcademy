"use client";

import { useSyncExternalStore } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DEFAULT_THEME, MODE_LABELS, MODE_STORAGE_KEY, MODES, type Mode, THEME_STORAGE_KEY, THEMES, isMode, isThemeId } from "@/themes";

// テーマとライト・ダークの切り替え。選択は localStorage に置き、<html> の data-theme / data-mode に反映する(docs/design-system.md 3.2)。
// 初期描画の反映は layout の ThemeBoot が済ませているので、ここは表示と変更だけを受け持つ。
// 現在の選択は <html> と localStorage を正として useSyncExternalStore で読む(サーバー描画では既定値)

function readStorage<T>(key: string, guard: (v: unknown) => v is T, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return guard(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // プライベートモードなどで保存できなくても、表示の切り替えは続ける
  }
}

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  // 「自動」のときは OS の設定変更に追従する
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (getMode() === "auto") applyMode("auto");
  };
  mq.addEventListener("change", onChange);
  return () => {
    listeners.delete(listener);
    mq.removeEventListener("change", onChange);
  };
}
function emit() {
  for (const l of listeners) l();
}

const getTheme = () => {
  const t = document.documentElement.dataset.theme;
  return isThemeId(t) ? t : DEFAULT_THEME;
};
const getMode = () => readStorage(MODE_STORAGE_KEY, isMode, "auto");

function applyTheme(id: string) {
  document.documentElement.dataset.theme = id;
  writeStorage(THEME_STORAGE_KEY, id);
  emit();
}

function applyMode(mode: Mode) {
  const dark = mode === "dark" || (mode === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.mode = dark ? "dark" : "light";
  writeStorage(MODE_STORAGE_KEY, mode);
  emit();
}

export function ThemeSwitcher() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => DEFAULT_THEME);
  const mode = useSyncExternalStore(subscribe, getMode, () => "auto" as Mode);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="テーマ">
          <Palette aria-hidden />
          <span className="hidden sm:inline">テーマ</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 gap-3">
        <div role="group" aria-label="テーマ" className="space-y-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={theme === t.id}
              onClick={() => applyTheme(t.id)}
              className={`flex w-full items-center gap-2.5 rounded-md border px-2 py-1.5 text-left text-sm ${theme === t.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`}
            >
              <span className="flex shrink-0 gap-0.5" aria-hidden>
                {t.preview.map((c, i) => (
                  <span key={i} className="h-4 w-2.5 rounded-sm border border-foreground/10" style={{ backgroundColor: c }} />
                ))}
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{t.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{t.description}</span>
              </span>
            </button>
          ))}
        </div>
        <div role="group" aria-label="明るさ" className="flex gap-1 border-t pt-2">
          {MODES.map((m) => (
            <Button key={m} type="button" size="sm" variant={mode === m ? "secondary" : "ghost"} aria-pressed={mode === m} className="flex-1" onClick={() => applyMode(m)}>
              {MODE_LABELS[m]}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
