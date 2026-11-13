---
id: receivables-and-payables/loans
title: 貸したお金、借りたお金
summary: 知り合いの焼き菓子店にお金を貸し、銀行の借入金に利息を払いながら、貸付金・借入金と利息の記録、元本と利息の違いを身につける
level: 1
order: 1
introduces: [loan, interest, principal, annual_interest_rate]
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
初夏。焼き菓子を卸してくれている知り合いの店から「新しいオーブンを買いたいので100,000円貸してほしい」と頼まれました。
マメノキ自身も、開業のときに銀行から300,000円を借りています。貸したお金は後で返してもらう権利、借りたお金は後で返す義務。この2つをまとめて[[loan|貸付金・借入金]]と呼びます。

```figure
type: elements
alt: 貸付金は後で返してもらう権利なので資産の箱、借入金は後で返す義務なので負債の箱に入る
items:
  - { account: loans_receivable, highlight: true }
  - { account: loans_payable, highlight: true }
  - { account: bank_deposit }
```

## お金を貸す
[[bank_deposit|普通預金]]から100,000円を振り込んで貸しました。半年後に返してもらう約束で、[[annual_interest_rate|年利率]]は4%です。年利率は1年あたりの利息が貸したお金の何%かを表す割合で、計算のしかたはこの単元の後半で見ます。
預金が減った代わりに、「返してもらう権利」が手に入りました。この権利は将来お金に戻るので資産です。科目は「[[loans_receivable|貸付金]]」。左に貸付金、右に普通預金です。

```task
type: post
transaction: 知り合いの焼き菓子店に、普通預金から100,000円を振り込んで貸し付けた
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
    feedback: 左の合計と右の合計がそろっていません。どちらも100,000にしましょう。
hint: 左に貸付金100,000、右に普通預金100,000です。
success: 普通預金が貸付金に形を変えました。資産の合計は変わっていません。
```

## 利息を受け取る
半年後の約束の日。焼き菓子店からまず半年分の利息2,000円が普通預金に振り込まれました。貸した100,000円そのものは、このあと別の振り込みで返ってきます。
貸し借りしたお金そのものを[[principal|元本]]と呼びます。今回の元本は貸した100,000円で、利息の2,000円は含みません。
お金を貸した「使用料」として受け取るのが[[interest|利息]]です。受け取る側は「[[interest_income|受取利息]]」という収益になります。記帳の前に、5つの箱がどう動くか予想してみましょう。

```task
type: predict
transaction: 貸付金の半年分の利息2,000円が普通預金に振り込まれた
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
success: 受取利息2,000が損益計算書に現れました。貸付金はそのままです。利息と元本は別物です。
```

## 借入金の利息を払う
今度はマメノキが払う番です。銀行の[[loans_payable|借入金]] 300,000円の利息、半年分3,000円を普通預金から支払いました。
借りている「使用料」なので、「[[interest_expense|支払利息]]」という費用です。借入金そのものは減りません。[[principal|元本]]を返したときだけ、借入金が減ります。

```task
type: post
transaction: 銀行からの借入金300,000円について、半年分の利息3,000円を普通預金から支払った
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
    feedback: 左の合計と右の合計がそろっていません。どちらも3,000にしましょう。
hint: 左に支払利息3,000、右に普通預金3,000です。
success: 支払利息3,000が費用に並びました。借入金は300,000のままです。
```

## 利息の計算
さっきの3,000円はどう決まったのでしょう。利息は「[[principal|元本]] × [[annual_interest_rate|年利率]] × 期間」で計算します。年利率は、1年借りたときの利息が元本の何%かを表す割合です。年利率2%で100,000円を1年借りれば、利息は2,000円です。期間は1年を12か月として、月数 ÷ 12で表します。
マメノキの借入金は300,000円、年利率2%、半年分でした。焼き菓子店から受け取った利息2,000円も同じ式で、貸した100,000円 × 年利率4% × 6/12です。

```task
type: calc
question: 借入金300,000円、年利率2%、半年分(6か月)の利息はいくらですか(円)
answer: 3000
wrong_patterns:
  - match: 6000
    feedback: 6,000円は1年分です。半年分なので6/12を掛けます。
  - match: 300
    feedback: 年利率は2%です。300,000 × 0.02 = 6,000が1年分、その半分です。
  - match: 1500
    feedback: 半年は6/12 = 1/2です。1年分の6,000に1/2を掛け直しましょう。
  - match: 36000
    misconception: interest_months_not_divided
    feedback: 36,000円は6か月をそのまま掛けた金額です。年利率は1年分の率なので、6ではなく6/12を掛けます。
hint: 300,000 × 2% × 6/12。
success: 300,000 × 0.02 × 6/12 = 3,000円。利息は元本・年利率・期間の3つで決まります。
```

## 返してもらう
利息に続いて、元本の100,000円が普通預金に振り込まれました。焼き菓子店からの入金はこれで全部です。
貸付金という権利が、普通預金に戻っただけです。もうけではないので、収益にはなりません。左に普通預金、右に貸付金です。

```task
type: post
transaction: 貸し付けていた100,000円が返済され、普通預金に振り込まれた
answer:
  debit: [{ account: bank_deposit, amount: 100000 }]
  credit: [{ account: loans_receivable, amount: 100000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 増えるのは普通預金なので左、消えるのは貸付金なので右です。
  - match: { credit: [{ account: loans_receivable, amount: 100000 }, { account: interest_income }] }
    misconception: repayment_includes_interest
    feedback: 貸付金を100,000減らせているのは合っています。利息の2,000円は、先に受け取って記録済みの別の入金です。今回の入金は元本の100,000円だけなので、受取利息の行は要りません。
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
    feedback: 左の合計と右の合計がそろっていません。どちらも100,000にしましょう。
hint: 左に普通預金100,000、右に貸付金100,000です。
success: 貸付金が消えて、普通預金に戻りました。利息の2,000円だけが、貸したことで得たもうけです。
```

## 借入金を返す
手元に余裕ができたので、銀行の借入金のうち100,000円を普通預金から返しました。
返すのは「義務」の分です。預金が減り、借入金が同じだけ減ります。記帳の前に、5つの箱がどう動くか予想してみましょう。

```task
type: predict
transaction: 銀行からの借入金のうち100,000円を、普通預金から返済した
entry:
  debit: [{ account: loans_payable, amount: 100000 }]
  credit: [{ account: bank_deposit, amount: 100000 }]
answer: { asset: decrease, liability: decrease, equity: none, revenue: none, expense: none }
wrong_patterns:
  - match: { expense: increase }
    misconception: repayment_is_expense
    feedback: 返済は費用ではありません。返す義務(借入金)が減るだけで、もうけは動きません。
  - match: { liability: none }
    feedback: 100,000円返したので、借入金という義務が減ります。
  - match: { equity: decrease }
    feedback: 資産と負債が同じだけ減るので、差し引きの純資産は変わりません。
  - match: { asset: none }
    feedback: 普通預金から100,000円を払ったので、資産は減ります。
hint: 普通預金(資産)と借入金(負債)が同じだけ減ります。もうけは動きません。
success: 借入金が200,000になりました。費用になったのは利息の3,000円だけです。
```

## 箱に分ける
貸付金、借入金、受取利息、支払利息。4つの科目を5つの箱に分けてみましょう。
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
success: 元本は資産か負債、利息は収益か費用。お金の貸し借りは、この2組で記録します。
```

## ふりかえり
貸したお金は貸付金(資産)、借りたお金は借入金(負債)。返したり返してもらったりしても、もうけは動きません。利息だけが受取利息(収益)や支払利息(費用)になります。
利息は「[[principal|元本]] × [[annual_interest_rate|年利率]] × 月数 ÷ 12」。この計算は、決算で「まだ払っていない利息」を扱うときにも使います。
次は、商品以外の売り買いの後払いと、手付金の記録です。
