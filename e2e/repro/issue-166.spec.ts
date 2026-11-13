import { expect, test } from "@playwright/test";

// Issue #166: 入力の段で指示どおり入れても待ち文が消えるだけで、済んだことも次にどれを押すかも示されなかった

test("3/12で「次へ →」を押すと4/12へ進み、4/12・5/12は入れ終えると完了文が出てカードの「次へ」で進む", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry?tour=1");
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  const next = tour.getByRole("button", { name: "次へ", exact: true });
  const work = page.getByRole("region", { name: "ワークスペース" });
  const completed = tour.getByText("できました。このカードの「次へ」で進みます");

  await tour.getByRole("button", { name: "はじめる" }).click({ timeout: 15000 });
  await next.click();
  await expect(tour).toContainText("3 / 12");

  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(tour).toContainText("4 / 12");
  await expect(completed).toHaveCount(0);
  await expect(next).toBeDisabled();

  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("100000");
  await expect(completed).toBeVisible();
  await expect(tour).not.toContainText("借方に 現金100,000を入れてください");
  await expect(next).toBeEnabled();
  await next.click();

  await expect(tour).toContainText("5 / 12");
  await expect(completed).toHaveCount(0);
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await expect(completed).toBeVisible();
  await next.click();
  await expect(tour).toContainText("6 / 12");
});
