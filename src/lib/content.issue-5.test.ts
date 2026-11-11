import { describe, expect, it } from "vitest";
import { glossary, glossaryMap } from "./content";

// Issue #5: requires / related / contrastsに同じ概念があると「関連」に2回並び、Reactのkeyが重複していた
describe("glossaryの関連", () => {
  it("全項目で関連のidが一意", () => {
    const duplicated = glossary
      .map((g) => ({ id: g.id, ids: g.related.map((r) => r.id) }))
      .filter((g) => new Set(g.ids).size !== g.ids.length)
      .map((g) => g.id);
    expect(duplicated).toEqual([]);
  });

  it("先に挙げた順を保つ(資産 → requires、relatedの順でcontrastsの負債は除く)", () => {
    expect(glossaryMap.get("asset")?.related.map((r) => r.id)).toEqual(["five_elements", "liability", "equity", "balance_sheet"]);
  });
});
