import { expect, test, type Page } from "@playwright/test";

// Issue #241: 「掛けで売る、掛けで買う」の要点に関わる誤答に、なぜ違うかの説明が無く汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずかを考えて";
const PREDICT_GENERIC = "予想と実際の動きが違いました";
const CALC_GENERIC = "計算の式と、使う数字をもう一度確かめましょう";

async function open(page: Page) {
  await page.goto("/units/merchandise/credit-transactions");
  const later = page.getByRole("button", { name: "今はしない" });
  await later.click({ timeout: 8000 }).catch(() => {});
}
async function fill(page: Page, debit: string, credit: string, amount: number) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill(debit);
  await work.getByLabel("借方の金額 1").fill(String(amount));
  await work.getByLabel("貸方の科目 1").fill(credit);
  await work.getByLabel("貸方の金額 1").fill(String(amount));
  await work.getByRole("button", { name: "記帳する" }).click();
}
const nextBtn = (page: Page) => page.getByRole("button", { name: "次へ →" }).first();
async function dismissNotes(page: Page) {
  for (const b of await page.getByRole("button", { name: "わかった" }).all()) await b.click().catch(() => {});
}
async function toStep(page: Page, n: number) {
  await expect(page.getByText(`ステップ ${n} / 8`)).toBeVisible();
  await dismissNotes(page);
}
async function predict(page: Page, values: Record<string, string>) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  for (const [k, v] of Object.entries(values)) await work.getByLabel(`${k}の予想`, { exact: true }).selectOption({ label: v });
  await work.getByRole("button", { name: "予想して記帳する" }).click();
}
const status = (page: Page) => page.getByRole("status").filter({ hasText: "もう一歩" });

for (const [label, wrong] of [
  ["資産が減る", { 資産: "減る", 負債: "変わらない", 純資産: "増える", 収益: "増える", 費用: "変わらない" }],
  ["費用が増える", { 資産: "増える", 負債: "変わらない", 純資産: "増える", 収益: "増える", 費用: "増える" }],
] as [string, Record<string, string>][]) {
  test(`予想で「${label}」を選ぶと、なぜ違うかの説明が出る`, async ({ page }) => {
    await open(page);
    await nextBtn(page).click();
    await toStep(page, 2);
    await fill(page, "仕入", "買掛金", 40000);
    await expect(page.getByText("できました", { exact: true })).toBeVisible();
    await nextBtn(page).click();
    await toStep(page, 3);
    await predict(page, wrong);
    await expect(status(page)).toBeVisible();
    await expect(status(page)).not.toContainText(PREDICT_GENERIC);
  });
}

test("仕訳と計算の誤答に、なぜ違うかの説明が出る", async ({ page }) => {
  await open(page);
  await nextBtn(page).click();
  await toStep(page, 2);
  await fill(page, "仕入", "売上", 40000);
  await expect(status(page)).toBeVisible();
  await expect.soft(status(page), "ステップ 2 仕入/売上").not.toContainText(GENERIC);
  await fill(page, "仕入", "買掛金", 40000);
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await nextBtn(page).click();
  await toStep(page, 3);
  await predict(page, { 資産: "増える", 負債: "変わらない", 純資産: "増える", 収益: "増える", 費用: "変わらない" });
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await nextBtn(page).click();
  await toStep(page, 4);
  await fill(page, "当座預金", "売掛金", 60000);
  await expect(status(page)).toBeVisible();
  await expect.soft(status(page), "ステップ 4 当座預金/売掛金").not.toContainText(GENERIC);
  await fill(page, "普通預金", "売掛金", 60000);
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await nextBtn(page).click();
  await toStep(page, 5);
  for (const [d, c] of [["買掛金", "普通預金"], ["買掛金", "売掛金"], ["買掛金", "仕入"], ["未払金", "現金"], ["借入金", "現金"]]) {
    await fill(page, d, c, 40000);
    await expect(status(page)).toBeVisible();
    await page.waitForTimeout(300);
    await expect.soft(status(page), `ステップ 5 ${d}/${c}`).not.toContainText(GENERIC);
  }
  await fill(page, "買掛金", "現金", 40000);
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await nextBtn(page).click();
  await toStep(page, 6);
  const board = page.getByRole("group", { name: "仕分けボード" });
  const place = async (chip: string, box: string) => {
    await board.locator(`[data-chip="${chip}"]`).click();
    await board.getByRole("button", { name: box }).first().click();
  };
  await place("accounts_receivable", "負債");
  await place("accounts_payable", "資産");
  await place("sales", "収益");
  await place("purchases", "費用");
  await place("bank_deposit", "資産");
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(status(page)).toBeVisible();
  await expect.soft(page.getByText("よくある思い込み: 売掛金と買掛金の取り違え"), "ステップ 6 売掛金と買掛金の入れ替え").toBeVisible();
  await place("accounts_receivable", "資産");
  await place("accounts_payable", "負債");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await nextBtn(page).click();
  await toStep(page, 7);
  const amount = page.getByPlaceholder("金額(円)");
  for (const v of ["140000", "20000"]) {
    await amount.fill(v);
    await work.getByRole("button", { name: "確認する" }).click();
    await expect(status(page)).toBeVisible();
    await page.waitForTimeout(300);
    await expect.soft(status(page), `ステップ 7 ${v}`).not.toContainText(CALC_GENERIC);
  }
});
