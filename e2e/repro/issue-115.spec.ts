import { devices, expect, test, type Page } from "@playwright/test";

// Issue #115: 誤答の説明が長いと、下部パネルの内側スクロールの外へ「答えを見る」「次へ →」が押し出されていた

const { defaultBrowserType: _ignored, ...iPhone } = devices["iPhone 13"];
test.use(iPhone);

async function openWorkspace(page: Page) {
  // 幅が広い画面にはタブが無く、ワークスペースが最初から見えている
  const tab = page.getByRole("tab", { name: "ワークスペース" });
  if (await tab.isVisible()) await tab.click();
  return page.getByRole("region", { name: "ワークスペース" });
}

async function post(page: Page, debit: string, credit: string, amount = "1000000") {
  const work = await openWorkspace(page);
  await work.getByLabel("借方の科目1").fill(debit);
  await work.getByLabel("借方の金額1").fill(amount);
  await work.getByLabel("貸方の科目1").fill(credit);
  await work.getByLabel("貸方の金額1").fill(amount);
  await work.getByRole("button", { name: "記帳する" }).click();
}

async function wrongTwice(page: Page) {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click({ timeout: 15000 });
  const hint = page.getByRole("status").filter({ hasText: "もう一歩" });
  await post(page, "現金", "売上");
  await expect(hint).toBeVisible();
  await post(page, "資本金", "現金");
  await expect(page.getByRole("button", { name: "答えを見る" })).toBeVisible();
  // 結果の表示アニメーションが終わってから位置を測る
  await page.waitForTimeout(400);
}

test("390pxで2回間違えた後の「答えを見る」「次へ →」が画面内に見える", async ({ page }) => {
  await wrongTwice(page);
  await expect(page.getByRole("button", { name: "答えを見る" })).toBeInViewport();
  await expect(page.getByRole("button", { name: "次へ →" })).toBeInViewport();
});

test.describe("横向き", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("844×390で2回間違えた後の「答えを見る」「次へ →」が画面内に見える", async ({ page }) => {
    await wrongTwice(page);
    await expect(page.getByRole("button", { name: "答えを見る" })).toBeInViewport();
    await expect(page.getByRole("button", { name: "次へ →" })).toBeInViewport();
  });
});

test("390pxの仕分けボードで間違えた後も「次へ →」が画面内に見え、説明は内側でスクロールできる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  const next = page.getByRole("button", { name: "次へ →" });
  const solved = async () => {
    await expect(page.getByText("できました", { exact: true })).toBeVisible();
    await next.click();
  };
  await next.click({ timeout: 15000 });
  await post(page, "現金", "資本金");
  await solved();
  let work = await openWorkspace(page);
  for (const n of ["資産"]) await page.getByLabel(`${n}の予想`, { exact: true }).selectOption({ label: "変わらない" });
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await solved();
  await post(page, "現金", "借入金", "300000");
  await solved();
  await post(page, "現金", "売上", "80000");
  await solved();
  await post(page, "支払家賃", "現金", "50000");
  await solved();

  work = await openWorkspace(page);
  const board = work.getByRole("group", { name: "仕分けボード" });
  const put = async (account: string, bin: RegExp) => {
    await board.getByRole("button", { name: account, exact: true }).click();
    await board.getByRole("button", { name: bin }).click();
  };
  await put("現金", /^(?!.*純).*資産/);
  await put("備品", /費用/);
  await put("借入金", /収益/);
  await put("資本金", /純資産/);
  await put("売上", /収益/);
  await put("支払家賃", /費用/);
  await work.getByRole("button", { name: "確認する" }).click();

  const status = page.getByRole("status").filter({ hasText: "個の科目" });
  await expect(status.getByText("よくある思い込み:")).toHaveCount(2);
  await page.waitForTimeout(400);
  await expect(next).toBeInViewport();

  // 操作行を残すために説明が切り捨てられていないこと(末尾まで読める)
  const lastMisconception = status.getByText(/^見方:/).last();
  await lastMisconception.scrollIntoViewIfNeeded();
  await expect(lastMisconception).toBeInViewport();
  await expect(next).toBeInViewport();
});
