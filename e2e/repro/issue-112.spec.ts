import { expect, test } from "@playwright/test";

// 勘定科目の説明が理由の断片で終わり、具体例が無かった
test("用語集の勘定科目に具体例と分類の理由がある", async ({ page }) => {
  await page.goto("/glossary#cash");
  const cash = page.locator("div#cash");
  await expect(cash.getByText(/^例:/)).toBeVisible();
  await expect(cash.getByText(/^資産に分類する理由: .+。$/)).toBeVisible();
});

test("用語集のすべての項目に具体例がある", async ({ page }) => {
  await page.goto("/glossary");
  const items = page.locator("main dl > div[id]");
  await expect(items.first()).toBeVisible();
  const missing = await items.evaluateAll((els) => els.filter((el) => !/例: /.test(el.textContent ?? "")).map((el) => el.id));
  expect(missing).toEqual([]);
});

test("結果ペインの勘定科目のポップオーバーに具体例と分類の理由が出る", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("region", { name: "結果" }).getByRole("button", { name: "現金", exact: true }).first().click();
  await page.getByRole("button", { name: "もっと見る" }).click();
  await expect(page.getByText(/^資産に分類する理由: .+。$/)).toBeVisible();
  await expect(page.getByText(/^例: /)).toBeVisible();
});
