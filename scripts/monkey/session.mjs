// Monkeyテストの操作スクリプトが使うPlaywrightセッション。
// ブラウザを開き、オラクル(不変条件の違反)を自動で集め、スクリーンショットと所見をセッションのディレクトリに残す。
// 使い方は .claude/skills/monkey-test/SKILL.md。
//
//   import { openSession } from "<repo>/scripts/monkey/session.mjs";
//   const s = await openSession({ dir: process.env.MONKEY_SESSION_DIR });
//   await s.page.goto("/units/bookkeeping-basics/five-elements");
//   await s.check("単元を開いた");      // オラクルを評価して所見をoracle.jsonlに追記する
//   await s.shot("opened");             // shots/NN-opened.png
//   await s.close();                    // ストレージ状態をstate.jsonに保存(次のスクリプトも同じゲストになる)

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium, devices } from "@playwright/test";

// リポジトリのroot(package.jsonがある場所)。import.metaはPlaywrightのテストから読み込むと使えないのでcwdから探す
const ROOT = (() => {
  let dir = process.cwd();
  while (!fs.existsSync(path.join(dir, "package.json")) && path.dirname(dir) !== dir) dir = path.dirname(dir);
  return dir;
})();
const BASE_URL = process.env.MONKEY_BASE_URL ?? "http://localhost:3000";
// 開発サーバーが常に出す雑音。異常として扱わない。
const CONSOLE_NOISE = [/Download the React DevTools/, /\[Fast Refresh\]/, /\[HMR\]/, /Fast Refresh/];

/**
 * ブラウザコンテキストのページイベントから所見を集める。drain()で回収する。
 * 開発サーバーが常に出す雑音は除く。
 */
export function attachOracle(context) {
  let pending = [];
  const push = (kind, detail) => pending.push({ kind, detail, at: new Date().toISOString() });
  const attach = (page) => {
    page.on("pageerror", (err) => push("pageerror", String(err.message ?? err).slice(0, 500)));
    page.on("console", (msg) => {
      const text = msg.text();
      if (CONSOLE_NOISE.some((re) => re.test(text))) return;
      if (msg.type() === "error") push("console.error", text.slice(0, 500));
      else if (msg.type() === "warning" && /hydrat/i.test(text)) push("hydration", text.slice(0, 500));
    });
    page.on("response", (res) => {
      const url = res.url();
      const status = res.status();
      if (status >= 500) push("http-5xx", `${status} ${res.request().method()} ${url}`);
      // 匿名サインイン後の自分の行に401 / 403が出るのはRLSかトークンの不具合
      else if ((status === 401 || status === 403) && /\/rest\/v1\//.test(url)) push("supabase-denied", `${status} ${res.request().method()} ${url}`);
      else if (status === 404 && /\/_next\/static\//.test(url)) push("static-404", url);
    });
    page.on("requestfailed", (req) => {
      const text = req.failure()?.errorText ?? "";
      if (/ERR_ABORTED/.test(text)) return;
      push("requestfailed", `${text} ${req.method()} ${req.url()}`);
    });
  };
  context.on("page", attach);
  for (const page of context.pages()) attach(page);
  return {
    drain() {
      const found = pending;
      pending = [];
      return found;
    },
  };
}

/** 表示中のページの状態(横スクロール、alert、貸借対照表の合計)を読む。 */
export async function domState(page) {
  try {
    return await page.evaluate(() => {
      const num = (s) => Number(String(s ?? "").replace(/[^\d-]/g, ""));
      const total = (label) => {
        const el = [...document.querySelectorAll("section[aria-label='貸借対照表'] *")].find((e) => e.childElementCount === 0 && e.textContent?.trim() === label);
        const amount = el?.closest("div")?.querySelector(".tabular-nums")?.textContent;
        return amount == null ? null : num(amount);
      };
      const bs = document.querySelector("section[aria-label='貸借対照表']");
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        alerts: [...document.querySelectorAll("[role='alert']")].map((e) => e.textContent?.trim()).filter(Boolean),
        unbalancedText: bs?.textContent?.includes("左右の合計が一致していません") ?? false,
        assets: total("資産合計"),
        liabEq: total("負債・純資産合計"),
        url: location.href,
      };
    });
  } catch (e) {
    return { evaluateError: String(e).slice(0, 200), url: page.url() };
  }
}

/** domStateの結果を所見に変換する。expectError: わざと失敗させた操作のときはalertを異常にしない。 */
export function domFindings(dom, { expectError = false } = {}) {
  const found = [];
  if (dom.overflow) found.push({ kind: "horizontal-overflow", detail: `${dom.url}で横スクロールが出ている` });
  if (!expectError && dom.alerts?.length) found.push({ kind: "alert", detail: dom.alerts.join(" / ") });
  if (dom.unbalancedText) found.push({ kind: "statements-unbalanced", detail: "貸借対照表が「左右の合計が一致していません」" });
  if (dom.assets != null && dom.liabEq != null && dom.assets !== dom.liabEq) found.push({ kind: "statements-mismatch", detail: `資産合計${dom.assets} ≠ 負債・純資産合計${dom.liabEq}` });
  return found;
}

/** コンテンツ(.velite)を読む。units / accounts / nameOfを返す。nameOfは単元限定の科目(scenario.accounts)も引く。 */
export function loadContent() {
  const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, ".velite", f), "utf8"));
  const accounts = read("accounts.json").accounts;
  const units = read("units.json");
  const local = units.flatMap((u) => u.scenario.accounts);
  return { units, accounts, nameOf: (id) => (accounts.find((a) => a.id === id) ?? local.find((a) => a.id === id))?.name ?? id };
}

/** ローカルSupabaseにSQLを流し、行をタブ区切りの配列で返す。 */
export function db(sql) {
  const out = execFileSync("docker", ["exec", "-i", "supabase_db_openboki", "psql", "-U", "postgres", "-d", "postgres", "-Atc", sql], { encoding: "utf8" });
  return out.trim() === "" ? [] : out.trim().split("\n").map((l) => l.split("|"));
}

/**
 * 仕訳エディタにentryを入れる(e2e/learning-loop.spec.tsと同じ手順)。
 * entryは { debit: [{ account: 科目名, amount }], credit: [...] }。残っている行は先に消す。
 */
export async function fillEntry(page, entry) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  // 1行だけのときの「行を削除」はdisabledなので、押せるものだけを消す
  const removable = work.locator("button[aria-label='行を削除']:not([disabled])");
  for (let guard = 0; guard < 10 && (await removable.count()) > 0; guard++) await removable.first().click();
  for (const side of ["借方", "貸方"]) {
    await work.getByLabel(`${side}の科目1`).fill("");
    await work.getByLabel(`${side}の金額1`).fill("");
  }
  for (const [side, lines] of [["借方", entry.debit], ["貸方", entry.credit]]) {
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) await work.getByRole("button", { name: "行を追加" }).nth(side === "借方" ? 0 : 1).click();
      await work.getByLabel(`${side}の科目${i + 1}`).fill(lines[i].account);
      await work.getByLabel(`${side}の金額${i + 1}`).fill(String(lines[i].amount));
    }
  }
}

/**
 * debugの課題を解く。誤りの行(answer.index)を選び、answer.entryを入れて「確認する」を押す(Issue #263)。
 * taskは.velite/units.jsonのステップのtask、nameOfはloadContent()のもの。
 */
export async function solveDebug(page, task, nameOf) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByRole("radio").nth(task.answer.index).check();
  const named = (lines) => lines.map((l) => ({ account: nameOf(l.account), amount: l.amount }));
  await fillEntry(page, { debit: named(task.answer.entry.debit), credit: named(task.answer.entry.credit) });
  await work.getByRole("button", { name: "確認する" }).click();
}

/**
 * セッションを開く。
 *   dir:    所見・スクリーンショット・ストレージ状態の置き場(必須)
 *   mobile: trueならiPhone 13相当(390×844、タッチ)
 *   fresh:  trueならstate.jsonを読まず、新しいゲストとして始める
 *   trace:  trueならtrace.zipを残す(重いので再現確認のときだけ)
 */
export async function openSession({ dir, viewport = { width: 1280, height: 800 }, mobile = false, fresh = false, trace = false } = {}) {
  if (!dir) throw new Error("dir(セッションのディレクトリ)を指定してください");
  fs.mkdirSync(path.join(dir, "shots"), { recursive: true });
  const statePath = path.join(dir, "state.json");
  const oraclePath = path.join(dir, "oracle.jsonl");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...(mobile ? devices["iPhone 13"] : { viewport }),
    baseURL: BASE_URL,
    locale: "ja-JP",
    storageState: !fresh && fs.existsSync(statePath) ? statePath : undefined,
  });
  if (trace) await context.tracing.start({ screenshots: true, snapshots: true });

  const oracle = attachOracle(context);
  const page = await context.newPage();

  let shotIndex = 0;
  const findings = [];

  const api = {
    browser,
    context,
    page,
    findings,
    baseURL: BASE_URL,

    /** スクリーンショットをshots/NN-label.pngに保存し、そのパスを返す。 */
    async shot(label, target = page) {
      const file = path.join(dir, "shots", `${String(++shotIndex).padStart(2, "0")}-${label.replace(/[^\w一-龠ぁ-んァ-ン-]+/g, "_")}.png`);
      await target.screenshot({ path: file });
      return file;
    },

    /**
     * オラクルを評価する。イベント由来の所見に加えて、いま表示中のページの不変条件を見る。
     * 所見をoracle.jsonlに追記して配列で返す(空なら異常なし)。
     *   expectError: 失敗を期待する操作(わざと間違える等)のときはrole=alertの表示を異常にしない
     */
    async check(label, { expectError = false, target = page } = {}) {
      const dom = await domState(target);
      const found = [...oracle.drain(), ...domFindings(dom, { expectError })];
      const record = { label, url: dom.url, at: new Date().toISOString(), findings: found };
      fs.appendFileSync(oraclePath, JSON.stringify(record) + "\n");
      findings.push(...found.map((f) => ({ label, ...f })));
      if (found.length) {
        console.log(`[oracle] ${label}: ${found.length}件`);
        for (const f of found) console.log(`  - ${f.kind}: ${f.detail}`);
      } else {
        console.log(`[oracle] ${label}: 異常なし`);
      }
      return found;
    },

    /** ストレージ状態を保存して閉じる。 */
    async close() {
      try {
        await context.storageState({ path: statePath });
      } catch {}
      if (trace) await context.tracing.stop({ path: path.join(dir, `trace-${Date.now()}.zip`) });
      await browser.close();
    },
  };
  return api;
}
