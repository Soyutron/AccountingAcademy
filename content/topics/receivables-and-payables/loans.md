---
id: receivables-and-payables/loans
title: 貸したお金、借りたお金
summary: 知り合いの焼き菓子店にお金を貸し、銀行の借入金に利息を払いながら、貸付金・借入金と利息の記録、元本と利息の違いを身につける
level: 1
order: 1
introduces: [loan, interest]
concepts: [asset, liability, revenue, expense]
requires: [cash-and-deposits/petty-cash]
scenario:
  company: カフェ「マメノキ」
  opening:
    - { account: cash, amount: 327000 }
    - { account: bank_deposit, amount: 300000 }
    - { account: checking_account, amount: 72500 }
    - { account: petty_cash, amount: 30000 }
    - { account: equipment, amount: 600000 }
    - { account: loans_payable, amount: 300000 }
    - { account: capital_stock, amount: 1000000 }
    - { account: retained_earnings, amount: 40000 }
    - { account: sales, amount: 110000 }
    - { account: purchases, amount: 55000 }
    - { account: rent_expense, amount: 50000 }
    - { account: communication_expense, amount: 6000 }
    - { account: miscellaneous_loss, amount: 1000 }
    - { account: supplies_expense, amount: 6500 }
    - { account: travel_expense, amount: 2000 }
---

## 貸す側と借りる側
初夏。焼き菓子を卸してくれている知り合いの店から「新しいオーブンを買いたいので 100,000 円貸してほしい」と頼まれました。
マメノキ自身も、開業のときに銀行から 300,000 円を借りています。貸したお金は後で返してもらう権利、借りたお金は後で返す義務。この 2 つをまとめて [[loan|貸付金・借入金]] と呼びます。

```figure
type: elements
alt: 貸付金は後で返してもらう権利なので資産の箱、借入金は後で返す義務なので負債の箱に入る
items:
  - { account: loans_receivable, highlight: true }
  - { account: loans_payable, highlight: true }
  - { account: bank_deposit }
```

## お金を貸す
普通預金から 100,000 円を振り込んで貸しました。
預金が減った代わりに、「返してもらう権利」が手に入りました。この権利は将来お金に戻るので資産です。科目は「貸付金」。左に貸付金、右に普通預金です。

```task
type: post
transaction: 知り合いの焼き菓子店に、普通預金から 100,000 円を振り込んで貸し付けた
answer:
  debit: [{ account: loans_receivable, amount: 100000 }]
  credit: [{ account: bank_deposit, amount: 100000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 増えるのは貸付金(権利)なので左、減るのは普通預金なので右です。
  - match: { debit: [{ account: loans_payable }] }
    misconception: lender_borrower_confused
    feedback: 借入金は自分が借りたときの科目です。今回は貸した側なので貸付金です。
  - match: { debit: [{ account: interest_expense }] }
    feedback: 貸したお金は費用ではありません。返してもらう権利として資産に残ります。
  - match: { credit: [{ account: cash }] }
    misconception: deposit_is_cash
    feedback: 取引文は普通預金からの振り込みです。現金は動いていないので、右は普通預金です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 100,000 にしましょう。
hint: 左に貸付金 100,000、右に普通預金 100,000 です。
success: 普通預金が貸付金に形を変えました。資産の合計は変わっていません。
```

## 利息を受け取る
3 か月後、焼き菓子店から利息 2,000 円が普通預金に振り込まれました。元本の 100,000 円はまだ返ってきていません。
お金を貸した「使用料」として受け取るのが [[interest|利息]] です。受け取る側は「受取利息」という収益になります。記帳の前に、5 つの箱がどう動くか予想してみましょう。

```task
type: predict
transaction: 貸付金の利息 2,000 円が普通預金に振り込まれた
entry:
  debit: [{ account: bank_deposit, amount: 2000 }]
  credit: [{ account: interest_income, amount: 2000 }]
answer: { asset: increase, liability: none, equity: increase, revenue: increase, expense: none }
wrong_patterns:
  - match: { revenue: none }
    misconception: interest_is_loan_return
    feedback: 利息は貸したことで得たもうけです。貸付金が減るのではなく、受取利息という収益が増えます。
  - match: { asset: none }
    feedback: 利息が預金に振り込まれたので、資産は増えます。貸付金は減りませんが、普通預金が増えます。
  - match: { equity: none }
    feedback: 収益が増えると当期純利益が増え、純資産も増えます。
hint: 普通預金(資産)と受取利息(収益)が増えます。収益が増えれば純資産も増えます。
success: 受取利息 2,000 が損益計算書に現れました。貸付金はそのままです。利息と元本は別物です。
```

## 借入金の利息を払う
今度はマメノキが払う番です。銀行の借入金 300,000 円の利息、半年分 3,000 円を普通預金から支払いました。
借りている「使用料」なので、「支払利息」という費用です。借入金そのものは減りません。元本を返したときだけ、借入金が減ります。

```task
type: post
transaction: 銀行からの借入金 300,000 円について、半年分の利息 3,000 円を普通預金から支払った
answer:
  debit: [{ account: interest_expense, amount: 3000 }]
  credit: [{ account: bank_deposit, amount: 3000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 支払利息は費用なので左、普通預金は減るので右です。
  - match: { debit: [{ account: loans_payable }] }
    misconception: interest_reduces_principal
    feedback: 利息を払っても借入金(元本)は減りません。利息は借りているための費用、支払利息です。
  - match: { debit: [{ account: interest_income }] }
    misconception: interest_income_expense_confused
    feedback: 受取利息は利息をもらう側の収益です。今回は銀行に払う側なので、費用の支払利息です。
  - match: { credit: [{ account: cash }] }
    misconception: deposit_is_cash
    feedback: 取引文は普通預金からの支払いです。現金は動いていないので、右は普通預金です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 3,000 にしましょう。
hint: 左に支払利息 3,000、右に普通預金 3,000 です。
success: 支払利息 3,000 が費用に並びました。借入金は 300,000 のままです。
```

## 利息の計算
さっきの 3,000 円はどう決まったのでしょう。利息は「元本 × 年利率 × 期間」で計算します。期間は 1 年を 12 か月として、月数 ÷ 12 で表します。
マメノキの借入金は 300,000 円、年利 2%、半年分でした。

```task
type: calc
question: 借入金 300,000 円、年利 2%、半年分(6 か月)の利息はいくらですか(円)
answer: 3000
wrong_patterns:
  - match: 6000
    feedback: 6,000 円は 1 年分です。半年分なので 6/12 を掛けます。
  - match: 300
    feedback: 年利は 2% です。300,000 × 0.02 = 6,000 が 1 年分、その半分です。
  - match: 1500
    feedback: 半年は 6/12 = 1/2 です。6,000 × 1/2 で 3,000 円になります。
  - match: 36000
    misconception: interest_months_not_divided
    feedback: 36,000 円は 6 か月をそのまま掛けた金額です。年利は 1 年分の率なので、6 ではなく 6/12 を掛けます。
hint: 300,000 × 2% × 6/12。
success: 300,000 × 0.02 × 6/12 = 3,000 円。利息は元本・利率・期間の 3 つで決まります。
```

## 返してもらう
半年後、焼き菓子店が 100,000 円を返してくれました。普通預金に振り込まれています。
貸付金という権利が、普通預金に戻っただけです。もうけではないので、収益にはなりません。左に普通預金、右に貸付金です。

```task
type: post
transaction: 貸し付けていた 100,000 円が返済され、普通預金に振り込まれた
answer:
  debit: [{ account: bank_deposit, amount: 100000 }]
  credit: [{ account: loans_receivable, amount: 100000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 増えるのは普通預金なので左、消えるのは貸付金なので右です。
  - match: { credit: [{ account: loans_receivable, amount: 100000 }, { account: interest_income }] }
    misconception: repayment_includes_interest
    feedback: 貸付金を 100,000 減らせているのは合っています。利息の 2,000 円は、前に受け取って記録済みの別の入金です。今回の入金は元本の 100,000 円だけなので、受取利息の行は要りません。
  - match: { credit: [{ account: interest_income }] }
    misconception: principal_is_revenue
    feedback: 返ってきたのは元本です。もうけではないので、受取利息ではなく貸付金を減らします。
  - match: { credit: [{ account: sales }] }
    feedback: 商品を売ったわけではありません。貸したお金が戻ってきただけです。
  - match: { credit: [{ account: loans_payable }] }
    misconception: lender_borrower_confused
    feedback: 返してもらった側なので、消すのは借入金ではなく貸付金です。借入金は自分が借りたお金の科目です。
  - match: { debit: [{ account: cash }] }
    misconception: deposit_is_cash
    feedback: 取引文は普通預金への振り込みです。現金は動いていないので、左は普通預金です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 100,000 にしましょう。
hint: 左に普通預金 100,000、右に貸付金 100,000 です。
success: 貸付金が消えて、普通預金に戻りました。利息の 2,000 円だけが、貸したことで得たもうけです。
```

## 借入金を返す
手元に余裕ができたので、銀行の借入金のうち 100,000 円を普通預金から返しました。
返すのは「義務」の分です。預金が減り、借入金が同じだけ減ります。記帳の前に、5 つの箱がどう動くか予想してみましょう。

```task
type: predict
transaction: 銀行からの借入金のうち 100,000 円を、普通預金から返済した
entry:
  debit: [{ account: loans_payable, amount: 100000 }]
  credit: [{ account: bank_deposit, amount: 100000 }]
answer: { asset: decrease, liability: decrease, equity: none, revenue: none, expense: none }
wrong_patterns:
  - match: { expense: increase }
    misconception: repayment_is_expense
    feedback: 返済は費用ではありません。返す義務(借入金)が減るだけで、もうけは動きません。
  - match: { liability: none }
    feedback: 100,000 円返したので、借入金という義務が減ります。
  - match: { equity: decrease }
    feedback: 資産と負債が同じだけ減るので、差し引きの純資産は変わりません。
  - match: { asset: none }
    feedback: 普通預金から 100,000 円を払ったので、資産は減ります。
hint: 普通預金(資産)と借入金(負債)が同じだけ減ります。もうけは動きません。
success: 借入金が 200,000 になりました。費用になったのは利息の 3,000 円だけです。
```

## 箱に分ける
貸付金、借入金、受取利息、支払利息。4 つの科目を 5 つの箱に分けてみましょう。
「貸した・借りた」は権利と義務、「利息」はもうけと費用です。

```task
type: classify
accounts: [loans_receivable, loans_payable, interest_income, interest_expense]
misconceptions:
  interest_income:
    asset: interest_is_loan_return
  loans_receivable:
    liability: lender_borrower_confused
  loans_payable:
    expense: repayment_is_expense
    asset: lender_borrower_confused
hint: 貸付金は資産、借入金は負債、受取利息は収益、支払利息は費用です。
success: 元本は資産か負債、利息は収益か費用。お金の貸し借りは、この 2 組で記録します。
```

## ふりかえり
貸したお金は貸付金(資産)、借りたお金は借入金(負債)。返したり返してもらったりしても、もうけは動きません。利息だけが受取利息(収益)や支払利息(費用)になります。
利息は「元本 × 年利率 × 月数 ÷ 12」。この計算は、決算で「まだ払っていない利息」を扱うときにも使います。
次は、商品以外の売り買いの後払いと、手付金の記録です。
