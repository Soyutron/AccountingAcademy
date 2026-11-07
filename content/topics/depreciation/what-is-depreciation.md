---
id: depreciation/what-is-depreciation
title: 減価償却とは何か
summary: カフェ 1 年目の決算で、コーヒーマシンの 600,000 円を「買った年に全部費用にしない」理由を、自分で記帳しながら確かめる
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

## 1 年目の決算の日
カフェ「マメノキ」を開いて 1 年。きょうは 3 月 31 日、1 年の区切りの日です。右の表には、この 1 年の売上 960,000 円と家賃 600,000 円、そして開店のときに買ったコーヒーマシン 600,000 円が載っています。
マシンのように、形があって 1 年を超えて使う財産を [[tangible_fixed_assets|有形固定資産]] と呼びます。この 600,000 円を 1 年の終わりにどう扱うかが、この単元のテーマです。

## 電気代を払う
決算の前に、3 月分の電気代 20,000 円を現金で払いました。記帳の前に、5 つの要素がどう動くか予想してみましょう。
電気はもう使ってしまったので、財産としては残りません。マシンを買ったときとの違いに注目してみてください。

```task
type: predict
transaction: 3 月分の電気代 20,000 円を現金で支払った
entry:
  debit: [{ account: utilities_expense, amount: 20000 }]
  credit: [{ account: cash, amount: 20000 }]
answer: { asset: decrease, liability: none, equity: decrease, revenue: none, expense: increase }
wrong_patterns:
  - match: { liability: increase }
    misconception: expense_as_liability
    feedback: 電気代はもう払い終えているので、支払う義務は残りません。負債ではなく費用です。
  - match: { asset: none }
    feedback: 現金で払ったので、資産は 20,000 減ります。
  - match: { expense: none }
    feedback: 使ってしまった電気の代金は、その場で費用になります。
  - match: { equity: none }
    feedback: 費用が増えると当期純利益が減り、そのぶん純資産も減ります。
hint: 現金(資産)が減り、水道光熱費(費用)が増えます。費用が増えれば利益も純資産も減ります。
success: 使った分がその場で費用になり、利益が減りました。電気は使ってしまえば終わりなので、これでぴったりです。
```

## もしマシンも全部費用にしたら
電気代と同じ調子で、マシンの 600,000 円も買った年に全部費用にしたらどうなるでしょう。いまの当期純利益は 340,000 円です(売上 960,000 − 家賃 600,000 − 電気代 20,000)。
ここから 600,000 円を引いた金額を入力してみましょう。マイナスになるなら、先頭に「-」を付けます。

```task
type: calc
question: マシン 600,000 円を全額その年の費用にした場合の当期純利益はいくらですか(円)
answer: -260000
wrong_patterns:
  - match: 260000
    feedback: 符号が逆です。費用のほうが大きいので、利益はマイナス(損失)になります。
  - match: -240000
    feedback: 電気代の 20,000 も費用です。340,000 − 600,000 で計算してみましょう。
hint: 340,000 − 600,000 = −260,000。
success: 1 年目だけ大赤字、2 年目からはマシンの費用がゼロ。毎年同じようにコーヒーを売っているのに、これではお店の本当の調子が読めません。
```

## 使う年数に分ける
マシンは 6 年くらい使えそうです。そこで、買った金額を使う年数に分けて、毎年少しずつ費用にします。この考え方を [[cost_allocation|費用配分]] と呼びます。
「お金を払ったとき」ではなく「使ったとき」に費用にする。この土台になる考え方が [[accrual_basis|発生主義]] です。買って使えるようにするまでにかかった金額を [[acquisition_cost|取得原価]] と呼び、今回は 600,000 円。6 年で割ると、1 年分は 100,000 円です。この手続きが [[depreciation|減価償却]] です。

## 減価償却を記帳する
1 年分の 100,000 円を、「減価償却費」という費用として左に書きます。右には「備品」ではなく、「減価償却累計額」という勘定科目を使ってみましょう。
備品の 600,000 円はそのまま残し、減った分を別の科目に積んでいく書き方を [[indirect_method|間接法]] と呼びます。減価償却累計額のような「資産のマイナス」を表す科目が [[contra_account|評価勘定]] です。

```task
type: post
transaction: 決算にあたり、コーヒーマシン(備品)の 1 年分の減価償却費 100,000 円を間接法で計上した
answer:
  debit: [{ account: depreciation_expense, amount: 100000 }]
  credit: [{ account: accumulated_depreciation, amount: 100000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 減価償却費は費用なので左で増えます。左右を入れ替えてみましょう。
  - match: { credit: [{ account: equipment }] }
    misconception: direct_writeoff_vs_contra
    feedback: 備品の 600,000 はそのまま残します。減った分は減価償却累計額という別の科目に積んでみましょう。
  - match: { credit: [{ account: cash }] }
    misconception: depreciation_as_cash_outflow
    feedback: 現金はマシンを買ったときにもう減っています。減価償却ではお金は動きません。
  - match: { debit: [{ amount: 600000 }] }
    misconception: no_cost_allocation
    feedback: 全額ではなく、6 年に分けた 1 年分の 100,000 だけを費用にします。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 100,000 にしましょう。
hint: 左に減価償却費 100,000、右に減価償却累計額 100,000 です。
success: 右の表では、備品 600,000 の下に減価償却累計額 −100,000 が並びました。費用が増えて、当期純利益は 240,000 になりました。
```

## 累計額はどの箱?
減価償却累計額は右(貸方)に書きました。右で増えるのは負債や収益でしたね。では、累計額は負債でしょうか。
支払う相手はいませんし、返す義務もありません。マシンの価値がどれだけ減ったかを示す、資産のマイナスです。4 つの科目を箱に分けてみましょう。

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
右の貸借対照表で、備品 600,000 と減価償却累計額 −100,000 が並んでいます。取得原価から累計額を引いた金額が、帳簿の上でのマシンのいまの価値、[[book_value|帳簿価額]] です。
マシンの帳簿価額はいくらでしょう。

```task
type: calc
question: 1 年目の決算を終えたマシンの帳簿価額はいくらですか(円)
answer: 500000
wrong_patterns:
  - match: 600000
    feedback: それは取得原価です。減価償却累計額を引いてみましょう。
  - match: 100000
    feedback: それは減った分(累計額)です。残っている価値を答えます。
hint: 600,000 − 100,000。
success: 帳簿価額は 500,000 円。「元は 600,000 で、いまは 500,000」が表から読み取れます。
```

## 2 年目の決算
1 年が過ぎて、2 年目の 3 月 31 日になりました。マシンはまだ元気に動いています。2 年目も同じように、1 年分の減価償却を記帳しましょう。
この画面の損益計算書は 1 年目の分に足された形で表示されています。累計額が育っていく様子に注目してください。

```task
type: post
transaction: 2 年目の決算にあたり、コーヒーマシン(備品)の 1 年分の減価償却費 100,000 円を間接法で計上した
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
  - match: { debit: [{ amount: 500000 }] }
    feedback: 帳簿価額ではなく、1 年分の 100,000 を費用にします。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 100,000 にしましょう。
hint: 1 年目とまったく同じ仕訳です。
success: 累計額が 200,000 になり、帳簿価額は 400,000 に。毎年 100,000 ずつ、6 年かけてゼロに近づいていきます。
```

## ふりかえり
長く使う財産は、買ったときに全部費用にせず、使う年数に分けて費用にする。これが減価償却です。
ポイントは 3 つ。お金が動くのは買ったときだけで、減価償却ではお金は動かない。備品の金額はそのまま残し、減った分は減価償却累計額に積む(間接法)。取得原価から累計額を引いたものが帳簿価額。
減価償却累計額は右(貸方)で増えますが、負債ではなく資産のマイナスです。「右で増える = 負債」とは限らないことも覚えておきましょう。
次の単元では、「1 年分はいくらか」を決める計算方法(定額法)を、条件を動かしながら確かめます。
