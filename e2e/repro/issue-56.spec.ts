import { expect, test } from "@playwright/test";

// Issue #56: YAMLのフロー列で引用符が無く、30,000のカンマでノードが割れていた
test("小口現金のflow図で30,000がカンマで割れない", async ({ page }) => {
  await page.goto("/units/cash-and-deposits/petty-cash");
  const fig = page.getByRole("region", { name: "ガイド" }).locator("figure").first();
  await expect(fig).toContainText("週の初めに30,000を渡す");
  await expect(fig.getByText("週の初めに30", { exact: true })).toHaveCount(0);
  await expect(fig.getByText("000を渡す", { exact: true })).toHaveCount(0);
});
