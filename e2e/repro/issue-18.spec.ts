import { expect, test } from "@playwright/test";

// Issue #18: 正解した瞬間に短い紙吹雪を 1 回出し、「次へ →」を一度だけ強調する。復元時と reduced-motion では出さない

const solve = async (page: import("@playwright/test").Page) => {
  await page.goto("/units/tutorial/first-entry");
  await page.getByRole("dialog", { name: "チュートリアル" }).getByRole("button", { name: "スキップ" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("100000");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("100000");
  const posted = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/rest/v1/attempts"));
  await work.getByRole("button", { name: "記帳する" }).click();
  await posted;
};

test("正解すると紙吹雪が 1 回出て消え、「次へ →」が一度だけ強調される。復元では出ない", async ({ page }) => {
  await solve(page);
  const confetti = page.locator("[data-celebration]");
  const next = page.getByRole("button", { name: "次へ →" });
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await expect(confetti).toHaveCount(1);
  await expect(next).toHaveClass(/animate-next-pulse/);
  await expect(confetti).toHaveCount(0);
  await expect(next).not.toHaveClass(/animate-next-pulse/);
  await expect(next).toHaveAttribute("aria-disabled", "false");

  // 正解済みの状態を復元したときは出ない
  // スキップしたツアーは再訪で再び始まり、ツアー中は「続きから」が出ない(Issue #44)
  await page.reload();
  await page.getByRole("dialog", { name: "チュートリアル" }).getByRole("button", { name: "スキップ" }).click();
  await page.getByRole("button", { name: "続きから" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(confetti).toHaveCount(0);

  // 「← 前へ」→「次へ →」で戻っても出ない(達成状態の復元そのものは Issue #16 で別に直す)
  await page.getByRole("button", { name: "← 前へ" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 4")).toBeVisible();
  await page.waitForTimeout(300);
  await expect(confetti).toHaveCount(0);
});

test.describe("動きを減らす設定", () => {
  test.use({ reducedMotion: "reduce" });
  test("紙吹雪とパルスは出ず、「できました」と「次へ →」の有効化は従来どおり", async ({ page }) => {
    await solve(page);
    await expect(page.getByText("できました", { exact: true })).toBeVisible();
    await page.waitForTimeout(300);
    await expect(page.locator("[data-celebration]")).toHaveCount(0);
    const next = page.getByRole("button", { name: "次へ →" });
    await expect(next).not.toHaveClass(/animate-next-pulse/);
    await expect(next).toHaveAttribute("aria-disabled", "false");
  });
});
