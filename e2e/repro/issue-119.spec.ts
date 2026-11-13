import { expect, test } from "@playwright/test";

// Issue #119: 全単元の最後のステップはobserveで正解の瞬間が無く、単元完了の札が一度も出なかった
test("単元の最後のステップに着くと、単元完了の札が1枚だけ出る", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/units/bookkeeping-basics/five-elements");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const nextButton = page.getByRole("button", { name: "次へ →" });
  const next = () => nextButton.click({ timeout: 15000 });
  const ok = () => expect(page.getByRole("status").getByText("できました", { exact: true })).toBeVisible();
  const post = async (dr: string, cr: string, amount: string) => {
    await work.getByLabel("借方の科目1").fill(dr);
    await work.getByLabel("借方の金額1").fill(amount);
    await work.getByLabel("貸方の科目1").fill(cr);
    await work.getByLabel("貸方の金額1").fill(amount);
    await page.getByRole("button", { name: "記帳する" }).click();
    await ok();
    await next();
  };
  await next();
  await post("現金", "資本金", "1000000");
  for (const el of ["資産"]) {
    await page.getByLabel(`${el}の予想`, { exact: true }).selectOption({ label: "変わらない" });
  }
  await page.getByRole("button", { name: "予想して記帳する" }).click();
  await ok();
  await next();
  await post("現金", "借入金", "300000");
  await post("現金", "売上", "80000");
  await post("支払家賃", "現金", "50000");
  const board = page.getByRole("group", { name: "仕分けボード" });
  const boxes: [string, string][] = [["現金", "資産"], ["備品", "資産"], ["借入金", "負債"], ["資本金", "純資産"], ["売上", "収益"], ["支払家賃", "費用"]];
  for (const [account, box] of boxes) {
    await board.getByRole("button", { name: account, exact: true }).click();
    await board.getByRole("button", { name: `${box} ← ここに入れる`, exact: true }).click();
  }
  await page.getByRole("button", { name: "確認する" }).click();
  await ok();
  await next();
  for (const v of ["30000", "1330000"]) {
    await page.getByPlaceholder("金額(円)").fill(v);
    await page.getByRole("button", { name: "確認する" }).click();
    await ok();
    await next();
  }

  await expect(page.getByText("ステップ10 / 10")).toBeVisible();
  const burst = page.locator("[data-celebration]");
  await expect(burst.getByText("この単元を最後までやりきりました")).toHaveCount(1, { timeout: 4000 });
  await expect(burst.getByText("次のステップへ進めます")).toHaveCount(0);

  // 前へ戻って着き直しても、同じセッションでは繰り返さない
  await expect(burst).toHaveCount(0, { timeout: 5000 });
  await page.getByRole("button", { name: "← 前へ" }).click();
  await nextButton.click();
  await expect(page.getByText("ステップ10 / 10")).toBeVisible();
  await page.waitForTimeout(300);
  await expect(burst).toHaveCount(0);
});
