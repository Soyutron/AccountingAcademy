import { devices, expect, test } from "@playwright/test";

// Issue #104: 「行を追加」で新しい行の科目欄へフォーカスが移ると候補リストが開いて「行を追加」を覆い、
// 同じ位置をもう一度押すと候補「現金」が新しい行に入って行が増えなかった
test.describe("390pxタッチ", () => {
  const { defaultBrowserType: _ignored, ...iPhone } = devices["iPhone 13"];
  test.use(iPhone);

  test("「行を追加」を続けて押すと、候補リストではなく次の行が増える", async ({ page }) => {
    await page.goto("/units/merchandise/three-account-method");
    await page.getByRole("button", { name: "今はしない" }).tap();
    await page.getByRole("button", { name: "次へ →" }).tap();
    await page.getByRole("tab", { name: "ワークスペース" }).tap();
    const work = page.getByRole("region", { name: "ワークスペース" });
    const add = work.getByRole("button", { name: "行を追加" }).first();

    await add.tap();
    await expect(work.getByLabel("借方の科目2")).toBeFocused();
    const box = (await add.boundingBox())!;
    // 指で押すのと同じく、見えている要素に当たる座標タップにする
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);

    await expect(work.getByLabel("借方の科目3")).toBeVisible();
    await expect(work.getByLabel("借方の科目2")).toHaveValue("");
  });

  test("新しい行の科目欄をタップすると候補リストが開く", async ({ page }) => {
    await page.goto("/units/merchandise/three-account-method");
    await page.getByRole("button", { name: "今はしない" }).tap();
    await page.getByRole("button", { name: "次へ →" }).tap();
    await page.getByRole("tab", { name: "ワークスペース" }).tap();
    const work = page.getByRole("region", { name: "ワークスペース" });

    await work.getByRole("button", { name: "行を追加" }).first().tap();
    await expect(page.getByRole("listbox", { name: "科目の候補" })).toBeHidden();
    await work.getByLabel("借方の科目2").tap();
    await expect(page.getByRole("listbox", { name: "科目の候補" })).toBeVisible();
  });
});

test.describe("1280pxマウス", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("「行を追加」の移動先を続けて押すと次の行が増える", async ({ page }) => {
    await page.goto("/units/cash-and-deposits/cash-over-and-short");
    await page.getByRole("button", { name: "今はしない" }).click();
    await page.getByRole("button", { name: "次へ →" }).click();
    const work = page.getByRole("region", { name: "ワークスペース" });
    const add = work.getByRole("button", { name: "行を追加" }).first();

    await add.click();
    await expect(work.getByLabel("借方の科目2")).toBeFocused();
    const box = (await add.boundingBox())!;
    // 通常のclick()は覆われていると待ち続けるので、座標で押す
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    await expect(work.getByLabel("借方の科目3")).toBeVisible();
    await expect(work.getByLabel("借方の科目2")).toHaveValue("");
  });
});
