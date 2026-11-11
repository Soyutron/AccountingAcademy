import { expect, test } from "@playwright/test";

// 別タブのlocalStorageの変更が、開いたままのタブの表示とメニューに反映される

test("別タブで変えたテーマと明るさが、開いたままのタブに反映される", async ({ context }) => {
  const stale = await context.newPage();
  await stale.goto("/");
  await expect(stale.getByRole("button", { name: "テーマ" })).toBeVisible();
  const other = await context.newPage();
  await other.goto("/");

  await other.getByRole("button", { name: "テーマ" }).click();
  await other.getByRole("button", { name: /藍と朱/ }).click();
  await other.getByRole("button", { name: "ダーク" }).click();
  await expect(other.locator("html")).toHaveAttribute("data-theme", "ai-shu");

  await stale.bringToFront();
  await expect(stale.locator("html")).toHaveAttribute("data-theme", "ai-shu");
  await expect(stale.locator("html")).toHaveAttribute("data-mode", "dark");

  await stale.getByRole("button", { name: "テーマ" }).click();
  await expect(stale.getByRole("button", { name: /藍と朱/ })).toHaveAttribute("aria-pressed", "true");
  await expect(stale.getByRole("button", { name: "ダーク" })).toHaveAttribute("aria-pressed", "true");
});

test("別タブでlocalStorageを消すと、開いたままのタブも既定のテーマと明るさに戻る", async ({ context }) => {
  const stale = await context.newPage();
  await stale.emulateMedia({ colorScheme: "light" });
  await stale.goto("/");
  await stale.evaluate(() => {
    localStorage.setItem("theme", "ai-shu");
    localStorage.setItem("mode", "dark");
  });
  await stale.reload();
  await expect(stale.locator("html")).toHaveAttribute("data-theme", "ai-shu");
  await expect(stale.getByRole("button", { name: "テーマ" })).toBeVisible();

  const other = await context.newPage();
  await other.goto("/");
  await other.evaluate(() => localStorage.clear());

  await stale.bringToFront();
  await expect(stale.locator("html")).toHaveAttribute("data-theme", "town-shop");
  await expect(stale.locator("html")).toHaveAttribute("data-mode", "light");

  await stale.getByRole("button", { name: "テーマ" }).click();
  await expect(stale.getByRole("button", { name: /街の小さな会社/ })).toHaveAttribute("aria-pressed", "true");
  await expect(stale.getByRole("button", { name: "自動" })).toHaveAttribute("aria-pressed", "true");
});
