import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "tutorial-state";
const stored = () => JSON.parse(localStorage.getItem(KEY) ?? "null");

// cache はモジュール変数なので、テストごとに読み込み直して「タブを開いた直後」にする
async function openTab() {
  vi.resetModules();
  return import("./tutorial-store");
}

describe("別タブが変えた tutorial-state", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("storage イベントが届く前の更新でも、別タブの enabled: false を潰さない", async () => {
    const { updateTutorial, useTutorialState } = await openTab();
    const { unmount } = renderHook(() => useTutorialState());

    localStorage.setItem(KEY, JSON.stringify({ status: "pending", enabled: false }));
    updateTutorial({ status: "skipped" });

    expect(stored()).toEqual({ status: "skipped", enabled: false, seen: [] });
    unmount();
  });

  it("storage イベントで画面の状態が最新になる", async () => {
    const { useTutorialState } = await openTab();
    const { result, unmount } = renderHook(() => useTutorialState());
    expect(result.current.status).toBe("pending");

    localStorage.setItem(KEY, JSON.stringify({ status: "done", enabled: true }));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    });

    expect(result.current.status).toBe("done");
    unmount();
  });

  it("別タブの localStorage.clear()(key が null)でも読み直す", async () => {
    localStorage.setItem(KEY, JSON.stringify({ status: "done", enabled: true }));
    const { useTutorialState } = await openTab();
    const { result, unmount } = renderHook(() => useTutorialState());
    expect(result.current.status).toBe("done");

    localStorage.clear();
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });

    expect(result.current.status).toBe("pending");
    unmount();
  });

  it("保存できない環境では、ページを開いている間の変更を積み重ねる", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    const { updateTutorial, useTutorialState } = await openTab();
    const { result, unmount } = renderHook(() => useTutorialState());

    act(() => updateTutorial({ enabled: false }));
    act(() => updateTutorial({ status: "skipped" }));

    expect(result.current).toEqual({ status: "skipped", enabled: false, seen: [] });
    unmount();
  });
});
