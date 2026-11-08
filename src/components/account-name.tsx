"use client";

import type { GlossaryAccount } from "@/lib/content";
import { Term } from "./term";

// 帳簿や財務諸表に出る科目名。ホバー / タップで意味と要素が分かる

export function AccountName({ account }: { account: GlossaryAccount }) {
  return <Term entry={account.glossary}>{account.name}</Term>;
}
