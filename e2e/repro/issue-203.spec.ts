import { expect, test } from "@playwright/test";

const unit = "/units/bookkeeping-basics/five-elements";

test("tutorial-state の seen が配列でなくても、課題の初出案内が出るステップで画面が落ちない", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(unit);
  await page.evaluate(() => localStorage.setItem("tutorial-state", '{"seen":null}'));
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("1000000");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("1000000");
  await page.getByRole("button", { name: /^記帳する$/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 3 / 10")).toBeVisible();
  expect(errors).toEqual([]);
});
