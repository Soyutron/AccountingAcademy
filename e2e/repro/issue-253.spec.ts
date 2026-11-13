import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Issue #253: 貸付の利息2,000円が何か月分か、年利率がいくらか本文に無く、ステップ5の式「元本 × 年利率 × 期間」を当てはめられなかった。
// 受取を返済の日に揃え、貸すステップで条件(半年、年利率4%)を示す(Issueの決定、案A)
const body = readFileSync("content/topics/receivables-and-payables/loans.md", "utf8");
const section = (from: string, to: string) => body.slice(body.indexOf(from), body.indexOf(to));

test("貸すステップに半年の約束と年利率があり、式に当てはめると利息が2,000円になる", () => {
  const lending = section("## お金を貸す", "## 利息を受け取る");
  expect(lending).toMatch(/半年後に返してもらう/);
  const rate = lending.match(/年利率[^\d%]{0,12}(\d+)%/);
  expect(rate).not.toBeNull();
  expect(100000 * (Number(rate![1]) / 100) * (6 / 12)).toBe(2000);
});

test("利息の受取から返済までの本文で、2,000円が半年分で、元本は利息に続いて返ることが読める", () => {
  const interest = section("## 利息を受け取る", "## 借入金の利息を払う");
  expect(interest).toMatch(/半年分の利息2,000円/);
  expect(interest).not.toMatch(/3か月後/);
  const calc = section("## 利息の計算", "## 返してもらう");
  expect(calc).toMatch(/100,000.*4%.*2,000|2,000.*100,000.*4%/);
  const repayment = section("## 返してもらう", "## 借入金を返す");
  expect(repayment).toMatch(/続いて.*元本の100,000円/);
});
