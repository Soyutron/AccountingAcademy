import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const unit = JSON.parse(readFileSync(".velite/units.json", "utf8")).find((u: { id: string }) => u.id === "receivables-and-payables/other-receivables-and-payables");

test("ステップ6と8で「受け取る側」が前受金の逆を指さない", () => {
  expect(unit.steps[5].narrative).not.toContain("今度は受け取る側です");
  expect(unit.steps[7].narrative).not.toContain("「未払」「前受」は渡す側");
  expect(unit.steps[7].narrative).toContain("商品を渡す義務");
});

test("前受金を「後で払う義務」に含めない(ステップ7)", () => {
  const step = unit.steps[6];
  expect(step.narrative).not.toMatch(/後で払う義務が増えました。借入金、未払金、買掛金、前受金/);
  expect(step.task.success).not.toContain("「後で払う義務」が4種類");
  expect(JSON.stringify(step.task.wrong_patterns)).not.toContain("後で払う義務である負債");
  expect(step.narrative).toContain("商品を渡す義務");
  expect(step.task.success).toContain("商品を渡す義務");
});

test("前受金の誤答文は返金ではなく渡す義務を主に置く(ステップ7)", () => {
  const pattern = unit.steps[6].task.wrong_patterns.find((p: { match: number }) => p.match === 310000);
  expect(pattern.feedback).not.toContain("返す可能性のあるお金");
  expect(pattern.feedback).toContain("渡す義務");
});
