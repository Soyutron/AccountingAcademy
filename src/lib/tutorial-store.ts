"use client";

import { useSyncExternalStore } from "react";
import { FIRST_TIME_IDS } from "@/lib/help-topics";

// チュートリアルの状態。localStorage に持ち、サーバー描画では「表示しない」扱いにして水和のずれを防ぐ

export type TutorialStatus = "pending" | "skipped" | "done";

export interface TutorialState {
  status: TutorialStatus;
  // 初回の案内(バナーと自動開始)を出すか。設定から切り替えられ、「今はしない」とスキップでも切れる
  enabled: boolean;
  // 初出の案内を閉じた(または課題を済ませた)話題 id
  seen: string[];
}

const KEY = "tutorial-state";
const DEFAULT: TutorialState = { status: "pending", enabled: true, seen: [] };
const SERVER: TutorialState = { status: "done", enabled: false, seen: [...FIRST_TIME_IDS] };
const listeners = new Set<() => void>();
let cache: TutorialState | null = null;
// 保存に失敗した変更は cache にしかないので、読み直して失わないようにする
let unsaved = false;

// 手で書き換えた値や古い形式でも落ちないよう、項目ごとに形を確かめて合わないものは既定に戻す(Issue #203)
function parse(raw: string): TutorialState {
  const value: unknown = JSON.parse(raw);
  if (typeof value !== "object" || value === null || Array.isArray(value)) return DEFAULT;
  const { status, enabled, seen } = value as Record<string, unknown>;
  return {
    status: status === "pending" || status === "skipped" || status === "done" ? status : DEFAULT.status,
    enabled: typeof enabled === "boolean" ? enabled : DEFAULT.enabled,
    seen: Array.isArray(seen) && seen.every((id) => typeof id === "string") ? seen : DEFAULT.seen,
  };
}

function read(): TutorialState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? parse(raw) : DEFAULT;
  } catch {
    cache = DEFAULT;
  }
  return cache;
}

export function updateTutorial(patch: Partial<TutorialState>) {
  // storage イベントが届く前に別タブが書いた値も潰さないよう、書く直前に読み直す
  if (!unsaved) cache = null;
  const current = read();
  // やり直しのツアーをスキップしても、完了の記録は下げない(Issue #81)
  const status = current.status === "done" && patch.status === "skipped" ? "done" : (patch.status ?? current.status);
  cache = { ...current, ...patch, status };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
    unsaved = false;
  } catch {
    // 保存できない環境では、このページを開いている間だけ有効
    unsaved = true;
  }
  listeners.forEach((l) => l());
}

export function markSeen(id: string) {
  const seen = read().seen;
  if (!seen.includes(id)) updateTutorial({ seen: [...seen, id] });
}

// key が null になるのは別タブの localStorage.clear()
function onStorage(e: StorageEvent) {
  if (e.key !== KEY && e.key !== null) return;
  cache = null;
  unsaved = false;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function useTutorialState(): TutorialState {
  return useSyncExternalStore(subscribe, read, () => SERVER);
}

export const TUTORIAL_UNIT_ID = "tutorial/first-entry";
// チュートリアルの次に進む単元。boki-3 パスの先頭
export const FIRST_UNIT_AFTER_TUTORIAL = "bookkeeping-basics/five-elements";
