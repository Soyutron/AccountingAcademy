---
id: merchandise/cost-of-goods-sold
title: 売れ残りと売上原価
summary: カフェの決算の日、前の期から持ち越した商品を仕入に入れ、売れ残った豆と菓子を仕入から取り出して繰越商品にしながら、「売れた分だけが費用」という売上原価の考え方を身につける
level: 2
order: 4
introduces: [cost_of_goods_sold, ending_inventory]
concepts: [three_account_method, purchase, asset, expense, net_income]
requires: [merchandise/returns-and-costs]
scenario:
  company: カフェ「マメノキ」
  opening:
    - { account: cash, amount: 561500 }
    - { account: bank_deposit, amount: 60000 }
    - { account: accounts_receivable, amount: 25000 }
    - { account: merchandise_inventory, amount: 15000 }
    - { account: equipment, amount: 600000 }
    - { account: accounts_payable, amount: 40000 }
    - { account: loans_payable, amount: 300000 }
    - { account: capital_stock, amount: 1000000 }
    - { account: sales, amount: 255000 }
    - { account: purchases, amount: 132000 }
    - { account: shipping_expense, amount: 1500 }
    - { account: rent_expense, amount: 200000 }
---

## 棚に残った豆
決算の日がやってきました。結果の[[income_statement|損益計算書]]には、この期に[[purchase|仕入れ]]た商品の合計132,000円が「仕入」として載っています。[[balance_sheet|貸借対照表]]には「[[merchandise_inventory|繰越商品]]」15,000円があります。前の期の決算の日に売れ残り、この期に持ち越した商品です。期の初めにあった商品なので、期首の商品と呼びます。
この期に売った商品は、期首の15,000円分と、この期に仕入れた132,000円分の中から出ていきました。でも棚を見ると、豆と焼き菓子が22,000円分(仕入値で数えて)まだ残っています。
残っている商品は「使った」とは言えません。これから売ってお金に変わる財産です。売れた分の仕入値だけを費用にしたい。その金額を[[cost_of_goods_sold|売上原価]]と呼びます。

```figure
type: flow
alt: 期首の商品15,000円とこの期の仕入132,000円を合わせ、売れ残り22,000円を除いた125,000円が売上原価になる
nodes: ["期首の商品15,000 + この期の仕入132,000", "売れ残り22,000を除く", "売上原価125,000"]
highlight: 1
```

## 売れた分はいくら
売れた商品の仕入値は、売れる可能性があった商品の合計から、売れ残りを引けば分かります。売れる可能性があったのは、期首の商品とこの期の仕入です。
式にすると「売上原価 = 期首の商品 + この期の仕入 − 期末の売れ残り」。15,000円、132,000円、22,000円で計算してみましょう。

```task
type: calc
question: この期の売上原価はいくらですか(円)
answer: 125000
wrong_patterns:
  - match: 132000
    misconception: purchases_equal_cogs
    feedback: 仕入の合計がそのまま売れたわけではありません。期首の商品15,000を足し、棚に残っている22,000円分を引きましょう。
  - match: 110000
    misconception: beginning_inventory_forgotten
    feedback: 売れ残りは引けています。でも期首の商品15,000円分も、この期に売った商品の出どころです。足しましょう。
  - match: 147000
    misconception: purchases_equal_cogs
    feedback: 期首の商品と仕入を足したところで止まっています。棚に残っている22,000円分は売れていないので引きます。
  - match: 95000
    feedback: 期首の商品15,000は引くのではなく足します。前の期から持ち越して、この期に売った商品です。
  - match: 169000
    feedback: 売れ残りは引きます。足してはいけません。
  - match: 22000
    feedback: それは売れ残りの金額です。売れた分は、期首の商品とこの期の仕入の合計から売れ残りを引いた金額です。
hint: 15,000 + 132,000 − 22,000。
success: 売上原価は125,000円。期首の商品と仕入のうち、売れた分だけが、この期の費用です。
```

## 期首の商品を仕入へ
この計算を帳簿でやるのが、決算の日の2本の仕訳です。1本目で期首の商品を仕入に入れて、仕入の列に「売れる可能性があった商品」を全部集めます。
繰越商品15,000を仕入へ移すので、左に仕入、右に繰越商品です。帳簿の中で科目を移すだけなので、お金は動きません。

```task
type: post
transaction: 決算にあたり、期首の商品15,000円分を繰越商品から仕入に振り替えた
answer:
  debit: [{ account: purchases, amount: 15000 }]
  credit: [{ account: merchandise_inventory, amount: 15000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: それは売れ残りを取り出すときの向きです。期首の商品は繰越商品から仕入へ移すので、左に仕入、右に繰越商品です。
  - match: { debit: [{ account: purchases, amount: 22000 }] }
    misconception: beginning_inventory_forgotten
    feedback: 22,000は期末の売れ残りです。仕入へ移すのは、前の期から持ち越した期首の商品15,000です。
  - match: { credit: [{ account: sales }] }
    feedback: 売ったわけではありません。期首の商品を仕入の列に入れるだけです。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも15,000にしましょう。
  - match: { credit: [{ account: cash }] }
    misconception: inventory_transfer_as_transaction
    feedback: 前の期から持ち越した商品を、帳簿の中で別の科目へ移すだけです。お金は払っていないので、右に現金は書きません。
  - match: { debit: [{ account: cash }] }
    misconception: inventory_transfer_as_transaction
    feedback: 帳簿の中で別の科目へ移すだけなので、お金は入ってきていません。左に現金は書きません。
  - match: { debit: [{ account: sales }] }
    misconception: inventory_transfer_as_transaction
    feedback: 売った分を取り消すわけではありません。売上は動かさず、期首の商品の金額を帳簿の中で移します。
hint: 左に仕入15,000、右に繰越商品15,000です。
success: 繰越商品が消え、仕入が147,000(期首の商品15,000 + この期の仕入132,000)になりました。売れる可能性があった商品が、仕入の列にそろいました。
```

## 売れ残りを取り出す
2本目で、売れ残りの22,000円分を仕入(費用)から取り出して資産に移します。決算の日に残っている商品を[[ending_inventory|期末商品]]と呼び、繰越商品という資産の科目で次の期に持ち越します。
左に繰越商品22,000、右に仕入22,000という仕訳です。1本目の「仕入 / 繰越商品」と左右が入れ替わった形で、決算の日にこの2本を続けて書きます。左と右の科目の頭の音を並べて、語呂合わせで「しーくり、くりしー」と呼ばれています。
記帳の前に、5つの箱がどう動くか予想してみましょう。費用から資産へ移すと、利益はどうなるでしょうか。

```figure
type: taccount
alt: 仕入のT勘定。左側に期首の商品15,000円とこの期の仕入132,000円、右側に売れ残り22,000円を移すと、残りの125,000円が売上原価
account: purchases
debit:
  - { label: 期首の商品(繰越商品から), amount: 15000 }
  - { label: この期の仕入, amount: 132000 }
credit:
  - { label: 売れ残り(繰越商品へ), amount: 22000 }
```

```task
type: predict
transaction: 決算にあたり、売れ残っている商品22,000円分を仕入から繰越商品に振り替えた
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
  - match: { expense: increase }
    misconception: purchases_equal_cogs
    feedback: 売れ残りの分は、まだ費用ではありません。費用から取り出すので、仕入(費用)は増えずに減ります。
  - match: { asset: decrease }
    misconception: purchases_equal_cogs
    feedback: 売れ残った商品は、これから売れる財産です。費用から資産へ移すので、資産は減らずに増えます。
  - match: { equity: decrease }
    feedback: 費用が減ると当期純利益が増えるので、純資産は減らずに増えます。
hint: 資産(繰越商品)が増え、費用(仕入)が減ります。費用が減れば利益も純資産も増えます。
success: 仕入が125,000に減り、繰越商品が22,000になりました。損益計算書の仕入が、ちょうど売上原価になっています。
```

## 決算後のもうけ
2本の仕訳で、損益計算書の費用が変わりました。改めて[[net_income|当期純利益]]を読んでみましょう。
売上255,000から、売上原価125,000、[[shipping_expense|発送費]] 1,500、[[rent_expense|支払家賃]] 200,000を引きます。家賃は毎月末に50,000円を払ってきたので、決算の日までの4か月分です。費用の合計が売上を上回ると、損益計算書には当期純利益ではなく当期純損失として載ります。そのときは先頭に「-」を付けて答えます。

```task
type: calc
question: 決算の2本の仕訳のあとの当期純利益はいくらですか(円)
answer: -71500
wrong_patterns:
  - match: -78500
    misconception: purchases_equal_cogs
    feedback: それはこの期の仕入132,000を、そのまま売上原価にした金額です。期首の商品15,000を足し、売れ残り22,000を引いた125,000が売上原価です。
  - match: -56500
    misconception: beginning_inventory_forgotten
    feedback: 売上原価を110,000で計算しています。期首の商品15,000もこの期に売った商品なので、売上原価は125,000です。
  - match: -93500
    misconception: purchases_equal_cogs
    feedback: 売れ残り22,000まで費用にしています。売れ残りは繰越商品(資産)に移したので、費用ではありません。
  - match: 71500
    feedback: 符号が逆です。費用の合計が売上より大きいので、当期純利益はマイナス(損失)になります。
  - match: 130000
    feedback: 売上原価だけでなく、発送費1,500と支払家賃200,000も費用です。
  - match: 78500
    feedback: 支払家賃を1か月分しか引いていません。家賃は毎月末に払ってきたので、4か月分200,000が費用です。
hint: 255,000 − 125,000 − 1,500 − 200,000 = −71,500。
success: 当期純利益は−71,500円。売れた分の仕入値だけを費用にしても、4か月分の家賃には届きませんでした。売れ残りの22,000円は費用ではなく、資産として次の期に持ち越されます。
```

## 商品の3つの科目
[[three_account_method|三分法]]の3つの科目がそろいました。仕入、売上、繰越商品です。それぞれどの箱に入るか、分けてみましょう。
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
success: 仕入(費用)、売上(収益)、繰越商品(資産)。三分法という名前は、この3つの科目で商品を記録することから来ています。
```

## ふりかえり
三分法では、日々は「買ったら仕入、売ったら売上」だけを記録し、決算の日に2本の仕訳を続けて書きます。期首の商品を繰越商品から仕入へ入れ(仕入 / 繰越商品)、売れ残りを仕入から取り出して繰越商品(資産)にします(繰越商品 / 仕入)。残った仕入が売上原価です。
売上原価は「売れた商品の仕入値」で、期首の商品 + この期の仕入 − 期末の売れ残り。仕入の合計そのものではありません。売れ残った分は財産として次の期に持ち越し、次の期の決算では期首の商品として仕入に入れます。
これで商品売買の流れは、仕入から決算までつながりました。「お金を払った年に全部費用にしない」という考え方は、後の固定資産のテーマ(減価償却)でもう一度出てきます。
