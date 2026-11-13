import { expect, test } from "@playwright/test";

const ACCOUNTS: [string, string][] = [["仕入", "費用"], ["売上", "収益"], ["備品", "資産"], ["現金", "資産"]];

// 当期純利益と当期純損失をまたぐ記帳では、増減を純資産の向きで示す(損失額を超える「増加」を出さない)
test("利益と損失をまたいだ行の増減は純資産の向きで読める", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const netIncomeRow = (label: string) => page.getByRole("region", { name: "貸借対照表" }).getByText(label, { exact: true }).locator("xpath=ancestor::div[1]");
  const journal = async (debit: string, credit: string, amount: string) => {
    await work.getByLabel("借方の科目1").fill(debit);
    await work.getByLabel("借方の金額1").fill(amount);
    await work.getByLabel("貸方の科目1").fill(credit);
    await work.getByLabel("貸方の金額1").fill(amount);
    await work.getByRole("button", { name: "記帳する" }).click();
  };
  await page.goto("/units/merchandise/three-account-method");
  await next.click();
  await journal("仕入", "現金", "30000");
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  const picks: [string, string][] = [["資産", "減る"], ["負債", "変わらない"], ["純資産", "減る"], ["収益", "変わらない"], ["費用", "増える"]];
  for (const [element, label] of picks) await work.getByLabel(`${element}の予想`, { exact: true }).selectOption({ label });
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();

  // 損失 → 利益
  await journal("現金", "売上", "90000");
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  const profit = netIncomeRow("当期純利益");
  await expect(profit).toContainText("70,000");
  await expect(profit).toContainText("+");
  await expect(profit).toContainText("増加90,000");

  await next.click();
  await work.getByPlaceholder("金額(円)").fill("40000");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  const board = work.getByRole("group", { name: "仕分けボード" });
  for (const [account, box] of ACCOUNTS) {
    await board.getByRole("button", { name: account, exact: true }).click();
    await board.getByRole("button", { name: `${box} ← ここに入れる`, exact: true }).click();
  }
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ7 / 7")).toBeVisible();

  // 利益 → 損失
  await journal("給料", "現金", "100000");
  const loss = netIncomeRow("当期純損失");
  await expect(loss).toContainText("30,000");
  await expect(loss).toContainText("−");
  await expect(loss).toContainText("減少100,000");
  await expect(loss).not.toContainText("+");
  await expect(loss).not.toContainText("増加");
});
