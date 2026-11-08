import { describe, expect, it } from "vitest";
import { type AccountInfo, findAccountByName, matchesAccountQuery, normalizeSearchText, toHiragana } from "./accounting";

// Issue #110: 検索語と候補は、空白の有無と全角・半角の違いを無視して比べる

const cash = { id: "cash", name: "現金", element: "asset", aliases: [], reading: ["げんきん"] } as unknown as AccountInfo;

describe("normalizeSearchText(Issue #110)", () => {
  it.each(["5要素", "５要素", "５ 要素", "5　要素", " 5 要素 "])("「%s」は「5 要素」と同じ形になる", (text) => {
    expect(normalizeSearchText(text)).toBe(normalizeSearchText("5 要素"));
  });

  it("カタカナは全角・半角ともひらがなに揃える", () => {
    expect(normalizeSearchText("シワケ")).toBe("しわけ");
    expect(normalizeSearchText("ｼﾜｹ")).toBe("しわけ");
    expect(toHiragana("シワケ")).toBe("しわけ");
  });
});

describe("matchesAccountQuery(Issue #110)", () => {
  it("空白や半角カナが混ざっても候補に出す", () => {
    expect(matchesAccountQuery(cash, "現 金")).toBe(true);
    expect(matchesAccountQuery(cash, "ｹﾞﾝｷﾝ")).toBe(true);
  });

  it("候補に出ても、科目の確定は正式名か別名の一致に限る", () => {
    expect(findAccountByName("現 金", [cash])).toBeUndefined();
  });
});
