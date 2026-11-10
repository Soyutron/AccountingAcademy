---
id: cash-and-deposits/cash-over-and-short
title: 金庫のお金が合わない
summary: 月末に金庫を数えたら帳簿と 3,000 円ずれていた。差額をいったん「現金過不足」に預け、原因を探し、分からない分を決算で片づける流れを身につける
level: 1
order: 1
introduces: [cash_over_and_short, miscellaneous_loss_gain]
concepts: [asset, expense, revenue, journal_entry]
requires: [bookkeeping-basics/five-elements]
scenario:
  company: カフェ「マメノキ」
  opening:
    - { account: cash, amount: 300000 }
    - { account: bank_deposit, amount: 500000 }
    - { account: equipment, amount: 600000 }
    - { account: accounts_payable, amount: 60000 }
    - { account: loans_payable, amount: 300000 }
    - { account: capital_stock, amount: 1000000 }
    - { account: retained_earnings, amount: 40000 }
    - { account: sales, amount: 80000 }
    - { account: purchases, amount: 30000 }
    - { account: rent_expense, amount: 50000 }
---

## 帳簿と金庫
カフェ「マメノキ」の 2 年目の春です。去年のもうけ 40,000 円は「繰越利益剰余金」として純資産に残り、現金の多くは普通預金に移しました。
4 月の末、金庫の現金を数えてみると 297,000 円。ところが結果の貸借対照表の現金は 300,000 円です。3,000 円、合いません。
帳簿は人が書くものなので、こういうずれは起こります。大事なのは、ずれをそのままにしないことです。

```figure
type: flow
alt: 帳簿の現金 300,000 円と、数えた現金 297,000 円の差額 3,000 円を、いったん現金過不足という科目に置く
nodes: ["帳簿の現金 300,000", "金庫を数える 297,000", "差額 3,000 を現金過不足へ", 原因を探す]
highlight: 2
```

## 帳簿を実際に合わせる
まず、帳簿の現金を実際の 297,000 円に直します。右に「現金 3,000」と書いて減らします。
左には何を書くでしょう。理由はまだ分かりません。そこで、正体が分かるまで差額を預けておく科目を使います。これが [[cash_over_and_short|現金過不足]] です。足りなかったときは左に書きます。

```task
type: post
transaction: 月末に現金を数えたところ、帳簿より 3,000 円少なかった。帳簿の現金を実際の金額に合わせた
answer:
  debit: [{ account: cash_over_and_short, amount: 3000 }]
  credit: [{ account: cash, amount: 3000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 現金は実際より多く書かれているので、右で減らします。差額の現金過不足は左です。
  - match: { debit: [{ account: miscellaneous_loss }] }
    misconception: shortage_is_loss
    feedback: 期中(決算の日より前)に分かった差額は、理由が分からないうちから費用にはしません。まず現金過不足に預けて、原因を探します。
  - match: { debit: [{ account: communication_expense }] }
    misconception: shortage_is_loss
    feedback: 原因がまだ分からないので通信費にはできません。まず現金過不足に預けて、原因を探します。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 3,000 にしましょう。
hint: 左に現金過不足 3,000、右に現金 3,000 です。
success: 現金が 297,000 になり、差額の 3,000 が現金過不足に預けられました。ここから原因を探します。
```

## 原因が 1 つ分かった
レシートを調べると、切手代 2,000 円を払ったのに記帳していませんでした。切手代は「通信費」という費用の科目で記録します。
3,000 円のうち 2,000 円の正体が分かったので、その分を現金過不足から通信費へ移します。左に通信費 2,000、右に現金過不足 2,000。記帳の前に、5 つの箱がどう動くか予想してみましょう。

```task
type: predict
transaction: 現金の不足のうち 2,000 円は、切手代の記帳漏れだと分かった。現金過不足から通信費に振り替えた
entry:
  debit: [{ account: communication_expense, amount: 2000 }]
  credit: [{ account: cash_over_and_short, amount: 2000 }]
answer: { asset: decrease, liability: none, equity: decrease, revenue: none, expense: increase }
wrong_patterns:
  - match: { asset: none }
    feedback: 預けておいた現金過不足(資産)が 2,000 減ります。現金はもう減らしてあるので、ここでは動きません。
  - match: { expense: none }
    feedback: 切手代は会社が使ったお金です。通信費という費用が増えます。
  - match: { equity: none }
    feedback: 費用が増えると当期純利益が減り、そのぶん純資産も減ります。
  - match: { expense: decrease }
    feedback: 切手代は使ったお金なので、通信費(費用)は減らずに増えます。
hint: 現金過不足(資産)が減り、通信費(費用)が増えます。費用が増えれば利益も純資産も減ります。
success: 通信費が損益計算書に現れ、現金過不足は 1,000 に減りました。残りの 1,000 円は、まだ正体が分かりません。
```

## まだ分からない分
3,000 円のうち 2,000 円は通信費でした。では、現金過不足に残っている金額はいくらでしょう。結果の貸借対照表で確かめてみましょう。

```task
type: calc
question: いま現金過不足に残っている金額はいくらですか(円)
answer: 1000
wrong_patterns:
  - match: 3000
    feedback: 2,000 円は通信費へ移しました。残りは 3,000 − 2,000 です。
  - match: 2000
    feedback: 2,000 円は正体が分かって通信費になった分です。残っているのはそれ以外です。
hint: 3,000 − 2,000。
success: 残りは 1,000 円。原因を探し続けますが、決算の日までに分からなければ片づけ方があります。
```

## 決算で片づける
決算の日になっても、残り 1,000 円の正体は分かりませんでした。現金過不足は「仮の置き場」なので、財務諸表には残せません。
分からないまま減った 1,000 円は、「雑損」という費用にします。逆に多かった場合は「雑益」という収益です。この片づけ方を [[miscellaneous_loss_gain|雑損・雑益]] への振り替えと呼びます。

```task
type: post
transaction: 決算日になっても現金の不足 1,000 円の原因が分からなかったので、雑損に振り替えた
answer:
  debit: [{ account: miscellaneous_loss, amount: 1000 }]
  credit: [{ account: cash_over_and_short, amount: 1000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 現金過不足を消すので右、雑損(費用)が増えるので左です。
  - match: { credit: [{ account: cash }] }
    feedback: 現金はもう実際の金額に直してあります。消すのは現金過不足のほうです。
  - match: { debit: [{ account: miscellaneous_gain }] }
    misconception: shortage_is_gain
    feedback: 足りなかったので損です。雑益は多かったときに使います。
  - match: { credit: [{ account: miscellaneous_gain }] }
    misconception: shortage_is_gain
    feedback: 今回は現金が足りなかったので損(雑損)です。雑益は現金が多かったときに使います。足りなかった分は現金過不足の左に預けてあるので、右に書いて消します。
  - match: { debit: [{ account: communication_expense }] }
    misconception: unknown_shortage_as_known_expense
    feedback: 通信費は原因が分かった 2,000 円の分です。残りの 1,000 円は原因が分からないままなので、雑損にします。
  - match: { credit: [{ account: bank_deposit }] }
    misconception: shortage_transfer_moves_money
    feedback: 普通預金は動いていません。この振り替えは、帳簿の中で現金過不足を雑損へ移すだけです。消すのは現金過不足のほうなので、右に書きます。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 1,000 にしましょう。
hint: 左に雑損 1,000、右に現金過不足 1,000 です。
success: 現金過不足が消え、雑損 1,000 が費用に並びました。仮の置き場は空になりました。
```

## 多かったときは
今回は足りませんでしたが、逆に金庫のほうが多いこともあります。そのときは帳簿の現金を増やし、差額を現金過不足の右に置きます。
原因が分かればその科目へ、分からなければ決算で雑益(収益)に振り替えます。流れは同じで、左右が逆になるだけです。

```figure
type: compare
alt: 足りなかったときは現金過不足から費用か雑損へ、多かったときは現金過不足から収益か雑益へ振り替える
left:
  title: 足りなかったとき
  figure:
    type: flow
    alt: 不足を現金過不足に置き、原因が分かれば費用へ、分からなければ雑損へ
    nodes: [現金過不足(左), 原因が分かれば費用へ, 分からなければ雑損へ]
right:
  title: 多かったとき
  figure:
    type: flow
    alt: 超過を現金過不足に置き、原因が分かれば収益などへ、分からなければ雑益へ
    nodes: [現金過不足(右), 原因が分かれば収益などへ, 分からなければ雑益へ]
```

ここからは、切手代とは別の例です。金庫のほうが帳簿より 2,000 円多かったとします。帳簿の現金を増やすので左に現金 2,000、差額は右に現金過不足 2,000 と書きます。

```journal
借方: 現金 2,000
貸方: 現金過不足 2,000
```

決算の日になってもこの 2,000 円の原因が分からなければ、現金過不足を左に書いて消し、右に雑益 2,000 と書きます。足りなかったときの「左に雑損、右に現金過不足」と、左右が逆になっています。

```journal
借方: 現金過不足 2,000
貸方: 雑益 2,000
```

## 箱に分ける
この単元で出てきた科目を 5 つの箱に分けてみましょう。現金過不足は仮の置き場なので、ここでは外します。
通信費と雑損はどちらも、残らずに[[equity|純資産]]を減らすお金です。

```task
type: classify
accounts: [cash, bank_deposit, communication_expense, miscellaneous_loss]
misconceptions: {}
hint: 現金と普通預金は資産、通信費と雑損は費用です。
success: 現金・普通預金は資産、通信費・雑損は費用。雑損は「理由が分からないまま減ったお金」の費用です。
```

## ふりかえり
期中(決算の日より前)に金庫と帳簿が合わなかったら、まず帳簿を実際の金額に直し、差額を現金過不足に預けます。原因が分かった分は本来の科目へ移し、決算まで分からなかった分だけが雑損か雑益になります。
「分からないからすぐ費用」ではなく、「分かるまで預ける」のが現金過不足の役目です。この「仮の置き場」という考え方は、後の仮払金・仮受金でも出てきます。
ただし、預けるのは原因を調べる時間があるからです。決算の日に初めて差額が分かり、その日に原因も分からなければ、預ける理由がないので、現金過不足を通さず直接、左に雑損、右に現金と書きます(多かったときは左に現金、右に雑益)。
次は、現金の代わりに小切手で支払う「当座預金」です。
