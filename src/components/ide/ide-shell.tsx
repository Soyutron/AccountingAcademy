"use client";

import Link from "next/link";
import { type MouseEvent, type ReactNode, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import type { GlossaryAccount } from "@/lib/content";
import { type AccountInfo, type Change, type Element, type JournalEntry, type Side, ELEMENT_LABELS, ELEMENTS, computeImpact, toChange } from "@/lib/accounting";
import { splitAmounts } from "@/lib/task-text";
import { ElementBadge } from "@/components/element-badge";
import { AccountName } from "@/components/account-name";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { type EditableEntry, emptyEntry, fromJournalEntry, isIncompleteLine, parseAmount, toJournalEntry } from "@/lib/journal-editable";
import { type ClassifyResult, type EffectAnswer, type GradeResult, type PredictResult, type Task, canRevealAnswer, gradeCalc, gradeClassify, gradePost, gradePredict, gradeTweak, predictElements } from "@/lib/grading";
import { evaluateFormula } from "@/lib/formulas";
import { type OpeningLine, computeBalances, diffBalances } from "@/lib/ledger";
import { CookieBlockedError, fetchProgress, recordAttempt, resetOutOfRangeStep, setUnitProgress } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JournalEditor } from "@/components/journal-editor";
import { StatementsPane } from "./statements-pane";
import { ImpactCompare } from "./impact-compare";
import { ClassifyBoard } from "./classify-board";
import { TweakPanel } from "./tweak-panel";
import { LedgerTab } from "./ledger-tab";
import { type Flight, FlyingAmounts } from "./flying-amounts";
import { type Burst, Celebration } from "./celebration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TutorialTour } from "./tutorial-tour";
import { HelpDialog } from "./help-dialog";
import { HelpControlsContext, HelpIcon } from "./help-icon";
import { FirstTimeNote } from "./first-time-note";
import { Spotlight } from "./spotlight";
import { type HelpContext, type HelpTopic, SANDBOX_NOT_SAVED, firstTimeTopic } from "@/lib/help-topics";
import { FIRST_UNIT_AFTER_TUTORIAL, TUTORIAL_UNIT_ID, markSeen, updateTutorial, useTutorialState } from "@/lib/tutorial-store";
import { REPO_URL } from "@/lib/repo";

// 会計IDEの本体。ステップの進行、帳簿(記帳済みの仕訳)、課題の確認と記録をまとめて持つ(docs/ide-design.md)

export interface IdeStep {
  title: string;
  task: Task;
}

export interface IdeUnit {
  id: string;
  title: string;
  // リポジトリのルートからのMarkdownのパス
  sourcePath: string;
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
  // isLater: 案内先がいまの単元を前提にしている(まだ読めない)
  remediation: { id: string; title: string; isLater: boolean };
}

interface Props {
  unit: IdeUnit;
  accounts: GlossaryAccount[];
  misconceptions: Record<string, MisconceptionInfo>;
  // ステップごとの説明文(サーバーでMarkdownを描画済み)
  narratives: ReactNode[];
  // チュートリアル単元だけに渡す、戻り先にできる単元のidと名前
  returnTitles?: Record<string, string>;
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
// スマホ幅ではフォーカスで画面内へ移したときに、上に固定したタブ列(高さ45px)の下へ潜らせない(Issue #240)
const FOCUS_TARGET_CLASS = "scroll-mt-12 lg:scroll-mt-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

// URLの ?tour=1でチュートリアルを強制的に始める(「使い方」からのやり直し)
const noop = () => () => {};
function readForceTour(): boolean {
  return new URLSearchParams(window.location.search).get("tour") === "1";
}
// 初回バナーから来たときの元の単元id(Issue #224)
function readReturnFrom(): string | null {
  return new URLSearchParams(window.location.search).get("from");
}

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

// 同じタブで単元を離れて戻ったとき(戻る・reload・他ページから)に、離れる前のステップと入力途中の答えを戻す(Issue #83)。
// タブを閉じれば消え、次に開いたときはDBの進捗から「続きから」を出す
interface SessionSnapshot {
  stepIndex: number;
  reached: number;
  posted: Posted[];
  draft: EditableEntry;
  effect: Partial<EffectAnswer>;
  placed: Partial<Record<string, Element>>;
  calcValue: string;
  params: Record<string, number>;
  attempts: number;
  answered: [number, unknown][];
  stepAttempts: [number, number][];
  // 未正解のステップで最後に採点した答え(JSON)。戻したあとも誤答の説明を出し、同じ答えを二重に記録しない
  gradedAnswer: string | null;
}
const sessionKey = (unitId: string) => `ide-session:${unitId}`;
function readSession(unitId: string): SessionSnapshot | null {
  try {
    const raw = window.sessionStorage.getItem(sessionKey(unitId));
    return raw ? (JSON.parse(raw) as SessionSnapshot) : null;
  } catch {
    return null;
  }
}

// ダブルクリックの2回目は、1回目で描画された次のステップや同じ位置の最終ステップのリンクに当たる(Issue #198)。
// ブラウザの数えるクリック回数で見分けるので、キーボード(detail 0)と普通の1回押しは妨げない
function isRepeatedClick(e: MouseEvent<HTMLElement>) {
  return e.detail > 1;
}

export function IdeShell({ unit, accounts, misconceptions, narratives, returnTitles }: Props) {
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const [stepIndex, setStepIndex] = useState(0);
  const [posted, setPosted] = useState<Posted[]>(() => replayEntries(unit.steps, 0));
  const [draft, setDraft] = useState<EditableEntry>(emptyEntry);
  // postを最後に採点したときの仕訳。比較表を採点した答えに固定する(Issue #129)
  const [gradedEntry, setGradedEntry] = useState<JournalEntry | null>(null);
  // 問題文の金額を挿入したあと、描画後にその金額欄へフォーカスとカーソルを戻す
  const amountCaret = useRef<{ field: string; pos: number } | null>(null);
  const autoFocusedAmount = useRef<HTMLInputElement | null>(null);
  const [effect, setEffect] = useState<Partial<EffectAnswer>>({});
  const [params, setParams] = useState<Record<string, number>>({});
  const [placed, setPlaced] = useState<Partial<Record<string, Element>>>({});
  // classifyを最後に採点したときの配置。採点後に移した科目を見分ける(Issue #66)
  const [gradedPlaced, setGradedPlaced] = useState<Partial<Record<string, Element>>>({});
  const [calcValue, setCalcValue] = useState("");
  // calcの入力が金額として読めないときの理由。採点も記録もしない(Issue #43)
  const [calcError, setCalcError] = useState<string | null>(null);
  // 直近の採点結果そのもの。画面に出すのは、これから導出するresult
  const [gradedResult, setResult] = useState<GradeResult | ClassifyResult | PredictResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [pane, setPane] = useState<Pane>("guide");
  // 初回バナーの判定。進捗を読み終えるまではfalseにして、記録のある学習者にバナーが一瞬出ないようにする
  const [noRecord, setNoRecord] = useState(false);
  const [resumeStep, setResumeStep] = useState<number | null>(null);
  // sessionStorageから戻したときは、DBの進捗で「続きから」を出さない(Issue #83)
  const restoredSession = useRef(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [resumeSolved, setResumeSolved] = useState(false);
  // 再開するステップの最後の回答。predictは誤答でも進めるので、その予想を復元する(Issue #10)
  const [resumeAnswer, setResumeAnswer] = useState<unknown>(undefined);
  // 再開するステップの保存済みの誤答回数。未正解なら引き継いで「答えを見る」を離脱前と揃える(Issue #21)
  const [resumeWrong, setResumeWrong] = useState(0);
  // 再開地点より前の、達成済みのステップとその保存済みの答え。「続きから」でansweredに渡す(Issue #175)
  const resumeAnswered = useRef(new Map<number, unknown>());
  const [saveError, setSaveError] = useState<string | null>(null);
  // 保存の成功で消えるsaveErrorとは分ける。読み込み直すまで「続きから」が出ないことを知らせ続ける
  const [loadError, setLoadError] = useState(false);
  const [tweakDone, setTweakDone] = useState(false);
  // 回答を確定したステップ。同一ティックの連打ではstateが更新前なので、refで同期的に弾く
  const answeredStep = useRef<number | null>(null);
  // このセッションで最も先まで進んだステップ。これより前は達成済みなので、見直しから「次へ」で戻れる
  const [reached, setReached] = useState(0);
  // このセッションで正解(predictは回答)したステップとその答え。「← 前へ」で戻ってから戻ってきたときに達成状態を復元する(Issue #16)
  const answered = useRef(new Map<number, unknown>());
  // 離れたステップの誤答回数。「← 前へ」→「次へ →」で戻っても「答えを見る」を離れる前と揃える(Issue #247)
  const stepAttempts = useRef(new Map<number, number>());
  // このステップで最後に採点した答え。同じ答えの連打(ダブルクリック)は1回の回答として扱う(Issue #15)
  const gradedAnswer = useRef<string | null>(null);
  const gradedAt = useRef(0);
  // 同じ答えで押し直した回数。無反応に見えないよう案内を出し、押すたびに出し直す(Issue #178)
  const [repeated, setRepeated] = useState(0);
  // 自由記帳で最後に記帳した下書き。同じ仕訳を入れ直して記帳するのは正当なので、内容ではなくインスタンスで同一ティックの連打を弾く(Issue #158)
  const freePostedDraft = useRef<EditableEntry | null>(null);
  // 保存済みのstep。見直しや案内前の「次へ」で保存するstepを下げないために持つ
  const savedStep = useRef(0);
  const unsavedProgress = useRef(false);
  // 失敗した回答と進捗は最新の1件ずつ持ち、次の保存で再送する。進捗は後勝ちのupsertなので、新しい進捗を送るときは古い方を捨てる
  const failedAttempt = useRef<(() => Promise<void>) | null>(null);
  const failedProgress = useRef<(() => Promise<void>) | null>(null);
  // 帳簿をさかのぼる: 何件目までの記帳で財務諸表を見るか(nullは最新)。記帳したら結果が見えるよう最新に戻す
  const [viewUpto, setViewUpto] = useState<number | null>(null);
  // 取引の流れのアニメーション。記帳が成功した仕訳を次の描画で測って飛ばす
  const [pendingFlight, setPendingFlight] = useState<JournalEntry | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  // 祝福。セッション中に初めてそのステップに正解した、または最後のステップに着いたときだけ出す(復元や再正解では出さない)
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [pulseNext, setPulseNext] = useState(false);
  const celebratedSteps = useRef(new Set<number>());
  // 採点で押したボタンが消えるときは、フォーカスがbodyに落ちないよう結果へ移す(復元や誤答では動かさない)
  const statusBox = useRef<HTMLDivElement>(null);
  const focusStatus = useRef(false);
  // 誤答のとき、直す対象を下部パネルの上へ出す(Issue #180)
  const revealWrong = useRef(false);
  // 「答えを見る」で正解を入れた後、確定ボタンを押すまで次の操作を案内する(Issue #195)
  const [revealed, setRevealed] = useState(false);
  const bottomBar = useRef<HTMLDivElement>(null);
  // 採点を通らずに消えるボタンの移し先(Issue #85)
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const hintText = useRef<HTMLParagraphElement>(null);
  const workPane = useRef<HTMLElement>(null);
  const paneTabs = useRef<HTMLDivElement>(null);
  const rewindSlider = useRef<HTMLInputElement>(null);
  const tutorial = useTutorialState();
  const [helpOpen, setHelpOpen] = useState(false);
  // 「?」の「もっと詳しく」から開いたときに見せる話題
  const [helpFocus, setHelpFocus] = useState<string | null>(null);
  // 「?」やnoteの「くわしく」から開いたときの、閉じたあとのフォーカスの戻り先(Issue #101)
  const helpReturnTo = useRef<HTMLElement | null>(null);
  // 「場所を示す」で光らせている対象(data-tourの値)
  const [spotlight, setSpotlight] = useState<string | null>(null);
  const forceTour = useSyncExternalStore(noop, readForceTour, () => false);
  const isTutorialUnit = unit.id === TUTORIAL_UNIT_ID;
  const [tourExited, setTourExited] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const tourActive = isTutorialUnit && !tourExited && (tutorial.status === "pending" || forceTour || tourKey > 0);
  const returnFrom = useSyncExternalStore(noop, readReturnFrom, () => null);
  const returnTitle = returnFrom ? returnTitles?.[returnFrom] : undefined;
  const exitTour = () => {
    setTourExited(true);
    if (!forceTour) return;
    // ?tour=1は一度きりの指示。URLに残すとreloadのたびにツアーが始まり直す(Issue #81)
    const url = new URL(window.location.href);
    url.searchParams.delete("tour");
    window.history.replaceState(null, "", url);
  };
  const restartTour = () => {
    setPosted(replayEntries(unit.steps, 0));
    answered.current.clear();
    goTo(0);
    setReached(0);
    setTourExited(false);
    setTourKey((k) => k + 1);
  };

  // 新しい行が描画されてから出発点と到着点を測る必要があるので、次のフレームで測る
  useEffect(() => {
    if (!pendingFlight) return;
    const raf = requestAnimationFrame(() => {
      const next: Flight[] = [];
      const measure = (side: "debit" | "credit") =>
        pendingFlight[side].forEach((line, i) => {
          const from = document.querySelector<HTMLElement>(`[data-journal-line="${side}-${i}"]`)?.getBoundingClientRect();
          const to = document.querySelector<HTMLElement>(`[data-account="${line.account}"]`)?.getBoundingClientRect();
          const account = accountMap.get(line.account);
          // どちらかが画面に無い(スマートフォンで別タブ)ときは飛ばさない
          if (!from || !to || !account || to.width === 0 || from.width === 0) return;
          next.push({
            id: `${Date.now()}-${side}-${i}`,
            element: account.element,
            amount: line.amount,
            from: { x: from.left + from.width * 0.6, y: from.top + from.height / 2 - 10 },
            to: { x: to.right - 80, y: to.top },
          });
        });
      measure("debit");
      measure("credit");
      setFlights(next);
      setPendingFlight(null);
    });
    return () => cancelAnimationFrame(raf);
  }, [pendingFlight, accountMap]);

  const step = unit.steps[stepIndex];
  const task = step.task;
  const isLast = stepIndex === unit.steps.length - 1;

  // 前回の続きがあれば案内する
  useEffect(() => {
    fetchProgress()
      .then((p) => {
        setNoRecord(!p || (Object.keys(p.units).length === 0 && Object.keys(p.answers).length === 0));
        const saved = p?.units[unit.id];
        // ステップを減らした単元では保存値が範囲外になる。そのまま持つと最後に着いても完了にならないので無視し、DBの値も戻す(再開できるように)
        if (saved && saved.step < unit.steps.length) savedStep.current = saved.step;
        else if (saved) resetOutOfRangeStep(unit.id, unit.steps.length).catch((e: Error) => console.error(e));
        if (saved && saved.step > 0 && saved.step < unit.steps.length && !restoredSession.current) {
          const answer = p.answers[unit.id]?.[saved.step];
          resumeAnswered.current = new Map(
            Object.entries(p.answers[unit.id] ?? {})
              .map(([i, a]) => [Number(i), a] as const)
              .filter(([i]) => i < saved.step && (p.solved[unit.id]?.includes(i) || unit.steps[i].task.type === "predict")),
          );
          setResumeStep(saved.step);
          setResumeAnswer(answer);
          setResumeWrong(p.wrong[unit.id]?.[saved.step] ?? 0);
          setResumeSolved((p.solved[unit.id]?.includes(saved.step) ?? false) || (unit.steps[saved.step].task.type === "predict" && answer !== undefined));
        }
      })
      .catch((e: Error) => {
        console.error(e);
        setLoadError(true);
      });
  }, [unit.id, unit.steps.length]);

  // 「← 前へ」で戻ってもpostedには後のステップの仕訳が残るので、画面の帳簿と残高は表示中のステップまでで出す
  const visiblePosted = useMemo(() => posted.filter((p) => p.step <= stepIndex), [posted, stepIndex]);
  const balancesBefore = useMemo(
    () => computeBalances(unit.opening, posted.filter((p) => p.step < stepIndex).map((p) => p.entry), accountMap),
    [unit.opening, posted, stepIndex, accountMap],
  );
  const balancesNow = useMemo(() => computeBalances(unit.opening, visiblePosted.map((p) => p.entry), accountMap), [unit.opening, visiblePosted, accountMap]);
  const diff = useMemo(() => diffBalances(balancesBefore, balancesNow), [balancesBefore, balancesNow]);
  // さかのぼり表示中は、その時点の残高と、その1件で動いた差分を見せる
  const view = useMemo(() => {
    if (viewUpto === null || viewUpto >= visiblePosted.length) return { balances: balancesNow, diff };
    const upto = computeBalances(unit.opening, visiblePosted.slice(0, viewUpto).map((p) => p.entry), accountMap);
    const prev = computeBalances(unit.opening, visiblePosted.slice(0, Math.max(0, viewUpto - 1)).map((p) => p.entry), accountMap);
    return { balances: upto, diff: viewUpto === 0 ? new Map<string, number>() : diffBalances(prev, upto) };
  }, [viewUpto, visiblePosted, balancesNow, diff, unit.opening, accountMap]);

  // 失敗の詳細(RLSの英文など)はconsoleに出し、学習者には取るべき行動だけ見せる
  const trySave = async (fn: () => Promise<void>, isAttempt: boolean) => {
    try {
      await fn();
      return null;
    } catch (e) {
      console.error(e);
      // Cookieが書けない間は再送しても失敗するだけなので持ち越さない
      if (!(e instanceof CookieBlockedError)) (isAttempt ? failedAttempt : failedProgress).current = fn;
      return e;
    }
  };
  const save = async (fn: () => Promise<void>, isAttempt = false) => {
    const retry = failedAttempt.current;
    const retryProgress = isAttempt ? failedProgress.current : null;
    failedAttempt.current = null;
    failedProgress.current = null;
    // 再開時は最後の回答が勝つので、再送を先に終えてから新しい保存を送る
    const retryFailure = retry ? await trySave(retry, true) : null;
    // 進捗の再送は回答の後に送る。回答の保存で匿名サインインした直後でも同じユーザーで書ける
    const failure = await trySave(fn, isAttempt);
    const progressFailure = retryProgress ? await trySave(retryProgress, false) : null;
    const error = failure ?? retryFailure ?? progressFailure;
    if (error) {
      setSaveError(
        error instanceof CookieBlockedError
          ? "このブラウザはCookieを保存できないため、進捗を残せません。Cookieを許可すると保存されるようになります。"
          : "保存できませんでした。このまま続けると、次の操作で保存し直します。",
      );
    } else if (!failedAttempt.current && !failedProgress.current) setSaveError(null);
  };
  const celebrate = (index = stepIndex) => {
    if (celebratedSteps.current.has(index)) return;
    celebratedSteps.current.add(index);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const big = index === unit.steps.length - 1;
    setBursts((prev) => [...prev, { id: `${index}-${Date.now()}`, big }]);
    // 最後のステップに「次へ →」は無く、パルスの終わりで戻す相手がいない
    setPulseNext(!big);
  };

  const saveProgress = (top: number) =>
    save(async () => {
      const last = top === unit.steps.length - 1;
      unsavedProgress.current = !(await setUnitProgress(unit.id, last ? "completed" : "started", top));
    });
  // 回答前の進捗は保存されない(Issue #214)ので、最初の回答でサインインしたら、いまの位置もそのユーザーで残す
  // 回答した時点で記録のある学習者になる。別タブのlocalStorage.clearでtutorialがpendingに戻っても初回バナーを出さない(Issue #246)
  const record = (r: GradeResult, answer: unknown) => {
    setNoRecord(false);
    return save(() => recordAttempt({ unitId: unit.id, exerciseId: `${unit.id}#${stepIndex}`, correct: r.correct, misconceptionId: r.misconception, answer }), true).then(() => {
      if (unsavedProgress.current) saveProgress(savedStep.current);
    });
  };

  // 条件を動かすたびに式を評価し、目標に届いた瞬間に1回だけ記録する
  const onTweakChange = (values: Record<string, number>) => {
    setParams(values);
    if (task.type !== "tweak") return;
    const r = gradeTweak(task, evaluateFormula(task.formula, values).outputs);
    // 達成後に値を外したら「できました」を隠す(記録と「次へ →」の有効は達成済みのまま保つ)
    if (tweakDone) {
      setResult(r.correct ? r : null);
      return;
    }
    if (r.correct) {
      // 他の課題種別と同じく状態欄へフォーカスを移し、「次へ →」まで結果ペインの用語を通らずに届くようにする(Issue #200)
      focusStatus.current = true;
      setTweakDone(true);
      setResult(r);
      record(r, values);
      answered.current.set(stepIndex, values);
      celebrate();
    }
  };

  // 正解済み(predictは回答済み)のステップを、その答えで達成状態まで戻す。answerが無いか、正解のあとに重ねた誤答なら模範解答を使う。
  // 使った答えをansweredに登録し、続きからで戻したステップも「← 前へ」→「次へ →」で達成状態に戻せるようにする(Issue #48)
  const restoreStep = (index: number, answer?: unknown) => {
    const t = unit.steps[index].task;
    answeredStep.current = index;
    if (t.type === "post") {
      const saved = answer as JournalEntry | undefined;
      const entry = saved && gradePost(t, saved).correct ? saved : t.answer;
      answered.current.set(index, entry);
      setDraft(fromJournalEntry(entry, accountMap));
      setResult(gradePost(t, entry));
    }
    if (t.type === "predict") {
      const predicted = (answer as EffectAnswer | undefined) ?? (t.answer as EffectAnswer);
      answered.current.set(index, predicted);
      setEffect(predicted);
      setResult(gradePredict(t, predicted));
    }
    if (t.type === "calc") {
      const n = gradeCalc(t, answer as number).correct ? (answer as number) : t.answer;
      answered.current.set(index, n);
      setCalcValue(String(n));
      setResult(gradeCalc(t, n));
    }
    if (t.type === "classify") {
      const saved = answer as Record<string, Element> | undefined;
      const placement = saved && gradeClassify(t, saved, accountMap).correct ? saved : Object.fromEntries(t.accounts.map((id) => [id, accountMap.get(id)!.element]));
      answered.current.set(index, placement);
      setPlaced(placement);
      setResult(gradeClassify(t, placement, accountMap));
    }
    if (t.type === "tweak") {
      setTweakDone(true);
      const values = answer as Record<string, number> | undefined;
      if (values) {
        answered.current.set(index, values);
        setParams(values);
        setResult(gradeTweak(t, evaluateFormula(t.formula, values).outputs));
      }
    }
  };

  const goTo = (index: number) => {
    const target = unit.steps[index];
    setStepIndex(index);
    setDraft(emptyEntry());
    setGradedEntry(null);
    setEffect({});
    setPlaced({});
    setCalcValue("");
    setCalcError(null);
    setParams({});
    setResult(null);
    setRevealed(false);
    stepAttempts.current.set(stepIndex, attempts);
    setAttempts(stepAttempts.current.get(index) ?? 0);
    setShowHint(false);
    setTweakDone(false);
    // 祝福の札は「次へ進める」案内なので、進んだ先のステップに残さない
    setBursts([]);
    setPulseNext(false);
    answeredStep.current = null;
    gradedAnswer.current = null;
    setRepeated(0);
    setViewUpto(null);
    setPane("guide");
    // observeの仕訳はステップに入った時点で自動的に記帳する
    if (target.task.type === "observe" && target.task.entries.length > 0) {
      const entries = target.task.entries;
      setPosted((prev) => (prev.some((p) => p.step === index) ? prev : [...prev, ...entries.map((e) => ({ step: index, memo: e.memo ?? target.title, entry: e }))]));
    }
    const sessionAnswer = answered.current.get(index);
    if (sessionAnswer !== undefined) restoreStep(index, sessionAnswer);
    const top = Math.max(index, reached, savedStep.current);
    setReached(Math.max(index, reached));
    savedStep.current = top;
    saveProgress(top);
  };

  // 「次へ」「前へ」の後はTabが新しいステップから続くよう、見出しへ移す。ツアー中は続きの操作が吹き出しにあるので動かさない
  const stepTo = (index: number) => {
    flushSync(() => goTo(index));
    // observeには正解の瞬間が無いので、最後のステップがobserveの単元は着いた時点を完了の祝福にする(続きからの復元では出さない)
    if (index === unit.steps.length - 1 && unit.steps[index].task.type === "observe") celebrate(index);
    if (!tourActive) stepHeading.current?.focus();
  };

  // 再開するステップを正解済みなら、その答えで達成状態まで戻す(離脱前の「できました」を保つ)
  const resume = () => {
    if (resumeStep === null) return;
    const replayed = replayEntries(unit.steps, resumeSolved ? resumeStep + 1 : resumeStep);
    // 案内はステップ1にいる間は残るので、先に解いた答えがあればそちらを優先する。読み込み時点の保存に無い仕訳も帳簿に残す(Issue #185)
    setPosted((prev) => [...replayed, ...prev.filter((p) => !replayed.some((r) => r.step === p.step))].sort((a, b) => a.step - b.step));
    answered.current = new Map([...resumeAnswered.current, ...answered.current]);
    const solvedInSession = answered.current.has(resumeStep);
    goTo(resumeStep);
    setReached(resumeStep);
    setResumeStep(null);
    // goToがセッション中の答えで達成状態まで戻している。読み込み時点の誤答回数や答えで上書きしない
    if (solvedInSession) return;
    if (!resumeSolved) {
      setAttempts(resumeWrong);
      return;
    }
    // post / calc / classifyは模範解答で戻せる。predictは保存した予想(誤答でも)、tweakは模範解答が無いので達成時の値で戻す
    const type = unit.steps[resumeStep].task.type;
    restoreStep(resumeStep, type === "predict" || type === "tweak" ? resumeAnswer : undefined);
  };

  // サーバー描画はステップ1なので、復元はマウント後に行う。チュートリアルはツアーがステップ1からの台本なので戻さない
  /* eslint-disable react-hooks/set-state-in-effect -- sessionStorageはマウント後にしか読めない */
  useEffect(() => {
    const s = isTutorialUnit ? null : readSession(unit.id);
    if (s && s.stepIndex < unit.steps.length) {
      // 何もしていないステップ1の状態しか無ければ、DBの進捗の「続きから」を出す
      restoredSession.current = s.stepIndex > 0 || s.reached > 0 || s.answered.length > 0;
      answered.current = new Map(s.answered);
      stepAttempts.current = new Map(s.stepAttempts);
      setStepIndex(s.stepIndex);
      setReached(s.reached);
      setPosted(s.posted);
      setAttempts(s.attempts);
      const answer = answered.current.get(s.stepIndex);
      if (answer !== undefined) restoreStep(s.stepIndex, answer);
      else {
        setDraft(s.draft);
        setEffect(s.effect);
        setPlaced(s.placed);
        setCalcValue(s.calcValue);
        setParams(s.params);
        const t = unit.steps[s.stepIndex].task;
        if (s.gradedAnswer && (t.type === "post" || t.type === "calc" || t.type === "classify")) {
          gradedAnswer.current = s.gradedAnswer;
          const graded = JSON.parse(s.gradedAnswer);
          if (t.type === "post") {
            setGradedEntry(graded);
            setResult(gradePost(t, graded, accountMap));
          }
          if (t.type === "calc") setResult(gradeCalc(t, graded));
          if (t.type === "classify") {
            setGradedPlaced(graded);
            setResult(gradeClassify(t, graded, accountMap));
          }
        }
      }
    }
    setSessionLoaded(true);
    // マウント時に1回だけ読む
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  // 読む前に書くと、StrictModeの2回目のマウントや復元前の描画が空の状態で上書きしてしまう
  useEffect(() => {
    if (!sessionLoaded || isTutorialUnit) return;
    const snapshot: SessionSnapshot = {
      stepIndex,
      reached,
      posted,
      draft,
      effect,
      placed,
      calcValue,
      params,
      attempts,
      answered: [...answered.current],
      stepAttempts: [...stepAttempts.current],
      gradedAnswer: answered.current.has(stepIndex) ? null : gradedAnswer.current,
    };
    try {
      window.sessionStorage.setItem(sessionKey(unit.id), JSON.stringify(snapshot));
    } catch {
      // 保存できないブラウザでは従来どおりDBの「続きから」だけで再開する
    }
    // answered・gradedAnswerはrefなので、採点のたびに書き直すためgradedResultとtweakDoneを依存に入れる
  }, [sessionLoaded, isTutorialUnit, unit.id, stepIndex, reached, posted, draft, effect, placed, calcValue, params, attempts, gradedResult, tweakDone]);

  const entryDraft = toJournalEntry(draft, accounts);

  // 問題文の金額を仕訳帳の金額欄に入れる(Issue #7)。フォーカス中の金額欄のカーソル位置に挿入し、
  // どこにもフォーカスが無ければ最初の空の金額欄に入れる。空の欄が無ければ何もしない
  const insertAmount = (digits: string) => {
    const active = document.activeElement;
    let target: { side: Side; index: number; start: number; end: number } | undefined;
    // 直前の挿入でこちらがフォーカスを当てただけの欄は、学習者が選んだ欄として扱わない(Issue #210)
    if (active instanceof HTMLInputElement && active.dataset.amountField && active !== autoFocusedAmount.current) {
      const [side, index] = active.dataset.amountField.split("-");
      const start = active.selectionStart ?? active.value.length;
      target = { side: side as Side, index: Number(index), start, end: active.selectionEnd ?? start };
    } else {
      for (const side of ["debit", "credit"] as const) {
        const index = draft[side].findIndex((l) => l.amount.trim() === "");
        if (index >= 0) {
          target = { side, index, start: 0, end: 0 };
          break;
        }
      }
    }
    if (!target) return;
    const { side, index, start, end } = target;
    const lines = draft[side].map((l, i) => (i === index ? { ...l, amount: l.amount.slice(0, start) + digits + l.amount.slice(end) } : l));
    amountCaret.current = { field: `${side}-${index}`, pos: start + digits.length };
    setDraft({ ...draft, [side]: lines });
    // スマホ幅では金額欄が隠れたままだと、入ったことが画面に出ない(Issue #147)
    setPane("work");
  };
  useEffect(() => {
    const caret = amountCaret.current;
    if (!caret) return;
    amountCaret.current = null;
    const input = document.querySelector<HTMLInputElement>(`[data-amount-field="${caret.field}"]`);
    if (!input) return;
    input.focus();
    input.setSelectionRange(caret.pos, caret.pos);
    autoFocusedAmount.current = input;
    // 学習者が欄を押す・打つ・離れたら、以後はその欄のカーソル位置に挿入する(Issue #7)
    const controller = new AbortController();
    const release = () => {
      if (autoFocusedAmount.current === input) autoFocusedAmount.current = null;
      controller.abort();
    };
    for (const type of ["pointerdown", "keydown", "blur"]) input.addEventListener(type, release, { signal: controller.signal });
  }, [draft]);
  const draftHasBothSides = entryDraft.debit.length > 0 && entryDraft.credit.length > 0;
  const draftIncomplete = [...draft.debit, ...draft.credit].some((l) => isIncompleteLine(l, accounts));
  const draftReady = draftHasBothSides && !draftIncomplete;
  // 何か入れたのに記帳できないとき、足りない側か途中の行を伝える(ボタンが無言で無効のままにならないように。Issue #43, #71)
  const missingSides = [entryDraft.debit.length === 0 && "借方", entryDraft.credit.length === 0 && "貸方"].filter(Boolean);
  const touched = [...draft.debit, ...draft.credit].some((l) => l.accountName.trim() || l.amount.trim());
  // 未確定の行はentryDraftから落ちるので、先に見ないと入力済みの側を「足りない側」と案内してしまう(Issue #97)
  const sideHint = draftReady || !touched ? null : draftIncomplete ? "入力が途中の行があります。科目と金額をそろえるか、その行を削除すると記帳できます。" : `${missingSides.join("と")}にも科目と金額を入れると記帳できます。`;
  const askedElements = task.type === "predict" ? predictElements(task) : ELEMENTS;
  const predictReady = askedElements.every((el) => effect[el]);

  useEffect(() => {
    if (!gradedResult || !focusStatus.current) return;
    focusStatus.current = false;
    statusBox.current?.focus();
  }, [gradedResult]);

  // スマホ幅では誤答の説明でパネルが画面の半分まで伸び、「(間違い)」の科目や「記帳する」がその裏に残る(Issue #180)。
  // lg以上はタブ列がdisplay: none(offsetParentがnull)で、ペインごとにスクロールするので動かさない
  useEffect(() => {
    if (!gradedResult || !revealWrong.current) return;
    revealWrong.current = false;
    const target = workPane.current?.querySelector(task.type === "classify" ? "[data-wrong]" : '[data-tour="post-button"]');
    const bar = bottomBar.current;
    if (!target || !bar || !paneTabs.current?.offsetParent) return;
    const overlap = target.getBoundingClientRect().bottom - bar.getBoundingClientRect().top;
    if (overlap > 0) window.scrollBy({ top: overlap + 8 });
  }, [gradedResult, task.type]);

  // スマホ幅ではペインがページごとスクロールし、タブ列は上に固定される。切り替えた先のペインが固定したタブ列の下に潜らないよう、
  // ペインの先頭がタブ列の真下に来るまで戻す(Issue #169、#240)。lg以上はタブ列がdisplay: noneで何もしない
  const switchPane = (p: Pane) => {
    flushSync(() => setPane(p));
    const tabs = paneTabs.current;
    const section = document.getElementById(`pane-${p}`);
    if (!tabs?.offsetParent || !section) return;
    const hidden = tabs.getBoundingClientRect().bottom - section.getBoundingClientRect().top;
    if (hidden > 0) window.scrollBy({ top: -hidden });
  };
  const showResultPane = () => switchPane("result");

  const check = () => {
    if (answeredStep.current === stepIndex) return;
    // 答えを変えずに押し直したときは採点も記録もしない(答えを変えれば数える)
    const alreadyGraded = (answer: unknown) => {
      const key = JSON.stringify(answer);
      if (gradedAnswer.current === key) {
        // ダブルクリックの2回目まで案内すると、1回しか答えていないのに「同じ答え」と言われる
        if (Date.now() - gradedAt.current > 500) setRepeated((n) => n + 1);
        return true;
      }
      gradedAnswer.current = key;
      gradedAt.current = Date.now();
      setRepeated(0);
      return false;
    };
    switch (task.type) {
      case "post": {
        if (!draftReady || alreadyGraded(entryDraft)) return;
        const r = gradePost(task, entryDraft, accountMap);
        if (r.correct) {
          focusStatus.current = true;
          answeredStep.current = stepIndex;
          answered.current.set(stepIndex, entryDraft);
        }
        setGradedEntry(entryDraft);
        setResult(r);
        setAttempts((n) => n + 1);
        record(r, entryDraft);
        if (r.correct) {
          // 「← 前へ」で戻って再記帳しても、そのステップの仕訳は1件のまま
          setPosted((prev) => (prev.some((p) => p.step === stepIndex) ? prev : [...prev, { step: stepIndex, memo: task.transaction, entry: entryDraft }]));
          setViewUpto(null);
          setPendingFlight(entryDraft);
          celebrate();
        }
        if (r.correct) showResultPane();
        else {
          revealWrong.current = true;
          setPane("work");
        }
        break;
      }
      case "predict": {
        if (!predictReady) return;
        const r = gradePredict(task, effect);
        focusStatus.current = true;
        answeredStep.current = stepIndex;
        answered.current.set(stepIndex, effect);
        setResult(r);
        record(r, effect);
        setPosted((prev) => (prev.some((p) => p.step === stepIndex) ? prev : [...prev, { step: stepIndex, memo: task.transaction, entry: task.entry }]));
        setViewUpto(null);
        setPendingFlight(task.entry);
        if (r.correct) celebrate();
        showResultPane();
        break;
      }
      case "calc": {
        const parsed = parseAmount(calcValue, true);
        if ("reason" in parsed) {
          setCalcError(parsed.reason);
          setResult(null);
          gradedAnswer.current = null;
          return;
        }
        const n = parsed.value;
        if (alreadyGraded(n)) return;
        const r = gradeCalc(task, n);
        if (r.correct) {
          focusStatus.current = true;
          answeredStep.current = stepIndex;
          answered.current.set(stepIndex, n);
        }
        setResult(r);
        setAttempts((k) => k + 1);
        record(r, n);
        if (r.correct) celebrate();
        break;
      }
      case "classify": {
        if (task.accounts.some((id) => !placed[id]) || alreadyGraded(placed)) return;
        const r = gradeClassify(task, placed, accountMap);
        if (r.correct) {
          focusStatus.current = true;
          answeredStep.current = stepIndex;
          answered.current.set(stepIndex, placed);
        }
        if (!r.correct) revealWrong.current = true;
        setGradedPlaced(placed);
        setResult(r);
        setAttempts((k) => k + 1);
        record(r, placed);
        if (r.correct) celebrate();
        break;
      }
    }
  };

  const reveal = () => {
    if (task.type === "post") setDraft(fromJournalEntry(task.answer, accountMap));
    if (task.type === "calc") {
      setCalcValue(String(task.answer));
      setCalcError(null);
    }
    if (task.type === "classify") setPlaced(Object.fromEntries(task.accounts.map((id) => [id, accountMap.get(id)!.element])));
    setResult(null);
    setRevealed(true);
    // 結果の表示を消すので、同じ誤答を入れ直して押したら採点し直して説明を出す(Issue #128)
    gradedAnswer.current = null;
    setRepeated(0);
  };

  // 課題のpostステップは採点が不一致を誤解として返すが、自由記帳には採点が無いのでここで止める(Issue #42)
  const freeBalanced = computeImpact(entryDraft, accountMap).balanced;
  const canPostFreely = freeBalanced && !draftIncomplete;
  const postFreely = () => {
    if (!canPostFreely || freePostedDraft.current === draft) return;
    freePostedDraft.current = draft;
    setPosted((prev) => [...prev, { step: stepIndex, memo: "自由に記帳", entry: entryDraft }]);
    setViewUpto(null);
    markSeen("sandbox");
    setDraft(emptyEntry());
    showResultPane();
  };

  // 採点後に箱を移した科目は採点結果の表示から外し、全部移したら結果も消す(Issue #66)。件数と誤解も残りの科目で出し直す
  const result = ((): typeof gradedResult => {
    if (task.type !== "classify" || !gradedResult || gradedResult.correct) return gradedResult;
    const r = gradeClassify({ ...task, accounts: task.accounts.filter((id) => placed[id] === gradedPlaced[id]) }, placed, accountMap);
    return r.correct ? null : r;
  })();

  const done =
    task.type === "observe" ||
    stepIndex < reached ||
    (task.type === "tweak" && tweakDone) ||
    (task.type === "predict" && result !== null) ||
    (result?.correct ?? false);
  const hint = "hint" in task ? task.hint : undefined;
  const canReveal = attempts >= 2 && canRevealAnswer(task.type) && !result?.correct;
  const revealNote = revealed && !result ? `正解を入れました。「${task.type === "post" ? "記帳する" : "確認する"}」を押すと次へ進めます。` : null;
  const misIds = result && "misconceptions" in result ? result.misconceptions : result?.misconception ? [result.misconception] : [];
  const misList = misIds.flatMap((id) => misconceptions[id] ?? []);
  const helpCtx: HelpContext = { taskType: task.type, postedCount: visiblePosted.length, isLast, hasHint: Boolean(hint) };
  const openHelpTopic = (id: string, returnTo: HTMLElement | null) => {
    helpReturnTo.current = returnTo;
    setHelpFocus(id);
    setHelpOpen(true);
  };
  const showTarget = (topic: HelpTopic) => {
    if (topic.pane) setPane(topic.pane);
    setSpotlight(topic.target ?? null);
  };
  // 初出の案内。チュートリアル単元とツアー中は出さず、再開などで結果が出ているステップでも出さない
  const firstTime = firstTimeTopic(helpCtx);
  const firstTimeDone = gradedResult !== null || tweakDone;
  const showFirstTime = firstTime !== null && !isTutorialUnit && !tourActive && !firstTimeDone && !tutorial.seen.includes(firstTime.id);
  // 課題を済ませたら、案内を閉じていなくても見た扱いにする
  useEffect(() => {
    if (firstTime && firstTimeDone) markSeen(firstTime.id);
  }, [firstTime, firstTimeDone]);

  const onTaskAmount = task.type === "post" && !result?.correct ? insertAmount : undefined;

  // min-w-0: スマホ幅(1列のgrid)で、ペインの中身のmin-content幅が列を押し広げないようにする(Issue #28)
  const paneClass = (p: Pane) => `${pane === p ? "block" : "hidden"} lg:block min-h-0 min-w-0 lg:overflow-y-auto p-4`;

  return (
    <HelpControlsContext value={{ openTopic: openHelpTopic, hidden: tourActive }}>
    <div className="flex flex-col lg:h-[calc(100dvh-49px)]">
      <div className="flex items-center gap-3 border-b px-4 py-2 text-sm">
        <span className="font-semibold truncate">{unit.title}</span>
        {/* 点は縮まないので、スマホ幅ではタイトルを潰し行も溢れさせる。進み具合は隣の「ステップn / N」で分かる(Issue #89) */}
        <ol className="hidden sm:flex gap-1" aria-label="ステップの進み具合" data-tour="steps">
          {unit.steps.map((s, i) => (
            <li key={i} aria-current={i === stepIndex ? "step" : undefined} className={`h-2 w-2 rounded-full ${i < stepIndex ? "bg-primary" : i === stepIndex ? "bg-primary/60 ring-2 ring-primary/30" : "bg-muted"}`}>
              <span className="sr-only">{s.title}</span>
            </li>
          ))}
        </ol>
        <span className="text-muted-foreground whitespace-nowrap">
          ステップ{stepIndex + 1} / {unit.steps.length}
        </span>
        <span className="flex-1" />
        <HelpDialog
          open={helpOpen}
          onOpenChange={(o) => {
            setHelpOpen(o);
            if (!o) setHelpFocus(null);
          }}
          focusTopic={helpFocus}
          returnToRef={helpReturnTo}
          ctx={helpCtx}
          stepLabel={`ステップ${stepIndex + 1}「${step.title}」`}
          onRestartTour={isTutorialUnit ? restartTour : undefined}
          onShowTarget={showTarget}
        />
      </div>

      <div ref={paneTabs} className="lg:hidden sticky top-0 z-30 grid grid-cols-3 border-b bg-background text-sm" role="tablist" aria-label="ペインの切り替え">
        {PANES.map((p, i) => (
          <button
            key={p}
            type="button"
            role="tab"
            id={`tab-${p}`}
            aria-selected={pane === p}
            aria-controls={`pane-${p}`}
            tabIndex={pane === p ? 0 : -1}
            onClick={() => switchPane(p)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") switchPane(PANES[(i + 1) % PANES.length]);
              if (e.key === "ArrowLeft") switchPane(PANES[(i + PANES.length - 1) % PANES.length]);
            }}
            className={`min-h-11 ${pane === p ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
          >
            {PANE_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="grid flex-1 min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)]">
        <section id="pane-guide" role="region" aria-label="ガイド" className={`${paneClass("guide")} bg-surface-guide lg:border-r`} data-tour="guide">
          <h2 ref={stepHeading} tabIndex={-1} className={`text-lg font-semibold mb-2 ${FOCUS_TARGET_CLASS}`}>{step.title}</h2>
          {/* ツアーを抜けたあと、学ぶつもりだった単元へ戻れるようにする。チュートリアルを続ける道も残すので自動では戻さない(Issue #224) */}
          {isTutorialUnit && returnTitle && !tourActive && (
            <p className="mb-3 text-sm">
              <Link href={`/units/${returnFrom}`} className="underline">
                「{returnTitle}」へ戻る
              </Link>
            </p>
          )}
          {!isTutorialUnit && noRecord && tutorial.status !== "done" && tutorial.enabled && (
            <div className="mb-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm flex flex-wrap items-center gap-2" role="note">
              <span className="flex-1">初めてですか? 2分のチュートリアルで、実際に1件記帳しながら使い方を覚えられます。</span>
              <Button size="sm" asChild>
                {/* skippedでもバナーは出るので、statusに頼らずツアーを始める(Issue #165) */}
                <Link href={`/units/${TUTORIAL_UNIT_ID}?tour=1&from=${encodeURIComponent(unit.id)}`}>はじめる</Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  stepHeading.current?.focus();
                  updateTutorial({ status: "skipped", enabled: false });
                }}
              >
                今はしない
              </Button>
            </div>
          )}
          {/* ツアーはステップ0からの台本なので、ツアー中に再開させるとツアーと画面がずれる。
              案内は開いた直後(最初のステップ)だけ出す。自分で進み始めたら学習に集中できるよう消す */}
          {!tourActive && resumeStep !== null && stepIndex === 0 && (
            <div className="mb-3 rounded-md bg-muted/60 p-2 text-sm flex items-center justify-between gap-2">
              <span>前回はステップ{resumeStep + 1}まで進みました。</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // 再開したステップの見出しを読ませるので、描画を終えてから移す
                  flushSync(resume);
                  stepHeading.current?.focus();
                }}
              >
                続きから
              </Button>
            </div>
          )}
          <div className="prose prose-sm max-w-none">{narratives[stepIndex]}</div>
          <TaskBox task={task} onAmount={onTaskAmount} />
          {hint && (
            <div className="mt-3 text-sm" data-tour="hint">
              {showHint ? (
                <p ref={hintText} tabIndex={-1} className={`rounded-md bg-hint p-2 text-hint-fg ${FOCUS_TARGET_CLASS}`}>ヒント: {hint}</p>
              ) : (
                <button
                  type="button"
                  className="underline text-muted-foreground"
                  onClick={() => {
                    flushSync(() => setShowHint(true));
                    hintText.current?.focus();
                  }}
                >
                  ヒントを見る
                </button>
              )}
            </div>
          )}
          <ContributeLinks unit={unit} stepNumber={stepIndex + 1} />
        </section>

        <section ref={workPane} id="pane-work" role="region" aria-label="ワークスペース" tabIndex={-1} className={`${paneClass("work")} bg-surface-work lg:border-r space-y-4 ${FOCUS_TARGET_CLASS}`}>
          {showFirstTime && <FirstTimeNote topic={firstTime} onMore={(button) => openHelpTopic(firstTime.id, button)} onDismiss={() => {
            // 入力欄へ移すとスマートフォンでキーボードが開くので、ペイン自体へ移す
            workPane.current?.focus();
            markSeen(firstTime.id);
          }} />}
          <TaskReminder task={task} onAmount={onTaskAmount} />
          {task.type === "post" && (
            <form
              className="space-y-2"
              data-tour="journal"
              onSubmit={(e) => {
                e.preventDefault();
                check();
              }}
            >
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-semibold">仕訳帳に書く</h3>
                <HelpIcon topic="journal" />
              </div>
              <JournalEditor accounts={accounts} value={draft} onChange={setDraft} readOnly={result?.correct === true} />
              {!result?.correct && (
                <Button type="submit" disabled={!draftReady} data-tour="post-button" aria-describedby={sideHint ? "post-side-hint" : undefined}>
                  記帳する
                </Button>
              )}
              {!result?.correct && sideHint && (
                <p id="post-side-hint" className="text-xs text-muted-foreground">
                  {sideHint}
                </p>
              )}
            </form>
          )}
          {task.type === "predict" && (
            <div className="space-y-3" data-tour="task-predict">
              <h3 className="text-sm font-semibold">これから記帳する仕訳</h3>
              <JournalEditor accounts={accounts} value={fromJournalEntry(task.entry, accountMap)} readOnly showImpact={result !== null} />
              <fieldset disabled={result !== null} className="grid gap-2 sm:grid-cols-5">
                <legend className="text-sm font-semibold mb-1">記帳すると、それぞれどう動くと思いますか</legend>
                {askedElements.map((el) => (
                  <label key={el} className="text-sm space-y-1">
                    <ElementBadge element={el} />
                    <select aria-label={`${ELEMENT_LABELS[el]}の予想`} className="block h-8 w-full rounded-md border bg-background px-2 py-1 text-base md:text-sm" value={effect[el] ?? ""} onChange={(e) => setEffect({ ...effect, [el]: e.target.value as Change })}>
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
                <Button onClick={check} disabled={!predictReady} aria-describedby={predictReady ? undefined : "predict-hint"}>
                  予想して記帳する
                </Button>
              )}
              {result === null && !predictReady && (
                <p id="predict-hint" className="text-xs text-muted-foreground">
                  {askedElements.length === ELEMENTS.length ? "5つすべて選ぶと記帳できます。動かないと思う要素は「変わらない」を選びます。" : "予想を選ぶと記帳できます。動かないと思うなら「変わらない」を選びます。"}
                </p>
              )}
            </div>
          )}
          {task.type === "tweak" && (
            <div data-tour="task-tweak">
            <TweakPanel formula={task.formula} params={task.params} values={Object.fromEntries(task.params.map((p) => [p.id, params[p.id] ?? p.value]))} onChange={onTweakChange} goal={task.goal} />
            </div>
          )}
          {task.type === "classify" && (
            <div className="space-y-2" data-tour="task-classify">
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
              data-tour="task-calc"
              onSubmit={(e) => {
                e.preventDefault();
                check();
              }}
            >
              <label className="text-sm font-semibold block">
                {task.question}
                <Input inputMode="numeric" className="mt-1" value={calcValue} disabled={result?.correct === true} onChange={(e) => {
                    setCalcValue(e.target.value);
                    setCalcError(null);
                  }}
                  aria-invalid={calcError ? true : undefined}
                  aria-describedby={calcError ? "calc-error" : undefined}
                  placeholder="金額(円)"
                />
              </label>
              {!result?.correct && (
                <Button type="submit" disabled={calcValue.trim() === ""}>
                  確認する
                </Button>
              )}
              {calcError && (
                <p id="calc-error" role="status" className="text-xs text-error-fg">
                  {calcError}
                </p>
              )}
            </form>
          )}
          {task.type === "observe" && isLast && (
            <form
              className="space-y-2"
              data-tour="task-sandbox"
              onSubmit={(e) => {
                e.preventDefault();
                postFreely();
              }}
            >
              <h3 className="text-sm font-semibold">自由に試す</h3>
              <p className="text-xs text-muted-foreground">好きな取引を記帳して、結果の財務諸表がどう動くか確かめてみましょう。{SANDBOX_NOT_SAVED}</p>
              <JournalEditor accounts={accounts} value={draft} onChange={setDraft} />
              <Button type="submit" variant="outline" disabled={!canPostFreely} aria-describedby={sideHint ? "free-side-hint" : draftReady && !freeBalanced ? "free-post-hint" : undefined}>
                記帳する
              </Button>
              {sideHint && (
                <p id="free-side-hint" className="text-xs text-muted-foreground">
                  {sideHint}
                </p>
              )}
              {draftReady && !freeBalanced && (
                <p id="free-post-hint" className="text-xs text-muted-foreground">
                  借方と貸方の合計をそろえると記帳できます。
                </p>
              )}
            </form>
          )}

          <Tabs defaultValue="journal">
            <TabsList data-tour="ledger">
              <TabsTrigger value="journal">仕訳帳(記帳済み)</TabsTrigger>
              <TabsTrigger value="ledger">総勘定元帳(T勘定)</TabsTrigger>
            </TabsList>
            <TabsContent value="ledger" className="pt-2">
              <LedgerTab opening={unit.opening} posted={visiblePosted} accounts={accountMap} />
            </TabsContent>
            <TabsContent value="journal" className="pt-2">
            {visiblePosted.length === 0 ? (
              <p className="text-xs text-muted-foreground">まだ記帳はありません。</p>
            ) : (
              <ol className="space-y-1 text-xs">
                {visiblePosted.map((p, i) => (
                  <li key={i} className={`rounded border px-2 py-1 ${p.step === stepIndex ? "border-primary/50 bg-primary/5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1" : ""}`}>
                    <div className="text-muted-foreground">{p.memo}</div>
                    <div className="grid grid-cols-2 gap-2 font-mono tabular-nums">
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
            </TabsContent>
          </Tabs>
        </section>

        <section id="pane-result" role="region" aria-label="結果" className={`${paneClass("result")} bg-surface-result`} data-tour="statements">
          {visiblePosted.length > 1 && (
            <div className="mb-3 rounded-md border p-2 text-xs space-y-1" data-tour="rewind">
              <div className="flex items-center gap-1">
              <label className="flex flex-1 items-center justify-between gap-2">
                <span className="font-medium">帳簿をさかのぼる</span>
                <span className="text-muted-foreground font-mono tabular-nums">
                  {viewUpto === null || viewUpto >= visiblePosted.length ? "最新" : viewUpto === 0 ? "記帳前" : `${viewUpto}件目まで`}
                </span>
                <input
                  ref={rewindSlider}
                  type="range"
                  min={0}
                  max={visiblePosted.length}
                  value={viewUpto ?? visiblePosted.length}
                  onChange={(e) => setViewUpto(Number(e.target.value) >= visiblePosted.length ? null : Number(e.target.value))}
                  className="flex-1"
                  aria-valuetext={viewUpto === null || viewUpto >= visiblePosted.length ? "最新" : `${viewUpto}件目まで`}
                />
              </label>
              <HelpIcon topic="rewind" />
              </div>
              {viewUpto !== null && viewUpto < visiblePosted.length && (
                <p className="text-muted-foreground">
                  {viewUpto === 0 ? "まだ何も記帳していない状態です。" : `「${visiblePosted[viewUpto - 1].memo}」を記帳した直後の姿です。`}
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => {
                      rewindSlider.current?.focus();
                      setViewUpto(null);
                    }}
                  >
                    最新に戻る
                  </button>
                </p>
              )}
            </div>
          )}
          <StatementsPane accounts={accountMap} balances={view.balances} diff={view.diff} company={unit.company} />
        </section>
      </div>

      <FlyingAmounts flights={flights} onDone={(id) => setFlights((prev) => prev.filter((f) => f.id !== id))} />
      <Celebration bursts={bursts} onDone={(id) => setBursts((prev) => prev.filter((b) => b.id !== id))} />
      {spotlight && <Spotlight target={spotlight} onDone={() => setSpotlight(null)} />}
      {tourActive && (
        <TutorialTour
          key={tourKey}
          ctx={{ stepIndex, postedCount: posted.length, debit: entryDraft.debit, credit: entryDraft.credit }}
          pane={pane}
          paneLabels={PANE_LABELS}
          onExit={exitTour}
          onPane={setPane}
        />
      )}
      <div ref={bottomBar} className="border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm flex flex-col gap-2 sticky bottom-0 max-h-[50dvh]">
        {/* 説明が長くても操作行を押し出さないよう、スクロールするのは説明だけにする(Issue #115) */}
        {(result || revealNote || saveError || loadError) && (
          <div className="min-h-0 overflow-y-auto space-y-2 border-b pb-2">
          {revealNote && (
            <p role="status" aria-live="polite" className="rounded-md bg-hint p-3 text-hint-fg">
              {revealNote}
            </p>
          )}
          {result && (
            <div ref={statusBox} tabIndex={-1} role="status" aria-live="polite" className={`rounded-md p-3 space-y-2 focus:outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 ${result.correct ? "bg-ok text-ok-fg" : "bg-hint text-hint-fg"}`}>
              {/* 正解はアイコンと見出しを大きくして、色だけに頼らず「もう一歩」と見分けられるようにする */}
              <p className={`flex items-center gap-1.5 ${result.correct ? "text-base font-bold" : "font-semibold"}`}>
                {result.correct ? <CheckCircle2 className="size-5" aria-hidden /> : <CircleAlert className="size-4" aria-hidden />}
                {result.correct ? "できました" : "もう一歩"}
              </p>
              {!result.correct && repeated > 0 && (
                <p key={repeated} className="font-semibold motion-safe:animate-in motion-safe:fade-in">
                  さっきと同じ答えです。どこかを変えて、もう一度試してみましょう。
                </p>
              )}
              <p className="whitespace-pre-wrap">{result.feedback}</p>
              {task.type === "post" && !result.correct && gradedEntry && (
                <div className="rounded bg-background/70 p-2">
                  <ImpactCompare yours={gradedEntry} expected={task.answer} accounts={accountMap} />
                </div>
              )}
              {task.type === "predict" && <PredictCompare predicted={effect} elements={askedElements} entry={task.entry} accounts={accountMap} />}
              {"wrong" in result && result.wrong.length > 0 && (
                <ul className="list-disc pl-5 space-y-0.5">
                  {result.wrong.map((w) => (
                    <li key={w.account}>{w.feedback}</li>
                  ))}
                </ul>
              )}
              {misList.map((mis) => (
                <div key={mis.id} className="border-t border-hint-fg/20 pt-2 space-y-1">
                  <p className="font-semibold">よくある思い込み: {mis.name}</p>
                  <p>{mis.description}</p>
                  <p>見方: {mis.correct}</p>
                  {mis.remediation.isLater ? (
                    <p>あとの単元「{mis.remediation.title}」で詳しく学びます</p>
                  ) : (
                    mis.remediation.id !== unit.id && (
                      <Link href={`/units/${mis.remediation.id}`} className="underline">
                        解きほぐす単元: {mis.remediation.title}
                      </Link>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
          {saveError && (
            <p role="alert" className="text-error-fg">
              保存エラー: {saveError}
            </p>
          )}
          {loadError && (
            <p role="alert" className="text-error-fg">
              学習の記録を読み込めませんでした。前回の続きから始めるには、ページを再読み込みしてください。
            </p>
          )}
          </div>
        )}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canReveal && (
            <Button variant="ghost" size="sm" onClick={reveal}>
              答えを見る
            </Button>
          )}
          <span className="flex-1" />
          {!done && !revealNote && <span className="text-xs text-muted-foreground">課題ができると次へ進めます</span>}
          {stepIndex > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (touched && !result?.correct && !window.confirm("入力中の仕訳は消えます。前のステップに戻りますか?")) return;
                stepTo(stepIndex - 1);
              }}
            >
              ← 前へ
            </Button>
          )}
          {!isLast ? (
            <Button
              aria-disabled={!done}
              className={done ? (pulseNext ? "animate-next-pulse" : "") : "opacity-50"}
              onAnimationEnd={() => setPulseNext(false)}
              onClick={(e) => done && !isRepeatedClick(e) && stepTo(stepIndex + 1)}
              data-tour="next-button"
            >
              次へ →
            </Button>
          ) : unit.next ? (
            <Button asChild>
              <Link href={`/units/${unit.next.id}`} onClick={(e) => isRepeatedClick(e) && e.preventDefault()}>
                次の単元: {unit.next.title} →
              </Link>
            </Button>
          ) : isTutorialUnit ? (
            <Button asChild>
              {/* ツアーの途中で進むとpendingのまま残り、次の単元で「初めてですか?」と勧めてしまう */}
              <Link
                href={`/units/${FIRST_UNIT_AFTER_TUTORIAL}`}
                onClick={(e) => {
                  if (isRepeatedClick(e)) return e.preventDefault();
                  if (tutorial.status === "pending") updateTutorial({ status: "done" });
                }}
              >
                3級パスの最初の単元へ →
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/">トップへ戻る</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
    </HelpControlsContext>
  );
}

function ContributeLinks({ unit, stepNumber }: { unit: IdeUnit; stepNumber: number }) {
  // unitはテンプレートの入力欄のid。GitHubがURLの値を初期値として埋める
  const reportHref = `${REPO_URL}/issues/new?template=content-error.yml&unit=${encodeURIComponent(`/units/${unit.id} ステップ${stepNumber}`)}`;
  const links = [
    { href: reportHref, label: "誤りを報告", purpose: "GitHubのIssue作成画面" },
    { href: `${REPO_URL}/edit/main/${unit.sourcePath}`, label: "この単元を改善", purpose: "GitHubの編集画面" },
  ];
  return (
    <div className="mt-6 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="py-1 underline">
          {l.label}
          <span className="sr-only">({l.purpose}を新しいタブで開く)</span>
        </a>
      ))}
    </div>
  );
}

function TaskText({ text, onAmount }: { text: string; onAmount?: (digits: string) => void }) {
  if (!onAmount) return text;
  return splitAmounts(text).map((seg, i) =>
    typeof seg === "string" ? (
      seg
    ) : (
      <button
        key={i}
        type="button"
        aria-label={`${seg.text}を仕訳帳に入れる`}
        title="押すと仕訳帳の金額欄に入ります"
        className="rounded-sm border-b border-dashed border-primary/60 px-0.5 font-medium font-mono tabular-nums text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-ring"
        // 金額欄のフォーカスを奪わない(フォーカス中の欄のカーソル位置に入れるため)
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onAmount(seg.digits)}
      >
        {seg.text}
      </button>
    ),
  );
}

function TaskBox({ task, onAmount }: { task: Task; onAmount?: (digits: string) => void }) {
  const content = (() => {
    switch (task.type) {
      case "post":
        return { title: "この取引を仕訳して記帳しましょう", body: task.transaction };
      case "predict":
        return { title: "記帳の前に、どう動くか予想しましょう", body: task.transaction };
      case "tweak":
        return { title: "条件を動かして目標に合わせましょう", body: `${task.goal.label}を${task.goal.equals.toLocaleString("ja-JP")}円にする` };
      case "classify":
        return { title: "科目を5つの箱に分けましょう", body: null };
      case "calc":
        return { title: "金額を答えましょう", body: task.question };
      case "observe":
        return null;
    }
  })();
  if (!content) return null;
  return (
    <div className="mt-4 rounded-md border-l-4 border-primary bg-muted/40 p-3 text-sm">
      <div className="font-semibold">やること: {content.title}</div>
      {content.body && (
        <p className="mt-1">
          <TaskText text={content.body} onAmount={onAmount} />
        </p>
      )}
    </div>
  );
}

// タブ表示の幅ではガイドが隠れるので、入力しながら取引文を読めるようにする(Issue #149)。
// calcとtweakはワークスペースに同じ文が既にあるので対象にしない
function TaskReminder({ task, onAmount }: { task: Task; onAmount?: (digits: string) => void }) {
  if (task.type !== "post" && task.type !== "predict") return null;
  return (
    <p className="rounded-md border-l-4 border-primary bg-muted/40 p-2 text-sm lg:hidden">
      <TaskText text={task.transaction} onAmount={onAmount} />
    </p>
  );
}

function PredictCompare({ predicted, elements, entry, accounts }: { predicted: Partial<EffectAnswer>; elements: readonly Element[]; entry: JournalEntry; accounts: ReadonlyMap<string, AccountInfo> }) {
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
        {elements.map((el) => {
          const actual = toChange(el === "equity" ? impact.equityTotal : impact[el]);
          const differs = predicted[el] !== actual;
          return (
            <tr key={el} className={differs ? "text-diff-fg font-medium" : ""}>
              <td className="py-0.5"><ElementBadge element={el} size="xs" /></td>
              <td className="text-right">{predicted[el] ? CHANGE_LABELS[predicted[el]] : "—"}</td>
              <td className="text-right">{CHANGE_LABELS[actual]}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
