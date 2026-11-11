import { devices, expect, test } from "@playwright/test";

// Issue #114: 高さの低い画面のツアー7/12で、案内された「記帳する」が固定バーの裏に隠れ、見えている位置を押しても記帳されなかった

const { defaultBrowserType: _ignored, ...iPhone } = devices["iPhone 13"];
test.use(iPhone);

test("390pxのツアー7/12で、案内された「記帳する」が固定バーに隠れず、その位置を押すと記帳できる", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry?tour=1");
  const dialog = page.getByRole("dialog", { name: "チュートリアル" });
  const next = dialog.getByRole("button", { name: "次へ", exact: true });
  await dialog.getByRole("button", { name: "はじめる" }).click({ timeout: 15000 });
  await next.click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(dialog.getByText("チュートリアル4 / 12")).toBeVisible();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("100000");
  await next.click();
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await next.click();
  // 入力のclickが自動スクロールした位置を消し、ツアー自身が対象を出すことを確かめる
  await page.evaluate(() => window.scrollTo(0, 0));
  await next.click();
  await expect(dialog.getByText("チュートリアル7 / 12")).toBeVisible();
  await page.waitForTimeout(500);

  // click()は自動でスクロールして隠れを解消してしまうので、スクロールせずに中心の要素を調べて座標で押す
  const center = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "記帳する")!;
    const r = button.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    return { x, y, onTop: button.contains(document.elementFromPoint(x, y)) };
  });
  expect(center.onTop).toBe(true);

  await page.mouse.click(center.x, center.y);
  await expect(dialog.getByText("チュートリアル8 / 12")).toBeVisible();
  // 記帳の位置までのスクロールを結果タブへ持ち越さない(カードが現金の行に重ならないように)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
