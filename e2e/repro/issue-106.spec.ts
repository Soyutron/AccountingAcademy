import { expect, type Page, test } from "@playwright/test";

function panes(page: Page) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const result = page.getByRole("region", { name: "結果" });
  const post = async (debit: string, credit: string, amount: string) => {
    await work.getByLabel("借方の科目1").fill(debit);
    await work.getByLabel("借方の金額1").fill(amount);
    await work.getByLabel("貸方の科目1").fill(credit);
    await work.getByLabel("貸方の金額1").fill(amount);
    await work.getByRole("button", { name: "記帳する", exact: true }).click();
  };
  const rewind = async () => {
    await result.getByRole("slider", { name: "帳簿をさかのぼる" }).fill("1");
    await expect(result.getByRole("button", { name: "最新に戻る" })).toBeVisible();
  };
  return { work, result, post, rewind };
}

// 帳簿をさかのぼったまま記帳すると、「できました」の文が指す変化が結果ペインに出ない
test("post課題: さかのぼったまま記帳すると、結果ペインが最新に戻る", async ({ page }) => {
  const { work, result, post, rewind } = panes(page);
  const next = page.getByRole("button", { name: "次へ →" });
  await page.goto("/units/merchandise/credit-transactions");
  await next.click();
  await post("仕入", "買掛金", "40000");
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ3 / 8")).toBeVisible();
  const prediction = { 資産: "増える", 負債: "変わらない", 純資産: "増える", 収益: "増える", 費用: "変わらない" };
  for (const [element, label] of Object.entries(prediction)) {
    await work.getByLabel(`${element}の予想`, { exact: true }).selectOption({ label });
  }
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await work.getByPlaceholder("金額(円)").fill("40000");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ5 / 8")).toBeVisible();

  await rewind();
  await post("普通預金", "売掛金", "60000");
  await expect(page.getByText("できました", { exact: true })).toBeVisible();

  await expect(result.getByRole("button", { name: "最新に戻る" })).toHaveCount(0);
  await expect(result.locator("section[aria-label='貸借対照表']").getByText("普通預金")).toBeVisible();
});

test("predict課題: さかのぼったまま予想して記帳すると、結果ペインが最新に戻る", async ({ page }) => {
  const { work, result, post, rewind } = panes(page);
  const next = page.getByRole("button", { name: "次へ →" });
  await page.goto("/units/cash-and-deposits/petty-cash");
  await next.click();
  await post("小口現金", "当座預金", "30000");
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await next.click();
  await work.getByRole("button", { name: "行を追加" }).first().click();
  await work.getByRole("button", { name: "行を追加" }).first().click();
  await work.getByLabel("借方の科目1").fill("通信費");
  await work.getByLabel("借方の金額1").fill("4000");
  await work.getByLabel("借方の科目2").fill("消耗品費");
  await work.getByLabel("借方の金額2").fill("6500");
  await work.getByLabel("借方の科目3").fill("旅費交通費");
  await work.getByLabel("借方の金額3").fill("2000");
  await work.getByLabel("貸方の科目1").fill("小口現金");
  await work.getByLabel("貸方の金額1").fill("12500");
  await work.getByRole("button", { name: "記帳する", exact: true }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();

  await rewind();
  for (const element of ["資産", "負債", "純資産", "収益", "費用"]) {
    await work.getByLabel(`${element}の予想`, { exact: true }).selectOption({ label: "変わらない" });
  }
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();

  await expect(result.getByRole("button", { name: "最新に戻る" })).toHaveCount(0);
  await expect(result.getByRole("slider", { name: "帳簿をさかのぼる" })).toHaveAttribute("aria-valuetext", "最新");
});

test("自由に記帳: さかのぼったまま記帳すると、結果ペインが最新に戻る", async ({ page }) => {
  const { result, post, rewind } = panes(page);
  const next = page.getByRole("button", { name: "次へ →" });
  await page.goto("/units/tutorial/first-entry");
  await page.getByRole("dialog", { name: "チュートリアル" }).getByRole("button", { name: "スキップ" }).click();
  await next.click();
  await post("現金", "資本金", "100000");
  await expect(page.getByRole("status")).toContainText("できました");
  await next.click();
  await next.click();
  await expect(page.getByText("ステップ4 / 4")).toBeVisible();
  await post("現金", "資本金", "50000");

  await rewind();
  await post("備品", "現金", "30000");

  await expect(result.getByRole("button", { name: "最新に戻る" })).toHaveCount(0);
  await expect(result.locator("section[aria-label='貸借対照表']").getByText("備品")).toBeVisible();
});
