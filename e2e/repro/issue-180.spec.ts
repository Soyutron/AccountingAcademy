import { devices, expect, type Locator, type Page, test } from "@playwright/test";

// Issue #180: スマホ幅で誤答すると、「もう一歩」のパネルが間違えた科目や「記帳する」の上に重なっていた
const { defaultBrowserType: _, ...iPhone13 } = devices["iPhone 13"];
test.use(iPhone13);

// 要素の中心に見えているのがその要素(か子孫)なら、パネルに隠れていない
async function expectNotCovered(page: Page, target: Locator) {
  await expect(page.getByText("もう一歩", { exact: true })).toBeVisible();
  await page.waitForTimeout(800);
  const covered = await target.evaluate((e) => {
    const r = e.getBoundingClientRect();
    const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !(top && (top === e || e.contains(top)));
  });
  expect(covered).toBe(false);
}

test("390pxの仕分けボードで誤答しても、間違えた科目がパネルに隠れない(classify)", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const done = () => expect(page.getByText("できました", { exact: true })).toBeVisible();
  const toWork = async () => {
    await next.click();
    await page.locator("#tab-work").click();
  };
  const post = async (debit: string, credit: string, amount: string) => {
    await toWork();
    await work.getByLabel("借方の科目1").fill(debit);
    await work.getByLabel("借方の金額1").fill(amount);
    await work.getByLabel("貸方の科目1").fill(credit);
    await work.getByLabel("貸方の金額1").fill(amount);
    await work.getByRole("button", { name: "記帳する" }).click();
    await done();
  };
  const predict = async (answers: Record<string, string>) => {
    await toWork();
    for (const [label, value] of Object.entries(answers)) await work.getByLabel(`${label}の予想`, { exact: true }).selectOption(value);
    await work.getByRole("button", { name: "予想して記帳する" }).click();
    await done();
  };

  await page.goto("/units/receivables-and-payables/loans");
  await page.getByRole("button", { name: "今はしない" }).click({ timeout: 15000 });
  await post("貸付金", "普通預金", "100000");
  await predict({ 資産: "increase", 負債: "none", 純資産: "increase", 収益: "increase", 費用: "none" });
  await post("支払利息", "普通預金", "3000");
  await toWork();
  await page.getByPlaceholder("金額(円)").fill("3000");
  await page.getByRole("button", { name: "確認する" }).click();
  await done();
  await post("普通預金", "貸付金", "100000");
  await predict({ 資産: "decrease", 負債: "decrease", 純資産: "none", 収益: "none", 費用: "none" });

  await toWork();
  const board = page.getByRole("group", { name: "仕分けボード" });
  for (const [account, box] of [["貸付金", "資産"], ["借入金", "費用"], ["受取利息", "収益"], ["支払利息", "費用"]]) {
    await board.getByRole("button", { name: account }).first().click();
    await board.getByRole("button", { name: new RegExp(box) }).first().click();
  }
  await page.getByRole("button", { name: "確認する" }).click();
  await expectNotCovered(page, board.getByRole("button", { name: /間違い/ }));
});

test("390pxで仕訳を誤答しても、「記帳する」がパネルに隠れない(post)", async ({ page }) => {
  await page.goto("/units/merchandise/credit-transactions");
  await page.getByRole("button", { name: "今はしない" }).click({ timeout: 15000 });
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.locator("#tab-work").click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  // 左右を入れ替えた誤答は、思い込みの説明まで出てパネルが長くなる
  await work.getByLabel("借方の科目1").fill("買掛金");
  await page.keyboard.press("Escape");
  await work.getByLabel("借方の金額1").fill("40000");
  await work.getByLabel("貸方の科目1").fill("仕入");
  await page.keyboard.press("Escape");
  await work.getByLabel("貸方の金額1").fill("40000");
  const postButton = work.getByRole("button", { name: "記帳する" });
  await postButton.click();
  await expectNotCovered(page, postButton);
});
