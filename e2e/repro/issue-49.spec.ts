import { expect, test } from "@playwright/test";

// Issue #49: tweakを達成してreload →「続きから」で戻ると、スライダーが初期値で「できました」も無いのに「次へ →」だけ有効だった
test("tweakの達成後にreloadしても、続きからで達成時の値とできましたが戻る", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const done = page.getByRole("status").filter({ hasText: "できました" });
  const attempt = (id: string) => page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/rest/v1/attempts") && r.request().postDataJSON()?.exercise_id === id);
  const resume = async () => {
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    // 進捗の取得は非同期なので、案内が出るまで待つ
    await page.getByRole("button", { name: "続きから" }).click();
  };

  await page.goto("/units/depreciation/straight-line");
  await next.click();
  await work.getByLabel("借方の科目1").fill("車両運搬具");
  await work.getByLabel("借方の金額1").fill("1200000");
  await work.getByLabel("貸方の科目1").fill("現金");
  await work.getByLabel("貸方の金額1").fill("1200000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await next.click();

  const lifeSaved = attempt("depreciation/straight-line#2");
  await page.getByRole("slider", { name: /耐用年数/ }).fill("6");
  await expect(done).toBeVisible();
  await lifeSaved;

  await resume();
  await expect(page.getByText("ステップ3 / 9")).toBeVisible();
  await expect(page.getByRole("slider", { name: /耐用年数/ })).toHaveValue("6");
  await expect(done).toBeVisible();
  await expect(next).not.toHaveAttribute("aria-disabled", "true");

  // ステップ4(残存価額)も同じく達成時の値で戻る
  await next.click();
  await expect(page.getByText("ステップ4 / 9")).toBeVisible();
  const residualSaved = attempt("depreciation/straight-line#3");
  await page.getByRole("slider", { name: /残存価額/ }).fill("300000");
  await expect(done).toBeVisible();
  await residualSaved;

  await resume();
  await expect(page.getByText("ステップ4 / 9")).toBeVisible();
  await expect(page.getByRole("slider", { name: /残存価額/ })).toHaveValue("300000");
  await expect(done).toBeVisible();
  await expect(next).not.toHaveAttribute("aria-disabled", "true");
});
