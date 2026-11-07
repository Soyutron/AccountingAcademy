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

/** 入力中の行を勘定科目 ID の仕訳に変換する。科目が解決できない行や金額が空の行は落とす */
export function toJournalEntry(entry: EditableEntry, accounts: AccountInfo[]): JournalEntry {
  const convert = (lines: EditableLine[]): JournalLine[] =>
    lines.flatMap((l) => {
      const account = findAccountByName(l.accountName, accounts);
      const amount = Number(l.amount.replaceAll(",", ""));
      return account && Number.isInteger(amount) && amount > 0 ? [{ account: account.id, amount }] : [];
    });
  return { debit: convert(entry.debit), credit: convert(entry.credit) };
}

export function fromJournalEntry(entry: JournalEntry, accounts: ReadonlyMap<string, AccountInfo>): EditableEntry {
  const convert = (lines: JournalLine[]): EditableLine[] =>
    lines.map((l) => ({ accountName: accounts.get(l.account)?.name ?? l.account, amount: formatAmount(l.amount) }));
  return { debit: convert(entry.debit), credit: convert(entry.credit) };
}
