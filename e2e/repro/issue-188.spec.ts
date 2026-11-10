import { expect, test } from "@playwright/test";

// 現金で商品を仕入れる predict で「資産が増える」を選ぶと、誤解の判定が無く汎用文だけが出る
test("商品の仕入で資産が増えると予想したら、資産の思い違いに触れた説明を出す", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  await page.goto("/units/merchandise/three-account-method");
  await next.click();
  await work.getByLabel("借方の科目 1").fill("仕入");
  await work.getByLabel("借方の金額 1").fill("30000");
  await work.getByLabel("貸方の科目 1").fill("現金");
  await work.getByLabel("貸方の金額 1").fill("30000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ 3 / 7")).toBeVisible();
  const picks: [string, string][] = [["資産", "増える"], ["負債", "変わらない"], ["純資産", "減る"], ["収益", "変わらない"], ["費用", "増える"]];
  for (const [element, label] of picks) await work.getByLabel(`${element}の予想`, { exact: true }).selectOption({ label });
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toBeVisible();
  await expect(status).not.toContainText("予想と実際の動きが違いました");
  await expect(status).toContainText("資産は減ります");
});
