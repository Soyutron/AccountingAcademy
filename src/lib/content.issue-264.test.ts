import { describe, expect, it } from "vitest";
import { sortedPaths } from "./content";

// トップページの学習パスはIDの字母順でなくorder順に並べ、3級合格パスを先に出す
describe("学習パスの並び", () => {
  it("order順で、最初がboki-3", () => {
    expect(sortedPaths.map((p) => p.order)).toEqual([...sortedPaths.map((p) => p.order)].sort((a, b) => a - b));
    expect(sortedPaths[0].id).toBe("boki-3");
  });
});
