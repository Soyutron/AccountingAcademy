import { expect, test } from "@playwright/test";

// Issue #48: 「続きから」で再開した正解済みステップに「← 前へ」→「次へ →」で戻ると、達成が消えて「次へ →」が無効になっていた
test("続きからで再開した正解済みの post ステップは、前へ→次へで戻っても次へが有効", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const done = page.getByRole("status").filter({ hasText: "できました" });
  await page.goto("/units/merchandise/three-account-method");
  await next.click();
  await work.getByLabel("借方の科目 1").fill("仕入");
  await work.getByLabel("借方の金額 1").fill("30000");
  await work.getByLabel("貸方の科目 1").fill("現金");
  await work.getByLabel("貸方の金額 1").fill("30000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(done).toBeVisible();
  await expect(async () => {
    await page.reload();
    await page.getByRole("button", { name: "続きから" }).click({ timeout: 3000 });
  }).toPass();
  await expect(page.getByText("ステップ 2 / 7")).toBeVisible();

  await page.getByRole("button", { name: "← 前へ" }).click();
  await next.click();
  await expect(page.getByText("ステップ 2 / 7")).toBeVisible();
  await expect(done).toBeVisible();
  await expect(next).toHaveAttribute("aria-disabled", "false");
  await expect(work.getByLabel("借方の科目 1")).toHaveValue("仕入");
  await expect(page.getByRole("region", { name: "結果" }).getByText("仕入")).toHaveCount(1);
});

test("続きからで再開した正解済みの calc ステップは、前へ→次へで戻っても答えと次へが残る", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const done = page.getByRole("status").filter({ hasText: "できました" });
  await page.goto("/units/depreciation/what-is-depreciation");
  await next.click();
  await expect(page.getByText("ステップ 2 / 9")).toBeVisible();
  for (const [el, v] of [["資産", "decrease"], ["負債", "none"], ["純資産", "decrease"], ["収益", "none"], ["費用", "increase"]])
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption(v);
  await work.getByRole("button", { name: /予想/ }).click();
  await expect(done).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ 3 / 9")).toBeVisible();
  await work.getByPlaceholder("金額(円)").fill("-260000");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(done).toBeVisible();
  await expect(async () => {
    await page.reload();
    await page.getByRole("button", { name: "続きから" }).click({ timeout: 3000 });
  }).toPass();
  await expect(page.getByText("ステップ 3 / 9")).toBeVisible();

  await page.getByRole("button", { name: "← 前へ" }).click();
  await expect(page.getByText("ステップ 2 / 9")).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ 3 / 9")).toBeVisible();
  await expect(done).toBeVisible();
  await expect(next).toHaveAttribute("aria-disabled", "false");
  await expect(work.getByPlaceholder("金額(円)")).toHaveValue("-260000");
});
