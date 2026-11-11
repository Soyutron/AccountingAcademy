import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { type AccountInfo, findAccountByName, matchesAccountQuery } from "./accounting";

type RawAccount = Pick<AccountInfo, "id" | "name"> & { aliases?: string[]; reading?: string[] };
const raw: RawAccount[] = parse(readFileSync("content/accounts.yaml", "utf8")).accounts;

const purchases: AccountInfo = {
  id: "purchases",
  name: "仕入",
  aliases: ["仕入れ"],
  reading: ["しいれ"],
  element: "expense",
  contra: false,
  short: "",
  why: "",
};

describe("matchesAccountQuery(Issue #79)", () => {
  it.each(["仕", "仕入", "仕入れ", "しいれ", "しい", "シイレ", " しいれ "])("「%s」で仕入に当たる", (query) => {
    expect(matchesAccountQuery(purchases, query)).toBe(true);
  });

  it("読みも別名も無い科目は科目名だけで照合する", () => {
    expect(matchesAccountQuery({ ...purchases, aliases: [], reading: undefined }, "しいれ")).toBe(false);
  });

  it("どこにも当たらない文字はfalse", () => {
    expect(matchesAccountQuery(purchases, "げんきん")).toBe(false);
  });

  it("読みは検索用で、科目名としては確定しない", () => {
    expect(findAccountByName("しいれ", [purchases])).toBeUndefined();
    expect(findAccountByName("仕入れ", [purchases])?.id).toBe("purchases");
  });
});

describe("content/accounts.yaml(Issue #79)", () => {
  it.each(raw.map((a) => [a.id, a] as const))("%sに読み(ひらがな)がある", (_id, account) => {
    expect(account.reading?.length).toBeGreaterThan(0);
    for (const r of account.reading ?? []) expect(r).toMatch(/^[ぁ-ゖー]+$/);
  });

  it.each([
    ["仕入れ", "purchases"],
    ["買い掛け金", "accounts_payable"],
    ["売り掛け金", "accounts_receivable"],
    ["売り上げ", "sales"],
  ])("送り仮名違いの「%s」は%sの別名", (alias, id) => {
    expect(raw.find((a) => a.id === id)?.aliases).toContain(alias);
  });
});
