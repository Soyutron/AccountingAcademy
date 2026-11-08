"use client";

import { type AccountInfo, accountSummary } from "@/lib/accounting";
import { Term } from "./term";

// 帳簿や財務諸表に出る科目名。ホバー / タップで意味と要素が分かる

export function AccountName({ account }: { account: AccountInfo }) {
  return (
    <Term
      entry={{
        id: account.id,
        kind: "account",
        name: account.name,
        aliases: account.aliases,
        reading: account.reading ?? [],
        short: account.short,
        summary: accountSummary(account),
        example: account.example,
        element: account.element,
        contra: account.contra,
        related: [],
      }}
    >
      {account.name}
    </Term>
  );
}
