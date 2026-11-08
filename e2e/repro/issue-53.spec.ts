import { devices, expect, test } from "@playwright/test";

const { defaultBrowserType: _browser, ...iPhone } = devices["iPhone 13"];
test.use(iPhone);

// Issue #53: タブ表示の画面幅では右に何も無いのに、成功文・汎用の不正解文・calc の「やること」が「右の…」で結果を指していた
test("390px の成功文が「右の表」を指さない", async ({ page }) => {
  await page.goto("/units/depreciation/straight-line");
  await page.getByRole("button", { name: "次へ →" }).first().click();
  await page.getByRole("tab", { name: "ワークスペース" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("車両運搬具");
  await work.getByLabel("借方の金額 1").fill("1200000");
  await work.getByLabel("貸方の科目 1").fill("現金");
  await work.getByLabel("貸方の金額 1").fill("1200000");
  await work.getByRole("button", { name: "記帳する" }).click();
  const status = page.getByRole("status").filter({ hasText: "できました" });
  await expect(status).toBeVisible();
  await expect(status).not.toContainText("右の");
});

test("390px の calc の「やること」と汎用の不正解文が「右の」を指さない", async ({ page }) => {
  await page.goto("/units/merchandise/cost-of-goods-sold");
  await page.getByRole("button", { name: "次へ →" }).first().click();
  await expect(page.getByText("ステップ 2 /")).toBeVisible();
  const guide = page.getByRole("region", { name: "ガイド" });
  await expect(guide.getByText("結果の表を読んで答えましょう")).toBeVisible();
  await expect(guide).not.toContainText("右の");

  await page.getByRole("tab", { name: "ワークスペース" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByPlaceholder("金額(円)").fill("1");
  await work.getByRole("button", { name: "確認する" }).click();
  const status = page.getByRole("status").filter({ hasText: "計算の式" });
  await expect(status).toBeVisible();
  await expect(status).not.toContainText("右の");
});
