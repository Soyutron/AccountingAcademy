import { describe, expect, it } from "vitest";
import type { AccountInfo } from "./accounting";
import { accountMap, unitMap } from "./content";
import { classifyBoard, gradeClassify, type TaskOf } from "./grading";

// Issue #262: classifyの箱を任意のラベルにする。従来のaccountsの形は5要素の箱のまま
const personal: TaskOf<"classify"> = {
  type: "classify",
  labels: { left: "左(彼がこちらに負う)", right: "右(こちらが彼に負う)" },
  items: [
    { id: "wine", label: "ワインを売った", answer: "left" },
    { id: "receipt", label: "代金を受け取った", answer: "right" },
  ],
  misconceptions: { receipt: { left: "personal_account_by_cash_direction" } },
};

describe("labelsの形の採点", () => {
  it("箱はlabelsの順、項目はitemsの表示で並ぶ", () => {
    const { boxes, items } = classifyBoard(personal, new Map());
    expect(boxes.map((b) => b.id)).toEqual(["left", "right"]);
    expect(items.map((i) => i.label)).toEqual(["ワインを売った", "代金を受け取った"]);
  });

  it("全部正しい箱なら正解", () => {
    const r = gradeClassify(personal, { wine: "left", receipt: "right" }, new Map());
    expect(r.correct).toBe(true);
    expect(r.wrong).toEqual([]);
  });

  it("1つ間違えると誤解IDと正解の箱が返り、科目のwhyは付かない", () => {
    const r = gradeClassify(personal, { wine: "left", receipt: "left" }, new Map());
    expect(r.correct).toBe(false);
    expect(r.misconceptions).toEqual(["personal_account_by_cash_direction"]);
    expect(r.wrong).toEqual([{ account: "receipt", misconception: "personal_account_by_cash_direction", feedback: "「代金を受け取った」は右(こちらが彼に負う)です。" }]);
    expect(r.feedback).toBe("1個の項目が別の箱に入っています。");
  });

  it("誤解の無い箱の取り違えは誤解IDなしで返る", () => {
    const r = gradeClassify(personal, { wine: "right", receipt: "right" }, new Map());
    expect(r.wrong).toEqual([{ account: "wine", misconception: undefined, feedback: "「ワインを売った」は左(彼がこちらに負う)です。" }]);
    expect(r.misconceptions).toEqual([]);
  });
});

describe("従来のaccountsの形", () => {
  const accounts = new Map<string, AccountInfo>([
    ["cash", { id: "cash", name: "現金", aliases: [], element: "asset", contra: false, short: "", why: "手元にある財産だから" } as AccountInfo],
    ["loans_payable", { id: "loans_payable", name: "借入金", aliases: [], element: "liability", contra: false, short: "", why: "返す義務だから" } as AccountInfo],
  ]);
  const task: TaskOf<"classify"> = { type: "classify", accounts: ["cash", "loans_payable"], misconceptions: { loans_payable: { revenue: "revenue_equals_cash_in" } } };

  it("箱は5要素、項目は科目名", () => {
    const { boxes, items } = classifyBoard(task, accounts);
    expect(boxes.map((b) => b.label)).toEqual(["資産", "負債", "純資産", "収益", "費用"]);
    expect(items).toEqual([
      { id: "cash", label: "現金", answer: "asset" },
      { id: "loans_payable", label: "借入金", answer: "liability" },
    ]);
  });

  it("間違えた科目には「なぜその要素か」を返す", () => {
    const r = gradeClassify(task, { cash: "asset", loans_payable: "revenue" }, accounts);
    expect(r.wrong).toEqual([{ account: "loans_payable", misconception: "revenue_equals_cash_in", feedback: "借入金は負債です。返す義務だから" }]);
    expect(r.feedback).toBe("1個の科目が別の箱に入っています。");
  });
});

describe("単元1ステップ4「残りの行を写す」", () => {
  const t = unitMap.get("birth-of-double-entry/memorandum-and-personal-accounts")!.steps[3].task;
  if (t.type !== "classify") throw new Error("classifyではない");

  it("正解の箱に入れれば解ける", () => {
    const answer = Object.fromEntries(t.items!.map((i) => [i.id, i.answer]));
    expect(gradeClassify(t, answer, accountMap).correct).toBe(true);
  });

  it("受け取りを左に入れると、現金の向きで決める誤解が返る", () => {
    const answer = Object.fromEntries(t.items!.map((i) => [i.id, i.answer]));
    const r = gradeClassify(t, { ...answer, mar14_receipt: "left" }, accountMap);
    expect(r.misconceptions).toEqual(["personal_account_by_cash_direction"]);
  });
});
