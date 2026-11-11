import { describe, expect, it } from "vitest";
import { parseAmount } from "./journal-editable";

// IMEの長音符と、結果ペインが負数の表示に使う △ も負号として読む(Issue #131)
describe("parseAmountの負号", () => {
  it.each(["ー260000", "ー２６００００", "△260000", "▲260,000", "△260,000円"])("signedなら%sを -260000と読む", (text) => {
    expect(parseAmount(text, true)).toEqual({ value: -260000 });
  });

  it.each(["(260000)", "(260,000)", "マイナス260000", "△ 260000"])("signedで読めない%sには - の付け方を案内する", (text) => {
    const r = parseAmount(text, true);
    expect("reason" in r && r.reason).toContain("先頭に - を付け");
  });

  it.each(["ー100000", "△100000", "▲100000"])("signedでなければ%sはマイナスとして拒否する", (text) => {
    const r = parseAmount(text);
    expect("reason" in r && r.reason).toContain("マイナスは使えません");
  });

  it("仕訳の金額の案内には負号の書き方を出さない", () => {
    expect(parseAmount("120万")).toEqual({ reason: "半角の数字だけで入力してください(例: 100000)" });
  });
});
