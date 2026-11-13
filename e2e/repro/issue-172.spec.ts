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

test("備品を費用と取り違えたときの見方に発生主義が出ない", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/units/bookkeeping-basics/five-elements");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = () => page.getByRole("button", { name: "次へ →" }).click({ timeout: 15000 });
  const post = async (dr: string, cr: string, amount: string) => {
    await work.getByLabel("借方の科目1").fill(dr);
    await work.getByLabel("借方の金額1").fill(amount);
    await work.getByLabel("貸方の科目1").fill(cr);
    await work.getByLabel("貸方の金額1").fill(amount);
    await work.getByRole("button", { name: "記帳する" }).click();
    await expect(page.getByRole("status").getByText("できました", { exact: true })).toBeVisible();
    await next();
  };
  await next();
  await post("現金", "資本金", "1000000");
  await work.getByLabel("資産の予想", { exact: true }).selectOption({ label: "変わらない" });
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await next();
  await post("現金", "借入金", "300000");
  await post("現金", "売上", "80000");
  await post("支払家賃", "現金", "50000");
  // ステップ7の仕分けで備品を費用に入れる(ステップ3は資産だけを問うので費用の誤答はここで起こす。Issue #170)
  const board = work.getByRole("group", { name: "仕分けボード" });
  const boxes: [string, string][] = [["現金", "資産"], ["備品", "費用"], ["借入金", "負債"], ["資本金", "純資産"], ["売上", "収益"], ["支払家賃", "費用"]];
  for (const [account, box] of boxes) {
    await board.getByRole("button", { name: account, exact: true }).click();
    await board.getByRole("button", { name: `${box} ← ここに入れる`, exact: true }).click();
  }
  await work.getByRole("button", { name: "確認する" }).click();
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status.getByText(/^見方:/).first()).toContainText("お金を払った時ではなく");
  await expect(status).not.toContainText("発生主義");
});
