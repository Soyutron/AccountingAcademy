import { expect, test } from "@playwright/test";

const unit = "/units/bookkeeping-basics/five-elements";

test("過去の回答が1000件以上あっても、正解したステップを「続きから」で正解済みに戻せる", async ({ page }) => {
  await page.goto(unit);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  const saved = page.waitForRequest((r) => r.method() === "POST" && r.url().includes("/rest/v1/attempts"));
  await page.getByRole("button", { name: /^記帳する$/ }).click();
  const request = await saved;
  await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeVisible();
  const headers = await request.allHeaders();
  const userId = JSON.parse(request.postData()!).user_id as string;

  // この学習者が以前に積み上げた回答(別の単元)を1000件入れる
  const base = Date.now() - 30 * 24 * 3600 * 1000;
  const rows = Array.from({ length: 1000 }, (_, i) => ({
    user_id: userId,
    unit_id: "monkey/bulk",
    exercise_id: "monkey/bulk#x",
    correct: false,
    answer: {},
    content_version: "monkey",
    created_at: new Date(base + i * 1000).toISOString(),
  }));
  const res = await page.request.post(request.url().split("?")[0], {
    headers: { apikey: headers.apikey, authorization: headers.authorization, "content-type": "application/json", prefer: "return=minimal" },
    data: rows,
  });
  expect(res.status()).toBe(201);

  await page.evaluate(() => sessionStorage.clear());

  await page.reload();
  await page.getByRole("button", { name: "続きから" }).click();
  await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeVisible();
  await expect(page.getByRole("region", { name: "結果" }).getByText("資本金")).toBeVisible();
});
