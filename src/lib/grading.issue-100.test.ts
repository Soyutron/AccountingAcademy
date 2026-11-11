import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #100: 売るときの運賃を書き忘れる・代金に混ぜる誤答に誤答パターンが無く、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";
const AMOUNT_WRONG = "科目は合っています。金額をもう一度確かめましょう。";

describe("返品と運賃 ステップ4(焼き菓子を送る)", () => {
  const task = unitMap.get("merchandise/returns-and-costs")!.steps[3].task;
  if (task.type !== "post") throw new Error("postではない");

  it("運賃を丸ごと書き忘れると、誤解IDなしで運賃の行を促す", () => {
    const result = gradePost(task, {
      debit: [{ account: "accounts_receivable", amount: 30000 }],
      credit: [{ account: "sales", amount: 30000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("運賃");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("運賃を売掛金に上乗せするとshipping_mixed_into_sale", () => {
    const result = gradePost(task, {
      debit: [{ account: "accounts_receivable", amount: 31500 }],
      credit: [
        { account: "sales", amount: 30000 },
        { account: "cash", amount: 1500 },
      ],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("shipping_mixed_into_sale");
    expect(result.feedback).toContain("運賃");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("運賃を売上に足すとshipping_mixed_into_sale", () => {
    const result = gradePost(task, {
      debit: [
        { account: "accounts_receivable", amount: 30000 },
        { account: "shipping_expense", amount: 1500 },
      ],
      credit: [{ account: "sales", amount: 31500 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("shipping_mixed_into_sale");
    expect(result.feedback).toContain("運賃");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("発送費を右に書くとdebit_means_increase", () => {
    const result = gradePost(task, {
      debit: [
        { account: "accounts_receivable", amount: 30000 },
        { account: "cash", amount: 1500 },
      ],
      credit: [
        { account: "sales", amount: 30000 },
        { account: "shipping_expense", amount: 1500 },
      ],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("debit_means_increase");
    expect(result.feedback).toContain("運賃");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("科目が合っていて運賃の金額だけ違うと、書き忘れとは言わず金額の確認を促す", () => {
    const result = gradePost(task, {
      debit: [
        { account: "accounts_receivable", amount: 30000 },
        { account: "shipping_expense", amount: 1000 },
      ],
      credit: [
        { account: "sales", amount: 30000 },
        { account: "cash", amount: 1000 },
      ],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toBe(AMOUNT_WRONG);
  });

  it("代金の金額が違う場合も金額の確認のまま", () => {
    const result = gradePost(task, {
      debit: [
        { account: "accounts_receivable", amount: 20000 },
        { account: "shipping_expense", amount: 1500 },
      ],
      credit: [
        { account: "sales", amount: 20000 },
        { account: "cash", amount: 1500 },
      ],
    });
    expect(result.feedback).toBe(AMOUNT_WRONG);
  });

  it("発送費の行だけ書いて貸借が合わない誤りは、不一致の説明のまま", () => {
    const result = gradePost(task, {
      debit: [
        { account: "accounts_receivable", amount: 30000 },
        { account: "shipping_expense", amount: 1500 },
      ],
      credit: [{ account: "sales", amount: 30000 }],
    });
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("そろっていません");
  });

  it("売上から運賃を引く誤りと左右逆は従来どおり", () => {
    expect(
      gradePost(task, {
        debit: [
          { account: "accounts_receivable", amount: 28500 },
          { account: "shipping_expense", amount: 1500 },
        ],
        credit: [
          { account: "sales", amount: 28500 },
          { account: "cash", amount: 1500 },
        ],
      }).feedback,
    ).toContain("売上から運賃を引きません");
    expect(gradePost(task, { debit: task.answer.credit, credit: task.answer.debit }).misconception).toBe("debit_means_increase");
  });

  it("正解は正解のまま", () => {
    expect(gradePost(task, task.answer).correct).toBe(true);
  });
});
