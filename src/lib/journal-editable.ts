import { type AccountInfo, type JournalEntry, type JournalLine, findAccountByName, formatAmount } from "./accounting";

// 仕訳エディタの入力状態(科目名と金額の文字列)と、勘定科目 ID の仕訳との相互変換。
// サーバー(本文の仕訳ブロック)とクライアント(演習)の両方から使うので "use client" のファイルには置かない

export interface EditableLine {
  accountName: string;
  amount: string;
}

export interface EditableEntry {
  debit: EditableLine[];
  credit: EditableLine[];
}

export const emptyEntry = (): EditableEntry => ({
  debit: [{ accountName: "", amount: "" }],
  credit: [{ accountName: "", amount: "" }],
});

export type ParsedAmount = { value: number } | { reason: string };

/**
 * 金額の入力を円単位の整数として解釈する。IME をオンのまま打った全角数字・全角カンマ・末尾の「円」は受け付け、
 * それ以外は理由を返す(Issue #43)。`Number()` に任せると「1e6」や安全な整数を超える桁まで通ってしまう。
 * signed は calc 用で、負数と 0 を許す(当期純損失などを答える課題がある)。
 */
export function parseAmount(text: string, signed = false): ParsedAmount {
  const s = text
    .trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[,，]/g, "")
    .replace(/円$/, "")
    .replace(/^[−－]/, "-");
  if (s === "") return { reason: "金額を入れてください" };
  if (/^-?\d+\.\d+$/.test(s)) return { reason: "小数は使えません。円単位の整数で入力してください" };
  if (!signed && s.startsWith("-")) return { reason: "マイナスは使えません。半角の数字で入力してください(例: 100000)" };
  if (!/^-?\d+$/.test(s)) return { reason: "半角の数字だけで入力してください(例: 100000)" };
  const value = Number(s);
  if (!Number.isSafeInteger(value)) return { reason: "桁が多すぎます" };
  if (!signed && value === 0) return { reason: "1 円以上の金額を入れてください" };
  return { value };
}

/** toJournalEntry が落とす行のうち、学習者が何か入れた行か。この行が残っていると入力と記帳内容が食い違う(Issue #71) */
export function isIncompleteLine(line: EditableLine, accounts: AccountInfo[]): boolean {
  if (!line.accountName.trim() && !line.amount.trim()) return false;
  return !findAccountByName(line.accountName, accounts) || "reason" in parseAmount(line.amount);
}

/** 入力中の行を勘定科目 ID の仕訳に変換する。科目が解決できない行や金額が解釈できない行は落とす */
export function toJournalEntry(entry: EditableEntry, accounts: AccountInfo[]): JournalEntry {
  const convert = (lines: EditableLine[]): JournalLine[] =>
    lines.flatMap((l) => {
      const account = findAccountByName(l.accountName, accounts);
      const amount = parseAmount(l.amount);
      return account && "value" in amount ? [{ account: account.id, amount: amount.value }] : [];
    });
  return { debit: convert(entry.debit), credit: convert(entry.credit) };
}

export function fromJournalEntry(entry: JournalEntry, accounts: ReadonlyMap<string, AccountInfo>): EditableEntry {
  const convert = (lines: JournalLine[]): EditableLine[] =>
    lines.map((l) => ({ accountName: accounts.get(l.account)?.name ?? l.account, amount: formatAmount(l.amount) }));
  return { debit: convert(entry.debit), credit: convert(entry.credit) };
}
