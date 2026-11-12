import { expect, test, type Page } from "@playwright/test";

// 書きかけの仕訳(片側だけ、金額が欠けた行)でも「← 前へ」は確認を出し、キャンセルすれば入力が残る

const CONFIRM = "入力中の仕訳は消えます。前のステップに戻りますか?";

async function goToPostStep4(page: Page) {
  await page.goto("/units/bookkeeping-basics/five-elements");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  await page.getByRole("button", { name: "今はしない" }).click();

  await next.click();
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();

  await next.click();
  for (const el of ["資産", "負債", "純資産", "収益", "費用"]) {
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption({ label: "変わらない" });
  }
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();

  await next.click();
  await expect(page.getByText(/^ステップ4 \//)).toBeVisible();
  return work;
}

function collectDialogs(page: Page) {
  const dialogs: string[] = [];
  page.on("dialog", (d) => {
    dialogs.push(d.message());
    void d.dismiss();
  });
  return dialogs;
}

test("借方だけ入れて「← 前へ」を押すと確認が出て、キャンセルすれば入力が残る", async ({ page }) => {
  const dialogs = collectDialogs(page);
  const work = await goToPostStep4(page);
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("300000");
  await page.getByRole("button", { name: "← 前へ" }).click();

  await expect.poll(() => dialogs).toEqual([CONFIRM]);
  await expect(page.getByText(/^ステップ4 \//)).toBeVisible();
  await expect(work.getByLabel("借方の金額1")).toHaveValue("300,000");
});

test("貸方の金額だけ未入力で「← 前へ」を押しても確認が出る", async ({ page }) => {
  const dialogs = collectDialogs(page);
  const work = await goToPostStep4(page);
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("300000");
  await work.getByLabel("貸方の科目1").fill("借入金");
  await page.getByRole("button", { name: "← 前へ" }).click();

  await expect.poll(() => dialogs).toEqual([CONFIRM]);
  await expect(page.getByText(/^ステップ4 \//)).toBeVisible();
  await expect(work.getByLabel("借方の金額1")).toHaveValue("300,000");
});

test("借方と貸方がそろった下書きでも確認が出る", async ({ page }) => {
  const dialogs = collectDialogs(page);
  const work = await goToPostStep4(page);
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("300000");
  await work.getByLabel("貸方の科目1").fill("借入金");
  await work.getByLabel("貸方の金額1").fill("300000");
  await page.getByRole("button", { name: "← 前へ" }).click();

  await expect.poll(() => dialogs).toEqual([CONFIRM]);
  await expect(page.getByText(/^ステップ4 \//)).toBeVisible();
});

test("何も入れていなければ確認なしで前のステップに戻る", async ({ page }) => {
  const dialogs = collectDialogs(page);
  await goToPostStep4(page);
  await page.getByRole("button", { name: "← 前へ" }).click();

  await expect(page.getByText(/^ステップ3 \//)).toBeVisible();
  expect(dialogs).toEqual([]);
});
