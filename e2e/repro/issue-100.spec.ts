import { expect, test } from "@playwright/test";

// 売上の発送運賃(返品と運賃 ステップ4)で運賃を丸ごと書き忘れると、誤解の説明が無く汎用文だけになっていた
test("運賃の書き忘れに、運賃に触れた説明を返す", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const post = work.getByRole("button", { name: "記帳する" });
  const line = async (side: "借方" | "貸方", n: number, account: string, amount: string) => {
    await work.getByLabel(`${side}の科目${n}`).fill(account);
    await work.getByLabel(`${side}の金額${n}`).fill(amount);
  };
  await page.goto("/units/merchandise/returns-and-costs");
  await next.click();
  await line("借方", 1, "仕入", "52000");
  await line("貸方", 1, "買掛金", "50000");
  await work.getByRole("button", { name: "行を追加" }).nth(1).click();
  await line("貸方", 2, "現金", "2000");
  await post.click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await line("借方", 1, "買掛金", "10000");
  await line("貸方", 1, "仕入", "10000");
  await post.click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ4 / 8")).toBeVisible();
  await line("借方", 1, "売掛金", "30000");
  await line("貸方", 1, "売上", "30000");
  await post.click();
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toBeVisible();
  await expect(status).not.toContainText("結果の表で何が動くはずか");
  await expect(status).toContainText("運賃");
});
