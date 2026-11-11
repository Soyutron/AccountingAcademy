---
id: receivables-and-payables/other-receivables-and-payables
title: 商品以外の後払いと手付金
summary: 古いショーケースを後払いで売り、新しい椅子を後払いで買い、豆の予約に手付金を払いながら、未収入金・未払金と前払金・前受金の使い分けを身につける
level: 1
order: 2
introduces: [non_trade_receivable_payable, advance_payment_receipt]
concepts: [accounts_receivable, accounts_payable, asset, liability]
requires: [receivables-and-payables/loans, merchandise/credit-transactions]
scenario:
  company: カフェ「マメノキ」
  opening:
    - { account: cash, amount: 327000 }
    - { account: bank_deposit, amount: 199000 }
    - { account: checking_account, amount: 72500 }
    - { account: petty_cash, amount: 30000 }
    - { account: equipment, amount: 600000 }
    - { account: loans_payable, amount: 200000 }
    - { account: capital_stock, amount: 1000000 }
    - { account: retained_earnings, amount: 40000 }
    - { account: sales, amount: 110000 }
    - { account: purchases, amount: 55000 }
    - { account: rent_expense, amount: 50000 }
    - { account: communication_expense, amount: 6000 }
    - { account: miscellaneous_loss, amount: 1000 }
    - { account: supplies_expense, amount: 6500 }
    - { account: travel_expense, amount: 2000 }
    - { account: interest_income, amount: 2000 }
    - { account: interest_expense, amount: 3000 }
---

## 商品以外の売り買い
夏の模様替え。古いショーケースを近所の雑貨店に売り、新しい椅子を家具店から買うことにしました。どちらも代金は来月です。
商品の後払いなら[[accounts_receivable|売掛金]]と[[accounts_payable|買掛金]]でした。でもショーケースや椅子は売り物ではありません。商品以外の後払いには、別の科目を使います。[[non_trade_receivable_payable|未収入金・未払金]]です。

```figure
type: compare
alt: 商品の後払いは売掛金と買掛金、商品以外の後払いは未収入金と未払金で記録する
left:
  title: 商品の売り買い
  figure:
    type: elements
    alt: 売掛金は資産の箱、買掛金は負債の箱
    items:
      - { account: accounts_receivable, highlight: true }
      - { account: accounts_payable, highlight: true }
right:
  title: 商品以外の売り買い
  figure:
    type: elements
    alt: 未収入金は資産の箱、未払金は負債の箱
    items:
      - { account: accounts_receivable_other, highlight: true }
      - { account: accounts_payable_other, highlight: true }
```

## 古いショーケースを売る
帳簿に50,000円で載っている古いショーケース(備品)を、雑貨店に50,000円で売りました。代金は来月振り込まれます。
備品が減り、「後で受け取る権利」が増えます。売り物ではないので売掛金ではなく[[accounts_receivable_other|未収入金]]。売上でもありません。左に未収入金、右に備品です。

```task
type: post
transaction: 帳簿に50,000円で載っている古いショーケース(備品)を50,000円で売却し、代金は来月受け取ることにした
answer:
  debit: [{ account: accounts_receivable_other, amount: 50000 }]
  credit: [{ account: equipment, amount: 50000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 増えるのは未収入金(権利)なので左、減るのは備品なので右です。
  - match: { debit: [{ account: accounts_receivable }] }
    misconception: nontrade_as_trade
    feedback: 売掛金は商品を売ったときの科目です。備品のような商品以外の物は未収入金を使います。
  - match: { credit: [{ account: sales }] }
    misconception: asset_sale_is_sales
    feedback: 売上は商品を売ったときだけです。備品を売ったときは、備品そのものを減らします。
  - match: { debit: [{ account: accounts_payable_other }] }
    misconception: nontrade_receivable_payable_confused
    feedback: 未払金は「後で払う義務」(負債)です。ショーケースを売って代金をこれから受け取るので、増えるのは「後で受け取る権利」である未収入金です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも50,000にしましょう。
hint: 左に未収入金50,000、右に備品50,000です。
success: 備品が550,000に減り、未収入金50,000が現れました。資産の中で形が変わっただけです。
```

## 新しい椅子を買う
家具店から新しい椅子を80,000円で買いました。代金は来月払います。
椅子は長く使うので備品(資産)です。「後で払う義務」は、商品ではないので買掛金ではなく[[accounts_payable_other|未払金]]。記帳の前に、5つの箱がどう動くか予想してみましょう。

```task
type: predict
transaction: 家具店から店で使う椅子(備品)を80,000円で購入し、代金は来月支払うことにした
entry:
  debit: [{ account: equipment, amount: 80000 }]
  credit: [{ account: accounts_payable_other, amount: 80000 }]
answer: { asset: increase, liability: increase, equity: none, revenue: none, expense: none }
wrong_patterns:
  - match: { expense: increase }
    feedback: 椅子は長く使う物なので、費用ではなく備品(資産)です。
  - match: { liability: none }
    feedback: 代金はまだ払っていません。「後で払う義務」である未払金が増えます。
  - match: { equity: increase }
    feedback: 資産と負債が同じだけ増えるので、差し引きの純資産は変わりません。
hint: 備品(資産)と未払金(負債)が同じだけ増えます。
success: 備品が630,000に増え、未払金80,000が負債に並びました。
```

## 手付金を払う
秋に向けて、問屋に新しい豆40,000円分を予約しました。予約のしるしに、手付金として10,000円を現金で払いました。
豆はまだ届いていないので、仕入ではありません。「豆を受け取る権利」を先に買った状態です。払った手付金は「[[advance_payment|前払金]]」という資産。これが[[advance_payment_receipt|前払金・前受金]]の片方です。

```task
type: post
transaction: 問屋にコーヒー豆(商品)40,000円分を予約し、手付金10,000円を現金で支払った
answer:
  debit: [{ account: advance_payment, amount: 10000 }]
  credit: [{ account: cash, amount: 10000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 増えるのは前払金(権利)なので左、減るのは現金なので右です。
  - match: { debit: [{ account: purchases }] }
    misconception: advance_is_expense
    feedback: 豆はまだ届いていません。届くまでは仕入ではなく、前払金という資産です。
  - match: { debit: [{ account: advance_received }] }
    feedback: 前受金は手付金を受け取った側の科目です。払った側は前払金です。
  - match: { debit: [{ account: accounts_receivable_other }] }
    misconception: advance_payment_as_receivable
    feedback: 未収入金は、商品以外の物を売った代金を後で受け取る権利です。今回は何も売っていません。お金を先に払って「豆を受け取る権利」を持ったので、前払金です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも10,000にしましょう。
hint: 左に前払金10,000、右に現金10,000です。
success: 前払金10,000が資産に現れました。豆が届いたときに、これを仕入に変えます。
```

## 商品が届く
予約していた豆40,000円分が届きました。手付金10,000円を差し引いた残りの30,000円は、月末に払います。
ここで初めて仕入40,000を左に書きます。右は2行。先に払ってあった前払金10,000を消し、残りの30,000は買掛金です。

```task
type: post
transaction: 予約していたコーヒー豆(商品)40,000円分を受け取った。手付金10,000円を差し引き、残額30,000円は月末に支払う
answer:
  debit: [{ account: purchases, amount: 40000 }]
  credit:
    - { account: advance_payment, amount: 10000 }
    - { account: accounts_payable, amount: 30000 }
wrong_patterns:
  - match: { debit: [{ account: advance_payment }] }
    feedback: 前払金は豆を受け取ったことで役目を終えます。右に書いて消します。
  - match: { credit: [{ account: cash }] }
    feedback: 今回は現金を払っていません。手付金はすでに払ってあり、残りは月末です。
  - match: { debit: [{ account: purchases, amount: 30000 }] }
    misconception: advance_is_expense
    feedback: 仕入は豆の全額40,000です。手付金の10,000も、今日仕入に変わります。
  - match: { credit: [{ account: advance_received }] }
    feedback: 前受金は手付金を受け取った側の科目です。払ってあったのは前払金です。
  - match: { credit: [{ account: accounts_payable_other }] }
    misconception: trade_as_nontrade
    feedback: 未払金は商品以外の物の代金に使う科目です。豆は売り物の商品なので、残りの代金は買掛金です。
  - match: { unbalanced: true }
    feedback: 左の仕入40,000と、右の前払金10,000 + 買掛金30,000がそろっていません。
  - match: { debit: [{ account: purchases, amount: 40000 }], credit: [{ account: accounts_payable, amount: 40000 }] }
    misconception: advance_not_cleared_on_receipt
    feedback: 先に払った手付金10,000は前払金として資産に残っています。右に前払金10,000を書いて消し、買掛金は残りの30,000だけです。
hint: 左に仕入40,000。右に前払金10,000と買掛金30,000の2行です。「行を追加」で行を増やせます。
success: 前払金が消えて仕入40,000になり、残りの30,000は買掛金に並びました。
```

## 手付金を受け取る
今度は手付金を受け取る側です。近所の会社から「秋のイベント用にコーヒーを50杯分、当日に届けてほしい」と注文があり、前金として5,000円を現金で受け取りました。
コーヒーはまだ渡していないので売上ではありません。「渡す義務」(渡せなければ返す義務)を負った状態です。受け取った手付金は「[[advance_received|前受金]]」という負債。記帳の前に、5つの箱がどう動くか予想してみましょう。

```task
type: predict
transaction: 近所の会社からイベント用コーヒーの注文を受け、前金として5,000円を現金で受け取った
entry:
  debit: [{ account: cash, amount: 5000 }]
  credit: [{ account: advance_received, amount: 5000 }]
answer: { asset: increase, liability: increase, equity: none, revenue: none, expense: none }
wrong_patterns:
  - match: { revenue: increase }
    misconception: advance_received_is_revenue
    feedback: コーヒーはまだ渡していません。渡すまでは売上ではなく、前受金という負債です。
  - match: { liability: none }
    feedback: 前金を受け取った分、「渡す義務」を負っています。負債が増えます。
  - match: { equity: increase }
    feedback: 現金と負債が同じだけ増えるので、純資産は変わりません。もうけになるのは当日です。
hint: 現金(資産)と前受金(負債)が同じだけ増えます。
success: 前受金5,000が負債に並びました。当日コーヒーを渡したときに、売上に変わります。
```

## いま負債はいくら
後で果たす義務が増えました。[[loans_payable|借入金]]、未払金、買掛金はお金を払う義務、前受金は商品を渡す義務です。いまの負債の合計はいくらでしょう。結果の[[balance_sheet|貸借対照表]]を見ずに計算してから、確かめてみましょう。

```task
type: calc
question: いまの負債の合計はいくらですか(円)
answer: 315000
wrong_patterns:
  - match: 310000
    misconception: advance_received_is_revenue
    feedback: 前受金5,000も負債です。まだ渡していないコーヒーの分は、これから渡す義務として残っています。
  - match: 235000
    feedback: 椅子の未払金80,000を忘れていませんか。
  - match: 285000
    feedback: 豆の残額の買掛金30,000も負債です。
  - match: 365000
    misconception: nontrade_receivable_payable_confused
    feedback: 365,000は未収入金50,000まで足した額です。未収入金は「後で受け取る権利」なので資産で、負債には入りません。
  - match: 1303500
    feedback: 1,303,500は結果の貸借対照表の「負債・純資産合計」で、負債に純資産(資本金など)まで足した額です。後で果たす義務である負債だけを足しましょう。
hint: 借入金200,000 + 未払金80,000 + 買掛金30,000 + 前受金5,000。
success: 負債の合計は315,000円。お金を払う義務が3種類と、商品を渡す義務が1種類並んでいます。
```

## 箱に分ける
未収入金、未払金、前払金、前受金。名前が似ていますが、権利か義務かで箱が分かれます。4つを5つの箱に分けてみましょう。
未収入金はお金を、前払金は商品を受け取る権利。未払金はお金を払う義務、前受金は商品を渡す義務です。

```task
type: classify
accounts: [accounts_receivable_other, accounts_payable_other, advance_payment, advance_received]
misconceptions:
  advance_payment:
    expense: advance_is_expense
  advance_received:
    revenue: advance_received_is_revenue
hint: 未収入金と前払金は資産、未払金と前受金は負債です。
success: 未収入金と前払金は資産、未払金と前受金は負債。どれも、まだ終わっていない取引の途中の姿です。
```

## ふりかえり
売掛金・買掛金は商品専用。商品以外の後払いは未収入金・未払金で記録して、本業と区別します。手付金は、商品が動くまでは前払金(資産)か前受金(負債)で、動いた日に仕入や売上に変わります。
どの科目も「まだ終わっていない取引の途中」を表しています。取引が終わったときに消えるのが共通点です。
次は、他人のお金を一時的に預かったり立て替えたりしたときと、正体の分からない入出金の記録です。
