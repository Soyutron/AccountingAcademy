import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const units = JSON.parse(readFileSync(".velite/units.json", "utf8"));
const accounts = JSON.parse(readFileSync(".velite/accounts.json", "utf8")).accounts;
const nameOf = (id: string) => accounts.find((a: { id: string }) => a.id === id).name;
const LABEL: Record<string, string> = { asset: "資産", liability: "負債", equity: "純資産", revenue: "収益", expense: "費用" };
const work = (page: Page) => page.getByRole("region", { name: "ワークスペース" });
const row = (page: Page, id: string) => page.getByRole("region", { name: "結果" }).locator(`[data-account="${id}"]`);

async function fillEntry(page: Page, entry: { debit: { account: string; amount: number }[]; credit: { account: string; amount: number }[] }) {
  for (const [side, lines] of [["借方", entry.debit], ["貸方", entry.credit]] as const) {
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) await work(page).getByRole("button", { name: "行を追加" }).nth(side === "借方" ? 0 : 1).click();
      await work(page).getByLabel(`${side}の科目${i + 1}`).fill(lines[i].account);
      await work(page).getByLabel(`${side}の金額${i + 1}`).fill(String(lines[i].amount));
    }
  }
}

async function post(page: Page, debit: string, credit: string, amount: number) {
  await fillEntry(page, { debit: [{ account: debit, amount }], credit: [{ account: credit, amount }] });
  await work(page).getByRole("button", { name: "記帳する" }).click();
}

// target(0始まり)のステップまで正解で進める
async function walk(page: Page, unitId: string, target: number) {
  const unit = units.find((u: { id: string }) => u.id === unitId);
  await page.goto(`/units/${unitId}`);
  await page.getByRole("button", { name: "今はしない" }).click();
  for (let i = 0; i < target; i++) {
    const t = unit.steps[i].task;
    const w = work(page);
    if (t.type === "post") {
      await fillEntry(page, { debit: t.answer.debit.map((l: { account: string; amount: number }) => ({ ...l, account: nameOf(l.account) })), credit: t.answer.credit.map((l: { account: string; amount: number }) => ({ ...l, account: nameOf(l.account) })) });
      await w.getByRole("button", { name: "記帳する" }).click();
    } else if (t.type === "predict") {
      for (const [k, v] of Object.entries(t.answer).filter(([k]) => !t.elements || t.elements.includes(k))) await w.getByLabel(`${LABEL[k]}の予想`, { exact: true }).selectOption(v as string);
      await w.getByRole("button", { name: "予想して記帳する" }).click();
    } else if (t.type === "calc") {
      await w.getByPlaceholder("金額(円)").fill(String(t.answer));
      await w.getByRole("button", { name: "確認する" }).click();
    } else if (t.type === "classify") {
      const b = w.getByRole("group", { name: "仕分けボード" });
      for (const id of t.accounts) {
        await b.getByRole("button", { name: nameOf(id), exact: true }).click();
        await b.getByRole("button", { name: `${LABEL[accounts.find((a: { id: string }) => a.id === id).element]} ← ここに入れる`, exact: true }).click();
      }
      await w.getByRole("button", { name: "確認する" }).click();
    }
    if (t.type !== "observe") await expect(page.getByText("できました", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "次へ →" }).click();
    await expect(page.getByText(`ステップ${i + 2} / ${unit.steps.length}`)).toBeVisible();
  }
}

const unitId = "bookkeeping-basics/five-elements";
const lastStep = () => units.find((u: { id: string }) => u.id === unitId).steps.length - 1;

// 残高がマイナスに転じた行でも、減った行に「増加」を出さない
test("現金が減ってマイナスに転じた行は増加と読まれない", async ({ page }) => {
  await walk(page, unitId, lastStep());
  await post(page, "備品", "現金", 1000000);
  await expect(row(page, "cash")).toContainText("270,000");
  await expect(row(page, "cash")).toContainText("減少");
  await expect(row(page, "cash")).not.toContainText("増加");

  // マイナスのままさらに減っても減少のまま
  await post(page, "備品", "現金", 100);
  await expect(row(page, "cash")).toContainText("270,100");
  await expect(row(page, "cash")).toContainText("減少");
  await expect(row(page, "cash")).not.toContainText("増加");
});

// 評価勘定は △ で絶対値を見せる行なので、控除額が増えたら増加のまま(#46の反転を残す)
test("評価勘定の控除額が増えた行は増加と読める", async ({ page }) => {
  await walk(page, unitId, lastStep());
  await post(page, "減価償却費", "減価償却累計額", 1000);
  await expect(row(page, "accumulated_depreciation")).toContainText("1,000");
  await expect(row(page, "accumulated_depreciation")).toContainText("増加");
  await expect(row(page, "accumulated_depreciation")).not.toContainText("減少");
});
