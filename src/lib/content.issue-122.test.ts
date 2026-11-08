import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const body = readFileSync("content/topics/merchandise/credit-transactions.md", "utf8");

// Issue #122: 数字や意味を読み違えやすい本文を固定する
describe("掛けで売る、掛けで買う の本文(Issue #122)", () => {
  it.each([
    ["先月の仕入に無い金額を「同じ」と書かない", "先月と同じ「仕入 40,000」"],
    ["「受け取った日」を代金の入金日に読ませない", "、受け取った日に仕入と買掛金"],
    ["減価償却を「取引が起きた日に記録する」話にしない", "取引が起きた日に記録する」考え方は、後で減価償却"],
  ])("%s", (_name, phrase) => {
    expect(body).not.toContain(phrase);
  });

  it("普通預金の初出に定義を添える", () => {
    const firstLine = body.split("\n").find((line) => line.includes("普通預金"));
    expect(firstLine).toContain("普通預金(銀行に預けてあるお金)");
  });
});
