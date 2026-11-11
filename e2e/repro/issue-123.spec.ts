import { expect, type Page, test } from "@playwright/test";

// 記帳で現れた科目も流動性の順に入り、単元をまたいでも同じ会社の行順が変わらない
async function assetRows(page: Page) {
  const rows = page.getByRole("region", { name: "貸借対照表" }).locator(".grid > div").first().locator("[data-account]");
  return rows.evaluateAll((els) => els.map((e) => e.getAttribute("data-account")));
}

test("「掛けで売る、掛けで買う」のステップ5と次の単元で資産の行順が流動性の順に一致する", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const post = async (debit: [string, number], credit: [string, number]) => {
    await work.getByLabel("借方の科目1").fill(debit[0]);
    await work.getByLabel("借方の金額1").fill(String(debit[1]));
    await work.getByLabel("貸方の科目1").fill(credit[0]);
    await work.getByLabel("貸方の金額1").fill(String(credit[1]));
    await work.getByRole("button", { name: "記帳する" }).click();
    await expect(page.getByText("できました", { exact: true })).toBeVisible();
  };

  await page.goto("/units/merchandise/credit-transactions");
  await page.getByRole("button", { name: "今はしない" }).click();

  await next.click();
  await expect(page.getByText("ステップ2 /")).toBeVisible();
  await post(["仕入", 40000], ["買掛金", 40000]);

  await next.click();
  await expect(page.getByText("ステップ3 /")).toBeVisible();
  for (const [element, value] of [["資産", "increase"], ["負債", "none"], ["純資産", "increase"], ["収益", "increase"], ["費用", "none"]]) {
    await work.getByLabel(`${element}の予想`, { exact: true }).selectOption(value);
  }
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();

  await next.click();
  await expect(page.getByText("ステップ4 /")).toBeVisible();
  await post(["普通預金", 60000], ["売掛金", 60000]);

  await next.click();
  await expect(page.getByText("ステップ5 /")).toBeVisible();
  await post(["買掛金", 40000], ["現金", 40000]);
  expect(await assetRows(page)).toEqual(["cash", "bank_deposit", "equipment"]);

  await page.goto("/units/merchandise/returns-and-costs");
  await expect(page.getByRole("region", { name: "貸借対照表" }).locator("[data-account='equipment']")).toBeVisible();
  expect(await assetRows(page)).toEqual(["cash", "bank_deposit", "equipment"]);
});
