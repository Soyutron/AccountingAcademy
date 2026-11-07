import { expect, test } from "@playwright/test";

async function post(page: import("@playwright/test").Page) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("1000000");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
}

// Issue #2: 「← 前へ」で記帳済みの post ステップに戻って再記帳すると、仕訳が二重に記帳されていた。
// #16 以降は戻ったステップが達成状態で復元され(読み取り専用、「記帳する」は出ない)、再記帳そのものが起きない
test("前へで戻っても仕訳は二重にならない", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 10")).toBeVisible();
  await post(page);
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 3 / 10")).toBeVisible();
  await page.getByRole("button", { name: "← 前へ" }).click();
  await expect(page.getByText("ステップ 2 / 10")).toBeVisible();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await expect(work.getByRole("button", { name: "記帳する" })).toHaveCount(0);
  await expect(work.getByText("元手として現金 1,000,000 円をお店に出資した")).toHaveCount(1);
  await expect(page.getByRole("region", { name: "結果" }).getByText("2,000,000")).toHaveCount(0);
});
