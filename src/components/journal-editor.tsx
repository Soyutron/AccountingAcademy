"use client";

import { useId, useMemo } from "react";
import { type AccountInfo, type Side, computeImpact, ELEMENT_LABELS, ELEMENTS, findAccountByName, formatAmount } from "@/lib/accounting";
import { type EditableEntry, type EditableLine, toJournalEntry } from "@/lib/journal-editable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// 仕訳エディタ。入力に応じて 5 要素の増減と当期純利益への影響をその場で表示する(要件 4.1)

interface Props {
  accounts: AccountInfo[];
  value: EditableEntry;
  onChange?: (value: EditableEntry) => void;
  readOnly?: boolean;
}

export function JournalEditor({ accounts, value, onChange, readOnly = false }: Props) {
  const listId = useId();
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
    <div className="flex-1 min-w-0">
      <div className="mb-1 text-sm font-semibold text-muted-foreground">{label}</div>
      <div className="space-y-1">
        {value[side].map((line, i) => {
          const account = findAccountByName(line.accountName, accounts);
          return (
            <div key={i} className="flex gap-1 items-center">
              <Input
                list={readOnly ? undefined : listId}
                aria-label={`${label}の科目 ${i + 1}`}
                placeholder="科目"
                value={line.accountName}
                readOnly={readOnly}
                onChange={(e) => update(side, i, { accountName: e.target.value })}
                className="min-w-24 flex-[3]"
              />
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
                className="min-w-24 flex-[2] text-right"
              />
              {!readOnly && (
                <Button type="button" variant="ghost" size="icon" aria-label="行を削除" disabled={value[side].length <= 1} onClick={() => removeLine(side, i)}>
                  ×
                </Button>
              )}
              {account && (
                <span className="hidden xl:inline text-xs text-muted-foreground w-12 shrink-0">
                  {ELEMENT_LABELS[account.element]}
                  {account.contra ? "(控除)" : ""}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {!readOnly && (
        <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => addLine(side)}>
          行を追加
        </Button>
      )}
    </div>
  );

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3 not-prose">
      {!readOnly && (
        <datalist id={listId}>
          {accounts.map((a) => (
            <option key={a.id} value={a.name} />
          ))}
        </datalist>
      )}
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
  const tone = (n: number) => (n > 0 ? "text-emerald-700" : n < 0 ? "text-rose-700" : "text-muted-foreground");
  return (
    <div className="rounded-md bg-muted/50 p-2 text-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {ELEMENTS.map((el) => {
          const value = el === "equity" ? impact.equityTotal : impact[el];
          return (
            <span key={el}>
              {ELEMENT_LABELS[el]} <span className={tone(value)}>{sign(value)}</span>
            </span>
          );
        })}
        <span>
          当期純利益 <span className={tone(impact.netIncome)}>{sign(impact.netIncome)}</span>
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">純資産は当期純利益による増減を含みます。</div>
      <div className="mt-1 text-xs text-muted-foreground">
        借方合計 {formatAmount(impact.debitTotal)} / 貸方合計 {formatAmount(impact.creditTotal)}
        {impact.debitTotal + impact.creditTotal > 0 && (
          <span className={impact.balanced ? " text-emerald-700" : " text-rose-700"}>
            {impact.balanced ? " 一致" : " 不一致"}
          </span>
        )}
      </div>
    </div>
  );
}
