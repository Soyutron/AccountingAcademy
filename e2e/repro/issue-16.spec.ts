import { expect, test } from "@playwright/test";

// Issue #16: いちばん先まで進んだステップで正解したあと「← 前へ」→「次へ →」で戻ると、達成が消えて「次へ →」が無効になっていた
test("正解したステップに「← 前へ」→「次へ →」で戻っても、できましたと有効な「次へ →」が残る", async ({ page }) => {
  const inserts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/rest/v1/attempts")) inserts.push(r.postDataJSON()?.exercise_id);
  });
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const done = page.getByText("できました", { exact: true });
  await page.goto("/units/receivables-and-payables/loans");
  await next.click();
  await expect(page.getByText("ステップ2 / 9")).toBeVisible();
  await work.getByLabel("借方の科目1").fill("貸付金");
  await work.getByLabel("借方の金額1").fill("100000");
  await work.getByLabel("貸方の科目1").fill("普通預金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(done).toBeVisible();
  await expect.poll(() => inserts.length).toBe(1);

  await page.getByRole("button", { name: "← 前へ" }).click();
  await expect(page.getByText("ステップ1 / 9")).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ2 / 9")).toBeVisible();
  await expect(done).toBeVisible();
  await expect(next).toHaveAttribute("aria-disabled", "false");
  // 記帳した仕訳が見え、再記帳はできない(attemptsも増えない)
  await expect(work.getByLabel("借方の科目1")).toHaveValue("貸付金");
  await expect(work.getByRole("button", { name: "記帳する" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "結果" }).getByText("貸付金")).toHaveCount(1);
  expect(inserts.length).toBe(1);
  await next.click();
  await expect(page.getByText("ステップ3 / 9")).toBeVisible();
});
