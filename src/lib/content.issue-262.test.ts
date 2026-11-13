import { describe, expect, it } from "vitest";
import { classifyErrors } from "./content-checks";

// Issue #262: classifyのlabels + itemsの形の検査
const mis = new Set(["personal_account_by_cash_direction"]);
const labels = { left: "左", right: "右" };
const items = [
  { id: "wine", answer: "left" },
  { id: "receipt", answer: "right" },
];

describe("classifyの検査", () => {
  it("正しいlabels + itemsは通る", () => {
    expect(classifyErrors({ labels, items, misconceptions: { receipt: { left: "personal_account_by_cash_direction" } } }, mis)).toEqual([]);
  });

  it("従来のaccountsの形はここでは何も言わない", () => {
    expect(classifyErrors({ accounts: ["cash", "sales"], misconceptions: {} }, mis)).toEqual([]);
  });

  it("answerがlabelsに無い箱なら拒否する", () => {
    expect(classifyErrors({ labels, items: [{ id: "wine", answer: "center" }], misconceptions: {} }, mis)).toEqual(["items wineのanswer centerがlabelsに無い"]);
  });

  it("misconceptionsのキーがitemsに無い項目なら拒否する", () => {
    expect(classifyErrors({ labels, items, misconceptions: { pepper: { left: "personal_account_by_cash_direction" } } }, mis)).toEqual(["misconceptionsのpepperがitemsに無い"]);
  });

  it("misconceptionsの箱がlabelsに無いなら拒否する", () => {
    expect(classifyErrors({ labels, items, misconceptions: { receipt: { up: "personal_account_by_cash_direction" } } }, mis)).toEqual(["misconceptions receiptの箱upがlabelsに無い"]);
  });

  it("存在しない誤解IDを拒否する", () => {
    expect(classifyErrors({ labels, items, misconceptions: { receipt: { left: "no_such" } } }, mis)).toEqual(["誤解no_suchが存在しない"]);
  });

  it("箱が1つ、itemsが無い、accountsとの併記、どちらも無いを拒否する", () => {
    expect(classifyErrors({ labels: { left: "左" }, items: [{ id: "wine", answer: "left" }], misconceptions: {} }, mis)).toEqual(["labelsの箱が2つ未満"]);
    expect(classifyErrors({ labels, misconceptions: {} }, mis)).toEqual(["labelsがあるのにitemsが無い"]);
    expect(classifyErrors({ accounts: ["cash"], labels, items, misconceptions: {} }, mis)).toEqual(["accountsとlabelsは一緒に書けない"]);
    expect(classifyErrors({ misconceptions: {} }, mis)).toEqual(["classifyにaccountsもlabelsも無い"]);
  });

  it("同じ項目IDの重複を拒否する", () => {
    expect(classifyErrors({ labels, items: [...items, items[0]], misconceptions: {} }, mis)).toEqual(["itemsのwineが重複"]);
  });
});
