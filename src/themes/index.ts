// テーマの登録簿(docs/design-system.md 3 章)。テーマを足すときは CSS を 1 つ置いてここに 1 行加える。
// 色・書体・形はテーマが決め、レイアウトと操作は全テーマ共通

export interface ThemeInfo {
  id: string;
  name: string;
  description: string;
  // 切り替え UI のプレビュー: 主色・背景・差し色(ライトの値)
  preview: [string, string, string];
}

export const THEMES: readonly ThemeInfo[] = [
  { id: "town-shop", name: "街の小さな会社", description: "カフェの物語を主役にした、暖かい紙と豆の木の緑", preview: ["#1e6b62", "#fbf7f1", "#e0a23a"] },
  { id: "ai-shu", name: "藍と朱", description: "藍の帳簿と墨の文字、朱で入れる訂正", preview: ["#2a4a7f", "#f3f2ee", "#d2462f"] },
  { id: "ledger-paper", name: "帳簿用紙", description: "緑がかった帳簿用紙に青い罫線、赤い欄線", preview: ["#2e5c9e", "#eef3ec", "#c5392c"] },
  { id: "workbench", name: "ワークベンチ", description: "開発ツールの作法。冷たいグレーと青緑の単一アクセント", preview: ["#0f766e", "#f4f6f9", "#0f766e"] },
];

export const DEFAULT_THEME = "town-shop";

export const MODES = ["auto", "light", "dark"] as const;
export type Mode = (typeof MODES)[number];
export const MODE_LABELS: Record<Mode, string> = { auto: "自動", light: "ライト", dark: "ダーク" };

// localStorage のキー。閲覧の設定なので DB には置かない
export const THEME_STORAGE_KEY = "theme";
export const MODE_STORAGE_KEY = "mode";

export function isThemeId(value: unknown): value is string {
  return typeof value === "string" && THEMES.some((t) => t.id === value);
}

export function isMode(value: unknown): value is Mode {
  return typeof value === "string" && (MODES as readonly string[]).includes(value);
}

/** 描画前に localStorage の設定を <html> に反映する。ちらつきを防ぐため <head> のインラインスクリプトとして埋め込む */
export function themeBootScript(): string {
  const ids = JSON.stringify(THEMES.map((t) => t.id));
  return `(function(){try{var d=document.documentElement,t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}),m=localStorage.getItem(${JSON.stringify(MODE_STORAGE_KEY)});if(${ids}.indexOf(t)>=0)d.dataset.theme=t;var dark=m==="dark"||(m!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);d.dataset.mode=dark?"dark":"light"}catch(e){}})()`;
}
