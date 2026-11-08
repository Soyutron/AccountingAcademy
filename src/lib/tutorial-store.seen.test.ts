import { beforeEach, describe, expect, it } from "vitest";
import { markSeen, updateTutorial, useTutorialState } from "./tutorial-store";
import { renderHook } from "@testing-library/react";

// 初出の案内を見た話題は localStorage に積まれ、古い保存形式(seen 無し)でも読める

describe("tutorial-store seen", () => {
  beforeEach(() => {
    localStorage.clear();
    // キャッシュを捨てるため、別タブの clear と同じ経路を使う
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });

  it("markSeen は重複せずに積む", () => {
    localStorage.setItem("tutorial-state", JSON.stringify({ status: "done", enabled: true }));
    const { result } = renderHook(() => useTutorialState());
    expect(result.current.seen).toEqual([]);
    markSeen("predict");
    markSeen("predict");
    markSeen("tweak");
    expect(JSON.parse(localStorage.getItem("tutorial-state")!).seen).toEqual(["predict", "tweak"]);
  });

  it("他の設定を変えても seen は残る", () => {
    markSeen("calc");
    updateTutorial({ enabled: false });
    expect(JSON.parse(localStorage.getItem("tutorial-state")!)).toEqual({ status: "pending", enabled: false, seen: ["calc"] });
  });
});
