import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import type { AccountInfo, Element } from "./accounting";
import { gradeClassify } from "./grading";

const raw: AccountInfo[] = parse(readFileSync("content/accounts.yaml", "utf8")).accounts;

describe("勘定科目の説明文(#112)", () => {
  it("すべての科目に具体例がある", () => {
    expect(raw.filter((a) => !a.example?.trim()).map((a) => a.id)).toEqual([]);
  });

  it("whyが文として閉じている", () => {
    expect(raw.filter((a) => !a.why.endsWith("。")).map((a) => a.id)).toEqual([]);
  });

  it("仕分けボードの誤答説明が「だから」で終わらない", () => {
    const placed: Partial<Record<string, Element>> = Object.fromEntries(raw.map((a) => [a.id, a.element === "asset" ? "liability" : "asset"]));
    const task = { type: "classify", accounts: raw.map((a) => a.id), misconceptions: {} } as unknown as Parameters<typeof gradeClassify>[0];
    const { wrong } = gradeClassify(task, placed, new Map(raw.map((a) => [a.id, a])));
    expect(wrong).toHaveLength(raw.length);
    expect(wrong.filter((w) => !w.feedback.endsWith("。")).map((w) => w.account)).toEqual([]);
  });
});
