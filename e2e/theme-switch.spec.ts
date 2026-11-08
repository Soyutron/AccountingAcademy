import { expect, test } from "@playwright/test";

// テーマと明るさの切り替え(docs/design-system.md 3.2)。選んだ設定が <html> に反映され、再読み込みしても保持されることを確かめる

test("テーマと明るさを切り替えると、再読み込み後も保持される", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "town-shop");

  await page.getByRole("button", { name: "テーマ" }).click();
  await page.getByRole("button", { name: /藍と朱/ }).click();
  await expect(html).toHaveAttribute("data-theme", "ai-shu");
  await page.getByRole("button", { name: "ダーク" }).click();
  await expect(html).toHaveAttribute("data-mode", "dark");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "ai-shu");
  await expect(html).toHaveAttribute("data-mode", "dark");
});
