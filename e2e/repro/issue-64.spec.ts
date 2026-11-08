import { test, expect } from "@playwright/test";

test("predict で資産と費用を外すと、費用の誤解にも触れる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "今はしない" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("1000000");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  const sel = (n: string, v: string) => page.getByLabel(`${n}の予想`, { exact: true }).selectOption({ label: v });
  await sel("資産", "減る");
  await sel("負債", "変わらない");
  await sel("純資産", "変わらない");
  await sel("収益", "変わらない");
  await sel("費用", "増える");
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  const status = page.getByRole("status");
  await expect(status).toContainText("もう一歩");
  await expect(status).toContainText("資産として増えました");
  // 費用を外したことへの説明も出る
  await expect(status).toContainText("払った時点では費用にならず");
  // 外した要素それぞれの誤解も出る
  await expect(status.getByText("よくある思い込み:")).toHaveCount(2);
});
