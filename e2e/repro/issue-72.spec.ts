import { expect, test } from "@playwright/test";

// Issue #72: 学習中に気づいた誤りを、単元とステップの文脈つきで GitHub に伝えられるようにする
const REPO = "https://github.com/Soyutron/AccountingAcademy";

test("「誤りを報告」は単元のパスと表示中のステップ番号を埋めた Issue テンプレートを開く", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  const guide = page.getByRole("region", { name: "ガイド" });
  const report = guide.getByRole("link", { name: /誤りを報告/ });

  const unitParam = (href: string | null) => new URL(href!).searchParams.get("unit");
  const first = await report.getAttribute("href");
  expect(first!.startsWith(`${REPO}/issues/new?template=content-error.yml&unit=`)).toBe(true);
  expect(unitParam(first)).toBe("/units/bookkeeping-basics/five-elements ステップ 1");

  // ハイドレーション前のクリックは効かないので、進むまで押し直す(ステップ 2 は課題なので進みすぎない)
  await expect(async () => {
    await page.getByRole("button", { name: "次へ →" }).click();
    await expect(page.getByText("ステップ 2 /")).toBeVisible({ timeout: 1000 });
  }).toPass();
  expect(unitParam(await report.getAttribute("href"))).toBe("/units/bookkeeping-basics/five-elements ステップ 2");
});

test("「この単元を改善」はその単元の Markdown の GitHub 編集画面を開く", async ({ page }) => {
  await page.goto("/units/depreciation/straight-line");
  const improve = page.getByRole("region", { name: "ガイド" }).getByRole("link", { name: /この単元を改善/ });
  await expect(improve).toHaveAttribute("href", `${REPO}/edit/main/content/topics/depreciation/straight-line.md`);
});

test("どちらのリンクも新しいタブで開き、用途を読み上げられる", async ({ page }) => {
  await page.goto("/units/depreciation/straight-line");
  const guide = page.getByRole("region", { name: "ガイド" });
  for (const name of ["誤りを報告 (GitHub の Issue 作成画面を新しいタブで開く)", "この単元を改善 (GitHub の編集画面を新しいタブで開く)"]) {
    const link = guide.getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await link.focus();
    await expect(link).toBeFocused();
  }
});
