import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

const units = JSON.parse(readFileSync(".velite/units.json", "utf8"));
const accounts = JSON.parse(readFileSync(".velite/accounts.json", "utf8")).accounts;
const nameOf = (id: string) => accounts.find((a: { id: string }) => a.id === id).name;
const ELEMENT_LABELS: Record<string, string> = { asset: "資産", liability: "負債", equity: "純資産", revenue: "収益", expense: "費用" };

const fillEntry = async (page: Page, debitAccount: string, creditAccount: string, amount: number) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill(debitAccount);
  await work.getByLabel("借方の金額 1").fill(String(amount));
  await work.getByLabel("貸方の科目 1").fill(creditAccount);
  await work.getByLabel("貸方の金額 1").fill(String(amount));
};

const goToSandbox = async (page: Page) => {
  const unit = units.find((u: { id: string }) => u.id === "merchandise/three-account-method");
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.goto(`/units/${unit.id}`);
  await page.getByRole("button", { name: "次へ →" }).waitFor();
  await page.waitForTimeout(1200);
  for (const { task } of unit.steps.slice(0, -1)) {
    if (task.type === "post") {
      await fillEntry(page, nameOf(task.answer.debit[0].account), nameOf(task.answer.credit[0].account), task.answer.debit[0].amount);
      await work.getByRole("button", { name: "記帳する" }).click();
    } else if (task.type === "predict") {
      const selects = work.locator("select");
      for (const [i, key] of ["asset", "liability", "equity", "revenue", "expense"].entries()) await selects.nth(i).selectOption(task.answer[key]);
      await work.getByRole("button", { name: "予想して記帳する" }).click();
    } else if (task.type === "calc") {
      await work.getByPlaceholder("金額(円)").fill(String(task.answer));
      await work.getByRole("button", { name: "確認する" }).click();
    } else if (task.type === "classify") {
      const board = work.getByRole("group", { name: "仕分けボード" });
      for (const id of task.accounts) {
        await board.getByRole("button", { name: nameOf(id), exact: true }).click();
        await board.getByRole("button", { name: `${ELEMENT_LABELS[accounts.find((a: { id: string }) => a.id === id).element]} ← ここに入れる`, exact: true }).click();
      }
      await work.getByRole("button", { name: "確認する" }).click();
    }
    if (task.type !== "observe") await expect(page.getByRole("status").filter({ hasText: "できました" }).first()).toBeVisible();
    await page.getByRole("button", { name: "次へ →" }).click();
  }
  await expect(page.getByRole("heading", { name: "自由に試す" })).toBeVisible();
};

// Issue #158: 自由記帳も課題と同じく、同一ティックの連打を 1 回の記帳として扱う
test("自由に試すの「記帳する」を同一ティックで連打しても仕訳は 1 件", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await goToSandbox(page);
  await fillEntry(page, "現金", "売上", 12345);
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "記帳する")!;
    button.click();
    button.click();
    button.click();
  });
  await expect(work.getByText("現金 12,345").first()).toBeVisible();
  await expect(work.getByText("現金 12,345")).toHaveCount(1);
  await expect(work.getByText("37,035")).toHaveCount(0);
});

// 同じ仕訳をわざと 2 回記帳するのは正当な操作なので、内容で弾いてはいけない
test("自由に試すで同じ仕訳を入力し直して記帳すると 2 件並ぶ", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await goToSandbox(page);
  for (const expected of [1, 2]) {
    await fillEntry(page, "現金", "売上", 12345);
    await work.getByRole("button", { name: "記帳する" }).click();
    await expect(work.getByText("現金 12,345")).toHaveCount(expected);
  }
});
