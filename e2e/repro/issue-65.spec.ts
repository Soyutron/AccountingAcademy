import { expect, test } from "@playwright/test";

// Issue #65: 売れ残りと売上原価を最後まで進め、成功文が言う仕入・当期純利益の額が損益計算書と一致すること
test("成功文の仕入と当期純利益の額が損益計算書と一致し、翌期の取引を記帳しない", async ({ page }) => {
  await page.goto("/units/merchandise/cost-of-goods-sold");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const status = page.getByRole("status");
  const next = page.getByRole("button", { name: "次へ →" });
  const done = status.getByText("できました");
  const pl = page.getByRole("region", { name: "結果" }).locator("section", { hasText: "損益計算書" }).last();
  const plAmount = async (label: string) => (await pl.innerText()).match(new RegExp(`${label}\\s*([\\d,]+)`))?.[1];
  const said = async (label: string) => (await status.innerText()).replace(/\s+/g, "").match(new RegExp(`${label}が([\\d,]+)`))?.[1];

  await expect(page.getByText("ステップ1 / 7")).toBeVisible();
  await next.click();
  await work.getByPlaceholder("金額(円)").fill("125000");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(done).toBeVisible();
  await next.click();

  await work.getByLabel("借方の科目1").fill("仕入");
  await work.getByLabel("借方の科目1").press("Escape");
  await work.getByLabel("借方の金額1").fill("15000");
  await work.getByLabel("貸方の科目1").fill("繰越商品");
  await work.getByLabel("貸方の科目1").press("Escape");
  await work.getByLabel("貸方の金額1").fill("15000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(done).toBeVisible();
  expect(await said("仕入")).toBe("147,000");
  expect(await plAmount("仕入")).toBe("147,000");
  await next.click();

  for (const [el, v] of [["資産", "increase"], ["負債", "none"], ["純資産", "increase"], ["収益", "none"], ["費用", "decrease"]])
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption(v);
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(done).toBeVisible();
  expect(await said("仕入")).toBe("125,000");
  expect(await plAmount("仕入")).toBe("125,000");
  await next.click();

  await work.getByPlaceholder("金額(円)").fill("78500");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(done).toBeVisible();
  expect(await plAmount("当期純利益")).toBe("78,500");
  await next.click();

  // 決算の後に翌期の取引を記帳させるステップが無い
  await expect(page.getByRole("group", { name: "仕分けボード" })).toBeVisible();
  await expect(page.getByText(/翌期首|新しい期/)).toHaveCount(0);
  expect(await plAmount("仕入")).toBe("125,000");
});
