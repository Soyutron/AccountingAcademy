import { expect, test } from "@playwright/test";

// Issue #22: 返品ステップで「買掛金 / 現金」と書くと、右の誤り(仕入で取り消す)を指す説明と誤解が出る
test("仕入の返品で右を現金にした誤答に、右を直す説明が出る", async ({ page }) => {
  await page.goto("/units/merchandise/returns-and-costs");
  const work = page.getByRole("region", { name: "ワークスペース" });
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
  };
  await page.getByRole("button", { name: "次へ →" }).click();
  await post([["仕入", 52000]], [["買掛金", 50000], ["現金", 2000]]);
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 8")).toBeVisible();
  await post([["買掛金", 10000]], [["現金", 10000]]);
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toBeVisible();
  // 既に書けている「買掛金を減らす」ではなく、右の仕入に触れる
  await expect(status).toContainText("仕入");
  await expect(status).not.toContainText("減るのは買掛金");
  await expect(page.getByText("よくある思い込み: 返品を新しい取引として記録")).toBeVisible();
});
