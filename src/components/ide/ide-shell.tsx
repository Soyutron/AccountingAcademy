"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { type AccountInfo, type Change, type Element, type JournalEntry, ELEMENT_LABELS, ELEMENTS, computeImpact, toChange } from "@/lib/accounting";
import { ElementBadge } from "@/components/element-badge";
import { AccountName } from "@/components/account-name";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { type EditableEntry, emptyEntry, fromJournalEntry, toJournalEntry } from "@/lib/journal-editable";
import { type ClassifyResult, type EffectAnswer, type GradeResult, type Task, gradeCalc, gradeClassify, gradePost, gradePredict, gradeTweak } from "@/lib/grading";
import { evaluateFormula } from "@/lib/formulas";
import { type OpeningLine, computeBalances, diffBalances } from "@/lib/ledger";
import { fetchProgress, recordAttempt, setUnitProgress } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JournalEditor } from "@/components/journal-editor";
import { StatementsPane } from "./statements-pane";
import { ImpactCompare } from "./impact-compare";
import { ClassifyBoard } from "./classify-board";
import { TweakPanel } from "./tweak-panel";

// 会計 IDE の本体。ステップの進行、帳簿(記帳済みの仕訳)、課題の確認と記録をまとめて持つ(docs/ide-design.md)

export interface IdeStep {
  title: string;
  task: Task;
}

export interface IdeUnit {
  id: string;
  title: string;
  company: string;
  opening: OpeningLine[];
  steps: IdeStep[];
  next?: { id: string; title: string };
}

export interface MisconceptionInfo {
  id: string;
  name: string;
  description: string;
  correct: string;
  remediation: { id: string; title: string };
}

interface Props {
  unit: IdeUnit;
  accounts: AccountInfo[];
  misconceptions: Record<string, MisconceptionInfo>;
  // ステップごとの説明文(サーバーで Markdown を描画済み)
  narratives: ReactNode[];
}

interface Posted {
  step: number;
  memo: string;
  entry: JournalEntry;
}

type Pane = "guide" | "work" | "result";

const CHANGE_LABELS: Record<Change, string> = { increase: "増える", decrease: "減る", none: "変わらない" };
const PANES: Pane[] = ["guide", "work", "result"];
const PANE_LABELS: Record<Pane, string> = { guide: "ガイド", work: "ワークスペース", result: "結果" };

/** ステップを飛ばして再開するとき、そこまでの仕訳を課題の答えから復元する */
function replayEntries(steps: IdeStep[], upto: number): Posted[] {
  const posted: Posted[] = [];
  steps.slice(0, upto).forEach((s, i) => {
    const t = s.task;
    if (t.type === "observe") t.entries.forEach((e) => posted.push({ step: i, memo: e.memo ?? s.title, entry: e }));
    if (t.type === "post") posted.push({ step: i, memo: t.transaction, entry: t.answer });
    if (t.type === "predict") posted.push({ step: i, memo: t.transaction, entry: t.entry });
  });
  return posted;
}

export function IdeShell({ unit, accounts, misconceptions, narratives }: Props) {
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const [stepIndex, setStepIndex] = useState(0);
  const [posted, setPosted] = useState<Posted[]>(() => replayEntries(unit.steps, 0));
  const [draft, setDraft] = useState<EditableEntry>(emptyEntry);
  const [effect, setEffect] = useState<Partial<EffectAnswer>>({});
  const [params, setParams] = useState<Record<string, number>>({});
  const [placed, setPlaced] = useState<Partial<Record<string, Element>>>({});
  const [calcValue, setCalcValue] = useState("");
  const [result, setResult] = useState<GradeResult | ClassifyResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [pane, setPane] = useState<Pane>("guide");
  const [resumeStep, setResumeStep] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tweakDone, setTweakDone] = useState(false);
  // 帳簿をさかのぼる: 何件目までの記帳で財務諸表を見るか(null は最新)
  const [viewUpto, setViewUpto] = useState<number | null>(null);

  const step = unit.steps[stepIndex];
  const task = step.task;
  const isLast = stepIndex === unit.steps.length - 1;

  // 前回の続きがあれば案内する
  useEffect(() => {
    fetchProgress()
      .then((p) => {
        const saved = p?.units[unit.id];
        if (saved && saved.step > 0 && saved.step < unit.steps.length) setResumeStep(saved.step);
      })
      .catch((e: Error) => console.error(e));
  }, [unit.id, unit.steps.length]);

  const balancesBefore = useMemo(
    () => computeBalances(unit.opening, posted.filter((p) => p.step < stepIndex).map((p) => p.entry), accountMap),
    [unit.opening, posted, stepIndex, accountMap],
  );
  const balancesNow = useMemo(() => computeBalances(unit.opening, posted.map((p) => p.entry), accountMap), [unit.opening, posted, accountMap]);
  const diff = useMemo(() => diffBalances(balancesBefore, balancesNow), [balancesBefore, balancesNow]);
  // さかのぼり表示中は、その時点の残高と、その 1 件で動いた差分を見せる
  const view = useMemo(() => {
    if (viewUpto === null || viewUpto >= posted.length) return { balances: balancesNow, diff };
    const upto = computeBalances(unit.opening, posted.slice(0, viewUpto).map((p) => p.entry), accountMap);
    const prev = computeBalances(unit.opening, posted.slice(0, Math.max(0, viewUpto - 1)).map((p) => p.entry), accountMap);
    return { balances: upto, diff: viewUpto === 0 ? new Map<string, number>() : diffBalances(prev, upto) };
  }, [viewUpto, posted, balancesNow, diff, unit.opening, accountMap]);

  const save = (fn: () => Promise<void>) => fn().catch((e: Error) => setSaveError(e.message));
  const record = (r: GradeResult, answer: unknown) =>
    save(() => recordAttempt({ unitId: unit.id, exerciseId: `${unit.id}#${stepIndex}`, correct: r.correct, misconceptionId: r.misconception, answer }));

  // 条件を動かすたびに式を評価し、目標に届いた瞬間に 1 回だけ記録する
  const onTweakChange = (values: Record<string, number>) => {
    setParams(values);
    if (task.type !== "tweak" || tweakDone) return;
    const r = gradeTweak(task, evaluateFormula(task.formula, values).outputs);
    if (r.correct) {
      setTweakDone(true);
      setResult(r);
      record(r, values);
    }
  };

  const goTo = (index: number) => {
    const target = unit.steps[index];
    setStepIndex(index);
    setDraft(emptyEntry());
    setEffect({});
    setPlaced({});
    setCalcValue("");
    setParams({});
    setResult(null);
    setAttempts(0);
    setShowHint(false);
    setTweakDone(false);
    setResumeStep(null);
    setViewUpto(null);
    setPane("guide");
    // observe の仕訳はステップに入った時点で自動的に記帳する
    if (target.task.type === "observe" && target.task.entries.length > 0) {
      const entries = target.task.entries;
      setPosted((prev) => (prev.some((p) => p.step === index) ? prev : [...prev, ...entries.map((e) => ({ step: index, memo: e.memo ?? target.title, entry: e }))]));
    }
    const last = index === unit.steps.length - 1;
    save(() => setUnitProgress(unit.id, last ? "completed" : "started", index));
  };

  const resume = () => {
    if (resumeStep === null) return;
    setPosted(replayEntries(unit.steps, resumeStep));
    goTo(resumeStep);
  };

  const entryDraft = toJournalEntry(draft, accounts);
  const draftReady = entryDraft.debit.length > 0 && entryDraft.credit.length > 0;

  const check = () => {
    switch (task.type) {
      case "post": {
        if (!draftReady) return;
        const r = gradePost(task, entryDraft);
        setResult(r);
        setAttempts((n) => n + 1);
        record(r, entryDraft);
        if (r.correct) setPosted((prev) => [...prev, { step: stepIndex, memo: task.transaction, entry: entryDraft }]);
        setPane(r.correct ? "result" : "work");
        break;
      }
      case "predict": {
        if (!ELEMENTS.every((el) => effect[el])) return;
        const r = gradePredict(task, effect as EffectAnswer);
        setResult(r);
        record(r, effect);
        setPosted((prev) => (prev.some((p) => p.step === stepIndex) ? prev : [...prev, { step: stepIndex, memo: task.transaction, entry: task.entry }]));
        setPane("result");
        break;
      }
      case "calc": {
        const n = Number(calcValue.replaceAll(",", ""));
        if (calcValue.trim() === "" || Number.isNaN(n)) return;
        const r = gradeCalc(task, n);
        setResult(r);
        setAttempts((k) => k + 1);
        record(r, n);
        break;
      }
      case "classify": {
        if (task.accounts.some((id) => !placed[id])) return;
        const r = gradeClassify(task, placed, accountMap);
        setResult(r);
        setAttempts((k) => k + 1);
        record(r, placed);
        break;
      }
    }
  };

  const reveal = () => {
    if (task.type === "post") setDraft(fromJournalEntry(task.answer, accountMap));
    if (task.type === "calc") setCalcValue(String(task.answer));
    if (task.type === "classify") setPlaced(Object.fromEntries(task.accounts.map((id) => [id, accountMap.get(id)!.element])));
    setResult(null);
  };

  const postFreely = () => {
    if (!draftReady) return;
    setPosted((prev) => [...prev, { step: stepIndex, memo: "自由に記帳", entry: entryDraft }]);
    setDraft(emptyEntry());
    setPane("result");
  };

  const done =
    task.type === "observe" ||
    (task.type === "tweak" && tweakDone) ||
    (task.type === "predict" && result !== null) ||
    (result?.correct ?? false);
  const hint = "hint" in task ? task.hint : undefined;
  const canReveal = attempts >= 2 && (task.type === "post" || task.type === "calc" || task.type === "classify") && !result?.correct;
  const mis = result?.misconception ? misconceptions[result.misconception] : undefined;

  const paneClass = (p: Pane) => `${pane === p ? "block" : "hidden"} lg:block min-h-0 lg:overflow-y-auto p-4`;

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-49px)]">
      <div className="flex items-center gap-3 border-b px-4 py-2 text-sm">
        <span className="font-semibold truncate">{unit.title}</span>
        <ol className="flex gap-1" aria-label="ステップの進み具合">
          {unit.steps.map((s, i) => (
            <li key={i} aria-current={i === stepIndex ? "step" : undefined} className={`h-2 w-2 rounded-full ${i < stepIndex ? "bg-primary" : i === stepIndex ? "bg-primary/60 ring-2 ring-primary/30" : "bg-muted"}`}>
              <span className="sr-only">{s.title}</span>
            </li>
          ))}
        </ol>
        <span className="text-muted-foreground whitespace-nowrap">
          ステップ {stepIndex + 1} / {unit.steps.length}
        </span>
      </div>

      <div className="lg:hidden grid grid-cols-3 border-b text-sm" role="tablist" aria-label="ペインの切り替え">
        {PANES.map((p, i) => (
          <button
            key={p}
            type="button"
            role="tab"
            id={`tab-${p}`}
            aria-selected={pane === p}
            aria-controls={`pane-${p}`}
            tabIndex={pane === p ? 0 : -1}
            onClick={() => setPane(p)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") setPane(PANES[(i + 1) % PANES.length]);
              if (e.key === "ArrowLeft") setPane(PANES[(i + PANES.length - 1) % PANES.length]);
            }}
            className={`min-h-11 ${pane === p ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
          >
            {PANE_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="grid flex-1 min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)]">
        <section id="pane-guide" role="region" aria-label="ガイド" className={`${paneClass("guide")} lg:border-r`}>
          <h2 className="text-lg font-semibold mb-2">{step.title}</h2>
          {resumeStep !== null && stepIndex === 0 && (
            <div className="mb-3 rounded-md bg-muted/60 p-2 text-sm flex items-center justify-between gap-2">
              <span>前回はステップ {resumeStep + 1} まで進みました。</span>
              <Button size="sm" variant="outline" onClick={resume}>
                続きから
              </Button>
            </div>
          )}
          <div className="prose prose-neutral prose-sm max-w-none">{narratives[stepIndex]}</div>
          <TaskBox task={task} />
          {hint && (
            <div className="mt-3 text-sm">
              {showHint ? (
                <p className="rounded-md bg-amber-50 p-2 text-amber-900">ヒント: {hint}</p>
              ) : (
                <button type="button" className="underline text-muted-foreground" onClick={() => setShowHint(true)}>
                  ヒントを見る
                </button>
              )}
            </div>
          )}
        </section>

        <section id="pane-work" role="region" aria-label="ワークスペース" className={`${paneClass("work")} lg:border-r space-y-4`}>
          {task.type === "post" && (
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                check();
              }}
            >
              <h3 className="text-sm font-semibold">仕訳帳に書く</h3>
              <JournalEditor accounts={accounts} value={draft} onChange={setDraft} readOnly={result?.correct === true} />
              {!result?.correct && (
                <Button type="submit" disabled={!draftReady}>
                  記帳する
                </Button>
              )}
            </form>
          )}
          {task.type === "predict" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">これから記帳する仕訳</h3>
              <JournalEditor accounts={accounts} value={fromJournalEntry(task.entry, accountMap)} readOnly />
              <fieldset disabled={result !== null} className="grid gap-2 sm:grid-cols-5">
                <legend className="text-sm font-semibold mb-1">記帳すると、それぞれどう動くと思いますか</legend>
                {ELEMENTS.map((el) => (
                  <label key={el} className="text-sm space-y-1">
                    <ElementBadge element={el} />
                    <select aria-label={`${ELEMENT_LABELS[el]}の予想`} className="block w-full rounded-md border bg-background px-2 py-1" value={effect[el] ?? ""} onChange={(e) => setEffect({ ...effect, [el]: e.target.value as Change })}>
                      <option value="">選ぶ</option>
                      {(Object.keys(CHANGE_LABELS) as Change[]).map((c) => (
                        <option key={c} value={c}>
                          {CHANGE_LABELS[c]}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </fieldset>
              {result === null && (
                <Button onClick={check} disabled={!ELEMENTS.every((el) => effect[el])}>
                  予想して記帳する
                </Button>
              )}
            </div>
          )}
          {task.type === "tweak" && (
            <TweakPanel formula={task.formula} params={task.params} values={Object.fromEntries(task.params.map((p) => [p.id, params[p.id] ?? p.value]))} onChange={onTweakChange} goal={task.goal} />
          )}
          {task.type === "classify" && (
            <div className="space-y-2">
              <ClassifyBoard accounts={task.accounts.map((id) => accountMap.get(id)!)} placed={placed} onChange={setPlaced} wrong={new Set(result && "wrong" in result ? result.wrong.map((w) => w.account) : [])} disabled={result?.correct === true} />
              {!result?.correct && (
                <Button onClick={check} disabled={task.accounts.some((id) => !placed[id])}>
                  確認する
                </Button>
              )}
            </div>
          )}
          {task.type === "calc" && (
            <form
              className="space-y-2 max-w-xs"
              onSubmit={(e) => {
                e.preventDefault();
                check();
              }}
            >
              <label className="text-sm font-semibold block">
                {task.question}
                <Input inputMode="numeric" className="mt-1" value={calcValue} disabled={result?.correct === true} onChange={(e) => setCalcValue(e.target.value)} placeholder="金額(円)" />
              </label>
              {!result?.correct && (
                <Button type="submit" disabled={calcValue.trim() === ""}>
                  確認する
                </Button>
              )}
            </form>
          )}
          {task.type === "observe" && isLast && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">自由に試す</h3>
              <p className="text-xs text-muted-foreground">好きな取引を記帳して、右の財務諸表がどう動くか確かめてみましょう。</p>
              <JournalEditor accounts={accounts} value={draft} onChange={setDraft} />
              <Button variant="outline" onClick={postFreely} disabled={!draftReady}>
                記帳する
              </Button>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold mb-1">仕訳帳(記帳済み)</h3>
            {posted.length === 0 ? (
              <p className="text-xs text-muted-foreground">まだ記帳はありません。</p>
            ) : (
              <ol className="space-y-1 text-xs">
                {posted.map((p, i) => (
                  <li key={i} className={`rounded border px-2 py-1 ${p.step === stepIndex ? "border-primary/50 bg-primary/5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1" : ""}`}>
                    <div className="text-muted-foreground truncate">{p.memo}</div>
                    <div className="grid grid-cols-2 gap-2 tabular-nums">
                      <div className="space-x-1">
                        {p.entry.debit.map((l, j) => {
                          const a = accountMap.get(l.account);
                          return (
                            <span key={j}>
                              {a ? <AccountName account={a} /> : l.account} {l.amount.toLocaleString("ja-JP")}
                            </span>
                          );
                        })}
                      </div>
                      <div className="text-right space-x-1">
                        {p.entry.credit.map((l, j) => {
                          const a = accountMap.get(l.account);
                          return (
                            <span key={j}>
                              {a ? <AccountName account={a} /> : l.account} {l.amount.toLocaleString("ja-JP")}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <section id="pane-result" role="region" aria-label="結果" className={paneClass("result")}>
          {posted.length > 1 && (
            <div className="mb-3 rounded-md border p-2 text-xs space-y-1">
              <label className="flex items-center justify-between gap-2">
                <span className="font-medium">帳簿をさかのぼる</span>
                <span className="text-muted-foreground tabular-nums">
                  {viewUpto === null || viewUpto >= posted.length ? "最新" : viewUpto === 0 ? "記帳前" : `${viewUpto} 件目まで`}
                </span>
                <input
                  type="range"
                  min={0}
                  max={posted.length}
                  value={viewUpto ?? posted.length}
                  onChange={(e) => setViewUpto(Number(e.target.value) >= posted.length ? null : Number(e.target.value))}
                  className="flex-1"
                  aria-valuetext={viewUpto === null || viewUpto >= posted.length ? "最新" : `${viewUpto} 件目まで`}
                />
              </label>
              {viewUpto !== null && viewUpto < posted.length && (
                <p className="text-muted-foreground">
                  {viewUpto === 0 ? "まだ何も記帳していない状態です。" : `「${posted[viewUpto - 1].memo}」を記帳した直後の姿です。`}
                  <button type="button" className="ml-2 underline" onClick={() => setViewUpto(null)}>
                    最新に戻る
                  </button>
                </p>
              )}
            </div>
          )}
          <StatementsPane accounts={accountMap} balances={view.balances} diff={view.diff} company={unit.company} />
        </section>
      </div>

      <div className="border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm space-y-2 sticky bottom-0 max-h-[50dvh] overflow-y-auto">
        {result && (
          <div role="status" aria-live="polite" className={`rounded-md p-3 space-y-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 ${result.correct ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
            <p className="font-semibold flex items-center gap-1.5">
              {result.correct ? <CheckCircle2 className="size-4" aria-hidden /> : <CircleAlert className="size-4" aria-hidden />}
              {result.correct ? "できました" : "もう一歩"}
            </p>
            <p className="whitespace-pre-wrap">{result.feedback}</p>
            {task.type === "post" && !result.correct && draftReady && (
              <div className="rounded bg-background/70 p-2">
                <ImpactCompare yours={entryDraft} expected={task.answer} accounts={accountMap} />
              </div>
            )}
            {task.type === "predict" && <PredictCompare predicted={effect as EffectAnswer} entry={task.entry} accounts={accountMap} />}
            {"wrong" in result && result.wrong.length > 0 && (
              <ul className="list-disc pl-5 space-y-0.5">
                {result.wrong.map((w) => (
                  <li key={w.account}>{w.feedback}</li>
                ))}
              </ul>
            )}
            {mis && (
              <div className="border-t border-amber-200 pt-2 space-y-1">
                <p className="font-semibold">よくある思い込み: {mis.name}</p>
                <p>{mis.description}</p>
                <p>見方: {mis.correct}</p>
                {mis.remediation.id !== unit.id && (
                  <Link href={`/units/${mis.remediation.id}`} className="underline">
                    解きほぐす単元: {mis.remediation.title}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
        {saveError && (
          <p role="alert" className="text-rose-700">
            保存エラー: {saveError}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {canReveal && (
            <Button variant="ghost" size="sm" onClick={reveal}>
              答えを見る
            </Button>
          )}
          <span className="flex-1" />
          {!done && <span className="text-xs text-muted-foreground">課題ができると次へ進めます</span>}
          {stepIndex > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (draftReady && !result?.correct && !window.confirm("入力中の仕訳は消えます。前のステップに戻りますか?")) return;
                goTo(stepIndex - 1);
              }}
            >
              ← 前へ
            </Button>
          )}
          {!isLast ? (
            <Button aria-disabled={!done} className={done ? "" : "opacity-50"} onClick={() => done && goTo(stepIndex + 1)}>
              次へ →
            </Button>
          ) : unit.next ? (
            <Button asChild>
              <Link href={`/units/${unit.next.id}`}>次の単元: {unit.next.title} →</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/">トップへ戻る</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskBox({ task }: { task: Task }) {
  const content = (() => {
    switch (task.type) {
      case "post":
        return { title: "この取引を仕訳して記帳しましょう", body: task.transaction };
      case "predict":
        return { title: "記帳の前に、どう動くか予想しましょう", body: task.transaction };
      case "tweak":
        return { title: "条件を動かして目標に合わせましょう", body: `${task.goal.label}を ${task.goal.equals.toLocaleString("ja-JP")} 円にする` };
      case "classify":
        return { title: "科目を 5 つの箱に分けましょう", body: null };
      case "calc":
        return { title: "右の結果を読んで答えましょう", body: task.question };
      case "observe":
        return null;
    }
  })();
  if (!content) return null;
  return (
    <div className="mt-4 rounded-md border-l-4 border-primary bg-muted/40 p-3 text-sm">
      <div className="font-semibold">やること: {content.title}</div>
      {content.body && <p className="mt-1">{content.body}</p>}
    </div>
  );
}

function PredictCompare({ predicted, entry, accounts }: { predicted: EffectAnswer; entry: JournalEntry; accounts: ReadonlyMap<string, AccountInfo> }) {
  const impact = computeImpact(entry, accounts);
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-muted-foreground">
          <th scope="col" className="text-left font-normal">要素</th>
          <th scope="col" className="text-right font-normal">あなたの予想</th>
          <th scope="col" className="text-right font-normal">実際</th>
        </tr>
      </thead>
      <tbody>
        {ELEMENTS.map((el) => {
          const actual = toChange(el === "equity" ? impact.equityTotal : impact[el]);
          const differs = predicted[el] !== actual;
          return (
            <tr key={el} className={differs ? "bg-rose-50 font-medium" : ""}>
              <td className="py-0.5"><ElementBadge element={el} size="xs" /></td>
              <td className="text-right">{CHANGE_LABELS[predicted[el]]}</td>
              <td className="text-right">{CHANGE_LABELS[actual]}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
