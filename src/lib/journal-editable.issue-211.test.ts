import { describe, expect, it } from "vitest";
import { parseAmount } from "./journal-editable";

// 問題文の書き方「30,000 円」のように「円」の前に空白があっても金額として読む(Issue #211)
describe("parseAmount の「円」の前の空白", () => {
  it.each([
    ["30,000 円", 30000],
    ["315000 円", 315000],
    ["１００，０００ 円", 100000],
    ["30,000　円", 30000],
    [" 30,000  円 ", 30000],
  ])("%s を金額として読む", (text, value) => {
    expect(parseAmount(text)).toEqual({ value });
    expect(parseAmount(text, true)).toEqual({ value });
  });

  it("calc の負数でも読む", () => {
    expect(parseAmount("-260,000 円", true)).toEqual({ value: -260000 });
  });

  it("「円」だけなら金額の入力を促す", () => {
    expect(parseAmount(" 円")).toEqual({ reason: "金額を入れてください" });
  });

  it("数字の途中の空白は受け付けない", () => {
    expect(parseAmount("30 000 円")).toHaveProperty("reason");
  });
});
