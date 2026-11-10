import { expect, test } from "@playwright/test";

// #212 390px の単元一覧で説明文が 1 行に切られ、「何を身につけるか」が読めない
test.use({ viewport: { width: 390, height: 664 } });

for (const path of ["/paths/boki-3", "/topics/merchandise"]) {
  test(`スマホ幅の単元一覧で説明文を全文読める: ${path}`, async ({ page }) => {
    await page.goto(path);
    const summaries = page.locator("main li p");
    await expect(summaries.first()).toBeVisible();

    const states = await summaries.evaluateAll((els) =>
      els.map((e) => ({
        text: e.textContent,
        cut: e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1,
        whiteSpace: getComputedStyle(e).whiteSpace,
      })),
    );
    expect(states.filter((s) => s.cut || s.whiteSpace === "nowrap")).toEqual([]);
  });
}
