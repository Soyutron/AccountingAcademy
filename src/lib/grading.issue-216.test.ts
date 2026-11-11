import { describe, expect, it } from "vitest";
import type { JournalEntry } from "./accounting";
import { accountMap, unitMap } from "./content";
import { gradeCalc, gradeClassify, gradePost } from "./grading";

// Issue #216: 返品と運賃で、運賃と返品の扱いを取り違えた誤答に誤答パターンが無く、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";
const taskAt = (step: number) => unitMap.get("merchandise/returns-and-costs")!.steps[step - 1].task;
const line = (account: string, amount: number) => ({ account, amount });
const entry = (debit: JournalEntry["debit"], credit: JournalEntry["credit"]): JournalEntry => ({ debit, credit });

const postCases: { name: string; step: number; entry: JournalEntry; misconception?: string; word: string }[] = [
  { name: "運賃まで掛けにする", step: 2, entry: entry([line("purchases", 52000)], [line("accounts_payable", 52000)]), word: "運賃" },
  { name: "返品を繰越商品から減らす", step: 3, entry: entry([line("accounts_payable", 10000)], [line("merchandise_inventory", 10000)]), misconception: "return_as_new_transaction", word: "仕入" },
  { name: "返品を売上と取り違える", step: 3, entry: entry([line("accounts_payable", 10000)], [line("sales", 10000)]), misconception: "return_as_new_transaction", word: "仕入" },
  { name: "買掛金を売掛金と取り違える", step: 3, entry: entry([line("accounts_receivable", 10000)], [line("purchases", 10000)]), misconception: "receivable_payable_confused", word: "買掛金" },
  { name: "運賃をお客さんに請求する", step: 4, entry: entry([line("accounts_receivable", 31500)], [line("sales", 31500)]), misconception: "shipping_mixed_into_sale", word: "運賃" },
  { name: "運賃を売掛金から引く", step: 4, entry: entry([line("accounts_receivable", 28500), line("shipping_expense", 1500)], [line("sales", 30000)]), misconception: "shipping_mixed_into_sale", word: "運賃" },
  { name: "売上の仕訳を書き忘れる", step: 4, entry: entry([line("shipping_expense", 1500)], [line("cash", 1500)]), word: "売掛金" },
  { name: "売掛金を買掛金と取り違える", step: 5, entry: entry([line("sales", 5000)], [line("accounts_payable", 5000)]), misconception: "receivable_payable_confused", word: "売掛金" },
];

describe("返品と運賃の仕訳の誤答", () => {
  it.each(postCases)("$name(ステップ$step)に説明を返す", ({ step, entry: e, misconception, word }) => {
    const task = taskAt(step);
    if (task.type !== "post") throw new Error("postではない");
    const result = gradePost(task, e);
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe(misconception);
    expect(result.feedback).not.toContain(GENERIC);
    expect(result.feedback).toContain(word);
  });

  it("売掛金と売上を運賃込みにした上で運賃の行もあるときは、運賃の行を書いていないとは言わない", () => {
    const task = taskAt(4);
    if (task.type !== "post") throw new Error("postではない");
    const result = gradePost(task, entry([line("accounts_receivable", 31500), line("shipping_expense", 1500)], [line("sales", 31500), line("cash", 1500)]));
    expect(result.misconception).toBe("shipping_mixed_into_sale");
    expect(result.feedback).not.toContain("書き忘れ");
  });
});

describe("今月の仕入の計算(ステップ6)", () => {
  const task = taskAt(6);
  if (task.type !== "calc") throw new Error("calcではない");

  it("返品を足すと、取り消しだと説明する", () => {
    const result = gradeCalc(task, 62000);
    expect(result.misconception).toBe("return_as_new_transaction");
    expect(result.feedback).toContain("返品");
  });

  it("累計からさらに返品を引くと、先月までの分を含むと説明する", () => {
    expect(gradeCalc(task, 122000).feedback).toContain("先月まで");
  });

  it.each([62000, 122000])("%dの説明に正解の金額を書かない", (value) => {
    expect(gradeCalc(task, value).feedback).not.toContain("42,000");
  });
});

describe("分類(ステップ7)", () => {
  const task = taskAt(7);
  if (task.type !== "classify") throw new Error("classifyではない");

  it("売掛金を負債、買掛金を資産に入れると、取り違えの誤解を返す", () => {
    const result = gradeClassify(task, { shipping_expense: "expense", purchases: "expense", accounts_payable: "asset", accounts_receivable: "liability" }, accountMap);
    expect(result.misconceptions).toEqual(["receivable_payable_confused"]);
  });
});
