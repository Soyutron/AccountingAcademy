import { expect, test } from "@playwright/test";

// 返品と運賃で、運賃を誰が負担するかを書かないまま処理を教え、誤答の説明も運賃一般の性質のように言い切っていた
test("運賃をお店が負担する取引だと本文に書かれ、誤答の説明もその取引に限る", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const guide = page.getByRole("region", { name: "ガイド" });
  const next = page.getByRole("button", { name: "次へ →" }).first();
  const post = work.getByRole("button", { name: "記帳する" });
  const done = page.getByText("できました", { exact: true });
  const line = async (side: "借方" | "貸方", n: number, account: string, amount: string) => {
    await work.getByLabel(`${side}の科目 ${n}`).fill(account);
    await work.getByLabel(`${side}の金額 ${n}`).fill(amount);
  };

  await page.goto("/units/merchandise/returns-and-costs");
  await next.click();
  await expect(page.getByText("ステップ 2 / 8")).toBeVisible();
  await expect(guide).toContainText("負担");
  await line("借方", 1, "仕入", "52000");
  await line("貸方", 1, "買掛金", "50000");
  await work.getByRole("button", { name: "行を追加" }).nth(1).click();
  await line("貸方", 2, "現金", "2000");
  await post.click();
  await expect(done).toBeVisible();
  await next.click();
  await line("借方", 1, "買掛金", "10000");
  await line("貸方", 1, "仕入", "10000");
  await post.click();
  await expect(done).toBeVisible();
  await next.click();

  await expect(page.getByText("ステップ 4 / 8")).toBeVisible();
  await expect(guide).toContainText("負担");
  await line("借方", 1, "売掛金", "31500");
  await line("貸方", 1, "売上", "30000");
  await work.getByRole("button", { name: "行を追加" }).nth(1).click();
  await line("貸方", 2, "現金", "1500");
  await post.click();
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toContainText("この取引では");
  await expect(status).not.toContainText("運賃はお客さんから受け取るお金ではなく");
});
