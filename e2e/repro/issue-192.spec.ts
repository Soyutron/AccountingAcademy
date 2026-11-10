import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const unit = () =>
  JSON.parse(readFileSync(".velite/units.json", "utf8")).find(
    (u: { id: string }) => u.id === "cash-and-deposits/cash-over-and-short",
  );

test("ふりかえりが現金過不足を使う条件と決算日の直接処理を書いている", () => {
  const review = unit().steps.find((s: { title: string }) => s.title === "ふりかえり").narrative;
  expect(review).toContain("期中");
  expect(review).toMatch(/決算の日に.*直接/);
  expect(review).toContain("雑益");
});

test("雑損と書いたときの feedback が期中の話だと分かる", () => {
  const pattern = unit().steps[1].task.wrong_patterns.find(
    (p: { misconception?: string; match: { debit?: { account: string }[] } }) =>
      p.misconception === "shortage_is_loss" && p.match.debit?.[0].account === "miscellaneous_loss",
  );
  expect(pattern.feedback).toContain("期中");
});

test("誤解 shortage_is_loss の正しい考え方が期中の話だと分かる", () => {
  const { misconceptions } = JSON.parse(readFileSync(".velite/misconceptions.json", "utf8"));
  const misconception = misconceptions.find((m: { id: string }) => m.id === "shortage_is_loss");
  expect(misconception.correct).toContain("期中");
});
