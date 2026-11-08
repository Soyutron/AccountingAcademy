import { devices, expect, test } from "@playwright/test";

const { defaultBrowserType: _ignored, ...iPhone } = devices["iPhone 13"];
test.use(iPhone);

test("390px の仕訳エディタで 8〜10 桁の金額と長い科目名が欄に収まる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click({ timeout: 15000 });
  await page.getByRole("tab", { name: "ワークスペース" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  const amount = work.getByLabel("借方の金額 1");
  const clipped = (el: HTMLInputElement) => el.scrollWidth > el.clientWidth;

  for (const [typed, shown] of [
    ["12345678", "12,345,678"],
    ["123456789", "123,456,789"],
    ["1000000000", "1,000,000,000"],
  ]) {
    await amount.fill(typed);
    await amount.blur();
    await expect(amount).toHaveValue(shown);
    expect(await amount.evaluate(clipped)).toBe(false);
  }

  // 金額欄に幅を回した分、科目欄で名前が切れないこと
  const account = work.getByLabel("借方の科目 1");
  await account.fill("繰越利益剰余金");
  await account.blur();
  expect(await account.evaluate(clipped)).toBe(false);
});
