import { describe, expect, it } from "vitest";
import { nextUnit, unitMap } from "./content";

// Issue #31: テーマ最後の単元では、次のテーマの最初の単元を「次」にする
describe("nextUnit", () => {
  it.each([
    ["merchandise/three-account-method", "merchandise/credit-transactions"],
    ["cash-and-deposits/petty-cash", "receivables-and-payables/loans"],
    ["receivables-and-payables/temporary-and-deposits", "depreciation/what-is-depreciation"],
  ])("%sの次は%s", (from, to) => {
    expect(nextUnit(unitMap.get(from)!)?.id).toBe(to);
  });
  it("最後のテーマの最後の単元には次が無い", () => {
    expect(nextUnit(unitMap.get("depreciation/straight-line")!)).toBeUndefined();
  });
  it("非表示テーマ(チュートリアル)の末尾から通常のテーマへはつながない", () => {
    expect(nextUnit(unitMap.get("tutorial/first-entry")!)).toBeUndefined();
  });
});
