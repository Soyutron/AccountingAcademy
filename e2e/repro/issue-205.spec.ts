import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const narrative = (title: string): string =>
  JSON.parse(readFileSync(".velite/units.json", "utf8"))
    .find((u: { id: string }) => u.id === "receivables-and-payables/temporary-and-deposits")
    .steps.find((s: { title: string }) => s.title === title).narrative;

test("ステップ 1 の本文が図と同じく振り込みと読める", async ({ page }) => {
  await page.goto("/units/receivables-and-payables/temporary-and-deposits");
  const guide = page.getByRole("region", { name: "ガイド" });
  await expect(guide).toContainText("手取り 97,000 を振り込む");
  await expect(guide).toContainText("本人に渡るのは 97,000 円");
  await expect(guide).not.toContainText("手渡すのは 97,000 円");
});

test("出張の仮払いの本文が仮払金を金額にも触れて説明する", () => {
  const text = narrative("出張の仮払い");
  expect(text).not.toContain("使い道が決まる前のお金");
  expect(text).toContain("金額や使い道が決まるまでのお金は「[[suspense_payment|仮払金]]」");
});

test("ふりかえりが仮払金を金額にも触れて説明する", () => {
  const text = narrative("ふりかえり");
  expect(text).not.toContain("使い道が決まっていないお金は仮払金");
  expect(text).toContain("いくら何に使うかが決まっていないお金は仮払金");
});
