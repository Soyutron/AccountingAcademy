import type { Unit } from "#content";
import { type AccountInfo, type Change, type Element, type JournalEntry, ELEMENT_LABELS, sameEntry } from "./accounting";

// ステップの課題の採点(純粋関数)。正誤だけでなく「どの誤解か」を返す(docs/architecture.md 6 章)

export type Task = Unit["steps"][number]["task"];
export type TaskOf<T extends Task["type"]> = Extract<Task, { type: T }>;
export type EffectAnswer = Record<Element, Change>;

export interface GradeResult {
  correct: boolean;
  misconception?: string;
  feedback: string;
}

const GENERIC_WRONG = "まだ合っていません。結果の表で何が動くはずかを考えて、もう一度試してみましょう。";
// 正解の金額は書かない。計算で求める課題では答えそのものになる
const AMOUNT_WRONG = "科目は合っています。金額をもう一度確かめましょう。";
// 計算問題では記帳しないので、結果の表の動きではなく計算そのものの見直しを促す
const CALC_WRONG = "まだ合っていません。計算の式と、使う数字をもう一度確かめましょう。";

/** 2 回誤答すると「答えを見る」が出る課題か。predict は 1 回で進み、tweak は目標に合わせるだけなので誤答が重ならない */
export function canRevealAnswer(type: Task["type"]): boolean {
  return type === "post" || type === "calc" || type === "classify";
}

function ok(task: { success?: string }): GradeResult {
  return { correct: true, feedback: task.success ?? "できました。" };
}
function ng(feedback?: string, misconception?: string): GradeResult {
  return { correct: false, misconception, feedback: feedback ?? GENERIC_WRONG };
}

function sameAccounts(a: JournalEntry, b: JournalEntry): boolean {
  const key = (lines: JournalEntry["debit"]) => [...new Set(lines.map((l) => l.account))].sort().join(",");
  return key(a.debit) === key(b.debit) && key(a.credit) === key(b.credit);
}

export function gradePost(task: TaskOf<"post">, entry: JournalEntry): GradeResult {
  if ([task.answer, ...task.alternatives].some((e) => sameEntry(e, entry))) return ok(task);
  const sum = (lines: { amount: number }[]) => lines.reduce((t, l) => t + l.amount, 0);
  const pattern = task.wrong_patterns.find((p) => {
    const m = p.match;
    if (m.swapped && !sameEntry(entry, { debit: task.answer.credit, credit: task.answer.debit })) return false;
    if (m.unbalanced && sum(entry.debit) === sum(entry.credit)) return false;
    const linesMatch = (wanted: { account?: string; amount?: number }[] | undefined, lines: JournalEntry["debit"]) =>
      (wanted ?? []).every((w) => lines.some((l) => (w.account === undefined || l.account === w.account) && (w.amount === undefined || l.amount === w.amount)));
    return linesMatch(m.debit, entry.debit) && linesMatch(m.credit, entry.credit);
  });
  if (!pattern && [task.answer, ...task.alternatives].some((e) => sameAccounts(e, entry))) return ng(AMOUNT_WRONG);
  return ng(pattern?.feedback, pattern?.misconception);
}

export interface PredictResult extends GradeResult {
  // 外した要素それぞれの誤解(重複なし)。misconception はこの先頭で、attempts には 1 件だけ保存する
  misconceptions: string[];
}

export function gradePredict(task: TaskOf<"predict">, effect: EffectAnswer): PredictResult {
  const keys = Object.keys(task.answer) as Element[];
  if (keys.every((k) => effect[k] === task.answer[k])) return { ...ok(task), misconceptions: [] };
  const patterns = task.wrong_patterns.filter((p) =>
    (Object.entries(p.match) as [Element, Change | undefined][]).every(([k, v]) => v === undefined || effect[k] === v),
  );
  const misconceptions = [...new Set(patterns.flatMap((p) => p.misconception ?? []))];
  return { ...ng(patterns.map((p) => p.feedback).join("\n") || undefined, misconceptions[0]), misconceptions };
}

export function gradeCalc(task: TaskOf<"calc">, value: number): GradeResult {
  if (value === task.answer) return ok(task);
  const pattern = task.wrong_patterns.find((p) => p.match === value);
  return ng(pattern?.feedback ?? CALC_WRONG, pattern?.misconception);
}

export function gradeTweak(task: TaskOf<"tweak">, outputs: Record<string, number>): GradeResult {
  return outputs[task.goal.output] === task.goal.equals ? ok(task) : ng(`いまの${task.goal.label}は ${outputs[task.goal.output]?.toLocaleString("ja-JP")} 円です。条件を動かして ${task.goal.equals.toLocaleString("ja-JP")} 円にしてみましょう。`);
}

export interface ClassifyResult extends GradeResult {
  // 間違えた科目ごとの説明
  wrong: { account: string; feedback: string; misconception?: string }[];
  // 間違えた科目それぞれの誤解(重複なし)。misconception はこの先頭で、attempts には 1 件だけ保存する
  misconceptions: string[];
}

export function gradeClassify(task: TaskOf<"classify">, placed: Partial<Record<string, Element>>, accounts: ReadonlyMap<string, AccountInfo>): ClassifyResult {
  const wrong: ClassifyResult["wrong"] = [];
  for (const id of task.accounts) {
    const account = accounts.get(id);
    const chosen = placed[id];
    if (!account || chosen === account.element) continue;
    wrong.push({
      account: id,
      misconception: chosen ? task.misconceptions[id]?.[chosen] : undefined,
      feedback: `${account.name}は${ELEMENT_LABELS[account.element]}です。${account.why}`,
    });
  }
  if (wrong.length === 0) return { ...ok(task), wrong, misconceptions: [] };
  const misconceptions = [...new Set(wrong.flatMap((w) => w.misconception ?? []))];
  return { ...ng(`${wrong.length} 個の科目が別の箱に入っています。`, misconceptions[0]), wrong, misconceptions };
}
