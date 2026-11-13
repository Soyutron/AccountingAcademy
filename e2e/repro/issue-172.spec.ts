import { expect, test } from "@playwright/test";

// Issue #172: 最初の単元で開く純資産・資本金の短い定義と、費用の誤答の見方に、未定義の「株主」「発生主義」が出ていた

test("用語集の純資産と資本金の短い定義に株主を使わない", async ({ page }) => {
  await page.goto("/glossary");
  const search = page.getByPlaceholder(/検索/).first();
  await search.fill("純資産");
  await expect(page.getByText("資産から負債を引いた残り").first()).toBeVisible();
  await expect(page.getByText("株主のものといえる")).toHaveCount(0);
  await search.fill("資本金");
  await expect(page.getByText("持ち主が出した元手").first()).toBeVisible();
  await expect(page.getByText("会社の持ち主(株主)が出したお金")).toHaveCount(0);
});

test("ステップ3で費用が増えると予想したときの見方に発生主義が出ない", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click({ timeout: 15000 });
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();

  for (const n of ["資産", "負債", "純資産", "収益"]) await page.getByLabel(`${n}の予想`, { exact: true }).selectOption({ label: "変わらない" });
  await page.getByLabel("費用の予想", { exact: true }).selectOption({ label: "増える" });
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status.getByText(/^見方:/).first()).toContainText("お金を払った時ではなく");
  await expect(status).not.toContainText("発生主義");
});
