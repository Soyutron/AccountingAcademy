import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// 保存値の形が想定外でも、既定の状態として読めて落ちない(Issue #203)

// モジュール内のキャッシュを持ち越さないよう、ケースごとに読み込み直す
async function load(raw: string) {
  localStorage.setItem("tutorial-state", raw);
  vi.resetModules();
  return import("./tutorial-store");
}

describe("tutorial-store の保存値の検査", () => {
  beforeEach(() => localStorage.clear());

  it.each(['{"seen":null}', '{"seen":1}', '{"seen":"predict"}', '{"seen":[1,"calc"]}'])(
    "seen が文字列の配列でない %s は空配列として扱い、markSeen で積める",
    async (raw) => {
      const { markSeen, useTutorialState } = await load(raw);
      const { result } = renderHook(() => useTutorialState());
      expect(result.current.seen).toEqual([]);
      expect(() => markSeen("predict")).not.toThrow();
      expect(JSON.parse(localStorage.getItem("tutorial-state")!).seen).toEqual(["predict"]);
    },
  );

  it.each(["null", "1", '"abc"', "[]"])("保存値がオブジェクトでない %s は既定の状態にする", async (raw) => {
    const { useTutorialState } = await load(raw);
    const { result } = renderHook(() => useTutorialState());
    expect(result.current).toEqual({ status: "pending", enabled: true, seen: [] });
  });

  it("status と enabled が想定外なら既定に戻し、正しい値は残す", async () => {
    const { useTutorialState } = await load(JSON.stringify({ status: "weird", enabled: "yes", seen: ["calc"] }));
    const { result } = renderHook(() => useTutorialState());
    expect(result.current).toEqual({ status: "pending", enabled: true, seen: ["calc"] });
  });
});
