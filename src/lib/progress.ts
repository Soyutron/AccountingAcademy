import { isAuthRetryableFetchError, type Session } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";

// 学習者の回答と進捗の保存(docs/architecture.md 3.2 / 5章)。
// 匿名サインインは閲覧時ではなく最初の書き込みの直前に行う。

export type UnitStatus = "started" | "completed";

export interface AttemptRecord {
  unitId: string;
  exerciseId: string;
  correct: boolean;
  misconceptionId?: string;
  answer: unknown;
}

export interface Progress {
  userId: string;
  isAnonymous: boolean;
  units: Record<string, { status: UnitStatus; step: number }>;
  // 単元ごとの正解済みステップindex(attemptsのcorrect行のexercise_id = `${unitId}#${index}`)
  solved: Record<string, number[]>;
  // 単元 → ステップindex → 最後の回答(正誤を問わない)。predictは間違えても進めるので、再開時の復元に使う
  answers: Record<string, Record<number, unknown>>;
  // 単元 → ステップindex → 誤答の回数。再開時に「答えを見る」の条件(2回誤答)を引き継ぐ(Issue #21)
  wrong: Record<string, Record<number, number>>;
  // 誤解IDごとの発生回数(立ち止まりの判断に使う)
  misconceptions: Record<string, number>;
}

const supabase = createClient();

// サインイン中だけPromiseを共有し、同時に複数の書き込みが走っても匿名ユーザーを1人しか作らない
let signInPromise: Promise<string> | null = null;

// getSession()はCookieの中身を検証しない。refresh_tokenが空で期限切れなら例外を投げ、userが無くてもsessionを返す。
// どちらも使えないので無いものとして扱い、次のサインインでCookieを上書きする(Issue #136)
async function loadSession(): Promise<Session | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user ? data.session : null;
  } catch {
    return null;
  }
}

/** Cookieに書けずセッションを保持できない。再読み込みでは直らないので、他の保存失敗と区別する */
export class CookieBlockedError extends Error {
  name = "CookieBlockedError";
}

function canStoreCookie(): boolean {
  const probe = "cookie-probe=1";
  // サンドボックス化されたiframeなどではdocument.cookieの参照自体が例外になる
  try {
    document.cookie = `${probe}; path=/; SameSite=Lax`;
    const stored = document.cookie.split("; ").includes(probe);
    document.cookie = `${probe}; path=/; SameSite=Lax; max-age=0`;
    return stored;
  } catch {
    return false;
  }
}

async function signIn(): Promise<string> {
  // ロックを待つ間に別タブがサインインしていれば、Cookie経由でそのセッションを使う
  const current = await loadSession();
  if (current) return current.user.id;
  const { data: signed, error } = await supabase.auth.signInAnonymously();
  if (error || !signed.user) throw new Error(`匿名サインインに失敗しました: ${error?.message}`);
  return signed.user.id;
}

// signInPromiseはタブ内でしか共有されず、signInAnonymouslyもタブ間で排他されない(Issue #134)
async function acrossTabs<T>(task: () => Promise<T>): Promise<T> {
  // navigator.locksが無い非セキュアコンテキスト(HTTPのLAN接続など)でも保存は止めない
  if (!navigator.locks) return task();
  return navigator.locks.request("anonymous-sign-in", task);
}

// PostgRESTが401を返した後に呼ぶ。refreshできれば同じユーザーのまま、できなければローカルのセッションを捨てる
async function recoverSession(): Promise<void> {
  await acrossTabs(async () => {
    // ロックを待つ間に別タブや並行した読み書きが直していれば、捨てて上書きしない
    const { error: invalid } = await supabase.auth.getUser();
    if (!invalid) return;
    const { error } = await supabase.auth.refreshSession();
    // 通信やサーバーの失敗ではセッションの無効が確定しないので、ゲストの記録を手放さない
    if (!error || isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500) return;
    await supabase.auth.signOut({ scope: "local" });
  });
}

// 書き込みのたびに現在のセッションを読む。user_idを持ち続けると、Cookieが消えた・別タブで別のゲストに
// 入れ替わったときに古いuser_idで書いてRLSに弾かれ続ける(Issue #14)
async function ensureUserId(): Promise<string> {
  const session = await loadSession();
  if (session) return session.user.id;
  // セッションの置き場はCookieだけなので、書けないままサインインすると保存に使えない匿名ユーザーが書き込みごとに増える。
  // CookieをブロックしたブラウザはWeb Locksも拒否するので、ロックを取る前に確かめる
  if (!canStoreCookie()) throw new CookieBlockedError("Cookieを保存できないため匿名サインインを行いません");
  if (!signInPromise) {
    signInPromise = acrossTabs(signIn).finally(() => {
      signInPromise = null;
    });
  }
  return signInPromise;
}

// 401はトークンが無効という合図。再読み込みしても同じCookieが読まれるだけなので、ここでセッションを立て直して1回やり直す
async function writeAsUser<T extends { status: number }>(write: (userId: string) => PromiseLike<T>): Promise<T> {
  const result = await write(await ensureUserId());
  if (result.status !== 401) return result;
  await recoverSession();
  return write(await ensureUserId());
}

export async function recordAttempt(record: AttemptRecord): Promise<void> {
  const { error } = await writeAsUser((userId) =>
    supabase.from("attempts").insert({
      user_id: userId,
      unit_id: record.unitId,
      exercise_id: record.exerciseId,
      correct: record.correct,
      misconception_id: record.misconceptionId ?? null,
      answer: record.answer,
      content_version: process.env.NEXT_PUBLIC_CONTENT_VERSION ?? "unknown",
    }),
  );
  if (error) throw new Error(`回答の保存に失敗しました: ${error.message}`);
}

export async function setUnitProgress(unitId: string, status: UnitStatus, step: number): Promise<void> {
  const { error } = await writeAsUser((userId) =>
    supabase
      .from("unit_progress")
      .upsert({ user_id: userId, unit_id: unitId, status, step, updated_at: new Date().toISOString() }),
  );
  if (error) throw new Error(`進捗の保存に失敗しました: ${error.message}`);
}

// 後退防止のトリガーがあるので、ステップを減らした単元の範囲外のstepはupsertでは下げられない(Issue #197)
export async function resetOutOfRangeStep(unitId: string, stepCount: number): Promise<void> {
  const { error } = await supabase.rpc("reset_out_of_range_step", { p_unit_id: unitId, p_step_count: stepCount });
  if (error) throw new Error(`進捗の修正に失敗しました: ${error.message}`);
}

// PostgRESTのmax_rows(既定1000)を超えた行はエラーなしで切られる
const ATTEMPTS_PAGE_SIZE = 1000;

// 最後の回答を後勝ちで復元するので、古い順のまま全件読む(Issue #202)。created_atが同時刻でもページがずれないようidでも並べる
async function queryAttempts() {
  const rows: Record<string, unknown>[] = [];
  for (;;) {
    const page = await supabase
      .from("attempts")
      .select("unit_id,exercise_id,correct,misconception_id,answer")
      .order("created_at")
      .order("id")
      .range(rows.length, rows.length + ATTEMPTS_PAGE_SIZE - 1);
    if (page.error) return page;
    rows.push(...page.data);
    if (page.data.length < ATTEMPTS_PAGE_SIZE) return { ...page, data: rows };
  }
}

function queryProgress() {
  return Promise.all([supabase.from("unit_progress").select("unit_id,status,step"), queryAttempts()]);
}

/** セッションが無ければnull(まだ何も回答していない閲覧者) */
export async function fetchProgress(): Promise<Progress | null> {
  let session = await loadSession();
  if (!session) return null;
  let [unitsRes, attemptsRes] = await queryProgress();
  if (unitsRes.status === 401 || attemptsRes.status === 401) {
    await recoverSession();
    // 閲覧だけでユーザーを作らないので、捨てたセッションの代わりは次の書き込みまで作らない
    session = await loadSession();
    if (!session) return null;
    [unitsRes, attemptsRes] = await queryProgress();
  }
  if (unitsRes.error) throw new Error(unitsRes.error.message);
  if (attemptsRes.error) throw new Error(attemptsRes.error.message);
  const units: Progress["units"] = {};
  for (const row of unitsRes.data) units[row.unit_id] = { status: row.status as UnitStatus, step: row.step as number };
  const misconceptions: Record<string, number> = {};
  const solved: Progress["solved"] = {};
  const answers: Progress["answers"] = {};
  const wrong: Progress["wrong"] = {};
  for (const row of attemptsRes.data) {
    const id = row.misconception_id as string | null;
    if (id) misconceptions[id] = (misconceptions[id] ?? 0) + 1;
    const index = Number((row.exercise_id as string).split("#")[1]);
    const unitId = row.unit_id as string;
    if (!Number.isInteger(index)) continue;
    (answers[unitId] ??= {})[index] = row.answer;
    if (row.correct && !solved[unitId]?.includes(index)) (solved[unitId] ??= []).push(index);
    if (!row.correct) (wrong[unitId] ??= {})[index] = (wrong[unitId][index] ?? 0) + 1;
  }
  return { userId: session.user.id, isAnonymous: session.user.is_anonymous ?? false, units, misconceptions, solved, answers, wrong };
}
