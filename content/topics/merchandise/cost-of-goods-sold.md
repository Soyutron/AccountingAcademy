---
id: merchandise/cost-of-goods-sold
title: 売れ残りと売上原価
summary: カフェの決算の日、売れ残った豆と菓子を仕入から取り出して繰越商品にしながら、「売れた分だけが費用」という売上原価の考え方を身につける
level: 2
order: 4
introduces: [cost_of_goods_sold, ending_inventory]
concepts: [three_account_method, purchase, asset, expense, net_income]
requires: [merchandise/returns-and-costs]
scenario:
  company: カフェ「マメノキ」
  opening:
    - { account: cash, amount: 726500 }
    - { account: bank_deposit, amount: 60000 }
    - { account: accounts_receivable, amount: 25000 }
    - { account: equipment, amount: 600000 }
    - { account: accounts_payable, amount: 40000 }
    - { account: loans_payable, amount: 300000 }
    - { account: capital_stock, amount: 1000000 }
    - { account: sales, amount: 255000 }
    - { account: purchases, amount: 132000 }
    - { account: shipping_expense, amount: 1500 }
    - { account: rent_expense, amount: 50000 }
---

## 棚に残った豆
決算の日がやってきました。右の損益計算書には、この期に仕入れた商品の合計 132,000 円が「仕入」として載っています。でも棚を見ると、豆と焼き菓子が 22,000 円分(仕入値で数えて)まだ残っています。
残っている商品は「使った」とは言えません。これから売ってお金に変わる財産です。売れた分の仕入値だけを費用にしたい。その金額を [[cost_of_goods_sold|売上原価]] と呼びます。

```figure
type: flow
alt: この期の仕入 132,000 円のうち、売れ残り 22,000 円を除いた 110,000 円が売上原価になる
nodes: ["この期の仕入 132,000", "売れ残りを除く", "売上原価 110,000"]
highlight: 1
```

## 売れた分はいくら
仕入の合計から、売れ残りを引けば、売れた商品の仕入値が分かります。
132,000 円のうち 22,000 円分が棚に残っているとして、売上原価はいくらでしょう。

```task
type: calc
question: この期の売上原価はいくらですか(円)
answer: 110000
wrong_patterns:
  - match: 132000
    misconception: purchases_equal_cogs
    feedback: 仕入れた全部が売れたわけではありません。棚に残っている 22,000 円分を引きましょう。
  - match: 22000
    feedback: それは売れ残りの金額です。売れた分は、仕入の合計から売れ残りを引いた金額です。
  - match: 154000
    feedback: 売れ残りは引きます。足してはいけません。
hint: 132,000 − 22,000。
success: 売上原価は 110,000 円。仕入のうち売れた分だけが、この期の費用です。
```

## 売れ残りを取り出す
売れ残りの 22,000 円分を、仕入(費用)から取り出して資産に移します。使う科目は「繰越商品」。決算の日に残っている商品を [[ending_inventory|期末商品]] と呼び、繰越商品という資産の科目で次の期に持ち越します。
左に繰越商品 22,000、右に仕入 22,000 という仕訳です。記帳の前に、5 つの箱がどう動くか予想してみましょう。費用から資産へ移すと、利益はどうなるでしょうか。

```figure
type: taccount
alt: 仕入の T 勘定。左側にこの期の仕入 132,000 円、右側に売れ残り 22,000 円を移すと、残りの 110,000 円が売上原価
account: purchases
debit:
  - { label: この期の仕入, amount: 132000 }
credit:
  - { label: 売れ残り(繰越商品へ), amount: 22000 }
```

```task
type: predict
transaction: 決算にあたり、売れ残っている商品 22,000 円分を仕入から繰越商品に振り替えた
entry:
  debit: [{ account: merchandise_inventory, amount: 22000 }]
  credit: [{ account: purchases, amount: 22000 }]
answer: { asset: increase, liability: none, equity: increase, revenue: none, expense: decrease }
wrong_patterns:
  - match: { expense: none }
    misconception: purchases_equal_cogs
    feedback: 売れ残りの分は、まだ費用ではありません。仕入(費用)がその分減ります。
  - match: { asset: none }
    feedback: 売れ残った商品は財産です。繰越商品という資産が増えます。
  - match: { equity: none }
    feedback: 費用が減ると当期純利益が増え、そのぶん純資産も増えます。
  - match: { revenue: increase }
    feedback: 売ったわけではないので、売上は動きません。費用が減るだけです。
hint: 資産(繰越商品)が増え、費用(仕入)が減ります。費用が減れば利益も純資産も増えます。
success: 仕入が 110,000 に減り、資産に繰越商品 22,000 が現れました。損益計算書の仕入が、ちょうど売上原価になっています。
```

## 決算後のもうけ
売れ残りを取り出したことで、損益計算書の費用が変わりました。改めて当期純利益を読んでみましょう。
売上 255,000 から、売上原価 110,000、発送費 1,500、支払家賃 50,000 を引きます。

```task
type: calc
question: 売れ残りを繰越商品に移したあとの当期純利益はいくらですか(円)
answer: 93500
wrong_patterns:
  - match: 71500
    misconception: purchases_equal_cogs
    feedback: それは仕入 132,000 を全部費用にした金額です。売れ残り 22,000 は費用から外れています。
  - match: 145000
    feedback: 売上原価だけでなく、発送費 1,500 と支払家賃 50,000 も費用です。
  - match: 115500
    feedback: 売上原価 110,000 を引いていますか。255,000 − 110,000 − 1,500 − 50,000 です。
hint: 255,000 − 110,000 − 1,500 − 50,000。
success: 当期純利益は 93,500 円。売れ残りを数える前より 22,000 円多くなりました。その分は費用ではなく、資産として次の期に持ち越されます。
```

## 翌期のはじめに戻す
新しい期が始まりました。棚の 22,000 円分の商品は、この期に売っていきます。そこで、決算で取り出した繰越商品を仕入に戻します。
決算で「繰越商品 / 仕入」、翌期首に「仕入 / 繰越商品」。左右が入れ替わるだけです。この 2 つの仕訳は、語呂合わせで「しーくり、くりしー」と呼ばれています。

```task
type: post
transaction: 翌期首、前期から繰り越した商品 22,000 円分を繰越商品から仕入に振り替えた
answer:
  debit: [{ account: purchases, amount: 22000 }]
  credit: [{ account: merchandise_inventory, amount: 22000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: それは決算のときの仕訳です。翌期首はその逆で、繰越商品を仕入に戻します。
  - match: { credit: [{ account: sales }] }
    feedback: まだ売っていません。商品を仕入の列に戻すだけです。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 22,000 にしましょう。
hint: 左に仕入 22,000、右に繰越商品 22,000 です。
success: 繰越商品が消えて、仕入に 22,000 が戻りました。前期の売れ残りが、この期の売り物として並んだ形です。
```

## 新しい期の最初の仕入
新しい期の最初の仕入です。問屋から豆 20,000 円分を掛けで仕入れました。
これまでどおり、買ったら仕入。前期から戻した 22,000 と合わせて、この期の仕入が積み上がっていきます。

```task
type: post
transaction: 問屋からコーヒー豆(商品)20,000 円分を掛けで仕入れた
answer:
  debit: [{ account: purchases, amount: 20000 }]
  credit: [{ account: accounts_payable, amount: 20000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 仕入は費用なので左、買掛金は右です。左右を入れ替えてみましょう。
  - match: { debit: [{ account: merchandise_inventory }] }
    misconception: purchase_is_asset
    feedback: 日々の仕入は、繰越商品ではなく仕入に書きます。繰越商品を使うのは決算と期首だけです。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 20,000 にしましょう。
hint: 左に仕入 20,000、右に買掛金 20,000 です。
success: 仕入が 42,000(前期の繰り越し 22,000 + 今回 20,000)になりました。この期の決算で、また売れ残りを数えます。
```

## 商品の 3 つの科目
三分法の 3 つの科目がそろいました。仕入、売上、繰越商品です。それぞれどの箱に入るか、分けてみましょう。
繰越商品だけが資産です。残りは、日々の売り買いを記録する費用と収益です。

```task
type: classify
accounts: [merchandise_inventory, purchases, sales, accounts_receivable]
misconceptions:
  merchandise_inventory:
    expense: purchases_equal_cogs
  purchases:
    asset: purchase_is_asset
  accounts_receivable:
    revenue: receivable_is_cash
hint: 繰越商品と売掛金は資産、仕入は費用、売上は収益です。
success: 仕入(費用)、売上(収益)、繰越商品(資産)。三分法という名前は、この 3 つの科目で商品を記録することから来ています。
```

## ふりかえり
三分法では、日々は「買ったら仕入、売ったら売上」だけを記録し、決算の日に売れ残りを数えます。売れ残りは仕入から取り出して繰越商品(資産)にし、残った仕入が売上原価になります。
売上原価は「売れた商品の仕入値」。仕入の合計そのものではありません。売れ残った分は財産として次の期に持ち越し、期首に仕入へ戻してその期に売っていきます。
これで商品売買の流れは、仕入から決算までつながりました。「お金を払った年に全部費用にしない」という考え方は、次の固定資産のテーマ(減価償却)でもう一度出てきます。
