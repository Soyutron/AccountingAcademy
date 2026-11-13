import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradeCalc, gradePost, type TaskOf } from "./grading";

// Issue #65: 期をまたがず、決算日の2本の振替と「期首 + 仕入 − 期末」で売上原価を教える
const unit = unitMap.get("merchandise/cost-of-goods-sold")!;
const task = <K extends "calc" | "post">(index: number) => unit.steps[index].task as TaskOf<K>;

describe("売れ残りと売上原価", () => {
  it("翌期の取引を記帳するステップが無い", () => {
    const text = unit.steps.map((s) => `${s.narrative}\n${JSON.stringify(s.task ?? {})}`).join("\n");
    expect(text).not.toMatch(/翌期首|新しい期/);
  });

  it("売上原価は期首の商品 + 仕入 − 期末で、足し忘れと仕入そのままに誤解IDが付く", () => {
    const cogs = task<"calc">(1);
    expect(gradeCalc(cogs, 125000).correct).toBe(true);
    expect(gradeCalc(cogs, 110000).misconception).toBe("beginning_inventory_forgotten");
    expect(gradeCalc(cogs, 132000).misconception).toBe("purchases_equal_cogs");
    expect(gradeCalc(cogs, 147000).misconception).toBe("purchases_equal_cogs");
  });

  it("決算日に仕入 / 繰越商品 15,000 を記帳させ、期末の額を書くと期首の足し忘れとして返す", () => {
    const post = task<"post">(2);
    expect(gradePost(post, post.answer).correct).toBe(true);
    const ending = gradePost(post, {
      debit: [{ account: "purchases", amount: 22000 }],
      credit: [{ account: "merchandise_inventory", amount: 22000 }],
    });
    expect(ending.misconception).toBe("beginning_inventory_forgotten");
  });

  it("決算後の当期純利益の誤答に誤解IDが付く", () => {
    const income = task<"calc">(4);
    expect(gradeCalc(income, -71500).correct).toBe(true);
    expect(gradeCalc(income, -56500).misconception).toBe("beginning_inventory_forgotten");
    expect(gradeCalc(income, -78500).misconception).toBe("purchases_equal_cogs");
  });
});
