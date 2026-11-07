import { expect, test } from "@playwright/test";

// Issue #15: 誤答のまま「記帳する」をダブルクリックすると押した回数だけ誤答が記録され、1 回で「答えを見る」が出ていた
test("誤答をダブルクリックしても 1 回の回答として数え、答えを変えれば次の回答として数える", async ({ page }) => {
  const inserts: boolean[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/rest/v1/attempts")) inserts.push(r.postDataJSON()?.correct);
  });
  await page.goto("/units/receivables-and-payables/loans");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 9")).toBeVisible();
  const work = page.getByRole("region", { name: "ワークスペース" });
  const reveal = page.getByRole("button", { name: "答えを見る" });
  // 貸借を逆にした誤答
  await work.getByLabel("借方の科目 1").fill("普通預金");
  await work.getByLabel("借方の金額 1").fill("100000");
  await work.getByLabel("貸方の科目 1").fill("貸付金");
  await work.getByLabel("貸方の金額 1").fill("100000");
  await work.getByRole("button", { name: "記帳する" }).dblclick();
  await expect(page.getByRole("status").filter({ hasText: "もう一歩" })).toBeVisible();
  await expect(reveal).toHaveCount(0);
  await expect.poll(() => inserts.length).toBe(1);
  // 同じ答えのまま押し直しても数えない
  await work.getByRole("button", { name: "記帳する" }).click();
  await page.waitForTimeout(300);
  expect(inserts.length).toBe(1);
  await expect(reveal).toHaveCount(0);

  // 答えを変えて間違えると 2 回目として数え、「答えを見る」が出る
  await work.getByLabel("貸方の金額 1").fill("50000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect.poll(() => inserts.length).toBe(2);
  await expect(reveal).toBeVisible();
  expect(inserts).toEqual([false, false]);
});
