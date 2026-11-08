import { expect, test } from "@playwright/test";

// Issue #56: YAML のフロー列で引用符が無く、30,000 のカンマでノードが割れていた
test("小口現金の flow 図で 30,000 がカンマで割れない", async ({ page }) => {
  await page.goto("/units/cash-and-deposits/petty-cash");
  const fig = page.getByRole("region", { name: "ガイド" }).locator("figure").first();
  await expect(fig).toContainText("週の初めに 30,000 を渡す");
  await expect(fig.getByText("週の初めに 30", { exact: true })).toHaveCount(0);
  await expect(fig.getByText("000 を渡す", { exact: true })).toHaveCount(0);
});
