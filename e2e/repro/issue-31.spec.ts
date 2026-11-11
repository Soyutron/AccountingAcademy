import { expect, test } from "@playwright/test";

// Issue #31: テーマ最後の単元でも、ふりかえりから次のテーマの最初の単元へ進める。テーマ内の次はそのまま
const cases = [
  ["/units/receivables-and-payables/temporary-and-deposits", "/units/depreciation/what-is-depreciation"],
  ["/units/cash-and-deposits/petty-cash", "/units/receivables-and-payables/loans"],
  ["/units/merchandise/three-account-method", "/units/merchandise/credit-transactions"],
] as const;

for (const [from, to] of cases) {
  test(`${from}のふりかえりに次の単元${to}へのリンクがある`, async ({ page }) => {
    await page.goto(from);
    await expect(page.getByRole("region", { name: "ワークスペース" })).toBeVisible();
    // 次の単元リンクは最終ステップでしか描画されないので、HTMLに埋め込まれたIdeShellのprops(next)で確かめる。
    // RSCペイロード内では引用符がエスケープされている
    const html = await page.content();
    const id = to.replace("/units/", "");
    expect(html).toMatch(new RegExp(`\\\\?"next\\\\?":\\{\\\\?"id\\\\?":\\\\?"${id}\\\\?"`));
  });
}
