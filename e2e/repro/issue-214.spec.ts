import { expect, test } from "@playwright/test";

// 回答していない閲覧者には匿名ユーザーを作らない(observeの「次へ」は回答ではない)。最初の回答の後は進捗が保存される
test("observeステップの「次へ」だけでは匿名サインインせず、最初の回答の後は進捗を保存する", async ({ page }) => {
  const signups: string[] = [];
  const progressWrites: string[] = [];
  page.on("request", (r) => {
    if (/\/auth\/v1\/signup/.test(r.url())) signups.push(r.url());
    if (/\/rest\/v1\/unit_progress/.test(r.url()) && r.method() === "POST") progressWrites.push(r.url());
  });
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "今はしない" }).click();
  await expect(page.getByText(/^ステップ1 \//)).toBeVisible();
  const next = page.getByRole("button", { name: "次へ →" });
  await next.click();
  await expect(page.getByText(/^ステップ2 \//)).toBeVisible();
  await page.waitForTimeout(1500);
  expect(signups).toEqual([]);
  expect(progressWrites).toEqual([]);

  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await expect.poll(() => signups.length).toBe(1);

  await next.click();
  await expect(page.getByText(/^ステップ3 \//)).toBeVisible();
  await expect.poll(() => progressWrites.length).toBeGreaterThan(0);
  expect(signups).toHaveLength(1);
});
