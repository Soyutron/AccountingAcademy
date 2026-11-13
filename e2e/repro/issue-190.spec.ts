import { expect, test } from "@playwright/test";

// 本文やタブで使う語が用語集に項目として無く、検索しても定義に行き着けなかった(Issue #190)
const cases = [
  { query: "T 勘定", id: "t_account" },
  { query: "T勘定", id: "t_account" },
  { query: "総勘定元帳", id: "t_account" },
  { query: "決算", id: "closing" },
  { query: "逆仕訳", id: "reverse_entry" },
  { query: "仕入諸掛", id: "incidental_costs" },
  { query: "諸掛り", id: "incidental_costs" },
];

for (const { query, id } of cases) {
  test(`用語集で「${query}」を検索すると先頭に完全一致の項目が出る`, async ({ page }) => {
    await page.goto("/glossary");
    await page.getByLabel("用語を検索").fill(query);
    const exact = page.locator("section").filter({ has: page.getByRole("heading", { name: "一致する用語" }) });
    await expect(exact.locator("dl > div[id]").first()).toHaveAttribute("id", id, { timeout: 3000 });
  });
}

