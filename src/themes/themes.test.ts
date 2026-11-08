import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, THEMES, isThemeId } from "./index";

// テーマの検査(docs/design-system.md 6 章)。登録簿のテーマごとに、ライト・ダークの両ブロックに必須トークンがそろい、
// 文字と背景のコントラストが AA(4.5:1)を満たし、状態色が要素色と同じ値になっていないことを確かめる

const ELEMENTS = ["asset", "liability", "equity", "revenue", "expense"] as const;

const REQUIRED = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "brand-accent",
  "rule",
  "surface-guide",
  "surface-work",
  "surface-result",
  ...ELEMENTS.flatMap((el) => [`el-${el}-fg`, `el-${el}-bg`, `el-${el}-border`, `el-${el}-bar`]),
  "ok-bg",
  "ok-fg",
  "hint-bg",
  "hint-fg",
  "diff-fg",
  "error-fg",
  "changed-bg",
];
// 形と書体はライトのブロックにだけ書く(ダークで変えない)
const REQUIRED_LIGHT_ONLY = ["radius", "type-heading", "type-body", "type-mono"];

// 文字 / 背景の組。すべて 4.5:1 以上
const CONTRAST_PAIRS: [string, string][] = [
  ["foreground", "background"],
  ["muted-foreground", "background"],
  ["card-foreground", "card"],
  ["muted-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
  ["foreground", "surface-guide"],
  ["foreground", "surface-work"],
  ["foreground", "surface-result"],
  ["muted-foreground", "surface-guide"],
  ["primary", "background"],
  ["primary", "card"],
  ...ELEMENTS.map((el): [string, string] => [`el-${el}-fg`, `el-${el}-bg`]),
  ...ELEMENTS.map((el): [string, string] => [`el-${el}-fg`, "card"]),
  ["ok-fg", "ok-bg"],
  ["hint-fg", "hint-bg"],
  ["diff-fg", "background"],
  ["diff-fg", "card"],
  ["diff-fg", "surface-guide"],
  ["error-fg", "background"],
  ["error-fg", "card"],
  ["foreground", "changed-bg"],
  ["destructive", "card"],
];

type Tokens = Record<string, string>;

function parseBlock(css: string, selector: string): Tokens | null {
  const start = css.indexOf(selector);
  if (start < 0) return null;
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const tokens: Tokens = {};
  for (const m of css.slice(open + 1, close).matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const HEX = /^#[0-9a-f]{6}$/;

describe("テーマの登録簿", () => {
  it("既定テーマが登録されている", () => {
    expect(isThemeId(DEFAULT_THEME)).toBe(true);
  });
  it("id は重複せず kebab-case", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

describe.each(THEMES.map((t) => [t.id, t] as const))("テーマ %s", (id) => {
  const file = path.join(__dirname, `${id}.css`);
  it("CSS ファイルがある", () => {
    expect(existsSync(file)).toBe(true);
  });
  const css = existsSync(file) ? readFileSync(file, "utf8") : "";
  const light = parseBlock(css, `[data-theme="${id}"] {`) ?? {};
  const dark = parseBlock(css, `[data-theme="${id}"][data-mode="dark"] {`) ?? {};

  for (const [mode, tokens] of [
    ["ライト", light],
    ["ダーク", dark],
  ] as const) {
    describe(mode, () => {
      it("必須トークンがそろっている", () => {
        const missing = REQUIRED.filter((t) => !(t in tokens));
        expect(missing).toEqual([]);
      });
      it("色は 6 桁の小文字 hex", () => {
        for (const t of REQUIRED) expect(tokens[t], t).toMatch(HEX);
      });
      it.each(CONTRAST_PAIRS)("%s / %s は 4.5:1 以上", (fg, bg) => {
        expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5);
      });
      it("状態色は要素色と同じ値を使わない", () => {
        expect(tokens["ok-bg"]).not.toBe(tokens["el-revenue-bg"]);
        expect(tokens["ok-fg"]).not.toBe(tokens["el-revenue-fg"]);
        expect(tokens["error-fg"]).not.toBe(tokens["el-liability-fg"]);
        expect(tokens["changed-bg"]).not.toBe(tokens["el-expense-bg"]);
      });
    });
  }

  it("形と書体はライトのブロックにある", () => {
    for (const t of REQUIRED_LIGHT_ONLY) expect(light[t], t).toBeTruthy();
    for (const t of ["type-heading", "type-body", "type-mono"]) expect(light[t]).toMatch(/^var\(--font-[a-z0-9-]+\)$/);
  });
});
