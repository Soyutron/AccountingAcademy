import { expect, test } from "@playwright/test";

test("用語「貸付金・借入金」の説明が、借入金の返済を預金への振り替えと書かない", async ({ page }) => {
  await page.goto("/glossary#loan");
  const entry = page.locator("[id='loan']");
  await expect(entry).toBeVisible();
  await expect(entry).not.toContainText("義務が預金に形を変える");
  await expect(entry).toContainText("預金と義務が同じだけ減る");
});
