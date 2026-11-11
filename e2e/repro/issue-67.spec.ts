import { expect, test } from "@playwright/test";

// 一時的な保存失敗(オフライン・5xx)の後、次の保存で失敗した記帳を再送し、成功したら「保存エラー」は消える
test("保存が一度失敗しても、復帰後の保存で記帳が再送され保存エラーは消える", async ({ page, context }) => {
  await page.goto("/units/cash-and-deposits/petty-cash");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ2 / 9")).toBeVisible();

  let fail = true;
  await context.route("**/rest/v1/attempts*", (r) =>
    fail ? r.fulfill({ status: 500, contentType: "application/json", body: '{"message":"boom"}' }) : r.continue(),
  );
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("小口現金");
  await work.getByLabel("借方の金額1").fill("30000");
  await work.getByLabel("貸方の科目1").fill("当座預金");
  await work.getByLabel("貸方の金額1").fill("30000");
  await work.getByRole("button", { name: "記帳する" }).click();
  const alert = page.getByRole("alert").filter({ hasText: "保存エラー" });
  await expect(alert).toBeVisible();

  fail = false;
  const resent = page.waitForResponse((r) => r.url().includes("/rest/v1/attempts") && r.request().method() === "POST" && r.ok());
  const saved = page.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress") && r.ok());
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 9")).toBeVisible();
  await Promise.all([resent, saved]);
  await expect(alert).toHaveCount(0);
});

test("再送も失敗している間は、進捗の保存が成功しても保存エラーを消さない", async ({ page, context }) => {
  await page.goto("/units/cash-and-deposits/petty-cash");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ2 / 9")).toBeVisible();

  await context.route("**/rest/v1/attempts*", (r) =>
    r.fulfill({ status: 500, contentType: "application/json", body: '{"message":"boom"}' }),
  );
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("小口現金");
  await work.getByLabel("借方の金額1").fill("30000");
  await work.getByLabel("貸方の科目1").fill("当座預金");
  await work.getByLabel("貸方の金額1").fill("30000");
  await work.getByRole("button", { name: "記帳する" }).click();
  const alert = page.getByRole("alert").filter({ hasText: "保存エラー" });
  await expect(alert).toBeVisible();

  const saved = page.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress") && r.ok());
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 9")).toBeVisible();
  await saved;
  await expect(alert).toBeVisible();
});
