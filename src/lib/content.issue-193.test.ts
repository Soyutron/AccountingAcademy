import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { parseJournalBlock } from "./journal-block";

// Issue #193: 説明なしの仕訳が切手代のものに読めないよう、金額と場面を本文で示す
describe("金庫のお金が合わない「多かったときは」の仕訳", () => {
  const narrative = unitMap.get("cash-and-deposits/cash-over-and-short")!.steps[5].narrative;
  const journals = [...narrative.matchAll(/```journal\n([\s\S]*?)```/g)].map((m) => parseJournalBlock(m[1]));
  const prose = narrative.replace(/```[\s\S]*?```/g, "");

  it("仕訳の金額を本文でも示し、切手代とは別の例だと分かる", () => {
    for (const line of journals.flat()) {
      expect(prose).toContain(line.amount.toLocaleString("en-US"));
    }
    expect(prose).toContain("切手代とは別の例");
    expect(prose).toContain("金庫のほうが帳簿より2,000円多かった");
  });

  it("超過の記帳と、決算での雑益への振り替えが並ぶ", () => {
    expect(journals).toEqual([
      [
        { side: "debit", accountName: "現金", amount: 2000 },
        { side: "credit", accountName: "現金過不足", amount: 2000 },
      ],
      [
        { side: "debit", accountName: "現金過不足", amount: 2000 },
        { side: "credit", accountName: "雑益", amount: 2000 },
      ],
    ]);
  });
});
