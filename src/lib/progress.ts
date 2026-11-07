import { createClient } from "./supabase/client";

// 学習者の回答と進捗の保存(docs/architecture.md 3.2 / 5 章)。
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
  // 単元ごとの正解済みステップ index(attempts の correct 行の exercise_id = `${unitId}#${index}`)
  solved: Record<string, number[]>;
  // 単元 → ステップ index → 最後の回答(正誤を問わない)。predict は間違えても進めるので、再開時の復元に使う
  answers: Record<string, Record<number, unknown>>;
  // 誤解 ID ごとの発生回数(立ち止まりの判断に使う)
  misconceptions: Record<string, number>;
}

const supabase = createClient();

// サインイン中だけ Promise を共有し、同時に複数の書き込みが走っても匿名ユーザーを 1 人しか作らない
let signInPromise: Promise<string> | null = null;

// 書き込みのたびに現在のセッションを読む。user_id を持ち続けると、Cookie が消えた・別タブで別のゲストに
// 入れ替わったときに古い user_id で書いて RLS に弾かれ続ける(Issue #14)
async function ensureUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  if (!signInPromise) {
    signInPromise = (async () => {
      const { data: signed, error } = await supabase.auth.signInAnonymously();
      if (error || !signed.user) throw new Error(`匿名サインインに失敗しました: ${error?.message}`);
      return signed.user.id;
    })().finally(() => {
      signInPromise = null;
    });
  }
  return signInPromise;
}

export async function recordAttempt(record: AttemptRecord): Promise<void> {
  const userId = await ensureUserId();
  const { error } = await supabase.from("attempts").insert({
    user_id: userId,
    unit_id: record.unitId,
    exercise_id: record.exerciseId,
    correct: record.correct,
    misconception_id: record.misconceptionId ?? null,
    answer: record.answer,
    content_version: process.env.NEXT_PUBLIC_CONTENT_VERSION ?? "unknown",
  });
  if (error) throw new Error(`回答の保存に失敗しました: ${error.message}`);
}

export async function setUnitProgress(unitId: string, status: UnitStatus, step: number): Promise<void> {
  const userId = await ensureUserId();
  const { error } = await supabase
    .from("unit_progress")
    .upsert({ user_id: userId, unit_id: unitId, status, step, updated_at: new Date().toISOString() });
  if (error) throw new Error(`進捗の保存に失敗しました: ${error.message}`);
}

/** セッションが無ければ null(まだ何も回答していない閲覧者) */
export async function fetchProgress(): Promise<Progress | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const userId = data.session.user.id;
  const [unitsRes, attemptsRes] = await Promise.all([
    supabase.from("unit_progress").select("unit_id,status,step"),
    supabase.from("attempts").select("unit_id,exercise_id,correct,misconception_id,answer").order("created_at"),
  ]);
  if (unitsRes.error) throw new Error(unitsRes.error.message);
  if (attemptsRes.error) throw new Error(attemptsRes.error.message);
  const units: Progress["units"] = {};
  for (const row of unitsRes.data) units[row.unit_id] = { status: row.status as UnitStatus, step: row.step as number };
  const misconceptions: Record<string, number> = {};
  const solved: Progress["solved"] = {};
  const answers: Progress["answers"] = {};
  for (const row of attemptsRes.data) {
    const id = row.misconception_id as string | null;
    if (id) misconceptions[id] = (misconceptions[id] ?? 0) + 1;
    const index = Number((row.exercise_id as string).split("#")[1]);
    const unitId = row.unit_id as string;
    if (!Number.isInteger(index)) continue;
    (answers[unitId] ??= {})[index] = row.answer;
    if (row.correct && !solved[unitId]?.includes(index)) (solved[unitId] ??= []).push(index);
  }
  return { userId, isAnonymous: data.session.user.is_anonymous ?? false, units, misconceptions, solved, answers };
}
