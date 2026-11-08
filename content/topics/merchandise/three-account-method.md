---
id: merchandise/three-account-method
title: 仕入と売上
summary: カフェ 2 か月目、売り物の豆と焼き菓子を仕入れて売る日々を記帳しながら、「買ったら仕入、売ったら売上」の三分法を身につける
level: 1
order: 1
introduces: [merchandise, three_account_method, purchase]
concepts: [expense, revenue, asset]
requires: [bookkeeping-basics/five-elements]
scenario:
  company: カフェ「マメノキ」
  opening:
    - { account: cash, amount: 730000 }
    - { account: equipment, amount: 600000 }
    - { account: loans_payable, amount: 300000 }
    - { account: capital_stock, amount: 1000000 }
    - { account: sales, amount: 80000 }
    - { account: rent_expense, amount: 50000 }
---

## 売り物を置く
カフェ「マメノキ」の 2 か月目です。先月はコーヒーを淹れて売るだけでしたが、今月からは袋入りのコーヒー豆と焼き菓子も棚に並べることにしました。
こうした「売るために買う物」を、簿記では [[merchandise|商品]] と呼びます。店で使うコーヒーマシンは商品ではありません。売るための物と、自分で使う物を分けて考えるのが、この単元の出発点です。

## 豆を仕入れる
問屋からコーヒー豆を 30,000 円分買い、現金で払いました。売るための商品を買う取引を [[purchase|仕入れ]] と呼びます。
仕訳帳では「仕入」という勘定科目を左に書きます。仕入は備品のような資産ではなく、費用の箱に入ります。買った豆はいずれ売れてお店を離れていくので、「使った分」として記録しておく考え方です。買ったら仕入、売ったら売上、売れ残りは決算で数える。この記録の方法を [[three_account_method|三分法]] と呼びます。

```figure
type: elements
alt: 仕入れた豆は費用の箱の「仕入」に入り、払った現金は資産の箱から減る。備品は資産の箱のまま
items:
  - { account: purchases, highlight: true }
  - { account: cash, highlight: true }
  - { account: equipment }
```

```task
type: post
transaction: 問屋からコーヒー豆(商品)30,000 円分を仕入れ、代金は現金で支払った
answer:
  debit: [{ account: purchases, amount: 30000 }]
  credit: [{ account: cash, amount: 30000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 仕入は費用なので左で増え、現金は右で減ります。左右を入れ替えてみましょう。
  - match: { debit: [{ account: merchandise_inventory }] }
    misconception: purchase_is_asset
    feedback: 三分法では、買ったときは資産にしません。「仕入」という費用の科目を左に書きます。
  - match: { debit: [{ account: equipment }] }
    misconception: purchase_is_asset
    feedback: 豆は売るための商品で、マシンのように長く使う備品ではありません。仕入を使います。
  - match: { debit: [{ account: supplies_expense }] }
    feedback: 消耗品費はお店で使い切る物の代金です。売り物の豆は仕入です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 30,000 にしましょう。
hint: 左に仕入 30,000、右に現金 30,000 です。
success: 費用の箱に「仕入」が現れ、現金が同じだけ減りました。買った豆は、売れるまでここにためておきます。
```

## 焼き菓子も仕入れる
今度は焼き菓子を 20,000 円分、やはり現金で仕入れます。記帳の前に、5 つの箱がどう動くか予想してみましょう。
先月のマシンのときは「資産が入れ替わるだけ」でした。今回は売り物です。違いが出るでしょうか。

```task
type: predict
transaction: 焼き菓子(商品)20,000 円分を仕入れ、代金は現金で支払った
entry:
  debit: [{ account: purchases, amount: 20000 }]
  credit: [{ account: cash, amount: 20000 }]
answer: { asset: decrease, liability: none, equity: decrease, revenue: none, expense: increase }
wrong_patterns:
  - match: { expense: none }
    misconception: purchase_is_asset
    feedback: 三分法では、商品を買ったときは仕入という費用で記録します。費用が増えます。
  - match: { asset: none }
    misconception: purchase_is_asset
    feedback: マシンのときとは違い、商品は資産にしません。現金が減った分だけ、資産は減ります。
  - match: { equity: none }
    feedback: 費用が増えると当期純利益が減り、そのぶん純資産も減ります。
hint: 現金(資産)が減り、仕入(費用)が増えます。費用が増えれば純資産も減ります。
success: マシンのときとは違い、資産は減って費用が増えました。売り物を買うことと、使う物を買うことの違いが仕訳に表れています。
```

## 豆と菓子が売れる
棚に並べた豆と焼き菓子がよく売れて、1 か月で 90,000 円の売上になりました。代金はすべて現金です。
売ったときは、仕入を減らしたりはしません。先月のコーヒーと同じく、「売上」を右に書くだけです。記帳して、損益計算書の形を見てみましょう。

```task
type: post
transaction: コーヒー豆と焼き菓子(商品)を 90,000 円で売り、代金は現金で受け取った
answer:
  debit: [{ account: cash, amount: 90000 }]
  credit: [{ account: sales, amount: 90000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 増えた現金は左、売上は右です。左右を入れ替えてみましょう。
  - match: { credit: [{ account: purchases }] }
    feedback: 売ったときに仕入を減らす必要はありません。三分法では、売上を右に書くだけです。
  - match: { credit: [{ account: merchandise_inventory }] }
    misconception: purchase_is_asset
    feedback: 商品を資産として持っていたわけではないので、減らす資産もありません。右は売上です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 90,000 にしましょう。
hint: 左に現金 90,000、右に売上 90,000 です。
success: 損益計算書に、売上 170,000 と仕入 50,000 が向かい合って並びました。この差が商品のもうけです。
```

## 商品のもうけ
損益計算書を見ると、収益に売上、費用に仕入が並んでいます。仕入は「売るために買った分」なので、売上と向かい合わせに読むと、商品でいくらもうかったかが分かります。
今月、豆と焼き菓子だけで見たもうけはいくらでしょう。結果の表から、今月の売上 90,000 と、今月の仕入の合計を読み取って引いてみましょう。

```figure
type: taccount
alt: 仕入の T 勘定。左側に豆 30,000 円と焼き菓子 20,000 円が積まれ、合計 50,000 円
account: purchases
debit:
  - { label: コーヒー豆, amount: 30000 }
  - { label: 焼き菓子, amount: 20000 }
```

```task
type: calc
question: 今月の商品の売上 90,000 円から、今月の仕入の合計を引いた金額はいくらですか(円)
answer: 40000
wrong_patterns:
  - match: 90000
    misconception: purchase_is_asset
    feedback: 仕入は費用です。売上 90,000 から仕入の合計を引きましょう。
  - match: 60000
    feedback: 焼き菓子の 20,000 も仕入です。30,000 + 20,000 を引きましょう。
  - match: 70000
    feedback: それは先月分も含めた当期純利益です。今月の商品だけなら、90,000 − 50,000 です。
hint: 90,000 − (30,000 + 20,000)。
success: 商品のもうけは 40,000 円。売上と仕入を向かい合わせに置くと、こうして読み取れます。
```

## 売り物と使う物を分ける
この単元で出てきた科目を、5 つの箱に分けてみましょう。仕入と備品はどちらも「買った物」ですが、入る箱が違います。
「売るために買ったのか、自分で使うために買ったのか」を思い出しながら分けてみてください。

```task
type: classify
accounts: [purchases, sales, equipment, cash]
misconceptions:
  purchases:
    asset: purchase_is_asset
  equipment:
    expense: expense_at_payment
hint: 仕入は費用、売上は収益、備品と現金は資産です。
success: 同じ「買った物」でも、売り物の仕入は費用、長く使う備品は資産。箱が違うことが仕訳の違いになります。
```

## ふりかえり
今月、あなたは商品を 2 回仕入れ、1 回売りました。買ったら「仕入」、売ったら「売上」。三分法の日々の記帳は、この 2 つだけです。
仕入は費用の箱に入ります。備品のように資産にしないのは、商品はいずれ売れてお店を離れていくからです。売上と仕入を向かい合わせに読めば、商品でいくらもうかったかが見えます。
ひとつ気になることがあります。仕入れた豆や菓子は、月末の時点で全部売れたとは限りません。売れ残った分は「使った」とは言えないはずです。三分法の 3 つ目の科目「繰越商品」は、この売れ残りを決算の日に数えるために使います。それはこのテーマの最後の単元で扱います。
次の単元では、代金を「後で」受け払いする掛け取引を記帳します。
