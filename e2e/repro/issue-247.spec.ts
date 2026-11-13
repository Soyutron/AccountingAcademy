import { expect, type Page, test } from "@playwright/test";

// Issue #247: 2回誤答して「答えを見る」が出た後、「← 前へ」→「次へ →」で戻ると誤答回数が0に戻り「答えを見る」が消えていた
const next = (page: Page) => page.getByRole("button", { name: "次へ →" }).or(page.getByRole("link", { name: "次へ →" })).first();

const wrongTwice = async (page: Page) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const post = async (debit: string, credit: string) => {
    await work.getByLabel("借方の科目1").fill(debit);
    await work.getByLabel("借方の金額1").fill("3000");
    await work.getByLabel("貸方の科目1").fill(credit);
    await work.getByLabel("貸方の金額1").fill("3000");
    const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/rest/v1/attempts"));
    await work.getByRole("button", { name: "記帳する" }).click();
    await expect(page.getByRole("status").filter({ hasText: "もう一歩" })).toBeVisible();
    await saved;
  };
  // 同じ答えの押し直しは1回と数える(Issue #15)ので、2回目は答えを変える
  await post("雑損", "現金");
  await post("現金", "現金過不足");
  await expect(page.getByRole("button", { name: "答えを見る" })).toBeVisible();
};

const backAndForth = async (page: Page) => {
  await page.getByRole("button", { name: "← 前へ" }).click();
  await expect(page.getByText("ステップ1 / 8")).toBeVisible();
  await next(page).click();
  await expect(page.getByText("ステップ2 / 8")).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await page.goto("/units/cash-and-deposits/cash-over-and-short");
  await page.getByRole("button", { name: "今はしない" }).click({ timeout: 15000 });
  await next(page).click();
  await expect(page.getByText("ステップ2 / 8")).toBeVisible();
  await wrongTwice(page);
});

test("前へ→次へで戻っても「答えを見る」が消えない", async ({ page }) => {
  await backAndForth(page);
  await expect(page.getByRole("button", { name: "答えを見る" })).toBeVisible();
});

test("「続きから」で引き継いだ誤答回数も、前へ→次へで消えない", async ({ page }) => {
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "続きから" }).click();
  await expect(page.getByText("ステップ2 / 8")).toBeVisible();
  await expect(page.getByRole("button", { name: "答えを見る" })).toBeVisible();
  await backAndForth(page);
  await expect(page.getByRole("button", { name: "答えを見る" })).toBeVisible();
});
