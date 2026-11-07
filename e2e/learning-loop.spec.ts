import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// 会計 IDE の学習ループ。コンテンツ(.velite)を読んで各ステップを正しく操作し、最後まで進めて進捗が保存されることを確かめる。
// 最初の post ステップでは、わざと貸借を逆にして「もう一歩」と誤解の説明が出ることも確かめる。

type Line = { account: string; amount: number };
type Entry = { debit: Line[]; credit: Line[] };
type Task =
  | { type: "observe" }
  | { type: "post"; answer: Entry }
  | { type: "predict"; answer: Record<string, string> }
  | { type: "tweak"; formula: string; params: { id: string; value: number; min: number; max: number; step: number }[]; goal: { output: string; equals: number } }
  | { type: "classify"; accounts: string[] }
  | { type: "calc"; answer: number };
type Unit = { id: string; title: string; steps: { title: string; task: Task }[] };

const units: Unit[] = JSON.parse(readFileSync(".velite/units.json", "utf8"));
const accounts: { id: string; name: string; element: string }[] = JSON.parse(readFileSync(".velite/accounts.json", "utf8")).accounts;
const nameOf = (id: string) => accounts.find((a) => a.id === id)!.name;
const ELEMENT_LABELS: Record<string, string> = { asset: "資産", liability: "負債", equity: "純資産", revenue: "収益", expense: "費用" };

async function fillEntry(page: Page, entry: Entry) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  // 前の入力(わざと間違えた分)が残っていれば、余分な行を消して 1 行目を空にする
  const removable = work.getByRole("button", { name: "行を削除" });
  for (let guard = 0; guard < 10; guard++) {
    const enabled = await removable.evaluateAll((els) => els.filter((e) => !(e as HTMLButtonElement).disabled).length);
    if (enabled === 0) break;
    await removable.filter({ hasNot: page.locator("[disabled]") }).first().click();
  }
  for (const side of ["借方", "貸方"]) {
    await work.getByLabel(`${side}の科目 1`).fill("");
    await work.getByLabel(`${side}の金額 1`).fill("");
  }
  for (const [side, lines] of [["借方", entry.debit], ["貸方", entry.credit]] as const) {
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) await work.getByRole("button", { name: "行を追加" }).nth(side === "借方" ? 0 : 1).click();
      await work.getByLabel(`${side}の科目 ${i + 1}`).fill(nameOf(lines[i].account));
      await work.getByLabel(`${side}の金額 ${i + 1}`).fill(String(lines[i].amount));
    }
  }
}

function solveTweak(task: Extract<Task, { type: "tweak" }>): Record<string, number> {
  // 定額法: (cost - residual) / useful_life を目標値にするパラメータを総当たりで探す
  const values = Object.fromEntries(task.params.map((p) => [p.id, p.value]));
  const compute = (v: Record<string, number>) => {
    const annual = Math.floor(((v.cost ?? 0) - (v.residual_value ?? 0)) / (v.useful_life ?? 1));
    const period = Math.floor((annual * (v.months ?? 12)) / 12);
    return { annual_depreciation: annual, period_depreciation: period, book_value_end: (v.cost ?? 0) - period }[task.goal.output];
  };
  for (const p of task.params) {
    for (let x = p.min; x <= p.max; x += p.step) {
      const trial = { ...values, [p.id]: x };
      if (compute(trial) === task.goal.equals) return trial;
    }
  }
  throw new Error(`tweak の解が見つからない: ${JSON.stringify(task)}`);
}

for (const unit of units) {
  test(`${unit.title} を最後まで進められる`, async ({ page }) => {
    await page.goto(`/units/${unit.id}`);
    // チュートリアルの案内やツアーは、学習ループの検証では閉じる
    const tourSkip = page.getByRole("dialog", { name: "チュートリアル" }).getByRole("button", { name: "スキップ" });
    if (await tourSkip.isVisible()) await tourSkip.click();
    const later = page.getByRole("button", { name: "今はしない" });
    if (await later.isVisible()) await later.click();
    let triedWrong = false;
    for (let i = 0; i < unit.steps.length; i++) {
      const { task } = unit.steps[i];
      await expect(page.getByText(`ステップ ${i + 1} / ${unit.steps.length}`)).toBeVisible();
      const work = page.getByRole("region", { name: "ワークスペース" });
      switch (task.type) {
        case "post": {
          if (!triedWrong) {
            // わざと貸借を逆にする → 「もう一歩」と影響の比較が出る
            await fillEntry(page, { debit: task.answer.credit, credit: task.answer.debit });
            await work.getByRole("button", { name: "記帳する" }).click();
            await expect(page.getByText("もう一歩", { exact: true })).toBeVisible();
            await expect(page.getByText("あなたの仕訳")).toBeVisible();
            triedWrong = true;
          }
          await fillEntry(page, task.answer);
          await work.getByRole("button", { name: "記帳する" }).click();
          await expect(page.getByText("できました", { exact: true })).toBeVisible();
          break;
        }
        case "predict": {
          for (const [el, v] of Object.entries(task.answer)) await work.getByLabel(`${ELEMENT_LABELS[el]}の予想`, { exact: true }).selectOption(v);
          await work.getByRole("button", { name: "予想して記帳する" }).click();
          await expect(page.getByText("できました", { exact: true })).toBeVisible();
          break;
        }
        case "tweak": {
          const solution = solveTweak(task);
          for (const p of task.params) {
            const slider = work.getByRole("slider", { name: unitLabel(unit, i, p.id) });
            await slider.fill(String(solution[p.id]));
          }
          await expect(page.getByText("達成")).toBeVisible();
          break;
        }
        case "classify": {
          const board = work.getByRole("group", { name: "仕分けボード" });
          for (const id of task.accounts) {
            await board.getByRole("button", { name: nameOf(id), exact: true }).click();
            await board.getByRole("button", { name: `${ELEMENT_LABELS[accounts.find((a) => a.id === id)!.element]} ← ここに入れる`, exact: true }).click();
          }
          await work.getByRole("button", { name: "確認する" }).click();
          await expect(page.getByText("できました", { exact: true })).toBeVisible();
          break;
        }
        case "calc": {
          await work.getByPlaceholder("金額(円)").fill(String(task.answer));
          await work.getByRole("button", { name: "確認する" }).click();
          await expect(page.getByText("できました", { exact: true })).toBeVisible();
          break;
        }
        case "observe":
          break;
      }
      if (i < unit.steps.length - 1) await page.getByRole("button", { name: "次へ →" }).click();
    }
    // 最後のステップに到達すると完了として保存される
    await page.goto(`/topics/${unit.id.split("/")[0]}`);
    await expect(page.getByRole("listitem").filter({ hasText: unit.title }).getByText("完了")).toBeVisible();
  });
}

function unitLabel(unit: Unit, stepIndex: number, paramId: string): string {
  const task = unit.steps[stepIndex].task as Extract<Task, { type: "tweak" }>;
  return (task.params.find((p) => p.id === paramId) as { label?: string }).label ?? paramId;
}
