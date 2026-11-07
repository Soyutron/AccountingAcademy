"use client";

import { useMemo } from "react";
import { type AccountInfo, type Side, computeImpact, ELEMENTS, findAccountByName, formatAmount } from "@/lib/accounting";
import { type EditableEntry, type EditableLine, toJournalEntry } from "@/lib/journal-editable";
import { ELEMENT_STYLE } from "@/lib/elements";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ElementBadge } from "@/components/element-badge";
import { AccountCombobox } from "@/components/account-combobox";

// 仕訳エディタ。入力に応じて 5 要素の増減と当期純利益への影響をその場で表示する(要件 4.1)

// 入力途中(候補の絞り込みと同じ部分一致で科目が残る)の間は「科目がない」と言わない
function matchesSomeAccount(text: string, accounts: AccountInfo[]): boolean {
  const t = text.trim();
  return accounts.some((a) => a.name.includes(t) || a.aliases.some((x) => x.includes(t)));
}

interface Props {
  accounts: AccountInfo[];
  value: EditableEntry;
  onChange?: (value: EditableEntry) => void;
  readOnly?: boolean;
}

export function JournalEditor({ accounts, value, onChange, readOnly = false }: Props) {
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const entry = useMemo(() => toJournalEntry(value, accounts), [value, accounts]);
  const impact = useMemo(() => computeImpact(entry, accountMap), [entry, accountMap]);

  const update = (side: Side, index: number, patch: Partial<EditableLine>) => {
    const lines = value[side].map((l, i) => (i === index ? { ...l, ...patch } : l));
    onChange?.({ ...value, [side]: lines });
  };
  const addLine = (side: Side) => onChange?.({ ...value, [side]: [...value[side], { accountName: "", amount: "" }] });
  const removeLine = (side: Side, index: number) => {
    if (value[side].length <= 1) return;
    onChange?.({ ...value, [side]: value[side].filter((_, i) => i !== index) });
  };

  const renderSide = (side: Side, label: string) => (
    <div className="flex-1 min-w-0" data-tour={side === "debit" ? "journal-debit" : "journal-credit"}>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-[10px] text-muted-foreground">{side === "debit" ? "左 · 資産と費用が増える側" : "右 · 負債・純資産・収益が増える側"}</span>
      </div>
      <div className="space-y-1.5">
        {value[side].map((line, i) => {
          const account = findAccountByName(line.accountName, accounts);
          const style = account ? ELEMENT_STYLE[account.element] : null;
          return (
            <div key={i} data-journal-line={`${side}-${i}`} className={`rounded-md border p-1.5 transition-colors ${style ? `${style.border} ${style.bg}` : "bg-background"}`}>
              <div className="flex gap-1 items-center">
                {readOnly ? (
                  <Input aria-label={`${label}の科目 ${i + 1}`} placeholder="科目" value={line.accountName} readOnly className="min-w-24 flex-[3] bg-background" />
                ) : (
                  <AccountCombobox
                    accounts={accounts}
                    aria-label={`${label}の科目 ${i + 1}`}
                    placeholder="科目"
                    value={line.accountName}
                    onChange={(accountName) => update(side, i, { accountName })}
                    className="min-w-24 flex-[3] bg-background"
                  />
                )}
                <Input
                  inputMode="numeric"
                  aria-label={`${label}の金額 ${i + 1}`}
                  placeholder="金額"
                  value={line.amount}
                  readOnly={readOnly}
                  onChange={(e) => update(side, i, { amount: e.target.value })}
                  onBlur={(e) => {
                    const n = Number(e.target.value.replaceAll(",", ""));
                    if (e.target.value.trim() && Number.isInteger(n)) update(side, i, { amount: formatAmount(n) });
                  }}
                  className="min-w-24 flex-[2] text-right bg-background"
                />
                {!readOnly && (
                  <Button type="button" variant="ghost" size="icon" aria-label="行を削除" disabled={value[side].length <= 1} onClick={() => removeLine(side, i)}>
                    ×
                  </Button>
                )}
              </div>
              <div className="mt-1 h-4 flex items-center gap-1 text-[10px] min-w-0">
                {account ? (
                  <>
                    <span className="shrink-0">
                      <ElementBadge element={account.element} contra={account.contra} size="xs" />
                    </span>
                    <span className="text-muted-foreground truncate">{account.short}</span>
                  </>
                ) : line.accountName.trim() && !matchesSomeAccount(line.accountName, accounts) ? (
                  <span className="text-rose-700">この名前の科目はありません</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {!readOnly && (
        <Button type="button" variant="outline" size="sm" className="mt-1.5" onClick={() => addLine(side)}>
          行を追加
        </Button>
      )}
    </div>
  );

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3 not-prose">
      <div className="flex flex-col sm:flex-row gap-3">
        {renderSide("debit", "借方")}
        {renderSide("credit", "貸方")}
      </div>
      <ImpactPanel impact={impact} />
    </div>
  );
}

function ImpactPanel({ impact }: { impact: ReturnType<typeof computeImpact> }) {
  const sign = (n: number) => (n > 0 ? `+${formatAmount(n)}` : n < 0 ? `−${formatAmount(-n)}` : "±0");
  return (
    <div className="rounded-md bg-muted/50 p-2 text-sm" data-tour="impact">
      <div className="flex flex-wrap gap-1.5">
        {ELEMENTS.map((el) => {
          const value = el === "equity" ? impact.equityTotal : impact[el];
          const s = ELEMENT_STYLE[el];
          return (
            <span key={el} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${value !== 0 ? `${s.bg} ${s.border} ${s.text}` : "text-muted-foreground"}`}>
              <span aria-hidden>{s.symbol}</span>
              {s.label} <span className="tabular-nums font-medium">{sign(value)}</span>
            </span>
          );
        })}
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${impact.netIncome !== 0 ? "font-medium" : "text-muted-foreground"}`}>
          当期純利益 <span className="ml-1 tabular-nums">{sign(impact.netIncome)}</span>
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        借方合計 {formatAmount(impact.debitTotal)} / 貸方合計 {formatAmount(impact.creditTotal)}
        {impact.debitTotal + impact.creditTotal > 0 && (
          <span className={impact.balanced ? " text-emerald-700" : " text-rose-700"}>{impact.balanced ? " 一致" : " 不一致"}</span>
        )}
        <span className="ml-2">純資産は当期純利益による増減を含みます。</span>
      </div>
    </div>
  );
}
