import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type RawAccount = { id: string; why: string };
const accounts: RawAccount[] = parse(readFileSync("content/accounts.yaml", "utf8")).accounts;

// Issue #92: 累計額は帳簿価額を減らす科目で、直接減らさないのは資産勘定の金額(取得原価)
describe("accumulated_depreciationのwhy(Issue #92)", () => {
  const why = accounts.find((a) => a.id === "accumulated_depreciation")?.why;

  it("帳簿価額を直接減らさないとは書かない", () => {
    expect(why).not.toContain("帳簿価額を直接減らさず");
  });

  it("直接減らさないのは勘定の金額(取得原価)だと分かる", () => {
    expect(why).toContain("勘定の金額(取得原価)を直接減らさず");
  });
});
