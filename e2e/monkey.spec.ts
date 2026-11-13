import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { attachOracle, db, domFindings, domState } from "../scripts/monkey/session.mjs";

// スクリプト型Monkey(docs/quality-loop.md §4.1 B)。seed付きのPRNGで画面状態に応じた操作をランダムに選び、
// オラクル(不変条件)の違反を探す。LLMを使わないので夜間に大量のseedを回せる。
// 通常のE2Eでは走らない。MONKEY=1 pnpm exec playwright test e2e/monkey.spec.ts [--repeat-each N]
//   MONKEY_SEED=<n>    seedを固定して再現する
//   MONKEY_STEPS=<n>   1 seedの操作数(既定40)
//   MONKEY_SEEDS=<n>   seedの本数(既定3。MONKEY_SEEDがあれば1本)
// 失敗時はseedと操作列を出力し、logs/monkey-scripted/<seed>.logに残す。

test.skip(!process.env.MONKEY, "MONKEY=1で実行する");

type Line = { account: string; amount: number };
type Task =
  | { type: "observe" }
  | { type: "post"; answer: { debit: Line[]; credit: Line[] } }
  | { type: "predict"; answer: Record<string, string> }
  | { type: "tweak"; params: { id: string; label?: string; min: number; max: number; step: number }[] }
  | { type: "classify"; accounts?: string[]; labels?: Record<string, string>; items?: { id: string; label: string; answer: string }[] }
  | { type: "calc"; answer: number };
type Unit = { id: string; title: string; steps: { title: string; task: Task }[] };

const units: Unit[] = JSON.parse(readFileSync(".velite/units.json", "utf8"));
const accounts: { id: string; name: string; element: string }[] = JSON.parse(readFileSync(".velite/accounts.json", "utf8")).accounts;
const nameOf = (id: string) => accounts.find((a) => a.id === id)!.name;
const ELEMENT_LABELS: Record<string, string> = { asset: "資産", liability: "負債", equity: "純資産", revenue: "収益", expense: "費用" };
const CHANGES = ["increase", "decrease", "none"];
// 境界値を混ぜた金額の候補
const AMOUNTS = [0, 1, 100, 1000, 100000, 1000000, 999999999, -500, 1.5, NaN];

// mulberry32。seedから決定的な乱数列を作る
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STEPS = Number(process.env.MONKEY_STEPS ?? 40);
const seeds = process.env.MONKEY_SEED
  ? [Number(process.env.MONKEY_SEED)]
  : Array.from({ length: Number(process.env.MONKEY_SEEDS ?? 3) }, (_, i) => Math.floor(Date.now() / 86_400_000) * 100 + i);

type State = { unit?: Unit; stepIndex?: number; task?: Task; nextEnabled: boolean; posted: number };

async function observe(page: Page): Promise<State> {
  const m = page.url().match(/\/units\/([^/?#]+\/[^/?#]+)/);
  const unit = m ? units.find((u) => u.id === m[1]) : undefined;
  if (!unit) return { nextEnabled: false, posted: 0 };
  const text = (await page.locator("body").innerText().catch(() => "")) ?? "";
  const s = text.match(/ステップ(\d+) \/ (\d+)/);
  const stepIndex = s ? Number(s[1]) - 1 : undefined;
  const next = page.getByRole("button", { name: "次へ →" });
  const nextEnabled = (await next.count()) > 0 && (await next.getAttribute("aria-disabled")) !== "true";
  const posted = await page.getByRole("region", { name: "結果" }).locator("[data-account]").count();
  return { unit, stepIndex, task: stepIndex === undefined ? undefined : unit.steps[stepIndex]?.task, nextEnabled, posted };
}

export const ACTIONS: { name: string; weight: number; when: (s: State) => boolean; run: (page: Page, s: State, rnd: () => number) => Promise<void> }[] = [
  { name: "単元へ移動", weight: 2, when: () => true, run: async (page, _s, rnd) => { await page.goto(`/units/${pick(units, rnd).id}`); await dismiss(page); } },
  { name: "トップ・テーマ・用語集へ移動", weight: 1, when: () => true, run: async (page, _s, rnd) => { await page.goto(pick(["/", "/paths/boki-3", "/glossary", `/topics/${pick(units, rnd).id.split("/")[0]}`], rnd)); } },
  { name: "続きから", weight: 3, when: (s) => !!s.unit, run: async (page) => { const b = page.getByRole("button", { name: "続きから" }); if (await b.isVisible().catch(() => false)) await b.click(); } },
  { name: "次へ", weight: 6, when: (s) => !!s.unit, run: async (page) => { await page.getByRole("button", { name: "次へ →" }).click({ timeout: 3000 }).catch(() => {}); } },
  { name: "前へ", weight: 2, when: (s) => (s.stepIndex ?? 0) > 0, run: async (page) => { page.once("dialog", (d) => d.accept()); await page.getByRole("button", { name: "← 前へ" }).click({ timeout: 3000 }); } },
  { name: "正解で記帳", weight: 4, when: (s) => s.task?.type === "post", run: async (page, s) => {
      const t = s.task as Extract<Task, { type: "post" }>;
      await fill(page, t.answer.debit.map((l) => ({ account: nameOf(l.account), amount: l.amount })), t.answer.credit.map((l) => ({ account: nameOf(l.account), amount: l.amount })));
      await work(page).getByRole("button", { name: "記帳する" }).click({ timeout: 3000 });
    } },
  { name: "でたらめに記帳", weight: 4, when: (s) => s.task?.type === "post", run: async (page, _s, rnd) => {
      const lines = () => Array.from({ length: 1 + Math.floor(rnd() * 2) }, () => ({ account: pick(accounts, rnd).name, amount: pick(AMOUNTS, rnd) }));
      await fill(page, lines(), lines());
      await work(page).getByRole("button", { name: "記帳する" }).click({ timeout: 3000 }).catch(() => {});
    } },
  { name: "記帳を連打", weight: 2, when: (s) => s.task?.type === "post", run: async (page, s) => {
      const t = s.task as Extract<Task, { type: "post" }>;
      await fill(page, t.answer.debit.map((l) => ({ account: nameOf(l.account), amount: l.amount })), t.answer.credit.map((l) => ({ account: nameOf(l.account), amount: l.amount })));
      const btn = work(page).getByRole("button", { name: "記帳する" });
      await Promise.all([btn.click({ timeout: 3000 }), btn.click({ timeout: 3000, force: true }).catch(() => {}), btn.click({ timeout: 3000, force: true }).catch(() => {})]);
    } },
  { name: "予想する", weight: 4, when: (s) => s.task?.type === "predict", run: async (page, s, rnd) => {
      const t = s.task as Extract<Task, { type: "predict" }>;
      for (const el of Object.keys(t.answer)) await work(page).getByLabel(`${ELEMENT_LABELS[el]}の予想`, { exact: true }).selectOption(rnd() < 0.5 ? t.answer[el] : pick(CHANGES, rnd));
      await work(page).getByRole("button", { name: "予想して記帳する" }).click({ timeout: 3000 }).catch(() => {});
    } },
  { name: "仕分ける", weight: 4, when: (s) => s.task?.type === "classify", run: async (page, s, rnd) => {
      const t = s.task as Extract<Task, { type: "classify" }>;
      const board = work(page).getByRole("group", { name: "仕分けボード" });
      // labelsの形は項目の文とその単元の箱で、従来の形は科目名と5要素で動かす(Issue #262)
      const labels = t.labels ?? ELEMENT_LABELS;
      const moves = t.labels
        ? t.items!.map((it) => ({ chip: it.label, answer: it.answer }))
        : t.accounts!.map((id) => {
            const a = accounts.find((x) => x.id === id)!;
            return { chip: a.name, answer: a.element };
          });
      for (const { chip, answer } of moves) {
        const bucket = rnd() < 0.6 ? answer : pick(Object.keys(labels), rnd);
        await board.getByRole("button", { name: chip, exact: true }).click({ timeout: 3000 }).catch(() => {});
        await board.getByRole("button", { name: `${labels[bucket]} ← ここに入れる`, exact: true }).click({ timeout: 3000 }).catch(() => {});
      }
      await work(page).getByRole("button", { name: "確認する" }).click({ timeout: 3000 }).catch(() => {});
    } },
  { name: "金額を答える", weight: 4, when: (s) => s.task?.type === "calc", run: async (page, s, rnd) => {
      const t = s.task as Extract<Task, { type: "calc" }>;
      await work(page).getByPlaceholder("金額(円)").fill(String(rnd() < 0.5 ? t.answer : pick(AMOUNTS, rnd)));
      await work(page).getByRole("button", { name: "確認する" }).click({ timeout: 3000 }).catch(() => {});
    } },
  { name: "条件を変える", weight: 4, when: (s) => s.task?.type === "tweak", run: async (page, s, rnd) => {
      const t = s.task as Extract<Task, { type: "tweak" }>;
      for (const p of t.params) {
        const v = p.min + Math.round((rnd() * (p.max - p.min)) / p.step) * p.step;
        await work(page).getByRole("slider", { name: p.label ?? p.id }).fill(String(v)).catch(() => {});
      }
    } },
  { name: "reload", weight: 3, when: (s) => !!s.unit, run: async (page) => { await page.reload(); await dismiss(page); } },
  { name: "戻る→進む", weight: 1, when: () => true, run: async (page) => { await page.goBack().catch(() => {}); await page.goForward().catch(() => {}); } },
  { name: "用語を開いて閉じる", weight: 3, when: (s) => !!s.unit, run: async (page, _s, rnd) => {
      const terms = page.getByRole("region", { name: "ガイド" }).locator("button[data-slot='popover-trigger'], [data-slot='popover-trigger']");
      const n = await terms.count();
      if (n === 0) return;
      await terms.nth(Math.floor(rnd() * n)).click({ timeout: 3000 }).catch(() => {});
      await page.keyboard.press("Escape");
    } },
  { name: "帳簿をさかのぼる", weight: 2, when: (s) => s.posted > 1, run: async (page, _s, rnd) => {
      const range = page.getByRole("region", { name: "結果" }).locator("input[type=range]");
      if ((await range.count()) === 0) return;
      const max = Number(await range.getAttribute("max"));
      await range.fill(String(Math.floor(rnd() * (max + 1))));
    } },
  { name: "帳簿のタブ切替", weight: 2, when: (s) => !!s.unit, run: async (page, _s, rnd) => { await page.getByRole("tab", { name: pick(["仕訳帳", "総勘定元帳"], rnd) }).click({ timeout: 3000 }).catch(() => {}); } },
  { name: "画面幅を変える", weight: 1, when: () => true, run: async (page, _s, rnd) => {
      await page.setViewportSize(rnd() < 0.5 ? { width: 390, height: 844 } : { width: 1280, height: 800 });
      const tab = page.getByRole("tab", { name: pick(["ガイド", "ワークスペース", "結果"], rnd) });
      if (await tab.isVisible().catch(() => false)) await tab.click();
    } },
  { name: "使い方を開いて閉じる", weight: 1, when: (s) => !!s.unit, run: async (page) => { await page.getByRole("button", { name: "使い方" }).click({ timeout: 3000 }); await page.keyboard.press("Escape"); } },
  { name: "ヒント・答えを見る", weight: 2, when: (s) => !!s.unit, run: async (page) => {
      for (const name of ["ヒントを見る", "答えを見る"]) {
        const b = page.getByRole("button", { name });
        if (await b.isVisible().catch(() => false)) await b.click();
      }
    } },
  { name: "行を増やして消す", weight: 2, when: (s) => s.task?.type === "post", run: async (page, _s, rnd) => {
      const add = work(page).getByRole("button", { name: "行を追加" });
      for (let i = 0; i < 1 + Math.floor(rnd() * 3); i++) await add.nth(Math.floor(rnd() * 2)).click({ timeout: 3000 }).catch(() => {});
      const del = work(page).getByRole("button", { name: "行を削除" });
      const n = await del.count();
      if (n) await del.nth(Math.floor(rnd() * n)).click({ timeout: 3000 }).catch(() => {});
    } },
  { name: "自由に記帳", weight: 1, when: (s) => !!s.unit, run: async (page, _s, rnd) => {
      const b = page.getByRole("button", { name: "自由に記帳" });
      if (!(await b.isVisible().catch(() => false))) return;
      await fill(page, [{ account: pick(accounts, rnd).name, amount: pick(AMOUNTS, rnd) }], [{ account: pick(accounts, rnd).name, amount: pick(AMOUNTS, rnd) }]);
      await b.click({ timeout: 3000 }).catch(() => {});
    } },
];

function pick<T>(xs: readonly T[], rnd: () => number): T { return xs[Math.floor(rnd() * xs.length)]; }
const work = (page: Page) => page.getByRole("region", { name: "ワークスペース" });
async function dismiss(page: Page) {
  // ツアーはハイドレーション後に出る(開発サーバーの初回コンパイルで数秒かかる)ので、チュートリアルの単元では長めに待つ
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  await tour.waitFor({ timeout: /tutorial|tour=1/.test(page.url()) ? 6000 : 800 }).catch(() => {});
  const skip = tour.getByRole("button", { name: /スキップ|閉じる/ });
  if (await skip.first().isVisible().catch(() => false)) await skip.first().click();
  const later = page.getByRole("button", { name: "今はしない" });
  if (await later.isVisible().catch(() => false)) await later.click();
}
async function fill(page: Page, debit: Line[], credit: Line[]) {
  const w = work(page);
  // 1行だけのときの「行を削除」はdisabledなので、押せるものだけを消す
  const del = w.locator("button[aria-label='行を削除']:not([disabled])");
  for (let g = 0; g < 10 && (await del.count()) > 0; g++) await del.first().click({ timeout: 3000 });
  for (const [side, lines] of [["借方", debit], ["貸方", credit]] as const) {
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) await w.getByRole("button", { name: "行を追加" }).nth(side === "借方" ? 0 : 1).click({ timeout: 3000 });
      await w.getByLabel(`${side}の科目${i + 1}`).fill(lines[i].account, { timeout: 3000 });
      await w.getByLabel(`${side}の金額${i + 1}`).fill(Number.isNaN(lines[i].amount) ? "abc" : String(lines[i].amount), { timeout: 3000 });
    }
  }
}
// このゲスト(匿名ユーザー)のattemptsの行数。他のセッションが同じDBを使っていても混ざらないようにuser_idで絞る
async function attemptsCount(page: Page): Promise<number | null> {
  try {
    const uid = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k));
      return key ? (JSON.parse(localStorage.getItem(key) ?? "{}").user?.id ?? null) : null;
    });
    if (!uid) return 0;
    return Number(db(`select count(*) from attempts where user_id = '${uid}'`)[0]?.[0] ?? 0);
  } catch {
    return null;
  }
}

for (const seed of seeds) {
  test(`seed ${seed}`, async ({ page, context }) => {
    test.setTimeout(STEPS * 15_000);
    mkdirSync("logs/monkey-scripted", { recursive: true });
    const logFile = `logs/monkey-scripted/${seed}.log`;
    const rnd = prng(seed);
    const oracle = attachOracle(context);
    const findings: { step: number; action: string; kind: string; detail: string }[] = [];
    const log = (line: string) => appendFileSync(logFile, line + "\n");
    log(`# seed ${seed} / ${STEPS} steps / ${new Date().toISOString()}`);
    await page.goto(`/units/${pick(units, rnd).id}`);
    await dismiss(page);
    let prevName = "";
    for (let step = 1; step <= STEPS; step++) {
      const state = await observe(page);
      const candidates = ACTIONS.filter((a) => a.when(state) && !(a.name === prevName && rnd() < 0.7));
      const total = candidates.reduce((s, a) => s + a.weight, 0);
      let r = rnd() * total;
      const action = candidates.find((a) => (r -= a.weight) < 0) ?? candidates[0];
      prevName = action.name;
      const expectError = /でたらめ|自由に|連打/.test(action.name);
      const isPost = /記帳|予想|仕分ける|金額を答える/.test(action.name);
      const before = isPost ? await attemptsCount(page) : null;
      let actionError = "";
      try {
        await action.run(page, state, rnd);
      } catch (e) {
        actionError = String(e).split("\n")[0].slice(0, 200);
      }
      await page.waitForTimeout(300);
      const dom = await domState(page);
      // 同じ所見の繰り返し(同じ警告が要素ごとに出る等)は1件にまとめる
      const raw = [...oracle.drain(), ...domFindings(dom, { expectError })];
      const key = (f: { kind: string; detail: string }) => `${f.kind}\n${f.detail.slice(0, 80)}`;
      const found = [...new Map(raw.map((f) => [key(f), f])).values()].map((f) => {
        const n = raw.filter((g) => key(g) === key(f)).length;
        return n > 1 ? { ...f, detail: `${f.detail} (×${n})` } : f;
      });
      // 1回の回答操作でattemptsが2行以上増えるのは二重送信
      if (before !== null && !/連打/.test(action.name)) {
        const after = await attemptsCount(page);
        if (after !== null && after - before > 1) found.push({ kind: "attempts-multiplied", detail: `attemptsが${after - before}行増えた` });
      } else if (before !== null) {
        const after = await attemptsCount(page);
        if (after !== null && after - before > 1) found.push({ kind: "double-submit", detail: `連打でattemptsが${after - before}行増えた` });
      }
      log(`${step}\t${action.name}\t${dom.url}\tstep=${state.stepIndex ?? "-"}\t${actionError ? "action-error: " + actionError : ""}\t${found.map((f) => `${f.kind}: ${f.detail}`).join(" | ")}`);
      for (const f of found) findings.push({ step, action: action.name, kind: f.kind, detail: f.detail });
    }
    if (findings.length) {
      await page.screenshot({ path: `logs/monkey-scripted/${seed}-last.png` }).catch(() => {});
      const summary = findings.map((f) => `step ${f.step} [${f.action}] ${f.kind}: ${f.detail}`).join("\n");
      log(`\n## findings\n${summary}`);
      expect(findings, `seed ${seed}で${findings.length}件の所見(再現: MONKEY=1 MONKEY_SEED=${seed} MONKEY_STEPS=${STEPS} pnpm exec playwright test e2e/monkey.spec.ts)\n${summary}`).toHaveLength(0);
    }
  });
}
