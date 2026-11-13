import { expect, test, type Page } from "@playwright/test";

async function fill(page: Page, debit: [string, number], credit: [string, number]) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill(debit[0]);
  await work.getByLabel("借方の金額1").fill(String(debit[1]));
  await work.getByLabel("貸方の科目1").fill(credit[0]);
  await work.getByLabel("貸方の金額1").fill(String(credit[1]));
  await work.getByRole("button", { name: "記帳する" }).click();
}

test("現金過不足の単元で、雑益への取り違えと費用の向きの予想違いに説明が出る", async ({ page }) => {
  await page.goto("/units/cash-and-deposits/cash-over-and-short");
  await page.getByRole("button", { name: "今はしない" }).click();
  const next = () => page.getByRole("button", { name: "次へ →" }).click();
  const wrong = page.getByRole("status").filter({ hasText: "もう一歩" });
  await next();
  await fill(page, ["現金過不足", 3000], ["現金", 3000]);
  await expect(page.getByRole("status").getByText("できました")).toBeVisible();
  await next();
  // 現金過不足は仮勘定なので、ステップ3は費用と純資産だけを問う(Issue #191)
  for (const k of ["純資産", "費用"]) await page.getByLabel(`${k}の予想`, { exact: true }).selectOption({ label: "減る" });
  await page.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(wrong).toBeVisible();
  await expect(wrong).not.toContainText("まだ合っていません");
  await next();
  await page.getByPlaceholder("金額(円)").fill("1000");
  await page.getByRole("button", { name: "確認する" }).click();
  await expect(page.getByRole("status").getByText("できました")).toBeVisible();
  await next();
  await fill(page, ["現金過不足", 1000], ["雑益", 1000]);
  await expect(wrong).toBeVisible();
  await expect(wrong).not.toContainText("まだ合っていません");
});
