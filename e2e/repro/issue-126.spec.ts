import { expect, test } from "@playwright/test";

test("predict の定義外の誤答で、やり直せないのに「もう一度試して」と案内しない", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("1000000");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByRole("status")).toContainText("できました");
  await page.getByRole("button", { name: "次へ →" }).click();
  for (const [element, label] of [["資産", "増える"], ["負債", "増える"], ["純資産", "増える"], ["収益", "変わらない"], ["費用", "変わらない"]]) {
    await work.getByRole("combobox", { name: `${element}の予想`, exact: true }).selectOption({ label });
  }
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  const status = page.getByRole("status");
  await expect(status).toContainText("もう一歩");
  // 予想は 1 回限りで、回答後は選択肢が無効になり「予想して記帳する」も消える
  await expect(work.getByRole("combobox", { name: "資産の予想", exact: true })).toBeDisabled();
  await expect(work.getByRole("button", { name: "予想して記帳する" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "次へ →" })).toBeEnabled();
  await expect(status).not.toContainText("もう一度試して");
  await expect(status).toContainText("次へ進めます");
});
