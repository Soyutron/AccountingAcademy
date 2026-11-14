import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { type AccountInfo, findAccountByName } from "./accounting";

type RawAccount = Pick<AccountInfo, "id" | "name"> & { aliases?: string[]; reading?: string[] };
const raw: RawAccount[] = parse(readFileSync("content/accounts.yaml", "utf8")).accounts;
const accounts: AccountInfo[] = raw.map((a) => ({
  id: a.id,
  name: a.name,
  aliases: a.aliases ?? [],
  reading: a.reading,
  element: "asset",
  contra: false,
  short: "",
  why: "",
}));

describe("content/accounts.yaml(Issue #268)", () => {
  it.each([
    ["車輌運搬具", "vehicle"],
    ["車輛運搬具", "vehicle"],
    ["車輌", "vehicle"],
    ["車輛", "vehicle"],
    ["車輌運搬具減価償却累計額", "accumulated_depreciation_vehicle"],
    ["車輛運搬具減価償却累計額", "accumulated_depreciation_vehicle"],
    ["車輌減価償却累計額", "accumulated_depreciation_vehicle"],
    ["車輛減価償却累計額", "accumulated_depreciation_vehicle"],
    ["給与", "salaries_expense"],
  ])("「%s」は%sとして確定する", (name, id) => {
    expect(findAccountByName(name, accounts)?.id).toBe(id);
  });

  it("別名はどの科目にも1つしか属さない", () => {
    const owners = new Map<string, string>();
    for (const a of accounts) {
      for (const text of [a.name, ...a.aliases]) {
        expect(owners.get(text), `「${text}」が${owners.get(text)}と${a.id}の両方にある`).toBeUndefined();
        owners.set(text, a.id);
      }
    }
  });
});
