import { expect, test } from "@playwright/test";

// 正解直後の「次へ →」のダブルクリックで、説明だけのステップ(observe)を読まずに飛ばしていた
test("「次へ →」をダブルクリックしても1ステップだけ進む", async ({ page }) => {
  await page.goto("/units/cash-and-deposits/petty-cash");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ2 / 9")).toBeVisible();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("小口現金");
  await work.getByLabel("借方の金額1").fill("30000");
  await work.getByLabel("貸方の科目1").fill("当座預金");
  await work.getByLabel("貸方の金額1").fill("30000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "次へ →" }).dblclick();
  await expect(page.getByText("ステップ3 / 9")).toBeVisible();
  await expect(page.getByRole("region", { name: "ガイド" }).getByText("担当者の1週間")).toBeVisible();
});

// 最終手前のダブルクリックで、2回目が同じ位置に現れた最終ステップのリンクに当たり、まとめを見ないまま単元を出ていた
test("最終手前で「次へ →」をダブルクリックしても単元に留まる", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "done", enabled: true })));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/units/tutorial/first-entry");
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("100000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 4")).toBeVisible();

  await page.getByRole("button", { name: "次へ →" }).dblclick();
  await expect(page.getByText("ステップ4 / 4")).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(/\/units\/tutorial\/first-entry$/);
});
