---
id: depreciation/what-is-depreciation
title: 減価償却とは何か
summary: カフェ1年目の決算で、コーヒーマシンの600,000円を「買った年に全部費用にしない」理由を、自分で記帳しながら確かめる
level: 1
order: 1
introduces: [tangible_fixed_assets, acquisition_cost, accrual_basis, cost_allocation, depreciation, book_value, contra_account, indirect_method]
concepts: [expense, asset, net_income]
requires: [bookkeeping-basics/five-elements]
scenario:
  company: カフェ「マメノキ」
  opening:
    - { account: cash, amount: 1060000 }
    - { account: equipment, amount: 600000 }
    - { account: loans_payable, amount: 300000 }
    - { account: capital_stock, amount: 1000000 }
    - { account: sales, amount: 960000 }
    - { account: rent_expense, amount: 600000 }
---

## 1年目の決算の日
少し時間を戻して、カフェ「マメノキ」を開いて1年の時点の話です。きょうは3月31日、1年目の区切りの日です。結果の表には、この1年の売上960,000円と家賃600,000円、そして開店のときに買ったコーヒーマシン600,000円が載っています。
マシンのように、形があって1年を超えて使う財産を[[tangible_fixed_assets|有形固定資産]]と呼びます。この600,000円を1年の終わりにどう扱うかが、この単元のテーマです。

## 電気代を払う
決算の前に、3月分の電気代20,000円を現金で払いました。記帳の前に、5つの要素がどう動くか予想してみましょう。
電気はもう使ってしまったので、財産としては残りません。マシンを買ったときとの違いに注目してみてください。

```task
type: predict
transaction: 3月分の電気代20,000円を現金で支払った
entry:
  debit: [{ account: utilities_expense, amount: 20000 }]
  credit: [{ account: cash, amount: 20000 }]
answer: { asset: decrease, liability: none, equity: decrease, revenue: none, expense: increase }
wrong_patterns:
  - match: { liability: increase }
    misconception: expense_as_liability
    feedback: 電気代はもう払い終えているので、支払う義務は残りません。負債ではなく費用です。
  - match: { asset: none }
    feedback: 現金で払ったので、資産は20,000減ります。
  - match: { expense: none }
    feedback: 使ってしまった電気の代金は、その場で費用になります。
  - match: { equity: none }
    feedback: 費用が増えると当期純利益が減り、そのぶん純資産も減ります。
  - match: { equity: increase }
    feedback: 費用が増えると当期純利益は減ります。純資産も増えるのではなく、そのぶん減ります。
hint: 現金(資産)が減り、水道光熱費(費用)が増えます。費用が増えれば利益も純資産も減ります。
success: 使った分がその場で費用になり、利益が減りました。電気は使ってしまえば終わりなので、これでぴったりです。
```

## もしマシンも全部費用にしたら
電気代と同じ調子で、マシンの600,000円も買った年に全部費用にしたらどうなるでしょう。いまの[[net_income|当期純利益]]は340,000円です(売上960,000 − 家賃600,000 − 電気代20,000)。
ここから600,000円を引いた金額を入力してみましょう。マイナスになるなら、先頭に「-」を付けます。

```task
type: calc
question: マシン600,000円を全額その年の費用にした場合の当期純利益はいくらですか(円)
answer: -260000
wrong_patterns:
  - match: 260000
    feedback: 符号が逆です。費用のほうが大きいので、利益はマイナス(損失)になります。
  - match: -240000
    feedback: 電気代の20,000も費用です。340,000 − 600,000で計算してみましょう。
hint: 340,000 − 600,000 = −260,000。
success: 1年目だけ大赤字、2年目からはマシンの費用がゼロ。毎年同じようにコーヒーを売っているのに、これではお店の本当の調子が読めません。
```

## 使う年数に分ける
マシンは6年くらい使えそうです。そこで、買った金額を使う年数に分けて、毎年少しずつ費用にします。この考え方を[[cost_allocation|費用配分]]と呼びます。
「お金を払ったとき」ではなく「使ったとき」に費用にする。この土台になる考え方が[[accrual_basis|発生主義]]です。買って使えるようにするまでにかかった金額を[[acquisition_cost|取得原価]]と呼び、今回は600,000円。6年で割ると、1年分は100,000円です。この手続きが[[depreciation|減価償却]]です。

```figure
type: timeline
alt: マシンの取得原価600,000円を6年に分けると、毎年100,000円ずつ費用になる
total: 600000
periods: 6
unit: 年
label: コーヒーマシンの取得原価
```

## 減価償却を記帳する
1年分の100,000円を、「[[depreciation_expense|減価償却費]]」という費用として左に書きます。右には「備品」ではなく、「[[accumulated_depreciation|減価償却累計額]]」という[[account_title|勘定科目]]を使ってみましょう。
備品の600,000円はそのまま残し、減った分を別の科目に積んでいく書き方を[[indirect_method|間接法]]と呼びます。減価償却累計額のような「資産のマイナス」を表す科目が[[contra_account|評価勘定]]です。

```figure
type: compare
alt: 直接法では備品そのものを減らすが、間接法では備品はそのままにして、減価償却累計額という資産のマイナスを資産の箱に置く
left:
  title: 直接法(備品を直接減らす)
  figure:
    type: elements
    alt: 備品だけが資産の箱にあり、その金額が減る
    items:
      - { account: equipment, highlight: true }
right:
  title: 間接法(累計額を別に積む)
  figure:
    type: elements
    alt: 備品はそのままで、減価償却累計額が資産の箱にマイナスとして並ぶ
    items:
      - { account: equipment }
      - { account: accumulated_depreciation, highlight: true }
```

```task
type: post
transaction: 決算にあたり、コーヒーマシン(備品)の1年分の減価償却費100,000円を間接法で計上した
answer:
  debit: [{ account: depreciation_expense, amount: 100000 }]
  credit: [{ account: accumulated_depreciation, amount: 100000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 減価償却費は費用なので左で増えます。左右を入れ替えてみましょう。
  - match: { credit: [{ account: equipment }] }
    misconception: direct_writeoff_vs_contra
    feedback: 備品の600,000はそのまま残します。減った分は減価償却累計額という別の科目に積んでみましょう。
  - match: { credit: [{ account: cash }] }
    misconception: depreciation_as_cash_outflow
    feedback: 現金はマシンを買ったときにもう減っています。減価償却ではお金は動きません。
  - match: { debit: [{ account: depreciation_expense, amount: 600000 }] }
    misconception: no_cost_allocation
    feedback: 全額ではなく、6年に分けた1年分の100,000だけを費用にします。
  - match: { debit: [{ account: equipment }] }
    misconception: direct_writeoff_vs_contra
    feedback: 左に備品を書くと、マシンの金額が増えてしまいます。使った1年分は費用なので、左には減価償却費を書きましょう。
  - match: { credit: [{ account: accounts_payable_other }] }
    misconception: expense_as_liability
    feedback: 未払金は、後で払う義務を表す科目です。マシンの代金は買ったときに払い終えていて、減価償却で新しく払う相手は生まれません。
  - match: { credit: [{ account: accounts_payable }] }
    misconception: expense_as_liability
    feedback: 買掛金は、商品の代金を後で払う義務を表す科目です。マシンの代金は買ったときに払い終えていて、減価償却で新しく払う相手は生まれません。
  - match: { debit: [{ account: supplies_expense }] }
    misconception: depreciation_as_supplies_expense
    feedback: 消耗品費は、文房具のようにすぐ使い切る物の費用です。何年も使うマシンの使った分には、減価償却のための費用の科目があります。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも100,000にしましょう。
hint: 左に減価償却費100,000、右に減価償却累計額100,000です。
success: 結果の表では、備品600,000の下に減価償却累計額 −100,000が並びました。費用が増えて、当期純利益は240,000になりました。
```

## 累計額はどの箱?
減価償却累計額は右(貸方)に書きました。右で増えるのは負債や収益でしたね。では、累計額は負債でしょうか。
支払う相手はいませんし、返す義務もありません。マシンの価値がどれだけ減ったかを示す、資産のマイナスです。4つの科目を箱に分けてみましょう。

```task
type: classify
accounts: [accumulated_depreciation, depreciation_expense, equipment, loans_payable]
misconceptions:
  accumulated_depreciation:
    liability: contra_as_liability
  depreciation_expense:
    liability: expense_as_liability
hint: 減価償却累計額は資産のマイナス、減価償却費は費用、備品は資産、借入金は負債です。
success: 右で増える科目でも、負債とは限りません。減価償却累計額は資産の箱に入り、資産を減らす向きに働きます。
```

## マシンのいまの価値
結果の[[balance_sheet|貸借対照表]]で、備品600,000と減価償却累計額 −100,000が並んでいます。取得原価から累計額を引いた金額が、帳簿の上でのマシンのいまの価値、[[book_value|帳簿価額]]です。
マシンの帳簿価額はいくらでしょう。

```task
type: calc
question: 1年目の決算を終えたマシンの帳簿価額はいくらですか(円)
answer: 500000
wrong_patterns:
  - match: 600000
    feedback: それは取得原価です。減価償却累計額を引いてみましょう。
  - match: 100000
    feedback: それは減った分(累計額)です。残っている価値を答えます。
hint: 600,000 − 100,000。
success: 帳簿価額は500,000円。「元は600,000で、いまは500,000」が表から読み取れます。
```

## 2年目の決算
1年が過ぎて、2年目の3月31日になりました。マシンはまだ元気に動いています。2年目も同じように、1年分の減価償却を記帳しましょう。
この画面の[[income_statement|損益計算書]]は1年目の分に足された形で表示されています。累計額が育っていく様子に注目してください。

```figure
type: taccount
alt: 減価償却累計額のT勘定。右側に1年目の決算の100,000円が積まれていて、2年目の分がこの下に加わる
account: accumulated_depreciation
credit:
  - { label: 1年目の決算, amount: 100000 }
```

```task
type: post
transaction: 2年目の決算にあたり、コーヒーマシン(備品)の1年分の減価償却費100,000円を間接法で計上した
answer:
  debit: [{ account: depreciation_expense, amount: 100000 }]
  credit: [{ account: accumulated_depreciation, amount: 100000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 減価償却費は費用なので左で増えます。左右を入れ替えてみましょう。
  - match: { credit: [{ account: equipment }] }
    misconception: direct_writeoff_vs_contra
    feedback: 備品はそのまま残し、減った分は減価償却累計額に積みます。
  - match: { credit: [{ account: cash }] }
    misconception: depreciation_as_cash_outflow
    feedback: 現金はマシンを買ったときにもう減っています。減価償却ではお金は動きません。
  - match: { debit: [{ account: depreciation_expense, amount: 500000 }] }
    feedback: 帳簿価額ではなく、1年分の100,000を費用にします。
  - match: { debit: [{ account: equipment }] }
    misconception: direct_writeoff_vs_contra
    feedback: 左に備品を書くと、マシンの金額が増えてしまいます。使った1年分は費用なので、左には減価償却費を書きましょう。
  - match: { credit: [{ account: accounts_payable_other }] }
    misconception: expense_as_liability
    feedback: 未払金は、後で払う義務を表す科目です。マシンの代金は買ったときに払い終えていて、減価償却で新しく払う相手は生まれません。
  - match: { credit: [{ account: accounts_payable }] }
    misconception: expense_as_liability
    feedback: 買掛金は、商品の代金を後で払う義務を表す科目です。マシンの代金は買ったときに払い終えていて、減価償却で新しく払う相手は生まれません。
  - match: { debit: [{ account: supplies_expense }] }
    misconception: depreciation_as_supplies_expense
    feedback: 消耗品費は、文房具のようにすぐ使い切る物の費用です。何年も使うマシンの使った分には、減価償却のための費用の科目があります。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも100,000にしましょう。
hint: 1年目とまったく同じ仕訳です。
success: 累計額が200,000になり、帳簿価額は400,000に。毎年100,000ずつ、6年かけてゼロに近づいていきます。
```

## ふりかえり
長く使う財産は、買ったときに全部費用にせず、使う年数に分けて費用にする。これが減価償却です。
ポイントは3つ。お金が動くのは買ったときだけで、減価償却ではお金は動かない。備品の金額はそのまま残し、減った分は減価償却累計額に積む(間接法)。取得原価から累計額を引いたものが帳簿価額。
減価償却累計額は右(貸方)で増えますが、負債ではなく資産のマイナスです。「右で増える = 負債」とは限らないことも覚えておきましょう。
次の単元では、「1年分はいくらか」を決める計算方法(定額法)を、条件を動かしながら確かめます。
