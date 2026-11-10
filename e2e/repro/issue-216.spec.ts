import { expect, test } from "@playwright/test";

// 返品と運賃のステップ 2〜4 で、運賃と返品の扱いを取り違えた誤答に汎用文だけが出ていた
test("運賃と返品の取り違えに、汎用文ではなく説明を返す", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const post = work.getByRole("button", { name: "記帳する" });
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  const line = async (side: "借方" | "貸方", n: number, account: string, amount: string) => {
    await work.getByLabel(`${side}の科目 ${n}`).fill(account);
    await work.getByLabel(`${side}の金額 ${n}`).fill(amount);
  };
  const wrong = async (word: string) => {
    await post.click();
    await expect(status).toContainText(word);
    await expect(status).not.toContainText("結果の表で何が動くはずか");
  };
  await page.goto("/units/merchandise/returns-and-costs");
  await next.click();
  await line("借方", 1, "仕入", "52000");
  await line("貸方", 1, "買掛金", "52000");
  await wrong("運賃");
  await line("貸方", 1, "買掛金", "50000");
  await work.getByRole("button", { name: "行を追加" }).nth(1).click();
  await line("貸方", 2, "現金", "2000");
  await post.click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await line("借方", 1, "買掛金", "10000");
  await line("貸方", 1, "繰越商品", "10000");
  await wrong("返品");
  await line("貸方", 1, "仕入", "10000");
  await post.click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ 4 / 8")).toBeVisible();
  await line("借方", 1, "売掛金", "31500");
  await line("貸方", 1, "売上", "31500");
  await wrong("運賃");
  await line("借方", 1, "売掛金", "28500");
  await work.getByRole("button", { name: "行を追加" }).nth(0).click();
  await line("借方", 2, "発送費", "1500");
  await line("貸方", 1, "売上", "30000");
  await wrong("引かず");
});
