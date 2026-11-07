import { expect, test } from "@playwright/test";

// Issue #9: 定額法 ステップ 3(tweak)で「当期の減価償却費」「期末の帳簿価額」が 12 か月分で出て、
// 単元の設定(10/1 取得・6 か月)やステップ 5 の正解と食い違っていた。月割りを教える前のステップでは 1 年分だけ見せる
test("定額法 ステップ 3: 1 年分だけが表示され、当期分と期末の帳簿価額は出ない", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  await page.goto("/units/depreciation/straight-line");
  await next.click();
  await work.getByLabel("借方の科目 1").fill("車両運搬具");
  await work.getByLabel("借方の金額 1").fill("1200000");
  await work.getByLabel("貸方の科目 1").fill("現金");
  await work.getByLabel("貸方の金額 1").fill("1200000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ 3 / 9")).toBeVisible();
  await work.getByRole("slider", { name: "耐用年数" }).fill("6");
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  const outputs = work.locator("dl");
  await expect(outputs.getByText("1 年分の減価償却費", { exact: true })).toBeVisible();
  await expect(outputs.getByText("200,000 円", { exact: true })).toBeVisible();
  await expect(outputs.getByText("当期の減価償却費")).toHaveCount(0);
  await expect(outputs.getByText("期末の帳簿価額")).toHaveCount(0);
  await expect(work.getByText("1,000,000 円")).toHaveCount(0);
});
