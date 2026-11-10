import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type CalcTask = { type: string; answer: number; wrong_patterns: { match: number; feedback: string }[] };

function calcTasks(path: string): CalcTask[] {
  return [...readFileSync(path, "utf8").matchAll(/```task\n([\s\S]*?)```/g)]
    .map((m) => parse(m[1]) as CalcTask)
    .filter((task) => task.type === "calc");
}

describe("計算課題の誤答の説明(Issue #182)", () => {
  it.each([
    ["content/topics/receivables-and-payables/loans.md"],
    ["content/topics/merchandise/returns-and-costs.md"],
  ])("%s の feedback に正解の金額を書かない", (path) => {
    const tasks = calcTasks(path);
    expect(tasks.length).toBeGreaterThan(0);
    for (const task of tasks) {
      for (const { feedback } of task.wrong_patterns) {
        expect(feedback).not.toContain(String(task.answer));
        expect(feedback).not.toContain(task.answer.toLocaleString("en-US"));
      }
    }
  });
});
