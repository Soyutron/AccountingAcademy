import { devices, expect, test, type Locator } from "@playwright/test";

const { defaultBrowserType: _ignored, ...iPhone } = devices["iPhone 13"];
test.use(iPhone);

// 高さを固定したまま折り返すと、切れない代わりに下の行へはみ出すので枠の中に収まることも見る
async function expectFullyReadable(short: Locator, line: Locator) {
  const { sw, cw } = await short.evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw + 1);
  const shortBox = (await short.boundingBox())!;
  const lineBox = (await line.boundingBox())!;
  expect(shortBox.y + shortBox.height).toBeLessThanOrEqual(lineBox.y + lineBox.height);
}

// Issue #201: 390pxで選んだ科目の一言説明が「…」で切れ、タップしても全文を読めなかった
test("スマホ幅で選んだ科目の説明が、金額の有無によらず切れない", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "今はしない" }).click({ timeout: 5000 }).catch(() => {});
  await page.getByRole("button", { name: "次へ →" }).first().click();
  await page.getByRole("tab", { name: "ワークスペース", exact: true }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  const line = work.locator('[data-journal-line="debit-0"]');

  await work.getByLabel("借方の科目1").fill("現金過不足");
  const short = line.getByText("帳簿の現金と実際の現金が合わないとき", { exact: false });
  await expect(short).toBeVisible();
  await expect(line.getByText("金額を入れてください")).toBeVisible();
  await expectFullyReadable(short, line);

  await work.getByLabel("借方の金額1").fill("100000");
  await expect(line.getByText("金額を入れてください")).toBeHidden();
  await expectFullyReadable(short, line);
});
