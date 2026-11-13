import { devices, expect, test } from "@playwright/test";

// Issue #28: スマホ幅で記帳済みの長い摘要が仕訳帳に並ぶと、ワークスペースが横にはみ出して金額欄が右で切れていた
test.use({ ...devices["iPhone 13"] });

test("390pxで記帳したあとワークスペースのタブを開いても横スクロールが出ない", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const scrollWidth = () => page.evaluate(() => document.documentElement.scrollWidth);
  await page.goto("/units/merchandise/credit-transactions");
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByRole("tab", { name: "ワークスペース" }).click();
  await work.getByLabel("借方の科目1").fill("仕入");
  await work.getByLabel("借方の金額1").fill("40000");
  await work.getByLabel("貸方の科目1").fill("買掛金");
  await work.getByLabel("貸方の金額1").fill("40000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "ワークスペース" }).click();
  await expect(work.getByText("仕訳帳(記帳済み)")).toBeVisible();
  expect(await scrollWidth()).toBeLessThanOrEqual(390);

  // Issueと同じ「続きから」の経路でも収まる
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "続きから" }).click();
  await page.getByRole("tab", { name: "ワークスペース" }).click();
  await expect(work.getByText("これから記帳する仕訳")).toBeVisible();
  expect(await scrollWidth()).toBeLessThanOrEqual(390);
});
