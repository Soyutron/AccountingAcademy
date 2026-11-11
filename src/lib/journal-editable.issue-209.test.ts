import { describe, expect, it } from "vitest";
import { parseAmount } from "./journal-editable";

// 残高や合計を足しても安全な整数に収まるよう、入力の時点で13桁までに止める(Issue #209)
describe("parseAmountの上限", () => {
  it.each([
    ["9999999999999", 9999999999999],
    ["9,999,999,999,999円", 9999999999999],
  ])("13桁の%sは受け付ける", (text, value) => {
    expect(parseAmount(text)).toEqual({ value });
  });

  it.each(["10000000000000", "9007199254740991", "99999999999999999999"])("%sは桁が多すぎるとして止める", (text) => {
    expect(parseAmount(text)).toEqual({ reason: "桁が多すぎます" });
  });

  it("signedでも同じ上限を負の側に当てる", () => {
    expect(parseAmount("-9999999999999", true)).toEqual({ value: -9999999999999 });
    expect(parseAmount("-10000000000000", true)).toEqual({ reason: "桁が多すぎます" });
  });
});
