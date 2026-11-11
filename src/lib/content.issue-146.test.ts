import { describe, expect, it } from "vitest";
import { units } from "#content";
import { nextUnit, unitMap } from "./content";

const closing = (id: string) => unitMap.get(id)!.steps.at(-1)!.narrative;

// Issue #146: ふりかえりの予告は、1行下の「次の単元」リンクと同じ行き先を指す
describe("ふりかえりの予告", () => {
  it("5つの要素と仕訳は、実際の次の単元へ橋渡しし、減価償却は先の話として書く", () => {
    const text = closing("bookkeeping-basics/five-elements");
    expect(text).not.toContain("次の単元では、1年の終わりに");
    expect(text).toContain(`次の単元「${nextUnit(unitMap.get("bookkeeping-basics/five-elements")!)!.title}」`);
    expect(text).toContain("後の固定資産のテーマ");
  });
  it("売れ残りと売上原価は、2テーマ先の固定資産を「次」と呼ばない", () => {
    const text = closing("merchandise/cost-of-goods-sold");
    expect(text).not.toContain("次の固定資産のテーマ");
    expect(text).toContain("後の固定資産のテーマ");
  });
  it("次の単元が無い単元は「次」を予告しない", () => {
    const noNext = units.filter((u) => !nextUnit(u));
    expect(noNext.map((u) => u.id)).toContain("depreciation/straight-line");
    for (const u of noNext) expect(closing(u.id), u.id).not.toMatch(/次の単元|次のテーマ|次は/);
  });
});
