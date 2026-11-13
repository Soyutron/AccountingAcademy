import { describe, expect, it } from "vitest";
import { accountSummary } from "./accounting";
import { accountMap, glossaryMap, unitMap } from "./content";
import { buildStatements, computeBalances } from "./ledger";

// Issue #191: 現金過不足は仮勘定。資産と断定せず、貸方残を資産のマイナスとして見せない
const statementsOf = (debit: string, credit: string, amount: number) =>
  buildStatements(computeBalances([{ account: "cash", amount: 300000 }, { account: "capital_stock", amount: 300000 }], [{ debit: [{ account: debit, amount }], credit: [{ account: credit, amount }] }], accountMap), accountMap);

describe("現金過不足の貸借対照表での並び", () => {
  it("貸方残(金庫が多かった)は負債の部に正の金額で並び、資産の部に出ない", () => {
    const st = statementsOf("cash", "cash_over_and_short", 2000);
    expect(st.assets.map((l) => l.account)).not.toContain("cash_over_and_short");
    expect(st.liabilities).toContainEqual({ account: "cash_over_and_short", name: "現金過不足", amount: 2000, contra: false, temporary: true });
    expect(st.totalAssets).toBe(302000);
    expect(st.totalLiabilities + st.totalEquity).toBe(302000);
  });

  it("借方残(足りなかった)は資産の部に並ぶ", () => {
    const st = statementsOf("cash_over_and_short", "cash", 3000);
    expect(st.assets).toContainEqual({ account: "cash_over_and_short", name: "現金過不足", amount: 3000, contra: false, temporary: true });
  });
});

describe("現金過不足の説明", () => {
  it("単元の本文・課題に「現金過不足(資産)」が無い", () => {
    const unit = unitMap.get("cash-and-deposits/cash-over-and-short")!;
    expect(JSON.stringify(unit)).not.toContain("現金過不足(資産)");
  });

  it("ステップ3の予想は現金過不足の要素を問わない", () => {
    const task = unitMap.get("cash-and-deposits/cash-over-and-short")!.steps[2].task;
    if (task.type !== "predict") throw new Error("predictではない");
    expect(task.elements).toEqual(["expense", "equity"]);
  });

  it("科目の説明は資産を理由にせず、仮勘定として扱う", () => {
    const account = accountMap.get("cash_over_and_short")!;
    expect(account.temporary).toBe(true);
    expect(account.why).not.toContain("資産の側");
    expect(accountSummary(account)).toMatch(/^仮勘定として扱う理由/);
    expect(glossaryMap.get("cash_over_and_short")!.temporary).toBe(true);
  });
});
