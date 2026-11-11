import { expect, test, type Page } from "@playwright/test";

const GENERIC = "結果の表で何が動くはずかを考えて";

async function openPostStep(page: Page) {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  return page.getByRole("region", { name: "ワークスペース" });
}
const status = (page: Page) => page.getByRole("status").filter({ hasText: "もう一歩" });

// 資産どうしの取り違えは 5 要素の動きが正解と同じになり、全行「同じ」の表と汎用文が矛盾していた
test("5 要素の動きが正解と同じ誤答に、科目を見直させる文を出す", async ({ page }) => {
  const work = await openPostStep(page);
  await work.getByLabel("借方の科目 1").fill("普通預金");
  await work.getByLabel("借方の金額 1").fill("1000000");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(status(page)).toContainText("5 つの要素の動きは合っています。使っている科目を見直しましょう。");
  await expect(status(page)).not.toContainText(GENERIC);
});

test("左右に同じ科目を足して打ち消す誤答に、結果の表を見直させる文を出さない", async ({ page }) => {
  const work = await openPostStep(page);
  await work.getByRole("button", { name: "行を追加" }).nth(0).click();
  await work.getByRole("button", { name: "行を追加" }).nth(1).click();
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("1000000");
  await work.getByLabel("借方の科目 2").fill("現金過不足");
  await work.getByLabel("借方の金額 2").fill("5");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("1000000");
  await work.getByLabel("貸方の科目 2").fill("現金過不足");
  await work.getByLabel("貸方の金額 2").fill("5");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(status(page)).toBeVisible();
  await expect(status(page)).not.toContainText(GENERIC);
});
