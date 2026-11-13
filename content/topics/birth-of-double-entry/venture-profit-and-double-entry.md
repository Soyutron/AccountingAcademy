---
id: birth-of-double-entry/venture-profit-and-double-entry
title: 航海の儲けと複式の発見
summary: 1386年、胡椒の航海1口のもうけを知るために商品ごとのページを作り、写し忘れに悩んだ末に、1つの出来事を2つのページへ同じ額で書く複式の記録にたどり着く
level: 1
order: 2
kind: history
introduces: [venture_accounting, double_entry]
concepts: [memorandum_book, personal_account, debit_credit, journal_entry]
requires: [birth-of-double-entry/memorandum-and-personal-accounts]
sources:
  - title: ルカ・パチョーリ『スンマ』(1494年)第9部第11論
    note: 商品ごとの勘定、利益の元手への振り替え、左右の合計の一致による検算。原典はパブリックドメイン
  - title: John B. Geijsbeek, Ancient Double-Entry Bookkeeping (1914)
    note: 『スンマ』簿記論の英訳と解説。パブリックドメイン
  - title: 渡邉泉『会計の歴史探訪』(同文舘出版)
    note: 口別計算から期間計算への流れ。記述の照合用で、文章は転記しない
scenario:
  company: ヴェネツィアの商人バルトロメオの店
  era: 1386年春、ヴェネツィア。アレクサンドリアからの船が戻った
  currency: ドゥカート
  view: ledger
  accounts:
    - { id: giovanni, name: ジョヴァンニ, element: asset, why: 彼がこちらに負う残高を置く人名勘定です。 }
    - { id: matteo, name: マッテオ, element: asset, why: 彼がこちらに負う残高を置く人名勘定です。 }
    - { id: pepper_voyage, name: 胡椒(アレクサンドリア航海), element: asset, why: 航海1口にかかった額と売った額を集め、差がもうけになる口別の勘定です。 }
    - { id: wine_voyage, name: ワイン(クレタ航海), element: asset, why: 航海1口にかかった額と売った額を集め、差がもうけになる口別の勘定です。 }
    - { id: owner_capital, name: 元手, element: equity, why: 商人が店に入れた財産と、そこに積み上がったもうけです。 }
  opening:
    - { account: cash, amount: 300 }
    - { account: owner_capital, amount: 300 }
---

## 胡椒の商いでいくらもうかった?
1386年の春、アレクサンドリアから船が戻りました。バルトロメオは胡椒50袋を120ドゥカートで買い付け、運賃に20、関税に10を払っています。胡椒はジョヴァンニに20袋を60で、さらに10袋を30で、マッテオに20袋を90で売れました。
バルトロメオが聞きます。「で、胡椒の商いはいくらもうかった?」
[[personal_account|人名勘定]]を見ても、ジョヴァンニとマッテオがいくら負っているかしか分かりません。[[memorandum_book|覚え書き]]に戻れば行は拾えますが、胡椒のことだけをまとめたページはどこにもないのです。

## 航海1口のページ
商人たちは、人だけでなく商いの1口ごとにもページを作りました。航海1回分の胡椒のページを開き、左にその航海にかかった額を、右に売った額を書きます。左右の差が、その1口のもうけです。この数え方を[[venture_accounting|口別計算]]と呼びます。

| 胡椒(アレクサンドリア航海)にかかった | ドゥカート | 売った | ドゥカート |
|---|---|---|---|
| 胡椒50袋を買った | 120 | ジョヴァンニに20袋 | 60 |
| 運賃 | 20 | ジョヴァンニに10袋 | 30 |
| 関税 | 10 | マッテオに20袋 | 90 |

```task
type: calc
question: この航海の胡椒で、いくらもうかったか(ドゥカート)
answer: 30
wrong_patterns:
  - match: 180
    misconception: venture_sales_as_profit
    feedback: 180は売った額の合計です。胡椒を買い、運び、関税を払った分を引かないと、もうけにはなりません。
  - match: 60
    misconception: incidental_cost_separate
    feedback: 胡椒の代金120だけを引いています。運賃20と関税10も、この航海の胡椒を売るためにかかった額なので、左に入れて引きます。
  - match: 150
    feedback: 150はかかった額の合計です。売った額180から引きましょう。
hint: 右の合計(売った額)から左の合計(かかった額)を引きます。運賃と関税も左です。
success: 30ドゥカートです。航海1口が終わるたびに、その口のもうけが1つの数字で出ます。
```

## 写し忘れ
ところで、このページはあなたが覚え書きから写したものです。もし「マッテオに20袋 90」をマッテオのページには写したのに、胡椒のページに写し忘れていたら、どうなるでしょう。胡椒のページの右は90だけになり、この航海は60の損に見えます。ページは何も教えてくれません。
商人たちが見つけた工夫はこうです。1つの出来事を、必ず2つのページに、同じ額で、片方は左、片方は右に書く。「マッテオに胡椒20袋を90で売った」なら、マッテオのページの左に90(彼がこちらに負う)、胡椒のページの右に90(売った)。すべての出来事をこう書けば、帳簿中のページの左の合計と右の合計は必ず同じになります。合わなければ、どこかに写し忘れか写し間違いがあると分かるのです。
これが[[double_entry|複式簿記]]です。左に書くページを[[debit_credit|借方]]、右に書くページを貸方と呼び、1つの出来事を借方と貸方の組で書いた記録が[[journal_entry|仕訳]]です。前の単元で「商人たちがこれからたどり着くもの」と言った左右2列の記録が、右側に現れました。

```figure
type: flow
alt: 覚え書きの1行が、人名勘定の左と商品のページの右という2つのページに同じ額で写され、全ページの左右の合計が一致する
nodes: [覚え書きの1行, 2つのページに同じ額(左と右), 全ページの左の合計 = 右の合計]
highlight: 1
```

## 2つのページに書く
ジョヴァンニに胡椒20袋を60ドゥカートで売り、代金は後で受け取ります。仕訳帳で、左に「ジョヴァンニ60」、右に「胡椒(アレクサンドリア航海)60」と入れて記帳してみましょう。

```task
type: post
transaction: ジョヴァンニに胡椒20袋を60ドゥカートで売った。代金は後で受け取る
answer:
  debit: [{ account: giovanni, amount: 60 }]
  credit: [{ account: pepper_voyage, amount: 60 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: personal_account_by_cash_direction
    feedback: 胡椒がジョヴァンニの手に渡ったからといって、彼のページが右にはなりません。売ったので彼がこちらに負い、彼のページは左、胡椒のページは売った側の右です。
  - match: { debit: [{ account: cash }] }
    feedback: 代金はまだ受け取っていません。いま増えたのは、ジョヴァンニがこちらに負う分です。
  - match: { unbalanced: true }
    feedback: 2つのページには同じ額を書きます。どちらも60にしましょう。
hint: 人名勘定の左は「彼がこちらに負う」、商品のページの右は「売った」です。
success: 記帳できました。右側の元帳で、ジョヴァンニのページの左と胡椒のページの右に、同じ60が入っています。
```

## 航海の残りを写す
航海の残りの出来事も、同じ形で写しました。胡椒を買った120と運賃20と関税10は胡椒のページの左と現金の右、ジョヴァンニへの10袋とマッテオへの20袋は人名勘定の左と胡椒の右です。
右側の試算の欄を見てください。すべてのページの左の合計と右の合計が、同じ数になっています。これが複式の検算です。

```task
type: observe
entries:
  - { memo: 胡椒50袋を120ドゥカートで買った, debit: [{ account: pepper_voyage, amount: 120 }], credit: [{ account: cash, amount: 120 }] }
  - { memo: 運賃20ドゥカートを払った, debit: [{ account: pepper_voyage, amount: 20 }], credit: [{ account: cash, amount: 20 }] }
  - { memo: 関税10ドゥカートを払った, debit: [{ account: pepper_voyage, amount: 10 }], credit: [{ account: cash, amount: 10 }] }
  - { memo: ジョヴァンニに胡椒10袋を30ドゥカートで売った, debit: [{ account: giovanni, amount: 30 }], credit: [{ account: pepper_voyage, amount: 30 }] }
  - { memo: マッテオに胡椒20袋を90ドゥカートで売った, debit: [{ account: matteo, amount: 90 }], credit: [{ account: pepper_voyage, amount: 90 }] }
```

## 写し忘れを見つける
次はクレタ島からのワインの航海です。見習いのあなたが写した5件のうち、1件を片方のページにしか写していません。試算の左右が合わないので、どこかにあるはずです。写し忘れた行を見つけて、足りない側を書き足しましょう。

```task
type: debug
entries:
  - { memo: ワイン10樽を80ドゥカートで買った, debit: [{ account: wine_voyage, amount: 80 }], credit: [{ account: cash, amount: 80 }] }
  - { memo: 運賃10ドゥカートを払った, debit: [{ account: wine_voyage, amount: 10 }], credit: [{ account: cash, amount: 10 }] }
  - { memo: ジョヴァンニにワイン5樽を50ドゥカートで売った, debit: [{ account: giovanni, amount: 50 }], credit: [] }
  - { memo: マッテオにワイン5樽を45ドゥカートで売った, debit: [{ account: matteo, amount: 45 }], credit: [{ account: wine_voyage, amount: 45 }] }
  - { memo: マッテオから45ドゥカートを受け取った, debit: [{ account: cash, amount: 45 }], credit: [{ account: matteo, amount: 45 }] }
answer:
  index: 2
  entry:
    debit: [{ account: giovanni, amount: 50 }]
    credit: [{ account: wine_voyage, amount: 50 }]
wrong_patterns:
  - match: { index: 4 }
    feedback: この行は現金の左とマッテオの右に同じ45があり、両側そろっています。
  - match: { index: 0 }
    feedback: この行はワインの左と現金の右に同じ80があり、両側そろっています。
hint: 左右の差はいくつでしょう。その額が片側にしか無い行を探します。
success: 見つけました。ジョヴァンニの左に50を書いたのに、ワインのページの右が空でした。右に50を足すと、試算の左右がそろいます。
```

## もうけを元手に移す
胡椒の航海は終わりました。胡椒のページは左150、右180で、右に30残っています。これがこの口のもうけです。航海が終わった口のページは閉じて、もうけを元手のページへ移します。左に「胡椒(アレクサンドリア航海)30」、右に「元手30」です。

```task
type: post
transaction: 胡椒の航海のもうけ30ドゥカートを元手に移した
answer:
  debit: [{ account: pepper_voyage, amount: 30 }]
  credit: [{ account: owner_capital, amount: 30 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: closing_side_confused
    feedback: 胡椒のページは右に30残っています。それを消すには反対の左に30を書き、相手の元手は右です。
  - match: { credit: [{ account: cash }] }
    misconception: profit_is_cash
    feedback: もうけは現金のページには書きません。現金は売った代金を受け取ったときに、すでに動いています。もうけが積み上がるのは元手です。
  - match: { debit: [{ amount: 180 }] }
    misconception: venture_sales_as_profit
    feedback: 180は売った額です。もうけは、かかった150を引いた30です。
  - match: { unbalanced: true }
    feedback: 2つのページには同じ額を書きます。どちらも30にしましょう。
hint: 右に残った30を左に書いて消し、同じ30を元手の右に書きます。
success: 胡椒のページが0になり、元手が330に増えました。商人の財産がいくら増えたかが、初めて1つの数字で見えています。
```

## まだ無いもの
複式の記録で、写し忘れは見つかるようになり、1口のもうけは元手に積み上がるようになりました。それでも、答えられない問いが残ります。
「今年はいくらもうかった?」 口別計算では、航海が終わるまでもうけは出ません。2年がかりの航海なら、1年目のもうけは無いことになります。船そのものを買って10年使うなら、その代金はどの口にかかった額でしょうか。この問いに答えるには、商いの1口ではなく「期間」で区切る考え方が要ります。それは何百年も先、鉄道会社の時代に形になります。

## ふりかえり
商品のページで航海1口のもうけを数えるのが口別計算、1つの出来事を2つのページへ同じ額で書くのが複式簿記でした。複式の記録では全ページの左右の合計が一致し、合わなければ写し忘れがあると分かります。前の単元で「左と右の呼び名」と言った借方・貸方は、どのページの左に書き、どのページの右に書くかを決める言葉になりました。
いまの簿記の仕訳は、この「2つのページに同じ額」をそのまま受け継いでいます。いまの簿記で商品のもうけを1年ごとに数える仕方は、あとの単元「売上原価」で学びます。口別と期間、同じもうけを別の区切りで数えています。
次の単元では、100年あとの1494年に飛び、この方法が印刷された本になって広まる場面を見ます。
