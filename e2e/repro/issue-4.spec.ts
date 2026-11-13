import { expect, type Page, test } from "@playwright/test";

// Issue #4: 「← 前へ」で見直すとunit_progress.stepが戻り、達成済みのステップでも「次へ →」が無効になっていた

/** unit_progressへのupsert(POST)で保存されたstepを記録する */
function recordSavedSteps(page: Page): number[] {
  const saved: number[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/rest/v1/unit_progress")) saved.push(r.postDataJSON()?.step);
  });
  return saved;
}

async function reachStep3(page: Page) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
}

test("達成済みのステップに前へで戻っても次へは有効で、保存されるstepは戻らない", async ({ page }) => {
  const saved = recordSavedSteps(page);
  await reachStep3(page);
  await expect.poll(() => saved.at(-1)).toBe(2);

  await page.getByRole("button", { name: "← 前へ" }).click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await expect.poll(() => saved.length).toBe(3);
  expect(saved.at(-1)).toBe(2);
  const next = page.getByRole("button", { name: "次へ →" });
  await expect(next).not.toHaveAttribute("aria-disabled", "true");
  await next.click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
});

test("開き直して案内を押さずに次へを押しても、保存されるstepは戻らず、最初のステップに戻れば続きからが使える", async ({ page }) => {
  const saved = recordSavedSteps(page);
  await reachStep3(page);
  await expect.poll(() => saved.at(-1)).toBe(2);

  await page.evaluate(() => sessionStorage.clear());

  await page.reload();
  // 進捗の取得が終わるまで待ってから、案内ではなく「次へ →」を押す
  await expect(page.getByRole("button", { name: "続きから" })).toBeVisible();
  const before = saved.length;
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await expect.poll(() => saved.length).toBe(before + 1);
  expect(saved.at(-1)).toBe(2);
  // 進み始めたら案内は消え(学習中の表示領域を圧迫しない)、最初のステップに戻ると再び出る
  await expect(page.getByRole("button", { name: "続きから" })).toHaveCount(0);
  await page.getByRole("button", { name: "← 前へ" }).click();
  await expect(page.getByText("ステップ1 / 10")).toBeVisible();
  await page.getByRole("button", { name: "続きから" }).click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
});
