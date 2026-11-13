import type { Unit } from "#content";
import { type AccountInfo, type Change, type Element, type JournalEntry, ELEMENTS, ELEMENT_LABELS, computeImpact, sameEntry } from "./accounting";

// ステップの課題の採点(純粋関数)。正誤だけでなく「どの誤解か」を返す(docs/architecture.md 6章)

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
// 比較表が全行「同じ」になる誤答。表を見直させても手がかりが無いので、科目へ目を向けさせる
const SAME_IMPACT = "5つの要素の動きは合っています。使っている科目を見直しましょう。";
const EXTRA_LINES = "正しい行はそろっています。この取引に含まれない余計な行を消しましょう。";
// 計算問題では記帳しないので、結果の表の動きではなく計算そのものの見直しを促す
const CALC_WRONG = "まだ合っていません。計算の式と、使う数字をもう一度確かめましょう。";
// 予想は1回限りで、回答と同時に記帳される。やり直しではなく実際の動きとの見比べを促す
const PREDICT_WRONG = "予想と実際の動きが違いました。下の表で、どの要素がどう動いたかを見比べましょう。外れても、このまま次へ進めます。";

/** 2回誤答すると「答えを見る」が出る課題か。predictは1回で進み、tweakは目標に合わせるだけなので誤答が重ならない */
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

export function gradePost(task: TaskOf<"post">, entry: JournalEntry, accounts?: ReadonlyMap<string, AccountInfo>): GradeResult {
  const answers = [task.answer, ...task.alternatives];
  if (answers.some((e) => sameEntry(e, entry))) return ok(task);
  const sum = (lines: { amount: number }[]) => lines.reduce((t, l) => t + l.amount, 0);
  const sides = ["debit", "credit"] as const;
  const pattern = task.wrong_patterns.find((p) => {
    const m = p.match;
    // 金額も違う貸借逆を、後ろの金額や科目のパターンに渡さない
    if (m.swapped && !sameAccounts(entry, { debit: task.answer.credit, credit: task.answer.debit })) return false;
    if (m.unbalanced && sum(entry.debit) === sum(entry.credit)) return false;
    return sides.every((side) => {
      const wanted = m[side];
      if (!wanted) return true;
      const named = wanted.every((w) => entry[side].some((l) => (w.account === undefined || l.account === w.account) && (w.amount === undefined || l.amount === w.amount)));
      // 正解にもパターンにも無い行があるなら、このパターンは学習者の誤りを説明していない
      const explained = entry[side].every((l) => wanted.some((w) => w.account === l.account) || answers.some((e) => e[side].some((c) => c.account === l.account)));
      return named && explained;
    });
  });
  if (pattern) return ng(pattern.feedback, pattern.misconception);
  const hasAllLines = (e: JournalEntry) => sides.every((side) => e[side].every((c) => entry[side].some((l) => l.account === c.account && l.amount === c.amount)));
  if (answers.some(hasAllLines)) return ng(EXTRA_LINES);
  if (answers.some((e) => sameAccounts(e, entry))) return ng(AMOUNT_WRONG);
  if (accounts) {
    // 比較表と同じくtask.answerとだけ比べる
    const yours = computeImpact(entry, accounts);
    const expected = computeImpact(task.answer, accounts);
    if (ELEMENTS.every((el) => yours[el] === expected[el])) return ng(SAME_IMPACT);
  }
  return ng();
}

export interface PredictResult extends GradeResult {
  // 外した要素それぞれの誤解(重複なし)。misconceptionはこの先頭で、attemptsには1件だけ保存する
  misconceptions: string[];
}

/** predictで問う要素。elementsが無ければ5要素すべて(Issue #170) */
export function predictElements(task: TaskOf<"predict">): readonly Element[] {
  return task.elements ? ELEMENTS.filter((el) => task.elements!.includes(el)) : ELEMENTS;
}

export function gradePredict(task: TaskOf<"predict">, effect: Partial<EffectAnswer>): PredictResult {
  const keys = predictElements(task);
  if (keys.every((k) => effect[k] === task.answer[k])) return { ...ok(task), misconceptions: [] };
  const patterns = task.wrong_patterns.filter((p) =>
    (Object.entries(p.match) as [Element, Change | undefined][]).every(([k, v]) => v === undefined || effect[k] === v),
  );
  const misconceptions = [...new Set(patterns.flatMap((p) => p.misconception ?? []))];
  return { ...ng(patterns.map((p) => p.feedback).join("\n") || PREDICT_WRONG, misconceptions[0]), misconceptions };
}

export function gradeCalc(task: TaskOf<"calc">, value: number): GradeResult {
  if (value === task.answer) return ok(task);
  const pattern = task.wrong_patterns.find((p) => p.match === value);
  return ng(pattern?.feedback ?? CALC_WRONG, pattern?.misconception);
}

export function gradeTweak(task: TaskOf<"tweak">, outputs: Record<string, number>): GradeResult {
  return outputs[task.goal.output] === task.goal.equals ? ok(task) : ng(`いまの${task.goal.label}は${outputs[task.goal.output]?.toLocaleString("ja-JP")}円です。条件を動かして${task.goal.equals.toLocaleString("ja-JP")}円にしてみましょう。`);
}

export interface ClassifyResult extends GradeResult {
  // 間違えた科目ごとの説明
  wrong: { account: string; feedback: string; misconception?: string }[];
  // 間違えた科目それぞれの誤解(重複なし)。misconceptionはこの先頭で、attemptsには1件だけ保存する
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
  return { ...ng(`${wrong.length}個の科目が別の箱に入っています。`, misconceptions[0]), wrong, misconceptions };
}
