import { describe, expect, it } from "vitest";
import { glossary, glossaryMap } from "./content";

// Issue #5: requires / related / contrasts に同じ概念があると「関連」に 2 回並び、React の key が重複していた
describe("glossary の関連", () => {
  it("全項目で関連の id が一意", () => {
    const duplicated = glossary
      .map((g) => ({ id: g.id, ids: g.related.map((r) => r.id) }))
      .filter((g) => new Set(g.ids).size !== g.ids.length)
      .map((g) => g.id);
    expect(duplicated).toEqual([]);
  });

  it("先に挙げた順を保つ(資産 → requires、related の順で contrasts の負債は除く)", () => {
    expect(glossaryMap.get("asset")?.related.map((r) => r.id)).toEqual(["five_elements", "liability", "equity", "balance_sheet"]);
  });
});
