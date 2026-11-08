---
id: receivables-and-payables/temporary-and-deposits
title: 預かったお金、仮のお金
summary: スタッフの給料から税金を預かり、出張費を仮払いし、正体不明の入金を仮受金に置きながら、立替金・預り金・仮払金・仮受金の記録を身につける
level: 1
order: 3
introduces: [advances_and_deposits, suspense_accounts]
concepts: [asset, liability, expense, cash_over_and_short]
requires: [receivables-and-payables/other-receivables-and-payables]
scenario:
  company: カフェ「マメノキ」
  opening:
    - { account: cash, amount: 322000 }
    - { account: bank_deposit, amount: 199000 }
    - { account: checking_account, amount: 72500 }
    - { account: petty_cash, amount: 30000 }
    - { account: accounts_receivable_other, amount: 50000 }
    - { account: equipment, amount: 630000 }
    - { account: accounts_payable, amount: 30000 }
    - { account: accounts_payable_other, amount: 80000 }
    - { account: advance_received, amount: 5000 }
    - { account: loans_payable, amount: 200000 }
    - { account: capital_stock, amount: 1000000 }
    - { account: retained_earnings, amount: 40000 }
    - { account: sales, amount: 110000 }
    - { account: purchases, amount: 95000 }
    - { account: rent_expense, amount: 50000 }
    - { account: communication_expense, amount: 6000 }
    - { account: miscellaneous_loss, amount: 1000 }
    - { account: supplies_expense, amount: 6500 }
    - { account: travel_expense, amount: 2000 }
    - { account: interest_income, amount: 2000 }
    - { account: interest_expense, amount: 3000 }
---

## アルバイトの給料日
マメノキに初めてのアルバイトスタッフが入りました。今月の給料は 100,000 円。ただし、給料から所得税 3,000 円を差し引いて、店が代わりに税務署へ納めます。
店が払う費用は 100,000 円。手渡すのは 97,000 円。差し引いた 3,000 円は店のお金ではなく、スタッフの代わりに預かっているだけです。このようなお金を [[advances_and_deposits|立替金・預り金]] で記録します。

```figure
type: flow
alt: 給料 100,000 円のうち所得税 3,000 円を預かり、手取り 97,000 円を払い、後日 3,000 円を税務署に納める
nodes: ["給料 100,000", "税 3,000 を預かる", "手取り 97,000 を振り込む", "後日 税務署へ 3,000"]
highlight: 1
```

## 給料を払う
給料 100,000 円から所得税 3,000 円を差し引き、手取り 97,000 円を普通預金から振り込みました。
左は給料 100,000。費用は差し引く前の総額です。右は 2 行。振り込んだ普通預金 97,000 と、預かった 3,000 の「預り金」です。預り金は後で納める義務なので負債です。

```task
type: post
transaction: アルバイトの給料 100,000 円から所得税 3,000 円を差し引き、残額 97,000 円を普通預金から振り込んだ
answer:
  debit: [{ account: salaries_expense, amount: 100000 }]
  credit:
    - { account: bank_deposit, amount: 97000 }
    - { account: deposits_received, amount: 3000 }
wrong_patterns:
  - match: { debit: [{ account: salaries_expense, amount: 97000 }] }
    misconception: net_pay_is_salary
    feedback: 給料は差し引く前の 100,000 円です。預かった 3,000 円は預り金として右に書きます。
  - match: { swapped: true }
    feedback: 給料は費用なので左、普通預金と預り金は右です。
  - match: { credit: [{ account: cash, amount: 97000 }] }
    feedback: 手取りは普通預金から振り込みました。
  - match: { unbalanced: true }
    feedback: 左の給料 100,000 と、右の普通預金 97,000 + 預り金 3,000 がそろっていません。
hint: 左に給料 100,000。右に普通預金 97,000 と預り金 3,000 の 2 行です。「行を追加」で行を増やせます。
success: 給料 100,000 が費用に、預り金 3,000 が負債に並びました。預り金はスタッフのお金です。
```

## 預かった税金を納める
翌月、預かっていた所得税 3,000 円を税務署に現金で納めました。
これは店の費用ではありません。預かっていたお金を、本人の代わりに渡しただけです。預り金という義務が消え、現金が減ります。記帳の前に、5 つの箱がどう動くか予想してみましょう。

```task
type: predict
transaction: 給料から預かっていた所得税 3,000 円を、税務署に現金で納付した
entry:
  debit: [{ account: deposits_received, amount: 3000 }]
  credit: [{ account: cash, amount: 3000 }]
answer: { asset: decrease, liability: decrease, equity: none, revenue: none, expense: none }
wrong_patterns:
  - match: { expense: increase }
    misconception: withholding_tax_is_expense
    feedback: 納めたのはスタッフから預かっていたお金です。店の費用にはなりません。
  - match: { liability: none }
    feedback: 納めたことで「代わりに納める義務」が無くなります。預り金(負債)が減ります。
  - match: { equity: decrease }
    feedback: 現金と預り金が同じだけ減るので、純資産は変わりません。
hint: 預り金(負債)と現金(資産)が同じだけ減ります。費用にはなりません。
success: 預り金が消えました。給料の費用は、払った月の 100,000 円だけです。
```

## スタッフの代わりに払う
スタッフが私物を実家に送るのに、店の宅配便の集荷に一緒に出し、送料 2,000 円を店の現金で払いました。後で本人から返してもらいます。
店が使ったお金ではないので費用ではありません。「本人から返してもらう権利」なので、立替金という資産です。

```task
type: post
transaction: スタッフの私物の送料 2,000 円を店の現金で立て替えた(後日本人から受け取る)
answer:
  debit: [{ account: advances_paid, amount: 2000 }]
  credit: [{ account: cash, amount: 2000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 増えるのは立替金(権利)なので左、減るのは現金なので右です。
  - match: { debit: [{ account: shipping_expense }] }
    misconception: advance_for_others_is_expense
    feedback: 店の商品を送ったわけではありません。本人から返してもらうお金なので、立替金という資産です。
  - match: { debit: [{ account: deposits_received }] }
    feedback: 預り金は、預かったお金を後で納める義務です。今回は逆に、店が先に払ってあげました。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 2,000 にしましょう。
hint: 左に立替金 2,000、右に現金 2,000 です。
success: 立替金 2,000 が資産に並びました。本人から受け取ったときに消えます。
```

## 出張の仮払い
店主が焙煎の研修で 2 日間の出張に行くことになり、出発前に概算で 20,000 円を現金で持ち出しました。
いくら何に使うかは帰ってくるまで分かりません。使い道が決まる前のお金は「仮払金」という資産に置きます。これが [[suspense_accounts|仮払金・仮受金]] の片方です。

```task
type: post
transaction: 店主の出張にあたり、旅費の概算額 20,000 円を現金で仮払いした
answer:
  debit: [{ account: suspense_payment, amount: 20000 }]
  credit: [{ account: cash, amount: 20000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 増えるのは仮払金なので左、減るのは現金なので右です。
  - match: { debit: [{ account: travel_expense }] }
    misconception: suspense_is_expense
    feedback: まだいくら使うか分かりません。金額が確定するまでは、旅費交通費ではなく仮払金に置きます。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 20,000 にしましょう。
hint: 左に仮払金 20,000、右に現金 20,000 です。
success: 仮払金 20,000 が資産に並びました。精算のときに、使った分だけが費用になります。
```

## 精算する
出張から戻った店主が精算しました。電車代と宿泊費で 18,000 円を使い、残りの 2,000 円は現金で返しました。
ここで仮払金 20,000 を消します。左は使った分の旅費交通費 18,000 と、戻ってきた現金 2,000 の 2 行。右は仮払金 20,000 です。

```task
type: post
transaction: 出張から戻り、仮払金 20,000 円を精算した。旅費交通費は 18,000 円で、残額 2,000 円は現金で返金された
answer:
  debit:
    - { account: travel_expense, amount: 18000 }
    - { account: cash, amount: 2000 }
  credit: [{ account: suspense_payment, amount: 20000 }]
wrong_patterns:
  - match: { debit: [{ account: travel_expense, amount: 20000 }] }
    misconception: settlement_full_amount_is_expense
    feedback: 費用になるのは実際に使った 18,000 円だけです。残りの 2,000 円は現金として戻ります。
  - match: { debit: [{ account: suspense_payment }] }
    feedback: 仮払金は精算で役目を終えます。右に書いて消します。
  - match: { unbalanced: true }
    feedback: 左の旅費交通費 18,000 + 現金 2,000 と、右の仮払金 20,000 がそろっていません。
hint: 左に旅費交通費 18,000 と現金 2,000 の 2 行。右に仮払金 20,000 です。「行を追加」で行を増やせます。
success: 仮払金が消え、旅費交通費 18,000 が費用に、現金 2,000 が戻りました。
```

## 正体不明の入金
普通預金の通帳を見ると、50,000 円の入金がありました。でも、誰から何のお金か分かりません。
分かるまで放っておくわけにはいきません。現金過不足と同じ「仮の置き場」の考え方で、正体が分かるまで「仮受金」という負債に置きます。返すことになるかもしれないお金だからです。記帳の前に、5 つの箱がどう動くか予想してみましょう。

```task
type: predict
transaction: 普通預金に 50,000 円の入金があったが、内容が不明だった
entry:
  debit: [{ account: bank_deposit, amount: 50000 }]
  credit: [{ account: suspense_receipt, amount: 50000 }]
answer: { asset: increase, liability: increase, equity: none, revenue: none, expense: none }
wrong_patterns:
  - match: { revenue: increase }
    misconception: suspense_receipt_is_revenue
    feedback: 何のお金か分からないうちは売上にできません。仮受金という負債に置いて、理由を調べます。
  - match: { liability: none }
    feedback: 返すことになるかもしれないお金なので、仮受金という負債に置きます。
  - match: { asset: none }
    feedback: 普通預金は実際に増えています。資産は増えます。
hint: 普通預金(資産)と仮受金(負債)が同じだけ増えます。
success: 仮受金 50,000 が負債に並びました。正体が分かったら、本来の科目へ移します。
```

## 正体が分かった
雑貨店に電話すると、この 50,000 円は先月売った古いショーケースの代金でした。つまり、未収入金の回収です。
仮受金を消して、未収入金を減らします。左に仮受金、右に未収入金。売上ではありません。

```task
type: post
transaction: 内容不明だった入金 50,000 円は、雑貨店に売却したショーケースの代金(未収入金)の回収だと分かった
answer:
  debit: [{ account: suspense_receipt, amount: 50000 }]
  credit: [{ account: accounts_receivable_other, amount: 50000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 仮受金を消すので左、未収入金を減らすので右です。
  - match: { credit: [{ account: sales }] }
    misconception: receivable_collection_is_sale
    feedback: ショーケースを売ったときに、未収入金として記録済みです。今回はその権利が回収されただけなので、売上ではありません。
  - match: { debit: [{ account: bank_deposit }] }
    feedback: 普通預金は入金のときに増やしてあります。今回は仮受金と未収入金を相殺するだけです。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 50,000 にしましょう。
hint: 左に仮受金 50,000、右に未収入金 50,000 です。
success: 仮受金と未収入金が両方消えました。仮の置き場は、正体が分かった日に空になります。
```

## 箱に分ける
立替金、預り金、仮払金、仮受金。4 つの科目を 5 つの箱に分けてみましょう。
「払った側」は権利、「受け取った側」は義務。どれも費用や収益ではありません。

```task
type: classify
accounts: [advances_paid, deposits_received, suspense_payment, suspense_receipt]
misconceptions:
  deposits_received:
    revenue: deposit_is_revenue
  suspense_payment:
    expense: suspense_is_expense
  suspense_receipt:
    revenue: suspense_receipt_is_revenue
hint: 立替金と仮払金は資産、預り金と仮受金は負債です。
success: 立替金と仮払金は資産、預り金と仮受金は負債。どれも「途中」のお金で、取引が終わると消えます。
```

## ふりかえり
他人の代わりに払ったお金は立替金(資産)、他人から預かったお金は預り金(負債)。使い道が決まっていないお金は仮払金(資産)、正体の分からない入金は仮受金(負債)。どれも、店のもうけや費用ではありません。
現金過不足と同じで、仮の科目は「分かるまで置いておく場所」です。分かった日に本来の科目へ移し、決算の日には残さないようにします。
これで、現金・預金と債権・債務のテーマは終わりです。次は固定資産のテーマで、「買った年に全部費用にしない」考え方を学びます。
