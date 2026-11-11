import { describe, expect, it } from "vitest";
import { parseAmount } from "./journal-editable";

// 全角数字・全角カンマ・「円」は受け付け、それ以外は理由付きで拒否する(Issue #43)
describe("parseAmount", () => {
  it.each([
    ["１０００００", 100000],
    ["1,000,000", 1000000],
    ["１，０００，０００", 1000000],
    ["100000円", 100000],
    [" 100000 ", 100000],
  ])("%sを%dと読む", (text, value) => {
    expect(parseAmount(text)).toEqual({ value });
  });

  it.each(["10万", "1e6", "-1", "0", "1000000.5", " 1 000 000", "9999999999999999", "", "abc"])("%sは理由付きで拒否する", (text) => {
    const r = parseAmount(text);
    expect(r).toHaveProperty("reason");
    expect("reason" in r && r.reason.length > 0).toBe(true);
  });

  it("signedなら負数と0を受け付ける(calcの当期純損失など)", () => {
    expect(parseAmount("-260000", true)).toEqual({ value: -260000 });
    expect(parseAmount("−２６００００", true)).toEqual({ value: -260000 });
    expect(parseAmount("0", true)).toEqual({ value: 0 });
    expect(parseAmount("10万", true)).toHaveProperty("reason");
  });
});
