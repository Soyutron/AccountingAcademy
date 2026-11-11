---
id: merchandise/returns-and-costs
title: 返品と運賃
summary: カフェ4か月目、傷んだ豆の返品と、仕入れ・発送にかかる運賃を記帳しながら、「元の取引を取り消す書き方」と「運賃をどこに含めるか」を身につける
level: 1
order: 3
introduces: [returns, incidental_costs]
concepts: [purchase, accounts_payable, accounts_receivable, expense]
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
カフェ「マメノキ」の4か月目。問屋から届いた豆の一部が湿気で傷んでいました。問屋に連絡すると「返してくれれば、その分は代金から引きます」とのこと。
商品を返したり、返されたりする取引を[[returns|返品]]と呼びます。それから今月は、豆を運んでもらう運賃と、お客さんに焼き菓子を送る運賃も発生します。「取り消す」と「運賃」が今月のテーマです。

## 運賃ごと仕入れる
問屋から豆50,000円分を掛けで[[purchase|仕入れ]]ました。運送会社への運賃2,000円はお店が負担する約束で、現金で払いました。
商品の売り買いにかかる運賃などを[[incidental_costs|諸掛]]と呼びます。このうち、お店が負担する仕入れの運賃(仕入諸掛)は、豆の値段の一部として「仕入」に含めます。豆は運んでもらわなければ店に届かないので、運賃込みが本当の仕入値だからです。左は仕入52,000、右は[[accounts_payable|買掛金]] 50,000と現金2,000の2行になります。

```figure
type: flow
alt: 豆の代金50,000円と運賃2,000円は、合わせて仕入52,000円になる
nodes: ["豆の代金50,000", "運賃2,000", "仕入52,000"]
highlight: 2
```

```task
type: post
transaction: 問屋からコーヒー豆(商品)50,000円分を掛けで仕入れ、お店が負担する運賃2,000円は現金で支払った
answer:
  debit: [{ account: purchases, amount: 52000 }]
  credit: [{ account: accounts_payable, amount: 50000 }, { account: cash, amount: 2000 }]
wrong_patterns:
  - match: { debit: [{ account: shipping_expense }] }
    misconception: incidental_cost_separate
    feedback: この取引の運賃はお店が負担するので、豆の値段の一部です。発送費ではなく、仕入に含めて52,000にしましょう。
  - match: { debit: [{ account: purchases, amount: 50000 }] }
    feedback: この取引の運賃2,000はお店が負担するので、仕入に含めます。仕入は52,000です。
  - match: { credit: [{ account: cash, amount: 52000 }] }
    feedback: 豆の代金50,000は掛け(買掛金)で、現金で払ったのは運賃の2,000だけです。右を2行に分けてみましょう。
  - match: { credit: [{ account: accounts_payable, amount: 52000 }] }
    feedback: 掛けにしたのは豆の代金50,000だけです。運賃2,000は運送会社に現金で払ったので、右を買掛金と現金の2行に分けてみましょう。
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 仕入は費用なので左、買掛金と減った現金は右です。
  - match: { unbalanced: true }
    feedback: 左の合計52,000と、右の合計(買掛金 + 現金)がそろっていません。
hint: 左に仕入52,000。右は買掛金50,000と現金2,000の2行です。
success: 仕入が運賃込みの52,000で記録されました。右の2行の合計も52,000で、左右がそろっています。
```

## 傷んだ豆を返す
傷んでいた10,000円分の豆を問屋に返しました。掛けで買ったので、お金は動きません。代わりに、月末に払う金額が10,000円減ります。
返品は新しい取引ではなく、元の仕入の一部を取り消すことです。元の仕訳「左に仕入、右に買掛金」を左右逆にして、「左に買掛金、右に仕入」と書きます。これを逆仕訳と呼びます。T勘定で見ると、仕入の右側に返した分が載る形です。

```figure
type: taccount
alt: 仕入のT勘定。左側に今月の仕入52,000円、右側に返品10,000円が載り、差し引きが今月の仕入になる
account: purchases
debit:
  - { label: 今月の仕入(運賃込み), amount: 52000 }
credit:
  - { label: 傷んだ豆の返品, amount: 10000 }
```

```task
type: post
transaction: 掛けで仕入れたコーヒー豆のうち、傷んでいた10,000円分を問屋に返品した
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
  - match: { credit: [{ account: sales }] }
    misconception: return_as_new_transaction
    feedback: 問屋に返すのは「売る」ことではないので、売上は動きません。元の仕入を取り消すので、右に仕入を書きます。
  - match: { credit: [{ account: merchandise_inventory }] }
    misconception: return_as_new_transaction
    feedback: 返品は、元の仕訳の取り消しです。豆を買ったときに左に書いたのは仕入なので、取り消すときは右に仕入を書きます。
  - match: { debit: [{ account: accounts_receivable }] }
    misconception: receivable_payable_confused
    feedback: 売掛金はお客さんから受け取る権利です。問屋に払う義務が減るので、左は買掛金です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも10,000にしましょう。
hint: 左に買掛金10,000、右に仕入10,000です。
success: 仕入が10,000減り、買掛金も10,000減りました。元の取引が一部なかったことになった形です。
```

## 焼き菓子を送る
常連のお客さんから、焼き菓子30,000円分を掛けで注文されました。宅配で送る運賃1,500円はお店が負担する約束で、現金で払っています。
今度の運賃は、仕入れるときではなく、売るときにかかったものです。これは仕入には含めず、「[[shipping_expense|発送費]]」という費用にします。左は[[accounts_receivable|売掛金]] 30,000と発送費1,500、右は売上30,000と現金1,500です。

```task
type: post
transaction: 焼き菓子(商品)30,000円分を掛けで売り、お店が負担する発送の運賃1,500円は現金で支払った
answer:
  debit: [{ account: accounts_receivable, amount: 30000 }, { account: shipping_expense, amount: 1500 }]
  credit: [{ account: sales, amount: 30000 }, { account: cash, amount: 1500 }]
wrong_patterns:
  - match: { debit: [{ account: purchases }] }
    misconception: shipping_in_purchases
    feedback: 売るときの運賃は仕入ではありません。発送費という費用を左に書きます。
  - match: { credit: [{ account: sales, amount: 28500 }] }
    feedback: 売上から運賃を引きません。売上は30,000のまま、運賃は発送費として別に書きます。
  - match: { debit: [{ account: cash, amount: 30000 }] }
    misconception: receivable_is_cash
    feedback: 代金はまだ受け取っていません。左は売掛金30,000です。
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 売掛金と発送費は左、売上と減った現金は右です。
  - match: { unbalanced: true }
    feedback: 左の合計(売掛金 + 発送費)と右の合計(売上 + 現金)がそろっていません。どちらも31,500です。
  - match: { credit: [{ account: shipping_expense }] }
    misconception: debit_means_increase
    feedback: 発送費は費用なので、増えるときは左です。運賃を払って現金は減ったので、現金は右です。左は売掛金と発送費、右は売上と現金になります。
  - match: { debit: [{ account: accounts_receivable, amount: 30000 }], credit: [{ account: sales, amount: 31500 }] }
    misconception: shipping_mixed_into_sale
    feedback: 売上は焼き菓子の代金30,000のままです。運賃は売り上げたお金ではなく払ったお金なので、右は売上30,000と現金1,500の2行に分けます。
  - match: { debit: [{ account: accounts_receivable, amount: 31500 }], credit: [{ account: sales, amount: 30000 }, { account: cash, amount: 1500 }] }
    misconception: shipping_mixed_into_sale
    feedback: 売掛金は焼き菓子の代金30,000のままです。この取引では、運賃はお店が負担するので、お客さんから受け取る金額には入れず、発送費として左に書きます。
  - match: { debit: [{ account: accounts_receivable, amount: 31500 }], credit: [{ account: sales, amount: 31500 }] }
    misconception: shipping_mixed_into_sale
    feedback: 売掛金も売上も、焼き菓子の代金30,000のままです。この取引では、運賃はお店が負担するので、お客さんには請求せず、発送費1,500と現金1,500の行で記録します。
  - match: { debit: [{ account: accounts_receivable, amount: 28500 }] }
    misconception: shipping_mixed_into_sale
    feedback: 売掛金は焼き菓子の代金30,000のままで、運賃の分を引かずに書きます。お店は運賃を現金で払ったので、右に現金1,500の行が要ります。
  - match: { debit: [{ account: accounts_receivable }, { account: shipping_expense }], credit: [{ account: sales }, { account: cash }] }
    feedback: 科目は合っています。金額をもう一度確かめましょう。
  - match: { debit: [{ account: accounts_receivable, amount: 30000 }], credit: [{ account: sales, amount: 30000 }] }
    feedback: 売掛金と売上の30,000は合っています。運賃の支払いも同じ取引なので、左に発送費1,500、右に現金1,500の行が要ります。
  - match: { debit: [{ account: shipping_expense, amount: 1500 }], credit: [{ account: cash, amount: 1500 }] }
    feedback: 発送費1,500と現金1,500は合っています。焼き菓子を掛けで売った分も同じ取引なので、左に売掛金30,000、右に売上30,000の行が要ります。
hint: 左に売掛金30,000と発送費1,500、右に売上30,000と現金1,500です。
success: 売上は30,000のまま、発送費1,500が費用に並びました。同じお店負担の運賃でも、仕入れるときは仕入に含め、売るときは発送費。向きで扱いが変わります。
```

## 返されてきた菓子
送った焼き菓子のうち5,000円分が、割れていたという理由で返されてきました。掛けで売ったので、受け取る金額がその分減ります。
これも返品です。元の仕訳「左に売掛金、右に売上」を左右逆にしてみましょう。

```task
type: post
transaction: 掛けで売った焼き菓子のうち、割れていた5,000円分が返品された
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
  - match: { credit: [{ account: accounts_payable }] }
    misconception: receivable_payable_confused
    feedback: 買掛金は問屋に払う義務です。お客さんから受け取る権利が減るので、右は売掛金です。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも5,000にしましょう。
hint: 左に売上5,000、右に売掛金5,000です。
success: 売上が5,000減り、売掛金も5,000減りました。売りの返品も、買いの返品と同じ「逆仕訳」です。
```

## 今月の仕入はいくら
結果の[[income_statement|損益計算書]]の仕入は、先月までの分も含んだ合計です。今月だけの仕入を数えてみましょう。
運賃込みで仕入れた金額から、返した分を引きます。T勘定の左から右を引く計算です。

```task
type: calc
question: 今月の仕入の金額(運賃を含め、返品を引いた純額)はいくらですか(円)
answer: 42000
wrong_patterns:
  - match: 50000
    misconception: incidental_cost_separate
    feedback: 運賃2,000は仕入に含めます。52,000から返品10,000を引きましょう。
  - match: 52000
    feedback: 返品した10,000分は仕入から引きます。
  - match: 40000
    misconception: incidental_cost_separate
    feedback: 運賃を引いてしまっています。仕入は運賃込みの52,000から、返品10,000を引いた金額です。
  - match: 132000
    feedback: 132,000は結果の損益計算書の仕入で、先月までの90,000を含んだ合計です。今月の分だけを、運賃込みの仕入から返品を引いて求めましょう。
  - match: 62000
    misconception: return_as_new_transaction
    feedback: 返品は元の仕入の取り消しなので、足さずに引きます。
  - match: 122000
    feedback: 結果の損益計算書の仕入は先月までの90,000を含み、返品もすでに引かれた合計です。そこからさらに引かず、今月の運賃込みの仕入から返品を引いて求めましょう。
hint: 52,000 − 10,000。
success: 今月の仕入は42,000円。運賃は足して、返品は引く。これが仕入の純額です。
```

## 運賃と権利を分ける
今月出てきた科目を5つの箱に分けてみましょう。発送費は費用ですが、仕入と同じ箱でも別の科目です。
売掛金と買掛金は先月のとおり、権利は資産、義務は負債です。

```task
type: classify
accounts: [shipping_expense, purchases, accounts_payable, accounts_receivable]
misconceptions:
  purchases:
    asset: purchase_is_asset
  accounts_receivable:
    revenue: receivable_is_cash
    liability: receivable_payable_confused
  accounts_payable:
    expense: expense_as_liability
    asset: receivable_payable_confused
hint: 発送費と仕入は費用、買掛金は負債、売掛金は資産です。
success: 発送費も仕入も費用の箱に入りますが、お店が負担する運賃のうち、仕入に含めるのは仕入れるときの分だけ。売るときの分は発送費として分けます。
```

## ふりかえり
返品は新しい取引ではなく、元の取引の取り消しです。だから元の仕訳を左右逆にした「逆仕訳」で書きます。掛けなら、お金ではなく買掛金や売掛金が減ります。
お店が負担する運賃は、向きで扱いが変わります。仕入れるときの運賃は商品の値段の一部なので仕入に含め、売るときの運賃は発送費という別の費用にします。「商品を手に入れるまでにかかった金額が仕入値」と覚えておくと迷いません。
これで日々の商品売買はひと通り記帳できました。次の単元は決算の日の話です。仕入れた商品のうち売れ残った分をどう扱うか、[[three_account_method|三分法]]の3つ目の科目「[[merchandise_inventory|繰越商品]]」が登場します。
