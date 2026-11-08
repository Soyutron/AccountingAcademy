"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { type AccountInfo, type Side, computeImpact, ELEMENTS, findAccountByName, formatAmount, matchesAccountQuery } from "@/lib/accounting";
import { type EditableEntry, type EditableLine, parseAmount, toJournalEntry } from "@/lib/journal-editable";
import { ELEMENT_STYLE } from "@/lib/elements";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ElementBadge } from "@/components/element-badge";
import { AccountCombobox } from "@/components/account-combobox";
import { HelpIcon } from "@/components/ide/help-icon";

// 仕訳エディタ。入力に応じて 5 要素の増減と当期純利益への影響をその場で表示する(要件 4.1)

interface Props {
  accounts: AccountInfo[];
  value: EditableEntry;
  onChange?: (value: EditableEntry) => void;
  readOnly?: boolean;
  // predict では予想を送るまで 5 要素の増減を見せない(答えが見えてしまう。Issue #11)
  showImpact?: boolean;
}

export function JournalEditor({ accounts, value, onChange, readOnly = false, showImpact = true }: Props) {
  const idPrefix = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const focusLine = useRef<string | null>(null);
  // IME の変換中は読みの途中なので「科目がない」と言わない(Issue #79)
  const [composingLine, setComposingLine] = useState<string | null>(null);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const entry = useMemo(() => toJournalEntry(value, accounts), [value, accounts]);
  const impact = useMemo(() => computeImpact(entry, accountMap), [entry, accountMap]);

  const update = (side: Side, index: number, patch: Partial<EditableLine>) => {
    const lines = value[side].map((l, i) => (i === index ? { ...l, ...patch } : l));
    onChange?.({ ...value, [side]: lines });
  };
  const addLine = (side: Side) => {
    focusLine.current = `${side}-${value[side].length}`;
    onChange?.({ ...value, [side]: [...value[side], { accountName: "", amount: "" }] });
  };
  // 新しい行は「行を追加」より前に描画され、Tab では届かない(Issue #68)
  // 解説ペインの読み取り専用エディタも同じ data-journal-line を持つので、自分の中だけを探す
  useEffect(() => {
    const line = focusLine.current;
    if (!line) return;
    focusLine.current = null;
    rootRef.current?.querySelector<HTMLInputElement>(`[data-journal-line="${line}"] input`)?.focus();
  }, [value]);
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
          const parsed = parseAmount(line.amount);
          // 空欄はまだ入力していないだけなので理由を出さない
          const amountError = line.amount.trim() && "reason" in parsed ? parsed.reason : null;
          const errorId = `${idPrefix}-${side}-${i}-amount-error`;
          const composing = composingLine === `${side}-${i}`;
          // 科目を選んだ直後は普通の入力の途中なので、赤字にせず次にすることとして添える(Issue #71)
          const amountMissing = !readOnly && account && !line.amount.trim();
          const accountMissing = !readOnly && !account && !composing && line.amount.trim();
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
                    onCompositionChange={(composing) => setComposingLine(composing ? `${side}-${i}` : null)}
                    className="min-w-24 flex-[3] bg-background"
                  />
                )}
                <Input
                  inputMode="numeric"
                  data-amount-field={`${side}-${i}`}
                  aria-label={`${label}の金額 ${i + 1}`}
                  placeholder="金額"
                  value={line.amount}
                  readOnly={readOnly}
                  aria-invalid={amountError ? true : undefined}
                  aria-describedby={amountError || amountMissing ? errorId : undefined}
                  onChange={(e) => update(side, i, { amount: e.target.value })}
                  onBlur={(e) => {
                    const p = parseAmount(e.target.value);
                    if ("value" in p) update(side, i, { amount: formatAmount(p.value) });
                  }}
                  className="min-w-24 flex-[2] text-right bg-background font-mono tabular-nums"
                />
                {!readOnly && (
                  <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label="行を削除" disabled={value[side].length <= 1} onClick={() => removeLine(side, i)}>
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
                ) : line.accountName.trim() && !composing && !accounts.some((a) => matchesAccountQuery(a, line.accountName)) ? (
                  <span className="text-error-fg">候補から選ぶか、漢字の一部を入れてください</span>
                ) : accountMissing ? (
                  <span className="text-error-fg">科目を選んでください</span>
                ) : null}
                {amountMissing && (
                  <span id={errorId} className="ml-auto shrink-0 text-muted-foreground">
                    金額を入れてください
                  </span>
                )}
              </div>
              {amountError && (
                <p id={errorId} className="mt-0.5 text-[10px] text-error-fg">
                  {amountError}
                </p>
              )}
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
    // 借方・貸方の並べ方は画面幅ではなくカード自身の幅で決める(3 ペインでは画面が広くてもカードが狭い。Issue #33)
    <div ref={rootRef} className="@container rounded-lg border bg-card p-3 space-y-3 not-prose">
      <div className="flex flex-col @lg:flex-row gap-3">
        {renderSide("debit", "借方")}
        {renderSide("credit", "貸方")}
      </div>
      {showImpact && <ImpactPanel impact={impact} />}
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
              {s.label} <span className="font-mono tabular-nums font-medium">{sign(value)}</span>
            </span>
          );
        })}
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${impact.netIncome !== 0 ? "font-medium" : "text-muted-foreground"}`}>
          当期純利益 <span className="ml-1 font-mono tabular-nums">{sign(impact.netIncome)}</span>
        </span>
        <HelpIcon topic="impact" />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        借方合計 {formatAmount(impact.debitTotal)} / 貸方合計 {formatAmount(impact.creditTotal)}
        {impact.debitTotal + impact.creditTotal > 0 && (
          <span className={impact.balanced ? " text-ok-fg" : " text-error-fg"}>{impact.balanced ? " 一致" : " 不一致"}</span>
        )}
        <span className="ml-2">純資産は当期純利益による増減を含みます。</span>
      </div>
    </div>
  );
}
