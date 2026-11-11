import { expect, test } from "@playwright/test";

// Issue #178: 同じ誤答のまま押し直すと、数えない(Issue #15)うえに画面が何も変わらず、無反応に見えていた
const SAME = "さっきと同じ答えです";

test("post: 同じ誤答を押し直すと数えずに案内を出し、答えを変えた誤答で「答えを見る」が出る", async ({ page }) => {
  const inserts: boolean[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/rest/v1/attempts")) inserts.push(r.postDataJSON()?.correct);
  });
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("資本金");
  await page.keyboard.press("Escape");
  await work.getByLabel("借方の金額 1").fill("1000000");
  await work.getByLabel("貸方の科目 1").fill("現金");
  await page.keyboard.press("Escape");
  await work.getByLabel("貸方の金額 1").fill("1000000");
  const post = work.getByRole("button", { name: "記帳する" });
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  const reveal = page.getByRole("button", { name: "答えを見る" });
  await post.click();
  await expect(status).toBeVisible();
  await expect(status).not.toContainText(SAME);
  await expect.poll(() => inserts.length).toBe(1);

  await page.waitForTimeout(1000);
  await post.click();
  await expect(status).toContainText(SAME);
  await page.waitForTimeout(300);
  expect(inserts.length).toBe(1);
  await expect(reveal).toHaveCount(0);

  await work.getByLabel("貸方の科目 1").fill("売上");
  await page.keyboard.press("Escape");
  await post.click();
  await expect.poll(() => inserts.length).toBe(2);
  await expect(reveal).toBeVisible();
  await expect(status).not.toContainText(SAME);
});

test("calc: 同じ誤答を押し直すと数えずに案内を出す", async ({ page }) => {
  const inserts: boolean[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/rest/v1/attempts")) inserts.push(r.postDataJSON()?.correct);
  });
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  // ステップ 2 が predict(答えれば進める)、ステップ 3 が calc
  await page.goto("/units/depreciation/what-is-depreciation");
  await next.click();
  for (const el of ["資産", "負債", "純資産", "収益", "費用"]) {
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption({ index: 1 });
  }
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(next).not.toHaveAttribute("aria-disabled", "true");
  await next.click();
  await expect.poll(() => inserts.length).toBe(1);
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  const amount = work.getByPlaceholder("金額(円)");
  const confirm = work.getByRole("button", { name: "確認する" });
  await amount.fill("11");
  await confirm.click();
  await expect(status).toBeVisible();
  await expect.poll(() => inserts.length).toBe(2);
  await page.waitForTimeout(1000);
  await confirm.click();
  await expect(status).toContainText(SAME);
  await page.waitForTimeout(300);
  expect(inserts.length).toBe(2);
  await expect(page.getByRole("button", { name: "答えを見る" })).toHaveCount(0);
});
