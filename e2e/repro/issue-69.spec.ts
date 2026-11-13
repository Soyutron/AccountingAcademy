import { expect, test } from "@playwright/test";

// 初回バナーはまだ何も記録していない学習者だけに出す。記帳したことがあれば、どの単元でも「初めてですか?」と聞かない

const UNIT = "/units/bookkeeping-basics/five-elements";

test("記帳したことのある学習者には、別の単元でも開き直した単元でも初回バナーが出ない", async ({ page }) => {
  await page.goto(UNIT);
  const banner = page.getByRole("note").filter({ hasText: "初めてですか" });
  await expect(banner).toBeVisible();

  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByLabel("借方の科目1").fill("現金");
  await page.getByLabel("借方の金額1").fill("1000000");
  await page.getByLabel("貸方の科目1").fill("資本金");
  await page.getByLabel("貸方の金額1").fill("1000000");
  await page.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeVisible();
  const saved = page.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress") && r.request().method() === "POST");
  await page.getByRole("button", { name: "次へ →" }).click();
  await saved;

  // 進捗の読み込みを待ってから確かめる。サーバー描画の時点ではどちらの実装でもバナーは無い
  const loaded = page.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress") && r.request().method() === "GET");
  await page.goto("/units/merchandise/three-account-method");
  await loaded;
  await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
  await expect(banner).toHaveCount(0);

  // 同じタブではsessionStorageから戻るので、タブを開き直したときのDBの経路を確かめる
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(UNIT);
  const guide = page.getByRole("region", { name: "ガイド" });
  await expect(guide.getByText(/前回はステップ\d+まで進みました/)).toBeVisible();
  await expect(guide.getByRole("note").filter({ hasText: "初めてですか" })).toHaveCount(0);
});
