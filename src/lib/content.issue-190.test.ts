import { describe, expect, it } from "vitest";
import { unitMap } from "./content";

const narrative = (id: string, step: number) => unitMap.get(id)!.steps[step - 1].narrative;

// Issue #190: 本文で使う「T勘定」「決算」「逆仕訳」を用語として開けるようにする
describe("用語の参照", () => {
  it("5つの要素と仕訳でT勘定と決算を定義する", () => {
    const unit = unitMap.get("bookkeeping-basics/five-elements")!;
    expect(unit.introduces).toEqual(expect.arrayContaining(["t_account", "closing"]));
    const all = unit.steps.map((s) => s.narrative).join("\n");
    expect(all).toContain("[[t_account");
    expect(all).toContain("[[closing");
  });
  it("返品と運賃のステップ3・5・8で逆仕訳を参照する", () => {
    expect(unitMap.get("merchandise/returns-and-costs")!.introduces).toContain("reverse_entry");
    for (const step of [3, 5, 8]) expect(narrative("merchandise/returns-and-costs", step), `ステップ${step}`).toContain("[[reverse_entry");
  });
});
