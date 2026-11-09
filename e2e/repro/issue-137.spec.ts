import { expect, test } from "@playwright/test";

// Issue #137: Cookie を保存できない環境では、書き込みのたびに匿名ユーザーが作られ、保存は RLS 違反で失敗し続けていた。
// 匿名ユーザーを作らず、再読み込みではなく Cookie の許可を案内すること

const unit = "/units/bookkeeping-basics/five-elements";

test("Cookie を保存できないとき、匿名ユーザーを作らず Cookie の許可を案内する", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, "cookie", { get: () => "", set: () => {}, configurable: true });
  });
  let signups = 0;
  const writes: string[] = [];
  page.on("request", (r) => {
    if (/\/rest\/v1\/(unit_progress|attempts)/.test(r.url()) && r.method() === "POST") writes.push(r.url());
  });
  page.on("response", (r) => {
    if (r.url().includes("/auth/v1/signup") && r.status() === 200) signups++;
  });
  await page.goto(unit);
  await page.waitForLoadState("networkidle");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const saveError = page.getByRole("alert").filter({ hasText: "保存エラー" });

  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(saveError).toContainText("Cookie を許可すると");
  await expect(saveError).not.toContainText("再読み込み");

  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("1000000");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("1000000");
  await work.getByRole("button", { name: "記帳する", exact: true }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.waitForTimeout(1000);

  await expect(saveError).toContainText("Cookie を許可すると");
  await expect(saveError).not.toContainText("再読み込み");
  expect(signups).toBe(0);
  expect(writes).toEqual([]);
});
