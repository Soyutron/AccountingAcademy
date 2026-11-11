import { test, expect } from "@playwright/test";

test("classifyで別々の誤解に当たる2科目を間違えると、両方の誤解が出る", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "今はしない" }).click();
  const next = page.getByRole("button", { name: "次へ →" });
  const work = page.getByRole("region", { name: "ワークスペース" });
  await next.click();
  const post = async (debit: string, credit: string, amount: string) => {
    await work.getByLabel("借方の科目1").fill(debit);
    await work.getByLabel("借方の金額1").fill(amount);
    await work.getByLabel("貸方の科目1").fill(credit);
    await work.getByLabel("貸方の金額1").fill(amount);
    await work.getByRole("button", { name: "記帳する" }).click();
    await expect(page.getByText("できました", { exact: true })).toBeVisible();
    await next.click();
  };
  await post("現金", "資本金", "1000000");
  for (const n of ["資産", "負債", "純資産", "収益", "費用"]) await page.getByLabel(`${n}の予想`, { exact: true }).selectOption({ label: "変わらない" });
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await post("現金", "借入金", "300000");
  await post("現金", "売上", "80000");
  await post("支払家賃", "現金", "50000");

  const board = work.getByRole("group", { name: "仕分けボード" });
  const put = async (account: string, bin: RegExp) => {
    await board.getByRole("button", { name: account, exact: true }).click();
    await board.getByRole("button", { name: bin }).click();
  };
  await put("現金", /^(?!.*純).*資産/);
  await put("備品", /費用/);
  await put("借入金", /収益/);
  await put("資本金", /純資産/);
  await put("売上", /収益/);
  await put("支払家賃", /費用/);
  await work.getByRole("button", { name: "確認する" }).click();

  const status = page.getByRole("status").filter({ hasText: "個の科目" });
  await expect(status).toContainText("2個の科目が別の箱に入っています");
  await expect(status).toContainText("支払った時に費用");
  await expect(status).toContainText("お金が入れば収益");
  await expect(status.getByText("よくある思い込み:")).toHaveCount(2);
});
