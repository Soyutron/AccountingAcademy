import { devices, expect, type Page, test } from "@playwright/test";

const { defaultBrowserType: _ignored, ...iPhone } = devices["iPhone 13"];

// 桁が増えても財務諸表の金額が列の中で折り返され、列の区切り・結果ペイン・ページの幅を越えない
const AMOUNTS = ["10000000", "900000000", "9000000000000"];

async function openFreePlay(page: Page, isPhone: boolean) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const showWork = async () => {
    if (isPhone) await page.getByRole("tab", { name: "ワークスペース" }).click();
  };
  const post = async (debit: string, credit: string, amount: string) => {
    await showWork();
    await work.getByLabel("借方の科目1").fill(debit);
    await work.getByLabel("借方の金額1").fill(amount);
    await work.getByLabel("貸方の科目1").fill(credit);
    await work.getByLabel("貸方の金額1").fill(amount);
    await work.getByRole("button", { name: "記帳する" }).click();
  };
  await page.goto("/units/tutorial/first-entry");
  await page.getByRole("dialog", { name: "チュートリアル" }).getByRole("button", { name: "スキップ" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await post("現金", "資本金", "100000");
  await expect(page.getByRole("status")).toContainText("できました");
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ4 / 4")).toBeVisible();
  return post;
}

/** 文字の実際の描画範囲で測る(折り返す要素の箱は列に収まっても、中の文字がはみ出すことがあるため) */
async function expectFits(page: Page, building: number) {
  const row = page.locator("section[aria-label='貸借対照表'] [data-account]").filter({ hasText: "建物" });
  await expect(row).toContainText(`増加${building.toLocaleString("ja-JP")}`);
  const overflow = await page.getByRole("region", { name: "結果" }).evaluate((pane) => {
    const range = document.createRange();
    const rights = [...pane.querySelectorAll<HTMLElement>("section .tabular-nums, section .font-mono")].map((el) => {
      range.selectNodeContents(el);
      const box = el.closest("section > div > div, section > div, li")!;
      return { text: el.textContent, right: range.getBoundingClientRect().right, limit: box.getBoundingClientRect().right - parseFloat(getComputedStyle(box).paddingRight) };
    });
    return {
      cells: rights.filter((r) => r.right > r.limit + 0.5),
      pane: pane.scrollWidth - pane.clientWidth,
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(overflow).toEqual({ cells: [], pane: 0, page: 0 });
}

test.describe("スマホ幅", () => {
  test.use(iPhone);

  test("増減つきの行が桁を増やしても貸借対照表の列に収まる(390px)", async ({ page }) => {
    const post = await openFreePlay(page, true);
    let building = 0;
    for (const amount of AMOUNTS) {
      await post("建物", "資本金", amount);
      building += Number(amount);
      await expect(page.getByRole("tab", { name: "結果" })).toHaveAttribute("aria-selected", "true");
      await expectFits(page, building);
    }
  });
});

test.describe("デスクトップ幅", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("結果ペインの内側に横スクロールが出ない(1280px)", async ({ page }) => {
    const post = await openFreePlay(page, false);
    let building = 0;
    for (const amount of AMOUNTS) {
      await post("建物", "資本金", amount);
      building += Number(amount);
      await expectFits(page, building);
    }
  });
});
