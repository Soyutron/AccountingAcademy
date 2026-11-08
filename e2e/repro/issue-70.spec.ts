import { expect, test, type Locator, type Page } from "@playwright/test";

// 3 ペインの狭いガイドでも、流れ図のノードが語の途中で折れない

function flowFigure(page: Page) {
  return page.getByRole("region", { name: "ガイド" }).locator("figure").first();
}

async function expectNodesOnSingleLine(figure: Locator) {
  const nodes = figure.locator("ol > li > span:first-child");
  await expect(nodes.first()).toBeVisible();
  const lineCounts = await nodes.evaluateAll((els) =>
    els.map((e) => {
      const r = document.createRange();
      r.selectNodeContents(e);
      return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size;
    }),
  );
  expect(lineCounts.length).toBeGreaterThan(0);
  expect(lineCounts.every((n) => n === 1)).toBe(true);
}

test.describe("1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("ガイドが狭いので縦に並び、ノードが 1 行に収まる", async ({ page }) => {
    await page.goto("/units/bookkeeping-basics/five-elements");
    const figure = flowFigure(page);
    await expectNodesOnSingleLine(figure);
    await expect(figure.getByText("↓").first()).toBeVisible();
    await expect(figure.getByText("→").first()).toBeHidden();
  });
});

test.describe("1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("収まる図は横に並んだまま", async ({ page }) => {
    await page.goto("/units/bookkeeping-basics/five-elements");
    const figure = flowFigure(page);
    await expectNodesOnSingleLine(figure);
    await expect(figure.getByText("→").first()).toBeVisible();
  });

  test("1 行に収まらない 4 ノードの図は、ノードの区切りで折り返してはみ出さない", async ({ page }) => {
    await page.goto("/units/cash-and-deposits/cash-over-and-short");
    const figure = flowFigure(page);
    await expect(figure.getByText("原因を探す", { exact: true })).toBeVisible();
    await expectNodesOnSingleLine(figure);
    const list = figure.locator("ol");
    const overflow = await list.evaluate((e) => e.scrollWidth - e.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
