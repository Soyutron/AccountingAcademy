---
id: bookkeeping-basics/five-elements
title: 5 つの要素と仕訳
summary: カフェを開く 1 か月を帳簿に書きながら、お金の動きを 5 つの箱に分けて記録する方法を身につける
level: 1
order: 1
introduces: [transaction, five_elements, asset, liability, equity, revenue, expense, account_title, debit_credit, journal_entry, balance_sheet, income_statement, net_income]
concepts: []
requires: []
scenario:
  company: カフェ「マメノキ」
  opening: []
---

## カフェを開く
あなたは今日、小さなカフェ「マメノキ」を開きます。元手は貯金の 1,000,000 円。これから 1 か月、お店で起きる出来事をひとつずつ帳簿に書いていきましょう。
お金や物が動く出来事を、簿記では [[transaction|取引]] と呼びます。結果の表には、記帳するたびにお店のいまの姿が映ります。まだ何もない、まっさらな状態から始めましょう。

```figure
type: flow
alt: お店で取引が起きたら仕訳帳に書き、それが集まって貸借対照表と損益計算書になる
nodes: [取引, 仕訳帳に書く, 貸借対照表・損益計算書]
highlight: 1
```

## 元手をお店に入れる
貯金の 1,000,000 円を、お店の現金にしました。仕訳帳で、左に「現金 1,000,000」、右に「資本金 1,000,000」と入れて、記帳してみましょう。
この左右に分けて書く記録を [[journal_entry|仕訳]] と呼びます。「現金」「資本金」のような決まった名前のラベルが [[account_title|勘定科目]] です。

```task
type: post
transaction: 元手として現金 1,000,000 円をお店に出資した
answer:
  debit: [{ account: cash, amount: 1000000 }]
  credit: [{ account: capital_stock, amount: 1000000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 現金は左で増えます。左右を入れ替えてみましょう。
  - match: { credit: [{ account: sales }] }
    misconception: revenue_equals_cash_in
    feedback: このお金はコーヒーを売ってもうけたものではなく、あなたが出した元手です。右は資本金にしてみましょう。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 1,000,000 にしましょう。
hint: 増えた現金を左に、その元手である資本金を右に書きます。
success: 記帳できました。結果の表に、現金と資本金が同時に現れましたね。
```

## コーヒーマシンを買う
いま左に書いた側を [[debit_credit|借方]]、右側を貸方と呼びます。難しそうな名前ですが、「左」と「右」の呼び名にすぎません。現金のようなお店の財産は、増えたら左に書きます。この「財産」の箱を [[asset|資産]] と呼びます。
さて、開店に欠かせないコーヒーマシンを 600,000 円で買い、現金で払いました。マシンは「備品」という勘定科目で、現金と同じ資産の仲間です。記帳の前に、資産・負債・純資産・収益・費用の [[five_elements|5 つの箱]] がどう動くか予想してみましょう。現金が減ってマシンが増えると、資産の合計はどうなるでしょうか。

```figure
type: elements
alt: 5 つの箱のうち、現金と備品はどちらも資産の箱に入る。資本金は純資産の箱
items:
  - { account: cash, highlight: true }
  - { account: equipment, highlight: true }
  - { account: capital_stock }
```

```task
type: predict
transaction: コーヒーマシン(備品)600,000 円を現金で買った
entry:
  debit: [{ account: equipment, amount: 600000 }]
  credit: [{ account: cash, amount: 600000 }]
answer: { asset: none, liability: none, equity: none, revenue: none, expense: none }
wrong_patterns:
  - match: { asset: decrease }
    misconception: cash_is_only_asset
    feedback: 現金は減りましたが、同じ金額のマシン(備品)が資産として増えました。資産の中身が入れ替わっただけで、合計は変わりません。
  - match: { expense: increase }
    misconception: expense_at_payment
    feedback: 600,000 円を払いましたが、マシンはこれから何年も使う財産です。払った時点では費用にならず、資産として残ります。
hint: 現金(資産)が 600,000 減り、備品(資産)が 600,000 増えます。
success: 資産の合計は 1,000,000 のまま。結果の表で、現金が減って備品が現れたことを確かめましょう。
```

## 銀行からお金を借りる
開店資金が心もとないので、銀行から 300,000 円を借りて現金で受け取りました。現金が増えるので、左は「現金 300,000」。では右は何でしょう。
借りたお金は、いつか返さなければなりません。この「返す義務」を [[liability|負債]] と呼び、「借入金」という勘定科目で右に書きます。記帳して、結果の表に何が現れるか見てみましょう。

```task
type: post
transaction: 銀行から 300,000 円を借り入れ、現金で受け取った
answer:
  debit: [{ account: cash, amount: 300000 }]
  credit: [{ account: loans_payable, amount: 300000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 増えた現金は左、返す義務である借入金は右です。左右を入れ替えてみましょう。
  - match: { credit: [{ account: sales }] }
    misconception: revenue_equals_cash_in
    feedback: お金は入りましたが、もうけではありません。同じ金額を返す義務が生まれています。右は借入金にしてみましょう。
  - match: { credit: [{ account: capital_stock }] }
    feedback: 資本金はあなたが出した元手です。銀行から借りたお金は返す義務なので、借入金を使います。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 300,000 にしましょう。
hint: 左に現金 300,000、右に借入金 300,000 です。
success: 現金が増えると同時に、借入金が「負債」の欄に現れました。資産は増えましたが、返す義務も同じだけ増えたので、お店が豊かになったわけではありません。
```

## 初めての売上
開店初日、コーヒーがよく売れて、現金で 80,000 円を受け取りました。さっきの借入と同じ「現金が増える」出来事ですが、今度は返す必要がありません。
お店のもうけの元になるものを [[revenue|収益]] と呼び、「売上」という勘定科目で右に書きます。記帳して、結果の表のどこが動くか見てみましょう。

```task
type: post
transaction: コーヒーを売り、代金 80,000 円を現金で受け取った
answer:
  debit: [{ account: cash, amount: 80000 }]
  credit: [{ account: sales, amount: 80000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 増えた現金は左、売上は右です。左右を入れ替えてみましょう。
  - match: { credit: [{ account: loans_payable }] }
    feedback: 売上は返す必要のないお金です。借入金ではなく売上を使います。
  - match: { credit: [{ account: capital_stock }] }
    feedback: 資本金はあなたが出した元手です。お客さんから受け取った代金は売上です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 80,000 にしましょう。
hint: 左に現金 80,000、右に売上 80,000 です。
success: 売上が「収益」に現れ、当期純利益が 80,000 になりました。これがお店の最初のもうけです。
```

## 家賃を払う
月末、お店の家賃 50,000 円を現金で払いました。現金が減るので、右に「現金 50,000」。左には何を書くでしょう。
もうけを得るために使ったお金を [[expense|費用]] と呼び、「支払家賃」という勘定科目で左に書きます。収益と費用は、ちょうど逆の向きに動きます。

```task
type: post
transaction: お店の家賃 50,000 円を現金で支払った
answer:
  debit: [{ account: rent_expense, amount: 50000 }]
  credit: [{ account: cash, amount: 50000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 費用は左で増え、現金は右で減ります。左右を入れ替えてみましょう。
  - match: { debit: [{ account: accounts_payable }] }
    misconception: expense_as_liability
    feedback: 家賃はもう払い終えているので、誰かに支払う義務は残っていません。使ったお金として、支払家賃を左に書きます。
  - match: { debit: [{ account: loans_payable }] }
    misconception: expense_as_liability
    feedback: 借入金は銀行に返す義務です。家賃は使ってしまったお金なので、支払家賃という費用になります。
  - match: { debit: [{ account: equipment }] }
    feedback: 家賃は払ったら消えてしまい、マシンのように財産としては残りません。支払家賃を使います。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 50,000 にしましょう。
hint: 左に支払家賃 50,000、右に現金 50,000 です。
success: 費用が増えて、当期純利益が 80,000 から 30,000 に減りました。
```

## 5 つの箱に分ける
ここまでに出てきた勘定科目を、5 つの箱に分けてみましょう。箱は資産・負債・[[equity|純資産]]・収益・費用です。
純資産は「資産から負債を引いた残り」で、あなたの元手(資本金)と、これまでのもうけが入ります。迷ったら、「財産か、返す義務か、元手か、もうけの元か、使ったお金か」と考えてみましょう。

```task
type: classify
accounts: [cash, equipment, loans_payable, capital_stock, sales, rent_expense]
misconceptions:
  loans_payable:
    revenue: revenue_equals_cash_in
  rent_expense:
    liability: expense_as_liability
  equipment:
    expense: expense_at_payment
hint: 現金と備品は財産、借入金は返す義務、資本金は元手、売上はもうけの元、支払家賃は使ったお金です。
success: 6 つの科目が 5 つの箱に収まりました。どの勘定科目も、必ずこの 5 つのどれかに属します。
```

## もうけはいくら?
1 か月が終わりました。結果の「損益計算書」を開いてみましょう。収益と費用を並べて、この 1 か月でいくらもうかったかを示す表が [[income_statement|損益計算書]] です。
収益の合計から費用の合計を引いた金額を [[net_income|当期純利益]] と呼びます。表を読んで、当期純利益がいくらか入力してみましょう。

```task
type: calc
question: この 1 か月の当期純利益はいくらですか(円)
answer: 30000
wrong_patterns:
  - match: 330000
    misconception: revenue_equals_cash_in
    feedback: 借入金の 300,000 は収益ではありません。収益は売上の 80,000 だけです。
  - match: -570000
    misconception: expense_at_payment
    feedback: コーヒーマシンの 600,000 は費用ではなく資産です。費用は家賃の 50,000 だけです。
  - match: 80000
    feedback: 家賃の 50,000 を引き忘れています。収益から費用を引きましょう。
hint: 売上 80,000 − 支払家賃 50,000。
success: 当期純利益は 30,000 円。このもうけは、結果の貸借対照表では純資産の中に足されています。
```

## お店の姿を読む
今度は「貸借対照表」です。お店がいま何を持ち、何を負っているかを一覧にした表が [[balance_sheet|貸借対照表]] です。左に資産、右に負債と純資産が並び、左右の合計はぴったり一致します。
資産の合計はいくらでしょう。現金だけでなく、備品も忘れずに足してみましょう。

```task
type: calc
question: 月末の資産の合計はいくらですか(円)
answer: 1330000
wrong_patterns:
  - match: 730000
    misconception: cash_is_only_asset
    feedback: 現金だけが資産ではありません。コーヒーマシン(備品)600,000 も資産です。
  - match: 1030000
    feedback: それは資産から負債を引いた、純資産の金額です。資産の合計は負債を引く前の金額です。
hint: 現金 730,000 + 備品 600,000。
success: 資産 1,330,000 = 負債 300,000 + 純資産 1,030,000。左右がぴったり合いましたね。
```

## ふりかえり
1 か月で、あなたは 5 つの取引を記帳しました。どの取引も「左と右に同じ金額を書く」仕訳の形で、結果の表はいつも左右の合計がそろっていましたね。
覚えておきたいことは 3 つです。現金が入ってきても、借入なら負債が増えるだけで、もうけではない。お金を払っても、マシンのように長く使う物は費用ではなく資産。収益と費用の差が当期純利益になり、それが純資産に足される。
勘定科目はどれも 5 つの要素のどれかに属し、要素が決まれば借方・貸方のどちらで増えるかが決まります。「借方 = 増える」ではなく、「要素が決まれば側が決まる」です。

```figure
type: proportion
alt: 月末の会社のかたち。資産 1,330,000 円は、負債 300,000 円と純資産 1,030,000 円でまかなわれている
assets:
  - { account: cash, amount: 730000 }
  - { account: equipment, amount: 600000 }
liabilities:
  - { account: loans_payable, amount: 300000 }
equity:
  - { account: capital_stock, amount: 1000000 }
  - { label: 当期純利益, amount: 30000 }
```
次の単元では、1 年の終わりに、このコーヒーマシンの 600,000 円をどう扱うかを考えます。「払った年に全部費用にしないのはなぜ?」が次のテーマです。仕訳帳は自由に使えるので、気になる取引を試してから進んでも構いません。
