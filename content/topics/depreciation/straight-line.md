---
id: depreciation/straight-line
title: 定額法
summary: カフェ 2 号店の軽バンを題材に、耐用年数や残存価額を動かしながら「1 年分の減価償却費」の決め方と月割り計算を身につける
level: 2
order: 2
introduces: [straight_line_method, useful_life, residual_value, monthly_proration]
concepts: [depreciation, acquisition_cost, book_value]
requires: [depreciation/what-is-depreciation]
scenario:
  company: カフェ「マメノキ」2 号店
  opening:
    - { account: cash, amount: 1600000 }
    - { account: equipment, amount: 600000 }
    - { account: capital_stock, amount: 2000000 }
    - { account: sales, amount: 500000 }
    - { account: rent_expense, amount: 300000 }
---

## 2 号店の決算
カフェ「マメノキ」は 10 月 1 日に 2 号店を開きました。開店の日に中古のコーヒーマシン 600,000 円(備品)を買い、同じ日に配達用の軽バン 1,200,000 円も買っています。
きょうは 3 月 31 日、2 号店にとって初めての決算です。この単元では、[[depreciation|減価償却]] の「1 年分はいくらか」を決める計算を、条件を動かしながら確かめます。

## 軽バンを記帳する
軽バンの購入を、まだ帳簿に書いていませんでした。1,200,000 円を現金で払っています。
軽バンは「車両運搬具」という勘定科目で、備品と同じ [[tangible_fixed_assets|有形固定資産]] です。払った日に全部費用にはしないことを思い出しながら、記帳してみましょう。

```figure
type: elements
alt: 軽バン(車両運搬具)は現金やマシン(備品)と同じ資産の箱に入る。買った日には費用の箱には何も入らない
items:
  - { account: cash }
  - { account: equipment }
  - { account: vehicle, highlight: true }
```

```task
type: post
transaction: 10 月 1 日、配達用の軽バン(車両運搬具)1,200,000 円を現金で買った
answer:
  debit: [{ account: vehicle, amount: 1200000 }]
  credit: [{ account: cash, amount: 1200000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 増えた軽バン(資産)は左、減った現金は右です。左右を入れ替えてみましょう。
  - match: { debit: [{ account: depreciation_expense }] }
    misconception: no_cost_allocation
    feedback: 買った日に費用にはしません。まず車両運搬具という資産として記録し、決算で使った分だけ減価償却します。
  - match: { debit: [{ account: supplies_expense }] }
    misconception: expense_at_payment
    feedback: 軽バンは何年も使う財産なので、払った時点では費用になりません。車両運搬具を使います。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 1,200,000 にしましょう。
hint: 左に車両運搬具 1,200,000、右に現金 1,200,000 です。
success: 結果の表に車両運搬具 1,200,000 が現れ、現金が同じだけ減りました。資産の合計は変わっていません。
```

## 1 年分を決める
軽バンの 1,200,000 円を、何年に分けるか。この「何年使えるか」の見積もりを [[useful_life|耐用年数]] と呼びます。
([[acquisition_cost|取得原価]] − [[residual_value|残存価額]])÷ 耐用年数 で毎年同じ金額を費用にする方法が [[straight_line_method|定額法]] です。耐用年数を動かして、1 年分の減価償却費が 200,000 円になる年数を探してみましょう。

```figure
type: timeline
alt: 軽バンの 1,200,000 円を 6 年に分けると、毎年 200,000 円ずつ費用になる
total: 1200000
periods: 6
unit: 年
label: 軽バンの取得原価
```

```task
type: tweak
formula: straight_line
params:
  - { id: cost, label: 取得原価, value: 1200000, min: 600000, max: 1800000, step: 100000, unit: 円 }
  - { id: residual_value, label: 残存価額, value: 0, min: 0, max: 600000, step: 50000, unit: 円 }
  - { id: useful_life, label: 耐用年数, value: 4, min: 1, max: 12, step: 1, unit: 年 }
goal: { output: annual_depreciation, equals: 200000, label: 1 年分の減価償却費 }
hint: 1,200,000 ÷ 6 = 200,000。
success: (取得原価 − 残存価額)÷ 耐用年数 で、1 年分が 200,000 円になりました。年数を長くするほど 1 年分は小さくなります。
```

## 最後に残る価値
6 年乗った軽バンでも、中古車として 300,000 円くらいで売れそうです。使い終わったときに残る見込みの価値を [[residual_value|残存価額]] と呼び、この分は費用にしません。
残存価額を動かして、1 年分の減価償却費が 150,000 円になる金額を探してみましょう。

```task
type: tweak
formula: straight_line
params:
  - { id: cost, label: 取得原価, value: 1200000, min: 600000, max: 1800000, step: 100000, unit: 円 }
  - { id: residual_value, label: 残存価額, value: 0, min: 0, max: 600000, step: 50000, unit: 円 }
  - { id: useful_life, label: 耐用年数, value: 6, min: 1, max: 12, step: 1, unit: 年 }
goal: { output: annual_depreciation, equals: 150000, label: 1 年分の減価償却費 }
hint: (1,200,000 − 残存価額)÷ 6 = 150,000 になる残存価額です。
success: 配分するのは、取得原価から残存価額を引いた分です。それを耐用年数で割って、1 年分が 150,000 円になりました。
```

## 使った月の分だけ
ここから先は、残存価額ゼロ・耐用年数 6 年で進めます。1 年分は 200,000 円ですが、軽バンを買ったのは 10 月 1 日。決算の 3 月 31 日までは 6 か月しか使っていません。
使った月数の分だけ費用にする計算を [[monthly_proration|月割り計算]] と呼びます。初年度の減価償却費はいくらでしょう。

```task
type: calc
question: 10 月 1 日に買った軽バンの、初年度(3 月 31 日まで)の減価償却費はいくらですか(円)
answer: 100000
wrong_patterns:
  - match: 200000
    misconception: forgot_monthly_proration
    feedback: 1 年分は 200,000 ですが、使ったのは 10 月から 3 月までの 6 か月です。使った月数の分だけにしましょう。
  - match: 150000
    feedback: ここでは残存価額ゼロで計算します。1 年分 200,000 を月割りしましょう。
  - match: 50000
    feedback: 10 月から 3 月までは 6 か月です。200,000 × 6 ÷ 12 で計算してみましょう。
hint: 200,000 × 6 か月 ÷ 12 か月。
success: 初年度は 100,000 円。買った日から決算日まで数えるのがコツです。
```

## 予想してから記帳する
軽バンの減価償却費 100,000 円を記帳します。その前に、5 つの要素がどう動くか予想してみましょう。
右に書く減価償却累計額が、負債ではなかったことを思い出してください。

```task
type: predict
transaction: 決算にあたり、軽バン(車両運搬具)の減価償却費 100,000 円を間接法で計上した
entry:
  debit: [{ account: depreciation_expense, amount: 100000 }]
  credit: [{ account: accumulated_depreciation, amount: 100000 }]
answer: { asset: decrease, liability: none, equity: decrease, revenue: none, expense: increase }
wrong_patterns:
  - match: { liability: increase }
    misconception: contra_as_liability
    feedback: 減価償却累計額は右に書きますが、負債ではありません。資産のマイナスなので、資産が減ります。
  - match: { asset: none }
    feedback: 累計額は資産のマイナスです。軽バンの価値が減った分だけ、資産の合計は減ります。
  - match: { expense: none }
    feedback: 減価償却費は費用です。使った 6 か月分の価値が費用になります。
  - match: { equity: none }
    feedback: 費用が増えると利益が減り、そのぶん純資産も減ります。
hint: 資産が減り、費用が増え、純資産(利益)が減ります。負債・収益は動きません。
success: 資産が減り、費用が増え、利益が減りました。現金は動いていないことも、結果の表で確かめましょう。
```

## マシンの分も記帳する
2 号店のコーヒーマシン 600,000 円も、10 月 1 日に買ったものです。耐用年数 6 年、残存価額ゼロなら 1 年分は 100,000 円。こちらも使ったのは 6 か月です。
マシン(備品)の減価償却を、自分で計算して記帳してみましょう。累計額は「備品減価償却累計額」と書いても構いません。

```figure
type: taccount
alt: 減価償却累計額の T 勘定。右側に軽バンの 100,000 円がすでに積まれていて、マシンの分がこの下に加わる
account: accumulated_depreciation
credit:
  - { label: 軽バン(6 か月分), amount: 100000 }
```

```task
type: post
transaction: 決算にあたり、コーヒーマシン(備品)の減価償却費を間接法で計上した(取得原価 600,000 円、耐用年数 6 年、残存価額ゼロ、10 月 1 日取得)
answer:
  debit: [{ account: depreciation_expense, amount: 50000 }]
  credit: [{ account: accumulated_depreciation, amount: 50000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 減価償却費は費用なので左で増えます。左右を入れ替えてみましょう。
  - match: { debit: [{ account: depreciation_expense, amount: 100000 }] }
    misconception: forgot_monthly_proration
    feedback: 1 年分は 100,000 ですが、使ったのは 6 か月です。月割りしてみましょう。
  - match: { credit: [{ account: equipment }] }
    misconception: direct_writeoff_vs_contra
    feedback: 備品はそのまま残し、減った分は減価償却累計額に積みます。
  - match: { credit: [{ account: cash }] }
    misconception: depreciation_as_cash_outflow
    feedback: 現金はマシンを買ったときにもう減っています。減価償却ではお金は動きません。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。
hint: 600,000 ÷ 6 年 = 100,000。それを 6 か月分にすると 50,000 です。
success: 累計額は軽バンの分と合わせて 150,000 になりました。減価償却費は合計 150,000、当期純利益は 50,000 です。
```

## 2 年目の終わりの価値
2 年目の決算では、軽バンを 4 月から 3 月まで丸 1 年使います。月割りは要らないので、2 年目の減価償却費は 1 年分の 200,000 円です。
2 年目の決算が終わったとき、軽バンの [[book_value|帳簿価額]] はいくらになっているでしょう。取得原価 1,200,000 から、1 年目と 2 年目の減価償却費の合計を引いてみましょう。

```task
type: calc
question: 2 年目の決算を終えたあとの、軽バンの帳簿価額はいくらですか(円)
answer: 900000
wrong_patterns:
  - match: 1000000
    feedback: 2 年目の 200,000 しか引いていません。1 年目の 100,000(6 か月分)も引きましょう。
  - match: 800000
    misconception: forgot_monthly_proration
    feedback: 1 年目は 6 か月分の 100,000 です。100,000 + 200,000 を引きましょう。
  - match: 1100000
    feedback: それは 1 年目の決算を終えたときの帳簿価額です。2 年目の分も引きましょう。
  - match: 1050000
    feedback: 結果の累計額 150,000 は、コーヒーマシンの 50,000 も入った 1 年目の終わりの合計で、2 年目の分はまだ入っていません。軽バンの分だけ、100,000 + 200,000 を引きましょう。
  - match: 850000
    feedback: 結果の累計額 150,000 には、コーヒーマシンの 50,000 も入っています。軽バンの 1 年目は 100,000 なので、100,000 + 200,000 を引きましょう。
hint: 1,200,000 − (100,000 + 200,000)。
success: 帳簿価額は 900,000 円。この先は毎年 200,000 ずつ減り、あと 4 年半、取得から 6 年(耐用年数どおり)でゼロになります。
```

## ふりかえり
定額法は、(取得原価 − 残存価額)÷ 耐用年数 で 1 年分を決め、毎年同じ金額を費用にする方法です。耐用年数を長くすれば 1 年分は小さく、残存価額を見込めば配分する総額が小さくなるのを、スライダーで確かめましたね。
期の途中で買ったものは、使った月数の分だけ。買った日から決算日までを数えるのがコツです。
これで、固定資産を買ってから毎年の決算まで、ひと通り自分の手で記帳できるようになりました。「売るときどうなるか」(固定資産の売却)や、毎年の金額が変わる定率法の単元は、いま準備中です。
