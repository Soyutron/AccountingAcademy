import { test, expect, devices } from "@playwright/test";

const { defaultBrowserType: _omit, ...iPhone } = devices["iPhone 13"];
test.use({ ...iPhone });

test("スマホ幅の予想のselectは、他の入力欄と同じ16px以上で高さも揃っている", async ({ page }) => {
  await page.goto("/units/merchandise/cost-of-goods-sold");
  await page.getByRole("button", { name: "今はしない" }).tap({ timeout: 3000 }).catch(() => {});
  const next = page.getByRole("button", { name: "次へ →" }).first();
  await next.tap();
  await expect(page.getByText(/ステップ2 \//).first()).toBeVisible();
  await page.getByRole("tablist", { name: "ペインの切り替え" }).getByRole("tab", { name: "ワークスペース" }).tap();
  await page.getByPlaceholder("金額(円)").first().fill("110000");
  await page.getByRole("button", { name: "確認する" }).first().tap();
  await next.tap();
  await expect(page.getByText(/ステップ3 \//).first()).toBeVisible();
  await page.getByRole("tablist", { name: "ペインの切り替え" }).getByRole("tab", { name: "ワークスペース" }).tap();
  for (const label of ["資産", "負債", "純資産", "収益", "費用"]) {
    const select = page.getByLabel(`${label}の予想`, { exact: true });
    await expect(select).toBeVisible();
    const m = await select.evaluate((e) => ({ fontSize: parseFloat(getComputedStyle(e).fontSize), height: e.getBoundingClientRect().height }));
    expect(m.fontSize, label).toBeGreaterThanOrEqual(16);
    expect(m.height, label).toBeGreaterThanOrEqual(32);
  }
});
