---
id: cash-and-deposits/petty-cash
title: 細かい支払いを任せる
summary: 切手代やお茶代のような小さな支払いを担当者に任せるため、小口現金を前もって渡し、週末の報告で費用を記録して補給する流れを身につける
level: 1
order: 3
introduces: [petty_cash, imprest_system]
concepts: [asset, expense, checking_account]
requires: [cash-and-deposits/checking-account]
scenario:
  company: カフェ「マメノキ」
  opening:
    - { account: cash, amount: 327000 }
    - { account: bank_deposit, amount: 300000 }
    - { account: checking_account, amount: 115000 }
    - { account: equipment, amount: 600000 }
    - { account: loans_payable, amount: 300000 }
    - { account: capital_stock, amount: 1000000 }
    - { account: retained_earnings, amount: 40000 }
    - { account: sales, amount: 110000 }
    - { account: purchases, amount: 55000 }
    - { account: rent_expense, amount: 50000 }
    - { account: communication_expense, amount: 2000 }
    - { account: miscellaneous_loss, amount: 1000 }
---

## 細かい支払い
切手代、文房具、お客さん用のお茶。毎日の細かい支払いのたびに店主が財布を開くのは大変です。
そこで、担当のスタッフに一定のお金を前もって渡し、細かい支払いはそこから出してもらうことにしました。このお金が[[petty_cash|小口現金]]です。

```figure
type: flow
alt: 週の初めに小口現金を渡し、担当者が細かい支払いをし、週末に内訳を報告し、使った分だけ補給する
nodes: ["週の初めに30,000を渡す", "担当者が細かい支払い", "週末に内訳を報告", "使った分だけ補給"]
highlight: 0
```

## 小口現金を渡す
週の初めに、担当者へ30,000円を[[check|小切手]]で渡しました。
渡しただけでは、まだ何も買っていません。会社のお金が、[[checking_account|当座預金]]から担当者の手元へ移っただけです。だから費用ではなく、小口現金という資産が増えます。右は小切手なので当座預金です。

```task
type: post
transaction: 小口現金の担当者に、小切手を振り出して30,000円を前渡しした
answer:
  debit: [{ account: petty_cash, amount: 30000 }]
  credit: [{ account: checking_account, amount: 30000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 増えるのは小口現金なので左、減るのは当座預金なので右です。
  - match: { debit: [{ account: supplies_expense }] }
    misconception: petty_cash_is_expense
    feedback: 渡しただけでは、まだ何も使っていません。担当者の手元にある会社のお金なので、小口現金という資産です。
  - match: { credit: [{ account: cash }] }
    misconception: check_is_cash
    feedback: 小切手で渡したので、減るのは当座預金です。
  - match: { debit: [{ account: cash }] }
    misconception: petty_cash_is_cash
    feedback: 担当者に渡したお金は、店の金庫の現金とは分けて小口現金という科目で管理します。増えるのは現金ではなく小口現金です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも30,000にしましょう。
hint: 左に小口現金30,000、右に当座預金30,000です。
success: 小口現金30,000が資産に並び、当座預金が同じだけ減りました。資産の合計は変わっていません。
```

## 担当者の1週間
週の間、担当者は小口現金から切手代やお茶代を払い、自分の帳面(小口現金出納帳)に書いていきます。
この時点では、店の帳簿にはまだ何も書きません。担当者がいくら何に使ったかは、週末の報告で分かるからです。結果の財務諸表も、まだ動きません。

## 週末の報告
週末、担当者から報告がありました。切手代4,000円、文房具6,500円、電車代2,000円、合わせて12,500円。
ここで初めて費用を記録します。左に[[communication_expense|通信費]]・[[supplies_expense|消耗品費]]・[[travel_expense|旅費交通費]]を1行ずつ、右に小口現金12,500です。3つの費用が、小口現金という1つの資産から出ていきました。

```task
type: post
transaction: 週末、小口現金の担当者から、切手代4,000円、文房具代6,500円、電車代2,000円を支払ったと報告を受けた
answer:
  debit:
    - { account: communication_expense, amount: 4000 }
    - { account: supplies_expense, amount: 6500 }
    - { account: travel_expense, amount: 2000 }
  credit: [{ account: petty_cash, amount: 12500 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 費用は左で増え、小口現金は右で減ります。
  - match: { credit: [{ account: checking_account }] }
    feedback: 支払ったのは担当者の手元の小口現金です。まず小口現金を減らします。補給は次のステップです。
  - match: { credit: [{ account: cash }] }
    misconception: petty_cash_is_cash
    feedback: 担当者の手元のお金は、店の金庫の現金とは分けて小口現金という科目で管理しています。支払いに使ったので、減るのは小口現金です。
  - match: { debit: [{ account: supplies_expense, amount: 4000 }] }
    feedback: 切手代4,000円は、郵便のための代金なので通信費です。消耗品費にするのは文房具代6,500円だけです。
  - match: { debit: [{ account: supplies_expense, amount: 10500 }] }
    feedback: 切手代4,000円は、郵便のための代金なので通信費です。消耗品費にするのは文房具代6,500円だけです。
  - match: { unbalanced: true }
    feedback: 左の3つの費用の合計(12,500)と、右の小口現金がそろっていません。
  - match: { debit: [{ account: communication_expense, amount: 12500 }] }
    misconception: petty_expenses_lumped
    feedback: 通信費になるのは切手代だけです。報告された3つの支払いは使い道が違うので、文房具代と電車代はそれぞれの費用の科目に分けます。
  - match: { debit: [{ account: supplies_expense, amount: 12500 }] }
    misconception: petty_expenses_lumped
    feedback: 消耗品費になるのは文房具代だけです。報告された3つの支払いは使い道が違うので、切手代と電車代はそれぞれの費用の科目に分けます。
  - match: { debit: [{ account: travel_expense, amount: 12500 }] }
    misconception: petty_expenses_lumped
    feedback: 旅費交通費になるのは電車代だけです。報告された3つの支払いは使い道が違うので、切手代と文房具代はそれぞれの費用の科目に分けます。
  - match: { debit: [{ account: communication_expense, amount: 4000 }, { account: supplies_expense, amount: 6500 }], credit: [{ account: petty_cash, amount: 10500 }] }
    misconception: petty_payment_omitted
    feedback: 報告された支払いは3つですが、電車代2,000円の分が書かれていません。旅費交通費の行を足して、右の小口現金も3つの合計にしましょう。
  - match: { debit: [{ account: communication_expense, amount: 4000 }, { account: travel_expense, amount: 2000 }], credit: [{ account: petty_cash, amount: 6000 }] }
    misconception: petty_payment_omitted
    feedback: 報告された支払いは3つですが、文房具代6,500円の分が書かれていません。消耗品費の行を足して、右の小口現金も3つの合計にしましょう。
  - match: { debit: [{ account: supplies_expense, amount: 6500 }, { account: travel_expense, amount: 2000 }], credit: [{ account: petty_cash, amount: 8500 }] }
    misconception: petty_payment_omitted
    feedback: 報告された支払いは3つですが、切手代4,000円の分が書かれていません。通信費の行を足して、右の小口現金も3つの合計にしましょう。
hint: 左に通信費4,000、消耗品費6,500、旅費交通費2,000の3行。右に小口現金12,500です。「行を追加」で行を増やせます。
success: 3つの費用が損益計算書に現れ、小口現金は17,500に減りました。
```

## 使った分を補給する
報告を受けたら、使った12,500円を小切手で補給して、小口現金を30,000円に戻します。
いつも決まった金額に戻すので、担当者の手元にいくらあるべきかが一目で分かります。この方法を[[imprest_system|定額資金前渡法]]と呼びます。記帳の前に、5つの箱がどう動くか予想してみましょう。

```task
type: predict
transaction: 小口現金の担当者に、使った分12,500円を小切手を振り出して補給した
entry:
  debit: [{ account: petty_cash, amount: 12500 }]
  credit: [{ account: checking_account, amount: 12500 }]
answer: { asset: none, liability: none, equity: none, revenue: none, expense: none }
wrong_patterns:
  - match: { expense: increase }
    misconception: petty_cash_is_expense
    feedback: 費用は報告を受けたときに記録済みです。補給は、当座預金から小口現金へお金を移すだけです。
  - match: { asset: decrease }
    feedback: 当座預金は減りますが、小口現金が同じだけ増えます。資産の合計は変わりません。
  - match: { asset: increase }
    feedback: 小口現金は増えますが、当座預金が同じだけ減ります。資産の合計は変わりません。
hint: 当座預金(資産)から小口現金(資産)へ移すだけなので、5つの箱の合計はどれも動きません。
success: 小口現金が30,000に戻り、当座預金が12,500減りました。資産の中でお金が移動しただけです。
```

## 報告と補給を同時に
報告を受けたその場で補給することも多いです。その場合は、費用の相手を小口現金ではなく当座預金にして、1つの仕訳にまとめます。
2段階に分けても、1つにまとめても、結果は同じです。小口現金は30,000円のまま、費用と当座預金の減少だけが残ります。

```figure
type: compare
alt: 報告と補給を分けると小口現金がいったん減って戻る。同時に行うと費用の相手が当座預金になり、小口現金は動かない
left:
  title: 分けて記帳
  figure:
    type: flow
    alt: 報告で費用と小口現金の減少を記録し、補給で小口現金の増加と当座預金の減少を記録する
    nodes: ["報告: 費用 / 小口現金", "補給: 小口現金 / 当座預金"]
right:
  title: 同時に記帳
  figure:
    type: flow
    alt: 報告と同時に補給するので、費用の相手を直接当座預金にする
    nodes: [報告と補給を同時に, "費用 / 当座預金"]
```

```journal
借方: 通信費 4,000
借方: 消耗品費 6,500
借方: 旅費交通費 2,000
貸方: 当座預金 12,500
```

## いま手元にいくら
補給が終わったあと、担当者の手元の小口現金はいくらでしょう。結果の[[balance_sheet|貸借対照表]]を見ずに答えてから、確かめてみましょう。

```task
type: calc
question: 補給が終わったあとの小口現金の残高はいくらですか(円)
answer: 30000
wrong_patterns:
  - match: 17500
    feedback: それは補給する前の金額です。使った12,500円を補給して、元の金額に戻しました。
  - match: 42500
    feedback: 補給は使った分だけです。17,500 + 12,500で、渡したときの金額に戻ります。
hint: 渡したときの金額に戻ります。
success: 小口現金は30,000円。定額資金前渡法では、補給のたびにこの金額に戻ります。
```

## 箱に分ける
小口現金と、そこから払った費用、補給に使った当座預金。4つの科目を5つの箱に分けてみましょう。
担当者の手元にあるお金は、まだ会社のものです。

```task
type: classify
accounts: [petty_cash, travel_expense, communication_expense, checking_account]
misconceptions:
  petty_cash:
    expense: petty_cash_is_expense
hint: 小口現金と当座預金は資産、旅費交通費と通信費は費用です。
success: 小口現金は資産。使った分の報告を受けて初めて、通信費や旅費交通費という費用になります。
```

## ふりかえり
小口現金は、細かい支払いを担当者に任せるために前もって渡しておくお金です。渡しただけでは費用にならず、報告を受けたときに使い道ごとの費用を記録します。使った分だけ補給して定額に戻すのが定額資金前渡法です。
[[cash_over_and_short|現金過不足]]、当座預金、小口現金。この3つの単元で、「お金がどこにあり、いつ費用になるか」を正確に書く練習をしました。
次のテーマは、貸したお金と借りたお金、後払いや手付金など、「後で受け取る権利」と「後で払う義務」です。
