import { describe, expect, it } from "vitest";
import { dependsOnUnit, unitMap } from "./content";

const unit = (id: string) => unitMap.get(id)!;
const FIVE = "bookkeeping-basics/five-elements";

// Issue #183: 誤解の案内先が、いま学んでいる単元を前提にしているかの判定
describe("dependsOnUnit", () => {
  it("直接の前提を見つける", () => {
    expect(dependsOnUnit(unit("depreciation/what-is-depreciation"), FIVE)).toBe(true);
    expect(dependsOnUnit(unit("merchandise/credit-transactions"), "merchandise/three-account-method")).toBe(true);
  });
  it("前提の前提までたどる", () => {
    expect(dependsOnUnit(unit("depreciation/straight-line"), FIVE)).toBe(true);
  });
  it("逆向きと自分自身は前提に含めない", () => {
    expect(dependsOnUnit(unit(FIVE), "depreciation/what-is-depreciation")).toBe(false);
    expect(dependsOnUnit(unit(FIVE), FIVE)).toBe(false);
  });
});
