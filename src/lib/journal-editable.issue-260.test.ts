import { describe, expect, it } from "vitest";
import { parseAmount } from "./journal-editable";
import { splitAmounts } from "./task-text";

// Issue #260: 金額の単位(scenario.currency)。円の単元の挙動は変えず、ドゥカートの単元では通貨名を外して読み、問題文の「数字 + ドゥカート」を金額として拾う
describe("通貨を指定した金額の入力", () => {
  it("末尾の通貨名を外して読む", () => {
    expect(parseAmount("40ドゥカート", false, "ドゥカート")).toEqual({ value: 40 });
    expect(parseAmount("1,200 ドゥカート", false, "ドゥカート")).toEqual({ value: 1200 });
  });

  it("理由の文言は通貨名を使い、円の単元では従来どおり", () => {
    expect(parseAmount("0", false, "ドゥカート")).toEqual({ reason: "1ドゥカート以上の金額を入れてください" });
    expect(parseAmount("1.5", false, "ドゥカート")).toEqual({ reason: "小数は使えません。ドゥカート単位の整数で入力してください" });
    expect(parseAmount("0")).toEqual({ reason: "1円以上の金額を入れてください" });
    expect(parseAmount("30,000 円")).toEqual({ value: 30000 });
  });

  it("ドゥカートの単元で「円」は外さない", () => {
    expect("reason" in parseAmount("40円", false, "ドゥカート")).toBe(true);
  });
});

describe("通貨を指定した問題文の金額", () => {
  it("「数字 + 通貨名」を金額にし、「円」は拾わない", () => {
    expect(splitAmounts("ジョヴァンニに胡椒を120ドゥカートで売った", "ドゥカート")).toEqual([
      "ジョヴァンニに胡椒を",
      { text: "120ドゥカート", digits: "120" },
      "で売った",
    ]);
    expect(splitAmounts("現金 100,000 円", "ドゥカート")).toEqual(["現金 100,000 円"]);
  });

  it("既定は円", () => {
    expect(splitAmounts("現金 100,000 円")).toEqual(["現金 ", { text: "100,000 円", digits: "100000" }]);
  });
});
