import { expect, test, type Page } from "@playwright/test";

// Issue #87: 「自由に試す」でもpostステップと同じく、金額欄のEnterで記帳できる

async function openSandbox(page: Page) {
  await page.goto("/units/tutorial/first-entry");
  await page.getByRole("button", { name: "スキップ" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("100000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await work.getByRole("button", { name: "記帳する", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "できました" }).first()).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ4 / 4")).toBeVisible();
  return work;
}

test("「自由に試す」で金額欄のEnterを押すと記帳され、入力欄が空になる", async ({ page }) => {
  const work = await openSandbox(page);
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("12345");
  await work.getByLabel("貸方の科目1").fill("売上");
  await work.getByLabel("貸方の金額1").fill("12345");
  await page.keyboard.press("Enter");
  await expect(work.getByText("自由に記帳")).toBeVisible({ timeout: 3000 });
  await expect(work.getByLabel("借方の科目1")).toHaveValue("");
  await expect(work.getByLabel("貸方の金額1")).toHaveValue("");
});

test("「自由に試す」で貸借が合わないときはEnterを押しても記帳されない", async ({ page }) => {
  const work = await openSandbox(page);
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("12345");
  await work.getByLabel("貸方の科目1").fill("売上");
  await work.getByLabel("貸方の金額1").fill("1000");
  await expect(work.getByText("借方と貸方の合計をそろえると記帳できます。")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(work.getByText("自由に記帳")).toHaveCount(0);
  await expect(work.getByLabel("貸方の金額1")).toHaveValue("1000");
});
