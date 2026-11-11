import { expect, test } from "@playwright/test";

// 記帳済みのステップへ「← 前へ」で戻ると、後のステップの仕訳まで「このステップで動いた要素」に合算される
test("前のステップに戻ったとき、影響はそのステップの仕訳だけ", async ({ page }) => {
  await page.goto("/units/merchandise/credit-transactions");
  await page.getByRole("button", { name: "今はしない" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  const result = page.getByRole("region", { name: "結果" });
  await work.getByLabel("借方の科目1").fill("仕入");
  await work.getByLabel("借方の金額1").fill("40000");
  await work.getByLabel("貸方の科目1").fill("買掛金");
  await work.getByLabel("貸方の金額1").fill("40000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  const impact = result.locator("section", { hasText: "このステップで動いた要素" });
  const atPost = (await impact.innerText()).replace(/\s+/g, " ");

  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 8")).toBeVisible();
  const answers = { 資産: "increase", 負債: "none", 純資産: "increase", 収益: "increase", 費用: "none" };
  for (const [el, v] of Object.entries(answers)) await work.getByLabel(`${el}の予想`, { exact: true }).selectOption(v);
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "← 前へ" }).click();
  await expect(page.getByText("ステップ2 / 8")).toBeVisible();
  // 記帳したときと同じ影響(負債 ▲40,000・純資産 ▼40,000・費用 ▲40,000)だけが出る
  await expect.poll(async () => (await impact.innerText()).replace(/\s+/g, " ")).toBe(atPost);
  await expect(impact.getByText("収益")).toHaveCount(0);

  await page.getByRole("button", { name: "← 前へ" }).click();
  await expect(page.getByText("ステップ1 / 8")).toBeVisible();
  await expect(impact).toHaveCount(0);
});
