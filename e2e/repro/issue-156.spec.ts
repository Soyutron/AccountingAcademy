import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Issue #156: 当座借越は一勘定制で教える。期中は当座預金だけで記録し、決算で当座借越へ移す

const unit = JSON.parse(readFileSync(".velite/units.json", "utf8")).find((u: { id: string }) => u.id === "cash-and-deposits/checking-account");
const step = unit.steps.find((s: { title: string }) => s.title === "残高を超えて振り出したら");
const journals: string[] = [...step.narrative.matchAll(/```journal\n([\s\S]*?)```/g)].map((m) => m[1]);

test("期中の仕訳の貸方は当座預金だけで、決算の仕訳で当座借越へ移す(ステップ7)", () => {
  expect(journals).toHaveLength(2);
  const [issue, closing] = journals;
  expect(issue).toContain("借方: 買掛金 150,000");
  expect(issue).toContain("貸方: 当座預金 150,000");
  expect(issue).not.toContain("当座借越");
  expect(closing).toContain("借方: 当座預金 50,000");
  expect(closing).toContain("貸方: 当座借越 50,000");
});

test("仮の例であることと、当座借越へ移す時点を本文に書く(ステップ7)", () => {
  expect(step.narrative).toContain("今の帳簿の数字とは別の例");
  expect(step.narrative).toContain("期中は当座預金のマイナスのまま");
  expect(step.narrative).toMatch(/決算で[^。]*当座借越へ移/);
});

test("分類課題の成功文とふりかえりも決算で移す時点に合わせる", () => {
  const classify = unit.steps.find((s: { title: string }) => s.title === "箱に分ける");
  expect(classify.task.success).toContain("決算で当座借越へ移す");
  const recap = unit.steps.find((s: { title: string }) => s.title === "ふりかえり");
  expect(recap.narrative).not.toContain("残高を超えて振り出した分は当座借越という負債です");
  expect(recap.narrative).toMatch(/決算で[^。]*当座借越/);
});
