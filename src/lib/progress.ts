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
  // 誤解 ID ごとの発生回数(立ち止まりの判断に使う)
  misconceptions: Record<string, number>;
}

const supabase = createClient();

// 同時に複数の書き込みが走っても匿名ユーザーを 1 人しか作らないよう、サインインは 1 つの Promise を共有する
let userIdPromise: Promise<string> | null = null;

function ensureUserId(): Promise<string> {
  if (!userIdPromise) {
    userIdPromise = (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) return data.session.user.id;
      const { data: signed, error } = await supabase.auth.signInAnonymously();
      if (error || !signed.user) throw new Error(`匿名サインインに失敗しました: ${error?.message}`);
      return signed.user.id;
    })().catch((e: Error) => {
      userIdPromise = null;
      throw e;
    });
  }
  return userIdPromise;
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
    supabase.from("attempts").select("misconception_id").not("misconception_id", "is", null),
  ]);
  if (unitsRes.error) throw new Error(unitsRes.error.message);
  if (attemptsRes.error) throw new Error(attemptsRes.error.message);
  const units: Progress["units"] = {};
  for (const row of unitsRes.data) units[row.unit_id] = { status: row.status as UnitStatus, step: row.step as number };
  const misconceptions: Record<string, number> = {};
  for (const row of attemptsRes.data) {
    const id = row.misconception_id as string;
    misconceptions[id] = (misconceptions[id] ?? 0) + 1;
  }
  return { userId, isAnonymous: data.session.user.is_anonymous ?? false, units, misconceptions };
}
