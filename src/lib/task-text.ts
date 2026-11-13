// 問題文の金額(「100,000円」「4000円」)を押せる要素にするための分割(Issue #7)。
// 仕訳帳への転記の手間をなくすのが目的なので、検出は「数字 + 通貨名」(既定は円。単元のscenario.currency)だけに絞る

export interface AmountSegment {
  // 表示する文字列(例「100,000円」)
  text: string;
  // 金額欄に入れる文字列(区切りなし。例「100000」)
  digits: string;
}

/** 本文を、そのままの文字列と金額の区間に分ける */
export function splitAmounts(text: string, currency = "円"): (string | AmountSegment)[] {
  const amount = new RegExp(`(\\d{1,3}(?:,\\d{3})+|\\d+)\\s?${currency.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g");
  const segments: (string | AmountSegment)[] = [];
  let last = 0;
  for (const m of text.matchAll(amount)) {
    if (m.index > last) segments.push(text.slice(last, m.index));
    segments.push({ text: m[0], digits: m[1].replaceAll(",", "") });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push(text.slice(last));
  return segments;
}
