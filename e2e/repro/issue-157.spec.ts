import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Issue #157: 「振り出す」を初出のステップで定義し、用語集でも引けるようにする

test("「振り出す」を初出で説明している", () => {
  const units = JSON.parse(readFileSync(".velite/units.json", "utf8"));
  const unit = units.find((u: { id: string }) => u.id === "cash-and-deposits/checking-account");
  expect(unit.steps[0].narrative).toMatch(/振り出[すし][^。]*(こと|と言|といい|と呼)|ことを[「『]?振り出/);
});

test("用語集で「振り出す」「振出」を検索すると小切手が出る", async ({ page }) => {
  await page.goto("/glossary");
  const search = page.getByLabel("用語を検索");
  for (const query of ["振り出す", "振出"]) {
    await search.fill(query);
    await expect(page.locator('[id="check"]')).toBeVisible();
    await expect(page.getByText("該当する用語がありません。")).toHaveCount(0);
  }
});
