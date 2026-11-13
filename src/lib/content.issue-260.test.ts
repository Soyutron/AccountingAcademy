import { describe, expect, it } from "vitest";
import { computeImpact } from "./accounting";
import { scenarioAccountErrors, unitAccountIds } from "./content-checks";
import { glossaryMap, unitAccountList } from "./content";
import { gradePost, type TaskOf } from "./grading";
import { computeBalances } from "./ledger";
import { toJournalEntry } from "./journal-editable";

// Issue #260: 単元限定の勘定科目(scenario.accounts)。全体マスタと重ねず、その単元からだけ参照でき、IDEでは全体マスタの科目と同じに扱う
const master = new Set(["cash", "capital_stock"]);
const giovanni = { id: "giovanni", name: "ジョヴァンニ", element: "asset" as const, why: "彼がこちらに負う残高を置く人名勘定です。" };
const ownerCapital = { id: "owner_capital", name: "元手", element: "equity" as const, why: "商人が店に入れた財産です。" };

describe("scenario.accountsの検査", () => {
  it("全体マスタと重ならなければ通る", () => {
    expect(scenarioAccountErrors([giovanni, ownerCapital], master)).toEqual([]);
  });

  it("全体マスタと同じIDは拒否する", () => {
    expect(scenarioAccountErrors([{ ...giovanni, id: "cash" }], master)).toEqual(["scenario.accountsのcashが全体マスタの勘定科目と重なる"]);
  });

  it("単元の中で同じIDを2回書けば拒否する", () => {
    expect(scenarioAccountErrors([giovanni, giovanni], master)).toEqual(["scenario.accountsのgiovanniが重複"]);
  });

  it("単元から参照できるのは全体マスタと自分の単元限定の科目だけ", () => {
    const own = unitAccountIds(master, [giovanni]);
    expect(own.has("giovanni")).toBe(true);
    expect(own.has("cash")).toBe(true);
    // 別の単元(scenario.accountsにgiovanniが無い)からは存在しない科目になる
    expect(unitAccountIds(master, [ownerCapital]).has("giovanni")).toBe(false);
  });
});

describe("IDEに渡す科目", () => {
  const accounts = unitAccountList([giovanni, ownerCapital]);
  const map = new Map(accounts.map((a) => [a.id, a]));

  it("全体マスタの後ろに単元限定の科目が並び、用語集には載らない", () => {
    expect(accounts.at(-2)?.id).toBe("giovanni");
    expect(map.get("cash")).toBeDefined();
    expect(map.get("giovanni")?.glossary.local).toBe(true);
    expect(glossaryMap.has("giovanni")).toBe(false);
  });

  it("仕訳の変換・5要素の影響・残高・採点で全体マスタの科目と同じに扱う", () => {
    const entry = toJournalEntry(
      { debit: [{ accountName: "ジョヴァンニ", amount: "40ドゥカート" }], credit: [{ accountName: "元手", amount: "40" }] },
      accounts,
      "ドゥカート",
    );
    expect(entry).toEqual({ debit: [{ account: "giovanni", amount: 40 }], credit: [{ account: "owner_capital", amount: 40 }] });
    const impact = computeImpact(entry, map);
    expect([impact.asset, impact.equity, impact.balanced]).toEqual([40, 40, true]);
    expect(computeBalances([{ account: "cash", amount: 300 }], [entry], map).get("giovanni")).toBe(40);
    const task: TaskOf<"post"> = { type: "post", transaction: "ジョヴァンニに40ドゥカートを貸した", answer: entry, alternatives: [], wrong_patterns: [] };
    expect(gradePost(task, entry, map).correct).toBe(true);
  });
});
