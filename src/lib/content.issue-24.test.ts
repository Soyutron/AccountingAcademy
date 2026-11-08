import { describe, expect, it } from "vitest";
import { glossary, glossaryMap } from "./content";

// Issue #24: 概念と勘定科目で同じ ID を持つ用語が用語集に 2 つ並び、単元のポップオーバーには例も単元リンクも無い勘定科目版が出ていた
// Issue #82: 売掛金・買掛金は概念と勘定科目で ID が違い、同じ名前の項目が並んでいた
const shared = ["cash_over_and_short", "checking_account", "bank_overdraft", "petty_cash", "accounts_receivable", "accounts_payable"];

describe("概念と勘定科目で同じ ID の用語", () => {
  it("用語集の ID が一意", () => {
    const ids = glossary.map((g) => g.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });
  it("用語集の名前が一意", () => {
    const names = glossary.map((g) => g.name);
    expect(names.filter((name, i) => names.indexOf(name) !== i)).toEqual([]);
  });
  it.each(shared)("%s は概念の説明と勘定科目の要素を 1 項目に持ち、関連に自分自身を含まない", (id) => {
    const g = glossaryMap.get(id)!;
    expect(g.kind).toBe("concept");
    expect(g.example).toBeTruthy();
    expect(g.unit).toBeTruthy();
    expect(g.element).toBeTruthy();
    expect(g.related.map((r) => r.id)).not.toContain(id);
  });
});
