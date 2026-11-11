import { expect, test } from "@playwright/test";

const ANSWER: Record<string, string> = { 資産: "decrease", 負債: "none", 純資産: "decrease", 収益: "none", 費用: "increase" };

// 年表図の金額がカードの幅に収まらず、隣のカードに隠れて「100,00」と読める(3ペイン最小の1024pxと390px)
for (const width of [1024, 390]) {
  test(`年表図の金額がカードの内側に収まる(${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    const work = page.getByRole("region", { name: "ワークスペース" });
    const next = page.getByRole("button", { name: "次へ →" });
    const showWork = async () => {
      const tab = page.getByRole("tab", { name: "ワークスペース" }).first();
      if (await tab.isVisible()) await tab.click();
    };
    await page.goto("/units/depreciation/what-is-depreciation");
    await page.getByRole("button", { name: "今はしない" }).click();
    await next.click();
    await showWork();
    for (const el of ["資産", "負債", "純資産", "収益", "費用"]) {
      await work.getByLabel(`${el}の予想`, { exact: true }).selectOption(ANSWER[el]);
    }
    await work.getByRole("button", { name: "予想して記帳する" }).click();
    await expect(page.getByText("できました", { exact: true })).toBeVisible();
    await next.click();
    await showWork();
    await work.getByPlaceholder("金額(円)").fill("-260000");
    await work.getByRole("button", { name: "確認する" }).click();
    await expect(page.getByText("できました", { exact: true })).toBeVisible();
    await next.click();
    await expect(page.getByText("ステップ4 / 9")).toBeVisible();
    const tab = page.getByRole("tab", { name: "ガイド" }).first();
    if (await tab.isVisible()) await tab.click();
    const spill = await page.getByRole("region", { name: "ガイド" }).locator("ol.grid > li").evaluateAll((items) =>
      items.map((li) => {
        const range = document.createRange();
        range.selectNodeContents(li.lastElementChild as Element);
        return range.getBoundingClientRect().right - li.getBoundingClientRect().right;
      }),
    );
    expect(spill.length).toBe(6);
    for (const px of spill) expect(px).toBeLessThanOrEqual(0);
  });
}
