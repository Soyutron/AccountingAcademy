import { expect, test } from "@playwright/test";

// 進捗の読み込みが失敗すると console.error だけで、画面は未着手の単元と区別できない
test("進捗の読み込みに失敗したら、その旨を画面で知らせる", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "done", enabled: true, seen: ["post", "predict", "classify", "calc", "tweak"] })));
  await page.goto("/units/bookkeeping-basics/five-elements");
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.getByRole("button", { name: "次へ →" }).first().click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  const progressSaved = page.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress") && r.request().method() === "POST" && r.ok());
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await progressSaved;

  await page.route("**/rest/v1/unit_progress?select=*", (route) => route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"boom"}' }));
  const failed = page.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress?select=") && r.status() === 500);
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await failed;
  await expect(page.getByText("ステップ1 / 10")).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: /読み込|進捗/ })).toBeVisible({ timeout: 5000 });

  // 障害が戻れば案内は消え、「続きから」が出る
  await page.unroute("**/rest/v1/unit_progress?select=*");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(page.getByRole("button", { name: /続きから/ })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: /読み込|進捗/ })).toHaveCount(0);
});
