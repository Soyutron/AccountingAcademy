import type { JournalLine } from "./accounting";

// 解説本文の ```journal ブロックを仕訳に変換する。1 行 = 「借方: 科目 金額」または「貸方: 科目 金額」

export interface NamedJournalLine {
  side: "debit" | "credit";
  accountName: string;
  amount: number;
}

const LINE = /^(借方|貸方)[:：]\s*(\S+)\s+([\d,]+)\s*$/;

export function parseJournalBlock(text: string): NamedJournalLine[] {
  const lines: NamedJournalLine[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = LINE.exec(line);
    if (!m) throw new Error(`仕訳ブロックの行を解釈できません: ${line}`);
    lines.push({
      side: m[1] === "借方" ? "debit" : "credit",
      accountName: m[2],
      amount: Number(m[3].replaceAll(",", "")),
    });
  }
  return lines;
}

export function toEntryLines(lines: NamedJournalLine[], resolve: (name: string) => string | undefined) {
  const entry: { debit: JournalLine[]; credit: JournalLine[] } = { debit: [], credit: [] };
  for (const line of lines) {
    const account = resolve(line.accountName);
    if (!account) throw new Error(`仕訳ブロックの科目が勘定科目マスタにありません: ${line.accountName}`);
    entry[line.side].push({ account, amount: line.amount });
  }
  return entry;
}
