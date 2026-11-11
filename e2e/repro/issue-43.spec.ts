import { expect, test } from "@playwright/test";

// 全角数字・「円」付きの金額を受け付け、受け付けられない入力には理由を出す(Issue #43)
test("全角数字の金額でも記帳・確認でき、読めない金額には理由が出る", async ({ page }) => {
  const attemptPosts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/rest/v1/attempts")) attemptPosts.push(r.url());
  });
  await page.goto("/units/depreciation/straight-line");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const postButton = work.getByRole("button", { name: "記帳する" });
  await next.click();

  // 片側だけ: 無効のまま、足りない側を伝える
  await work.getByLabel("借方の科目1").fill("車両運搬具");
  await work.getByLabel("借方の金額1").fill("1200000");
  await expect(postButton).toBeDisabled();
  await expect(work.getByText("貸方にも科目と金額を入れると記帳できます。")).toBeVisible();

  // 読めない金額: 欄に理由を出す
  await work.getByLabel("借方の金額1").fill("120万");
  await expect(work.getByLabel("借方の金額1")).toHaveAttribute("aria-invalid", "true");
  await expect(work.getByText("半角の数字だけで入力してください(例: 100000)")).toBeVisible();

  await work.getByLabel("借方の金額1").fill("１２０００００");
  await work.getByLabel("貸方の科目1").fill("現金");
  await work.getByLabel("貸方の金額1").fill("１，２００，０００円");
  await postButton.click({ timeout: 3000 });
  await expect(page.getByText("できました", { exact: true })).toBeVisible();

  const slide = async (i: number, steps: number) => {
    const s = page.getByRole("slider").nth(i);
    await s.focus();
    await page.keyboard.press("Home");
    for (let k = 0; k < steps; k++) await page.keyboard.press("ArrowRight");
  };
  await next.click();
  await slide(2, 5);
  await next.click();
  await slide(1, 6);
  await next.click();
  await expect(page.getByText("ステップ5 / 9")).toBeVisible();

  const calc = work.getByPlaceholder("金額(円)");
  const confirm = work.getByRole("button", { name: "確認する" });
  const before = attemptPosts.length;
  await calc.fill("10万");
  await confirm.click();
  await expect(work.getByRole("status")).toHaveText(/半角/);
  await expect(calc).toHaveAttribute("aria-invalid", "true");
  // 読めない入力は誤答として数えない
  expect(attemptPosts).toHaveLength(before);

  await calc.fill("１０００００円");
  await confirm.click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
});
