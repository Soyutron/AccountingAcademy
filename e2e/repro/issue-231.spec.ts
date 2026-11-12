import { expect, test } from "@playwright/test";

// 失敗した回答はメモリ上で持ち越して次の保存で再送するので、再読み込みを勧めると再送待ちの回答を失わせる
test("保存エラーの案内は再読み込みを勧めず、そのまま続ければ回答が再送される", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).first().click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await expect(work.getByLabel("借方の科目1")).toBeVisible();

  let fail = true;
  await page.route("**/rest/v1/attempts*", (route) =>
    fail && route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await page.getByRole("button", { name: "記帳する" }).first().click();

  await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeVisible();
  const alert = page.getByRole("alert").filter({ hasText: "保存エラー" });
  await expect(alert).toBeVisible();
  await expect(alert).not.toContainText("再読み込み");

  fail = false;
  const resent = page.waitForResponse(
    (r) => r.url().includes("/rest/v1/attempts") && r.request().method() === "POST" && r.ok(),
  );
  await page.getByRole("button", { name: "次へ →" }).first().click();
  await resent;
  await expect(alert).toHaveCount(0);
});
