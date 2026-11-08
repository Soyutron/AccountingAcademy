import { expect, test } from "@playwright/test";

// Issue #58: 小切手で前渡しするのに本文が「金庫から」と書き、貸方を現金にする誤り(check_is_cash)を誘っていた
test("小口現金ステップ 2 の本文が、お金の出どころを貸方と同じ当座預金と書く", async ({ page }) => {
  await page.goto("/units/cash-and-deposits/petty-cash");
  await page.getByRole("button", { name: "次へ →" }).first().click();
  await expect(page.getByText("ステップ 2 / 9")).toBeVisible();

  const guide = page.getByRole("region", { name: "ガイド" });
  await expect(guide).not.toContainText("金庫から担当者の手元へ");
  await expect(guide).toContainText("当座預金から担当者の手元へ");
});
