import { expect, test } from "@playwright/test";

// Issue #83: 単元を離れて同じタブで戻ると、ステップ1に戻り入力途中の仕訳も消えていた
const UNIT = "/units/bookkeeping-basics/five-elements";

test("入力途中で用語集へ行き、ブラウザの戻るで帰るとステップと入力が残る", async ({ page }) => {
  await page.goto(UNIT);
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await page.getByLabel("借方の科目1").fill("現金");
  await page.getByLabel("借方の金額1").fill("1000000");
  await page.getByRole("link", { name: "用語集" }).first().click();
  await page.waitForURL(/glossary/);
  await page.goBack();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await expect(page.getByLabel("借方の科目1")).toHaveValue("現金");
  // 欄を離れた時点で桁区切りに整形される
  await expect(page.getByLabel("借方の金額1")).toHaveValue("1,000,000");
  await expect(page.getByRole("button", { name: "続きから" })).toHaveCount(0);
});

test("記帳してステップ3へ進んでから用語集へ行き戻ると、ステップ3と記帳した仕訳が残る", async ({ page }) => {
  await page.goto(UNIT);
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByLabel("借方の科目1").fill("現金");
  await page.getByLabel("借方の金額1").fill("1000000");
  await page.getByLabel("貸方の科目1").fill("資本金");
  await page.getByLabel("貸方の金額1").fill("1000000");
  await page.getByRole("button", { name: "記帳する" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  await page.getByRole("link", { name: "用語集" }).first().click();
  await page.waitForURL(/glossary/);
  await page.goBack();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  await expect(page.locator("#pane-result").getByText("1,000,000").first()).toBeAttached();
});

test("入力途中でreloadしても、ステップと下書きが残る", async ({ page }) => {
  await page.goto(UNIT);
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByLabel("借方の科目1").fill("現金");
  await page.getByLabel("借方の金額1").fill("12345");
  await page.reload();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await expect(page.getByLabel("借方の科目1")).toHaveValue("現金");
  await expect(page.getByLabel("借方の金額1")).toHaveValue("12345");
});

test("DBの進捗がある状態でタブを開き直し、「続きから」を押す前に用語集へ行って戻っても、reloadしても「続きから」が残る", async ({ page }) => {
  await page.goto(UNIT);
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByLabel("借方の科目1").fill("現金");
  await page.getByLabel("借方の金額1").fill("1000000");
  await page.getByLabel("貸方の科目1").fill("資本金");
  await page.getByLabel("貸方の金額1").fill("1000000");
  await page.getByRole("button", { name: "記帳する" }).click();
  const saved = page.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress") && r.request().method() === "POST");
  await page.getByRole("button", { name: "次へ →" }).click();
  await saved;
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  const resume = page.getByRole("button", { name: "続きから" });
  await expect(resume).toBeVisible();
  await page.getByRole("link", { name: "用語集" }).first().click();
  await page.waitForURL(/glossary/);
  await page.goBack();
  await expect(resume).toBeVisible();
  await page.reload();
  await expect(resume).toBeVisible();
  await resume.click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
});

test("誤答を記帳してから用語集へ行き戻ると、誤解の説明が残り、同じ答えを押し直しても記録は増えない", async ({ page }) => {
  let attempts = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/rest/v1/attempts")) attempts++;
  });
  await page.goto(UNIT);
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByLabel("借方の科目1").fill("資本金");
  await page.getByLabel("借方の金額1").fill("1000000");
  await page.getByLabel("貸方の科目1").fill("現金");
  await page.getByLabel("貸方の金額1").fill("1000000");
  const recorded = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/rest/v1/attempts"));
  await page.getByRole("button", { name: "記帳する" }).click();
  await recorded;
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toBeVisible();
  await page.getByRole("link", { name: "用語集" }).first().click();
  await page.waitForURL(/glossary/);
  await page.goBack();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await expect(status).toBeVisible();
  await page.getByRole("button", { name: "記帳する" }).click();
  await page.waitForTimeout(500);
  expect(attempts).toBe(1);
});
