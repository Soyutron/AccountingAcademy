import { test, expect } from "@playwright/test";

// Issue #5: 用語集の「関連」に同じ用語が 2 回並び、React が重複 key の console.error を出す
test("用語集の関連リンクに同じ用語が重複せず、重複 key の console.error も出ない", async ({ page }) => {
  const dupKeyErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && /same key/.test(msg.text())) dupKeyErrors.push(msg.text());
  });

  await page.goto("/glossary");
  await expect(page.getByRole("heading", { name: "用語集" })).toBeVisible();

  const asset = page.locator("#asset");
  const relatedLinks = asset.locator("a[href='#liability']");
  await expect(relatedLinks).toHaveCount(1);

  const duplicated = await page.evaluate(() =>
    [...document.querySelectorAll("dd p")]
      .filter((p) => p.textContent?.startsWith("関連"))
      .map((p) => {
        const hrefs = [...p.querySelectorAll("a")].map((a) => a.getAttribute("href"));
        return { id: p.closest("div[id]")?.id, dups: hrefs.filter((h, i) => hrefs.indexOf(h) !== i) };
      })
      .filter((x) => x.dups.length > 0),
  );
  expect(duplicated).toEqual([]);
  expect(dupKeyErrors).toEqual([]);
});

// 用語ポップオーバーの「もっと見る」でも同じ用語が二重に出る
test("用語ポップオーバーの関連に同じ用語が重複しない", async ({ page }) => {
  await page.goto("/units/receivables-and-payables/other-receivables-and-payables");
  await page.getByRole("button", { name: "売掛金" }).first().click();
  await page.getByRole("button", { name: "もっと見る" }).click();
  const related = await page.getByText(/^関連:/).first().textContent();
  const names = (related ?? "").replace(/^関連:\s*/, "").split("、");
  expect(new Set(names).size).toBe(names.length);
});
