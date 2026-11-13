import { describe, expect, it } from "vitest";
import { gradeTweak, type TaskOf } from "./grading";

// Issue #260: 採点の文言は単元の通貨(scenario.currency)を使い、円の単元では従来の文言のまま
describe("tweakの採点の文言と通貨", () => {
  const task: TaskOf<"tweak"> = {
    type: "tweak",
    formula: "straight_line",
    params: [{ id: "cost", label: "取得原価", value: 1200, min: 0, max: 2000, step: 100, unit: "" }],
    goal: { output: "annual_depreciation", equals: 150, label: "1年分の減価償却費" },
  };

  it("円の単元", () => {
    expect(gradeTweak(task, { annual_depreciation: 200 }).feedback).toBe("いまの1年分の減価償却費は200円です。条件を動かして150円にしてみましょう。");
  });

  it("ドゥカートの単元では「円」が出ない", () => {
    expect(gradeTweak(task, { annual_depreciation: 200 }, "ドゥカート").feedback).toBe("いまの1年分の減価償却費は200ドゥカートです。条件を動かして150ドゥカートにしてみましょう。");
  });
});
