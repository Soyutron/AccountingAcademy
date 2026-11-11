import { expect, type Page, test } from "@playwright/test";

test.use({ hasTouch: true, isMobile: true });

async function openDebitCombobox(page: Page) {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await page.getByRole("tablist", { name: "ペインの切り替え" }).getByRole("tab", { name: "ワークスペース" }).click();
  const input = page.getByRole("region", { name: "ワークスペース" }).getByLabel("借方の科目1");
  await input.click();
  const first = page.getByRole("option").first();
  await expect(first).toBeVisible();
  const list = page.locator('[data-slot="popover-content"]');
  await list.evaluate((e) => {
    e.scrollTop = 0;
  });
  return { input, first, list };
}

test.describe("横向きのスマホ", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("科目欄を開くと、候補リスト全体と先頭の候補が画面内に収まる", async ({ page }) => {
    const { first, list } = await openDebitCombobox(page);
    // 広い上側に開く。下側の狭い高さに縮んで収まるのでは候補がほとんど見えない
    await expect(list).toHaveAttribute("data-side", "top");
    const firstBox = await first.boundingBox();
    const listBox = await list.boundingBox();
    expect(firstBox?.y ?? -1).toBeGreaterThanOrEqual(0);
    expect(listBox?.y ?? -1).toBeGreaterThanOrEqual(0);
    expect((listBox?.y ?? 0) + (listBox?.height ?? 9999)).toBeLessThanOrEqual(390);
  });
});

test.describe("縦向きのスマホ", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("候補リストは従来どおり科目欄の下に開き、先頭の候補が見える", async ({ page }) => {
    const { input, first, list } = await openDebitCombobox(page);
    await expect(list).toHaveAttribute("data-side", "bottom");
    const inputBox = await input.boundingBox();
    const listBox = await list.boundingBox();
    const firstBox = await first.boundingBox();
    expect(listBox?.y ?? -1).toBeGreaterThanOrEqual((inputBox?.y ?? 0) + (inputBox?.height ?? 0));
    expect((listBox?.y ?? 0) + (listBox?.height ?? 9999)).toBeLessThanOrEqual(844);
    expect(firstBox?.y ?? -1).toBeGreaterThanOrEqual(listBox?.y ?? 0);
  });
});
