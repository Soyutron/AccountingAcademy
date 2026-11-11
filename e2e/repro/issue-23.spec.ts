import { expect, test } from "@playwright/test";

// Issue #23: calc「今月の仕入」で、損益計算書の累計132,000を答えると、累計だと分かる説明が出る
test("今月の仕入に損益計算書の132,000を答えると、先月分を含むと説明される", async ({ page }) => {
  await page.goto("/units/merchandise/returns-and-costs");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = () => page.getByRole("button", { name: "次へ →" }).click();
  const post = async (d: [string, number][], c: [string, number][]) => {
    for (const [side, lines] of [["借方", d], ["貸方", c]] as const) {
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) await work.getByRole("button", { name: "行を追加" }).nth(side === "借方" ? 0 : 1).click();
        await work.getByLabel(`${side}の科目${i + 1}`).fill(lines[i][0]);
        await work.getByLabel(`${side}の科目${i + 1}`).press("Escape");
        await work.getByLabel(`${side}の金額${i + 1}`).fill(String(lines[i][1]));
      }
    }
    await work.getByRole("button", { name: "記帳する" }).click();
    await expect(page.getByText("できました", { exact: true })).toBeVisible();
  };
  await next();
  await post([["仕入", 52000]], [["買掛金", 50000], ["現金", 2000]]);
  await next();
  await post([["買掛金", 10000]], [["仕入", 10000]]);
  await next();
  await post([["売掛金", 30000], ["発送費", 1500]], [["売上", 30000], ["現金", 1500]]);
  await next();
  await post([["売上", 5000]], [["売掛金", 5000]]);
  await next();
  await expect(page.getByText("ステップ6 / 8")).toBeVisible();
  await page.getByPlaceholder("金額(円)").fill("132000");
  await page.getByRole("button", { name: "確認する" }).click();
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toBeVisible();
  await expect(status).not.toContainText("まだ合っていません");
});
