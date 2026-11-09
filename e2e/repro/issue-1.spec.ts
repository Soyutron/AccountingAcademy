import { expect, test } from "@playwright/test";

// Issue #1: 同一ティックの連打で、同じ仕訳が押した回数だけ記帳されていた
test("「記帳する」「予想して記帳する」を連打しても仕訳は 1 件ずつ", async ({ page }) => {
  // attempts への insert を数える(1 回の正解につき 1 行)
  const inserts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/rest/v1/attempts")) inserts.push(r.postDataJSON()?.exercise_id);
  });
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 10")).toBeVisible();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("1000000");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); b.click(); });
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await expect(work.getByText("元手として現金 1,000,000 円をお店に出資した").filter({ visible: true })).toHaveCount(1);
  await expect(page.getByRole("region", { name: "結果" }).getByText("3,000,000")).toHaveCount(0);
  await expect.poll(() => inserts.length).toBe(1);

  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 3 / 10")).toBeVisible();
  for (const el of ["資産", "負債", "純資産", "収益", "費用"]) await work.getByLabel(`${el}の予想`, { exact: true }).selectOption("none");
  await work.getByRole("button", { name: "予想して記帳する" }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); b.click(); });
  await expect(page.getByRole("button", { name: "予想して記帳する" })).toHaveCount(0);
  await expect.poll(() => inserts.length).toBe(2);
  // 仕訳帳には post の 1 件と predict の 1 件だけが並ぶ
  await expect(work.getByText("元手として現金 1,000,000 円をお店に出資した").filter({ visible: true })).toHaveCount(1);
  // 遅れて届く重複がないことを確かめる
  await page.waitForTimeout(500);
  expect(inserts).toEqual(["bookkeeping-basics/five-elements#1", "bookkeeping-basics/five-elements#2"]);
});
