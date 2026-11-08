---
id: merchandise/returns-and-costs
title: 返品と運賃
summary: カフェ 4 か月目、傷んだ豆の返品と、仕入れ・発送にかかる運賃を記帳しながら、「元の取引を取り消す書き方」と「運賃をどこに含めるか」を身につける
level: 1
order: 3
introduces: [returns, incidental_costs]
concepts: [purchase, payable, receivable, expense]
requires: [merchandise/credit-transactions]
scenario:
  company: カフェ「マメノキ」
  opening:
    - { account: cash, amount: 730000 }
    - { account: bank_deposit, amount: 60000 }
    - { account: equipment, amount: 600000 }
    - { account: loans_payable, amount: 300000 }
    - { account: capital_stock, amount: 1000000 }
    - { account: sales, amount: 230000 }
    - { account: purchases, amount: 90000 }
    - { account: rent_expense, amount: 50000 }
---

## 届いた豆に問題が
カフェ「マメノキ」の 4 か月目。問屋から届いた豆の一部が湿気で傷んでいました。問屋に連絡すると「返してくれれば、その分は代金から引きます」とのこと。
商品を返したり、返されたりする取引を [[returns|返品]] と呼びます。それから今月は、豆を運んでもらう運賃と、お客さんに焼き菓子を送る運賃も発生します。「取り消す」と「運賃」が今月のテーマです。

## 運賃ごと仕入れる
問屋から豆 50,000 円分を掛けで仕入れました。運送会社への運賃 2,000 円は、お店が現金で払いました。
商品を手に入れるまでにかかる運賃を [[incidental_costs|諸掛]] と呼びます。仕入れるときの運賃(仕入諸掛)は、豆の値段の一部として「仕入」に含めます。豆は運んでもらわなければ店に届かないので、運賃込みが本当の仕入値だからです。左は仕入 52,000、右は買掛金 50,000 と現金 2,000 の 2 行になります。

```figure
type: flow
alt: 豆の代金 50,000 円と運賃 2,000 円は、合わせて仕入 52,000 円になる
nodes: ["豆の代金 50,000", "運賃 2,000", "仕入 52,000"]
highlight: 2
```

```task
type: post
transaction: 問屋からコーヒー豆(商品)50,000 円分を掛けで仕入れ、運賃 2,000 円は現金で支払った
answer:
  debit: [{ account: purchases, amount: 52000 }]
  credit: [{ account: accounts_payable, amount: 50000 }, { account: cash, amount: 2000 }]
wrong_patterns:
  - match: { debit: [{ account: shipping_expense }] }
    misconception: incidental_cost_separate
    feedback: 仕入れるときの運賃は、豆の値段の一部です。発送費ではなく、仕入に含めて 52,000 にしましょう。
  - match: { debit: [{ account: purchases, amount: 50000 }] }
    misconception: incidental_cost_separate
    feedback: 運賃 2,000 も仕入に含めます。仕入は 52,000 です。
  - match: { credit: [{ account: cash, amount: 52000 }] }
    feedback: 豆の代金 50,000 は掛け(買掛金)で、現金で払ったのは運賃の 2,000 だけです。右を 2 行に分けてみましょう。
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 仕入は費用なので左、買掛金と減った現金は右です。
  - match: { unbalanced: true }
    feedback: 左の合計 52,000 と、右の合計(買掛金 + 現金)がそろっていません。
hint: 左に仕入 52,000。右は買掛金 50,000 と現金 2,000 の 2 行です。
success: 仕入が運賃込みの 52,000 で記録されました。右の 2 行の合計も 52,000 で、左右がそろっています。
```

## 傷んだ豆を返す
傷んでいた 10,000 円分の豆を問屋に返しました。掛けで買ったので、お金は動きません。代わりに、月末に払う金額が 10,000 円減ります。
返品は新しい取引ではなく、元の仕入の一部を取り消すことです。元の仕訳「左に仕入、右に買掛金」を左右逆にして、「左に買掛金、右に仕入」と書きます。これを逆仕訳と呼びます。T 勘定で見ると、仕入の右側に返した分が載る形です。

```figure
type: taccount
alt: 仕入の T 勘定。左側に今月の仕入 52,000 円、右側に返品 10,000 円が載り、差し引きが今月の仕入になる
account: purchases
debit:
  - { label: 今月の仕入(運賃込み), amount: 52000 }
credit:
  - { label: 傷んだ豆の返品, amount: 10000 }
```

```task
type: post
transaction: 掛けで仕入れたコーヒー豆のうち、傷んでいた 10,000 円分を問屋に返品した
answer:
  debit: [{ account: accounts_payable, amount: 10000 }]
  credit: [{ account: purchases, amount: 10000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: return_as_new_transaction
    feedback: それは新しく仕入れたときの仕訳です。返品は取り消しなので、左右を逆にします。
  - match: { debit: [{ account: accounts_payable }], credit: [{ account: cash }] }
    misconception: return_as_new_transaction
    feedback: 左の買掛金は合っています。豆を返したので、現金は動きません。元の仕入を取り消すので、右に仕入を書きます。
  - match: { credit: [{ account: cash }] }
    misconception: return_as_new_transaction
    feedback: 掛けで買った豆なので、お金は動きません。減るのは買掛金(払う義務)です。
  - match: { debit: [{ account: sales }] }
    misconception: return_as_new_transaction
    feedback: 問屋に返すのは「売る」ことではありません。元の仕入を取り消すので、右に仕入を書きます。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 10,000 にしましょう。
hint: 左に買掛金 10,000、右に仕入 10,000 です。
success: 仕入が 10,000 減り、買掛金も 10,000 減りました。元の取引が一部なかったことになった形です。
```

## 焼き菓子を送る
常連のお客さんから、焼き菓子 30,000 円分を掛けで注文されました。宅配で送るので、運賃 1,500 円を現金で払っています。
今度の運賃は、仕入れるときではなく、売るときにかかったものです。これは仕入には含めず、「発送費」という費用にします。左は売掛金 30,000 と発送費 1,500、右は売上 30,000 と現金 1,500 です。

```task
type: post
transaction: 焼き菓子(商品)30,000 円分を掛けで売り、発送の運賃 1,500 円は現金で支払った
answer:
  debit: [{ account: accounts_receivable, amount: 30000 }, { account: shipping_expense, amount: 1500 }]
  credit: [{ account: sales, amount: 30000 }, { account: cash, amount: 1500 }]
wrong_patterns:
  - match: { debit: [{ account: purchases }] }
    misconception: shipping_in_purchases
    feedback: 売るときの運賃は仕入ではありません。発送費という費用を左に書きます。
  - match: { credit: [{ account: sales, amount: 28500 }] }
    feedback: 売上から運賃を引きません。売上は 30,000 のまま、運賃は発送費として別に書きます。
  - match: { debit: [{ account: cash, amount: 30000 }] }
    misconception: receivable_is_cash
    feedback: 代金はまだ受け取っていません。左は売掛金 30,000 です。
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 売掛金と発送費は左、売上と減った現金は右です。
  - match: { unbalanced: true }
    feedback: 左の合計(売掛金 + 発送費)と右の合計(売上 + 現金)がそろっていません。どちらも 31,500 です。
hint: 左に売掛金 30,000 と発送費 1,500、右に売上 30,000 と現金 1,500 です。
success: 売上は 30,000 のまま、発送費 1,500 が費用に並びました。同じ運賃でも、仕入れるときは仕入に含め、売るときは発送費。向きで扱いが変わります。
```

## 返されてきた菓子
送った焼き菓子のうち 5,000 円分が、割れていたという理由で返されてきました。掛けで売ったので、受け取る金額がその分減ります。
これも返品です。元の仕訳「左に売掛金、右に売上」を左右逆にしてみましょう。

```task
type: post
transaction: 掛けで売った焼き菓子のうち、割れていた 5,000 円分が返品された
answer:
  debit: [{ account: sales, amount: 5000 }]
  credit: [{ account: accounts_receivable, amount: 5000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: return_as_new_transaction
    feedback: それは新しく売ったときの仕訳です。返品は取り消しなので、左右を逆にします。
  - match: { debit: [{ account: purchases }] }
    misconception: return_as_new_transaction
    feedback: お客さんから戻ってきた菓子を「仕入れた」わけではありません。元の売上を取り消すので、左に売上を書きます。
  - match: { credit: [{ account: cash }] }
    feedback: 代金はまだ受け取っていなかったので、現金は動きません。減るのは売掛金(受け取る権利)です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 5,000 にしましょう。
hint: 左に売上 5,000、右に売掛金 5,000 です。
success: 売上が 5,000 減り、売掛金も 5,000 減りました。売りの返品も、買いの返品と同じ「逆仕訳」です。
```

## 今月の仕入はいくら
結果の損益計算書の仕入は、先月までの分も含んだ合計です。今月だけの仕入を数えてみましょう。
運賃込みで仕入れた金額から、返した分を引きます。T 勘定の左から右を引く計算です。

```task
type: calc
question: 今月の仕入の金額(運賃を含め、返品を引いた純額)はいくらですか(円)
answer: 42000
wrong_patterns:
  - match: 50000
    misconception: incidental_cost_separate
    feedback: 運賃 2,000 は仕入に含めます。52,000 から返品 10,000 を引きましょう。
  - match: 52000
    feedback: 返品した 10,000 分は仕入から引きます。
  - match: 40000
    misconception: incidental_cost_separate
    feedback: 運賃を引いてしまっています。仕入は運賃込みの 52,000 から、返品 10,000 を引いた金額です。
  - match: 132000
    feedback: 132,000 は結果の損益計算書の仕入で、先月までの 90,000 を含んだ合計です。今月の分は、運賃込みの 52,000 から返品 10,000 を引いた 42,000 です。
hint: 52,000 − 10,000。
success: 今月の仕入は 42,000 円。運賃は足して、返品は引く。これが仕入の純額です。
```

## 運賃と権利を分ける
今月出てきた科目を 5 つの箱に分けてみましょう。発送費は費用ですが、仕入と同じ箱でも別の科目です。
売掛金と買掛金は先月のとおり、権利は資産、義務は負債です。

```task
type: classify
accounts: [shipping_expense, purchases, accounts_payable, accounts_receivable]
misconceptions:
  purchases:
    asset: purchase_is_asset
  accounts_receivable:
    revenue: receivable_is_cash
  accounts_payable:
    expense: expense_as_liability
hint: 発送費と仕入は費用、買掛金は負債、売掛金は資産です。
success: 発送費も仕入も費用の箱に入りますが、仕入に含めるのは仕入れるときの運賃だけ。売るときの運賃は発送費として分けます。
```

## ふりかえり
返品は新しい取引ではなく、元の取引の取り消しです。だから元の仕訳を左右逆にした「逆仕訳」で書きます。掛けなら、お金ではなく買掛金や売掛金が減ります。
運賃は向きで扱いが変わります。仕入れるときの運賃は商品の値段の一部なので仕入に含め、売るときの運賃は発送費という別の費用にします。「商品を手に入れるまでにかかった金額が仕入値」と覚えておくと迷いません。
これで日々の商品売買はひと通り記帳できました。次の単元は決算の日の話です。仕入れた商品のうち売れ残った分をどう扱うか、三分法の 3 つ目の科目「繰越商品」が登場します。
