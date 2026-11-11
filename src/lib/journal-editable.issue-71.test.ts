import { describe, expect, it } from "vitest";
import type { AccountInfo } from "./accounting";
import { isIncompleteLine } from "./journal-editable";

const accounts: AccountInfo[] = [{ id: "cash", name: "現金", aliases: [], reading: ["げんきん"], element: "asset", contra: false, short: "", why: "" }];

// 片方だけ入った行を黙って捨てると、画面の入力と記帳内容が食い違う(Issue #71)
describe("isIncompleteLine", () => {
  it.each([
    ["", ""],
    ["  ", "　"],
  ])("科目%j / 金額%jは未入力の行なので無視する", (accountName, amount) => {
    expect(isIncompleteLine({ accountName, amount }, accounts)).toBe(false);
  });

  it("科目と金額がそろった行は完成している", () => {
    expect(isIncompleteLine({ accountName: "現金", amount: "1,000" }, accounts)).toBe(false);
  });

  it.each([
    ["", "500000", "科目が空"],
    ["現金", "", "金額が空"],
    ["げんきん", "500000", "読みのままで科目が確定していない"],
    ["ぜんぜん無い科目", "500000", "存在しない科目"],
    ["現金", "0", "0円"],
    ["現金", "abc", "数字でない金額"],
  ])("科目%j / 金額%jは不完全(%s)", (accountName, amount) => {
    expect(isIncompleteLine({ accountName, amount }, accounts)).toBe(true);
  });
});
