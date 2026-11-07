"use client";

import { useSyncExternalStore } from "react";

// チュートリアルの状態。localStorage に持ち、サーバー描画では「表示しない」扱いにして水和のずれを防ぐ

export type TutorialStatus = "pending" | "skipped" | "done";

export interface TutorialState {
  status: TutorialStatus;
  // 初回の案内(バナーと自動開始)を出すか。設定から切り替えられる
  enabled: boolean;
}

const KEY = "tutorial-state";
const DEFAULT: TutorialState = { status: "pending", enabled: true };
const SERVER: TutorialState = { status: "done", enabled: false };
const listeners = new Set<() => void>();
let cache: TutorialState | null = null;

function read(): TutorialState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<TutorialState>) } : DEFAULT;
  } catch {
    cache = DEFAULT;
  }
  return cache;
}

export function updateTutorial(patch: Partial<TutorialState>) {
  cache = { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // 保存できない環境では、このページを開いている間だけ有効
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTutorialState(): TutorialState {
  return useSyncExternalStore(subscribe, read, () => SERVER);
}

export const TUTORIAL_UNIT_ID = "tutorial/first-entry";
