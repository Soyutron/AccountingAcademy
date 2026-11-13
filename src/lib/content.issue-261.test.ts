import { describe, expect, it } from "vitest";
import { units } from "#content";
import { nextUnit, unitAccountList, unitMap } from "./content";
import { buildTrialBalance } from "./ledger";

// Issue #261: 結果ペインの段階(scenario.view)と、歴史の単元の「次へ」
const memorandum = "birth-of-double-entry/memorandum-and-personal-accounts";
const venture = "birth-of-double-entry/venture-profit-and-double-entry";
const pacioli = "birth-of-double-entry/venetian-method-and-pacioli";

describe("scenario.view", () => {
  it("書かなければstatements(3級の単元は従来どおり財務諸表まで出す)", () => {
    expect(unitMap.get("depreciation/straight-line")!.scenario.view).toBe("statements");
    expect(units.filter((u) => u.kind === "lesson").every((u) => u.scenario.view === "statements")).toBe(true);
  });
  it("歴史の単元は、帳簿の無い時代がnone、元帳の時代がledger", () => {
    expect(unitMap.get(memorandum)!.scenario.view).toBe("none");
    expect(unitMap.get(venture)!.scenario.view).toBe("ledger");
    expect(unitMap.get(pacioli)!.scenario.view).toBe("ledger");
  });
});

describe("試算", () => {
  it("開始残高と記帳から科目ごとの借方合計・貸方合計を出し、全体の左右が一致する", () => {
    const unit = unitMap.get(venture)!;
    const accounts = new Map(unitAccountList(unit.scenario.accounts).map((a) => [a.id, a]));
    const tb = buildTrialBalance(
      unit.scenario.opening,
      [
        { debit: [{ account: "pepper_voyage", amount: 120 }], credit: [{ account: "cash", amount: 120 }] },
        { debit: [{ account: "giovanni", amount: 60 }], credit: [{ account: "pepper_voyage", amount: 60 }] },
        { debit: [{ account: "matteo", amount: 90 }], credit: [{ account: "pepper_voyage", amount: 90 }] },
      ],
      accounts,
    );
    const line = (id: string) => tb.lines.find((l) => l.account === id);
    expect(line("cash")).toMatchObject({ debit: 300, credit: 120 });
    expect(line("owner_capital")).toMatchObject({ debit: 0, credit: 300 });
    // 口別の勘定は売った額がかかった額を上回り、貸方が多くなる
    expect(line("pepper_voyage")).toMatchObject({ debit: 120, credit: 150 });
    expect(tb.debit).toBe(570);
    expect(tb.credit).toBe(570);
  });
  it("片方のページにしか写さなければ左右が合わない", () => {
    const unit = unitMap.get(venture)!;
    const accounts = new Map(unitAccountList(unit.scenario.accounts).map((a) => [a.id, a]));
    const tb = buildTrialBalance(unit.scenario.opening, [{ debit: [{ account: "wine_voyage", amount: 80 }], credit: [] }], accounts);
    expect(tb.debit).toBe(380);
    expect(tb.credit).toBe(300);
  });
});

describe("nextUnit", () => {
  it("歴史の単元は歴史の単元の中だけで次を決める", () => {
    expect(nextUnit(unitMap.get(memorandum)!)?.id).toBe(venture);
    expect(nextUnit(unitMap.get(venture)!)?.id).toBe(pacioli);
    expect(nextUnit(unitMap.get(pacioli)!)).toBeUndefined();
  });
  it("3級の最後の単元から歴史の単元へはつながない", () => {
    expect(nextUnit(unitMap.get("depreciation/straight-line")!)).toBeUndefined();
  });
});
