---
id: merchandise/credit-transactions
title: 掛けで売る、掛けで買う
summary: カフェ 3 か月目、近所の会社への納品と問屋からの仕入を「代金は後で」の掛け取引で記帳しながら、売掛金と買掛金の正体を身につける
level: 1
order: 2
introduces: [credit_transaction, accounts_receivable, accounts_payable]
concepts: [asset, liability, revenue, expense]
requires: [merchandise/three-account-method]
scenario:
  company: カフェ「マメノキ」
  opening:
    - { account: cash, amount: 770000 }
    - { account: equipment, amount: 600000 }
    - { account: loans_payable, amount: 300000 }
    - { account: capital_stock, amount: 1000000 }
    - { account: sales, amount: 170000 }
    - { account: purchases, amount: 50000 }
    - { account: rent_expense, amount: 50000 }
---

## 代金は月末に
カフェ「マメノキ」の 3 か月目。近所の会社から「会議用にコーヒー豆をまとめて納めてほしい、代金は月末にまとめて払う」と注文が入りました。問屋も「代金は月末でいいよ」と言ってくれています。
商品を先に渡し、代金は後でまとめて受け払いする約束の取引を [[credit_transaction|掛け取引]] と呼びます。お金が動かない日に、何を記帳すればよいのでしょう。

```figure
type: flow
alt: 掛け取引の流れ。商品を渡した日に売上と「受け取る権利」を記録し、月末に代金を受け取って権利が預金に変わる
nodes: [商品を渡す, 受け取る権利を記録, 月末に代金を受け取る]
highlight: 1
```

## 問屋から掛けで仕入れる
問屋からコーヒー豆を 40,000 円分仕入れました。豆は受け取りましたが、代金は月末に払います。
商品を受け取ったので、左は先月と同じ「仕入 40,000」です。右は現金ではありません。まだ払っていないからです。代わりに「後で払う義務」を書きます。この義務が [[accounts_payable|買掛金]] で、借入金と同じ負債の仲間です。

```figure
type: elements
alt: 掛けで仕入れると、仕入は費用の箱に、買掛金は借入金と同じ負債の箱に入る。現金は動かない
items:
  - { account: purchases, highlight: true }
  - { account: accounts_payable, highlight: true }
  - { account: loans_payable }
  - { account: cash }
```

```task
type: post
transaction: 問屋からコーヒー豆(商品)40,000 円分を仕入れ、代金は月末に支払うことにした
answer:
  debit: [{ account: purchases, amount: 40000 }]
  credit: [{ account: accounts_payable, amount: 40000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 仕入は費用なので左、払う義務である買掛金は右です。左右を入れ替えてみましょう。
  - match: { credit: [{ account: cash }] }
    feedback: 代金はまだ払っていないので、現金は減りません。「後で払う義務」を右に書きます。
  - match: { credit: [{ account: loans_payable }] }
    feedback: 借入金は銀行から借りたお金です。商品の代金を後で払う義務は買掛金を使います。
  - match: { debit: [{ account: merchandise_inventory }] }
    misconception: purchase_is_asset
    feedback: 掛けでも、買ったときは仕入という費用で記録します。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 40,000 にしましょう。
hint: 左に仕入 40,000、右に買掛金 40,000 です。
success: 負債の箱に買掛金が現れました。現金は 1 円も動いていないのに、仕入はきちんと記録されています。
```

## 会社に掛けで納品する
注文のあった会社にコーヒー豆 60,000 円分を納品しました。代金は月末に振り込んでもらう約束です。
記帳の前に予想してみましょう。お金はまだ入っていませんが、豆はもう渡しました。売上はいつ記録するべきでしょうか。そして左には何が増えるでしょうか。

```task
type: predict
transaction: 会社にコーヒー豆(商品)60,000 円分を納品し、代金は月末に受け取ることにした
entry:
  debit: [{ account: accounts_receivable, amount: 60000 }]
  credit: [{ account: sales, amount: 60000 }]
answer: { asset: increase, liability: none, equity: increase, revenue: increase, expense: none }
wrong_patterns:
  - match: { revenue: none }
    misconception: revenue_only_when_cash
    feedback: 豆はもう渡しているので、売上はこの日に記録します。お金を受け取る日まで待ちません。
  - match: { asset: none }
    misconception: receivable_is_cash
    feedback: 現金は増えませんが、「後で代金を受け取る権利」が増えます。この権利は資産です。
  - match: { liability: increase }
    feedback: 増えたのは受け取る権利で、払う義務ではありません。負債は動きません。
  - match: { equity: none }
    feedback: 売上が増えると当期純利益が増え、そのぶん純資産も増えます。
hint: 売上(収益)が増え、受け取る権利(資産)が増えます。収益が増えれば純資産も増えます。
success: 左に現れた「売掛金」が、後で代金を受け取る権利です。現金と同じ資産の箱に入ります。
```

## 月末、代金が振り込まれる
月末になり、会社から 60,000 円が普通預金に振り込まれました。納品の日に左に書いた「後で受け取る権利」が [[accounts_receivable|売掛金]] です。その権利が、預金というお金に変わった瞬間です。
売上はもう納品の日に記録してあります。ここで売上をもう一度書いてしまうと、二重になってしまいます。何が増えて何が減るかだけを書いてみましょう。

```task
type: post
transaction: 月末、納品した会社から代金 60,000 円が普通預金に振り込まれた
answer:
  debit: [{ account: bank_deposit, amount: 60000 }]
  credit: [{ account: accounts_receivable, amount: 60000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 増えた預金は左、減った売掛金は右です。左右を入れ替えてみましょう。
  - match: { credit: [{ account: sales }] }
    misconception: receivable_collection_is_sale
    feedback: 売上は納品の日に記録済みです。ここでは売掛金(権利)が預金に変わっただけなので、右は売掛金です。
  - match: { debit: [{ account: cash }] }
    misconception: deposit_is_cash
    feedback: 代金は銀行の口座に振り込まれたので、手元の現金は増えていません。左は普通預金です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 60,000 にしましょう。
hint: 左に普通預金 60,000、右に売掛金 60,000 です。
success: 売掛金が消えて、普通預金が現れました。資産の中身が変わっただけで、売上も利益も動いていません。
```

## 問屋に代金を払う
同じ月末、問屋への代金 40,000 円を現金で払いました。買掛金という義務を、お金で消す取引です。
仕入は豆を受け取った日に記録してあります。ここでも、もう一度仕入を書かないように気をつけましょう。

```task
type: post
transaction: 月末、問屋に買掛金 40,000 円を現金で支払った
answer:
  debit: [{ account: accounts_payable, amount: 40000 }]
  credit: [{ account: cash, amount: 40000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 負債は右で増え、左で減ります。義務が消えるので買掛金は左、減った現金は右です。
  - match: { debit: [{ account: purchases }] }
    misconception: payable_payment_is_purchase
    feedback: 仕入は豆を受け取った日に記録済みです。ここでは買掛金(義務)が減るだけなので、左は買掛金です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 40,000 にしましょう。
hint: 左に買掛金 40,000、右に現金 40,000 です。
success: 買掛金が消えました。負債が減り、現金も減る。仕入や費用はここでは動きません。
```

## 権利と義務を分ける
売掛金と買掛金は名前が似ていますが、入る箱は正反対です。この単元の科目を 5 つの箱に分けてみましょう。
「受け取る権利か、払う義務か」「売ったのか、買ったのか」で考えると迷いません。

```task
type: classify
accounts: [accounts_receivable, accounts_payable, sales, purchases, bank_deposit]
misconceptions:
  accounts_receivable:
    revenue: receivable_is_cash
  accounts_payable:
    expense: expense_as_liability
  purchases:
    asset: purchase_is_asset
hint: 売掛金と普通預金は資産、買掛金は負債、売上は収益、仕入は費用です。
success: 売掛金は受け取る権利なので資産、買掛金は払う義務なので負債。売上と仕入は、代金がいつ動くかに関係なく収益と費用です。
```

## ここまでのもうけ
結果の損益計算書で、ここまでの当期純利益を読んでみましょう。掛けで納品した 60,000 円は、お金が振り込まれる前から売上に入っていました。
掛けで仕入れた 40,000 円も、払う前から仕入に入っています。収益の合計から費用の合計を引いて答えてみましょう。

```task
type: calc
question: 3 か月目が終わった時点の当期純利益はいくらですか(円)
answer: 90000
wrong_patterns:
  - match: 30000
    misconception: revenue_only_when_cash
    feedback: 掛けで納品した 60,000 も売上です。お金が入る前から収益に入っています。
  - match: 130000
    feedback: 掛けで仕入れた 40,000 も仕入(費用)です。費用から引き忘れていませんか。
  - match: 230000
    feedback: それは売上の合計です。費用(仕入 90,000 と家賃 50,000)を引きましょう。
hint: 売上 230,000 − 仕入 90,000 − 支払家賃 50,000。
success: 当期純利益は 90,000 円。掛けの売上も仕入も、取引の日にちゃんと数えられていますね。
```

## ふりかえり
掛け取引では、商品を渡した日に売上と売掛金、受け取った日に仕入と買掛金を記録します。お金が動く月末には、権利や義務がお金に変わるだけで、売上や仕入はもう一度書きません。
売掛金は「後で受け取る権利」で資産、買掛金は「後で払う義務」で負債。どちらも、お金の動きと取引の日がずれるときに橋渡しをする科目です。
この「お金が動いた日ではなく、取引が起きた日に記録する」考え方は、後で減価償却を学ぶときにも顔を出します。
次の単元では、返品と運賃(諸掛)を扱います。元の取引を取り消す書き方と、運賃をどこに含めるかがテーマです。
