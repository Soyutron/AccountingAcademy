import { expect, test } from "@playwright/test";

// 動的ルートの notFound() でも、選んだテーマとモードが 404 ページに反映される

for (const path of ["/units/nope/nope", "/topics/nope", "/paths/nope"]) {
  test(`${path} で保存したテーマとダークモードが保たれる`, async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("theme", "ai-shu");
      localStorage.setItem("mode", "dark");
    });
    const scriptWarnings: string[] = [];
    page.on("console", (m) => {
      if (m.text().includes("Encountered a script tag")) scriptWarnings.push(m.text());
    });
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "ai-shu");

    // 切り替え UI の選択状態も、適用されたテーマに揃う
    await page.getByRole("button", { name: "テーマ" }).click();
    await expect(page.getByRole("button", { name: /藍と朱/ })).toHaveAttribute("aria-pressed", "true");
    expect(scriptWarnings).toEqual([]);
  });
}

// 通常のページは JS の読み込みを待たず、<head> のインラインスクリプトだけで反映される(ちらつき防止)
test("JS バンドルが無くてもインラインスクリプトでテーマとモードが反映される", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("theme", "ai-shu");
    localStorage.setItem("mode", "dark");
  });
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ai-shu");
});

test("通常のページで hydration の不一致が報告されない", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && /hydrat/i.test(m.text())) errors.push(m.text());
  });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("theme", "ai-shu");
    localStorage.setItem("mode", "dark");
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
  await page.getByRole("button", { name: "テーマ" }).click();
  await expect(page.getByRole("button", { name: /藍と朱/ })).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});
