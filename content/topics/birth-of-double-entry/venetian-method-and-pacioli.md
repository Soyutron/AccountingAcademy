---
id: birth-of-double-entry/venetian-method-and-pacioli
title: ヴェネツィア式とパチョーリ
summary: 1494年、印刷された『スンマ』を手にした商人の孫が、覚え書き・仕訳帳・元帳の3帳簿と、もうけを集める「利益と損失」のページを使い、帳簿を閉じるまでを体験する
level: 1
order: 3
kind: history
introduces: [three_books, profit_and_loss_account]
concepts: [memorandum_book, double_entry, venture_accounting, journal_entry, debit_credit]
requires: [birth-of-double-entry/venture-profit-and-double-entry]
sources:
  - title: ルカ・パチョーリ『スンマ』(1494年、ヴェネツィア)第9部第11論「計算と記録の詳論」
    note: 3帳簿(memoriale / giornale / quaderno)、仕訳の「Per / A」の形、利益と損失(pro e danno)の勘定、帳簿の検算と締め切り。原典はパブリックドメイン。章の番号と「年ごとに閉じる」の記述は執筆の確定時に照合する
  - title: John B. Geijsbeek, Ancient Double-Entry Bookkeeping (1914)
    note: 『スンマ』簿記論の英訳と解説。パブリックドメイン
  - title: Alan Sangster, The Genesis of Double Entry Bookkeeping, The Accounting Review (2016)
    note: 複式簿記の起源が特定の都市の発明ではないこと、パチョーリが記述者であることの根拠
  - title: 福澤諭吉『帳合之法』(1873年)
    note: 日本への伝来。訳語の初出かどうかは確定前に照合する
scenario:
  company: ヴェネツィアの商人バルトロメオ(孫)の店
  era: 1494年11月、ヴェネツィア。印刷された『スンマ』が店に届いた
  currency: ドゥカート
  view: ledger
  accounts:
    - { id: giovanni, name: ジョヴァンニ, element: asset, why: 彼がこちらに負う残高を置く人名勘定です。 }
    - { id: niccolo, name: ニッコロ, element: liability, why: こちらが彼に負う残高を置く人名勘定です。 }
    - { id: cloth_venture, name: 布(フランドル航海), element: asset, why: 航海1口にかかった額と売った額を集める口別の勘定です。 }
    - { id: pepper_voyage, name: 胡椒(アレクサンドリア航海), element: asset, why: 航海1口にかかった額と売った額を集める口別の勘定です。 }
    - { id: profit_and_loss, name: 利益と損失, element: equity, why: 口ごとのもうけと損を1つのページに集め、帳簿を閉じるときに元手へ移します。 }
    - { id: owner_capital, name: 元手, element: equity, why: 商人が店に入れた財産と、そこに積み上がったもうけです。 }
  opening:
    - { account: cash, amount: 390 }
    - { account: pepper_voyage, amount: 10 }
    - { account: owner_capital, amount: 400 }
---

## 印刷された本
1494年11月、ヴェネツィア。店を継いだ孫のバルトロメオのもとに、印刷されたばかりの分厚い本が届きました。ルカ・パチョーリという修道士の数学者が書いた『スンマ』(算術・幾何・比および比例の総覧)です。数学の本ですが、その中の1つの論が「計算と記録」、つまり簿記に当てられています。
パチョーリは[[double_entry|複式簿記]]を発明したのではありません。祖父の代からヴェネツィアの商人たちが使ってきた方法を、順序立てて書き記したのです。それでも、この本には祖父の店に無かった力がありました。印刷です。手で写すしかなかった商人の技が、同じ内容の本として何百部も作られ、イタリアの外へ運ばれていきます。
この単元では、『スンマ』が書いた「ヴェネツィア式」の手順で、1年の終わりに帳簿を閉じるところまでを体験します。右側の元帳には、祖父の時代と同じく胡椒の航海のページがあり、こちらは今年、売り切れずに10ドゥカートの損になっています。

## 3つの帳簿
『スンマ』が最初に書くのは、帳簿を3冊に分けることです。[[three_books|3帳簿]]と呼びましょう。
1冊目は[[memorandum_book|覚え書き]]。起きたことを起きた順に、誰でも書けるように文章で書きます。2冊目は仕訳帳(giornale)。覚え書きの1行を、「Per(借方のページ)// A(貸方のページ)」の形に直して、額を1つ添えます。3冊目は元帳(quaderno)。仕訳帳の1行を、借方のページと貸方のページへ写します。
いまの会計IDEの仕訳帳は、この2冊目そのものです。あなたが前の単元で「左にジョヴァンニ、右に胡椒」と入れた形は、『スンマ』では「Per ジョヴァンニ // A 胡椒」と書かれています。

```figure
type: flow
alt: 覚え書きに文章で書き、仕訳帳で借方と貸方の組に直し、元帳の各ページへ写す。3冊の流れ
nodes: [覚え書き(文章), 仕訳帳(Per // A), 元帳(ページごと)]
highlight: 1
```

## 仕訳帳に書く
フランドルへ送る布20反を、ニッコロから100ドゥカートで買いました。代金は後で払います。仕訳帳で、左に「布(フランドル航海)100」、右に「ニッコロ100」と入れて記帳してみましょう。ニッコロのページは、こちらが彼に負う側の右です。

```task
type: post
transaction: ニッコロから布20反を100ドゥカートで買った。代金は後で払う
answer:
  debit: [{ account: cloth_venture, amount: 100 }]
  credit: [{ account: niccolo, amount: 100 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: credit_purchase_as_claim
    feedback: 買ったので、布の口にかかった額が左です。ニッコロはこちらが彼に負う側なので右です。
  - match: { credit: [{ account: cash }] }
    feedback: 代金はまだ払っていません。いま増えたのは、こちらがニッコロに負う分です。
  - match: { unbalanced: true }
    feedback: 借方と貸方には同じ額を書きます。どちらも100にしましょう。
hint: 「Per 布 // A ニッコロ、100」。Perが左、Aが右です。
success: 記帳できました。元帳では布のページの左と、ニッコロのページの右に100が写っています。
```

## フランドルからの便り
秋、フランドルから便りが来ました。布20反は130ドゥカートで売れ、代金はジョヴァンニが立て替えてこちらに負う形になっています。仕訳帳には「Per ジョヴァンニ // A 布、130」と書かれ、元帳に写されました。

```task
type: observe
entries:
  - { memo: フランドルで布20反が130ドゥカートで売れた。代金はジョヴァンニがこちらに負う, debit: [{ account: giovanni, amount: 130 }], credit: [{ account: cloth_venture, amount: 130 }] }
```

## 布の口のもうけ
布のページは左100、右130です。この口のもうけはいくらでしょう。

```task
type: calc
question: 布(フランドル航海)の口のもうけはいくらか(ドゥカート)
answer: 30
wrong_patterns:
  - match: 130
    misconception: venture_sales_as_profit
    feedback: 130は売れた額です。布にかかった100を引いたものが、この口のもうけです。
  - match: 100
    feedback: 100はかかった額です。売れた130から引きましょう。
hint: 布のページの右の合計から左の合計を引きます。
success: 30ドゥカートです。祖父の時代と同じ口別計算です。
```

## 利益と損失のページ
祖父は口のもうけを、そのまま元手へ移していました。『スンマ』はもう1枚、ページを挟みます。「利益と損失(pro e danno)」のページです。口が閉じるたびに、もうけは右へ、損は左へ、すべてこの1ページに集めます。[[profit_and_loss_account|利益と損失の勘定]]です。
こうすると、今年どの口でいくらもうけ、どの口でいくら損をしたかが、1ページで読めます。あなたが最初の単元で見た[[income_statement|損益計算書]]は、このページの子孫です。
布の口のもうけ30を、利益と損失へ移しましょう。左に「布(フランドル航海)30」、右に「利益と損失30」です。

```task
type: post
transaction: 布の口のもうけ30ドゥカートを利益と損失のページへ移した
answer:
  debit: [{ account: cloth_venture, amount: 30 }]
  credit: [{ account: profit_and_loss, amount: 30 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: closing_side_confused
    feedback: 布のページは右に30残っています。消すには反対の左に30を書き、利益と損失の右へ移します。
  - match: { credit: [{ account: owner_capital }] }
    feedback: 祖父のやり方ならそれで合っています。『スンマ』の手順では、いったん利益と損失のページに集めてから元手へ移します。
  - match: { credit: [{ account: cash }] }
    misconception: profit_is_cash
    feedback: もうけは現金のページには書きません。利益と損失のページに集めます。
  - match: { unbalanced: true }
    feedback: 借方と貸方には同じ額を書きます。どちらも30にしましょう。
hint: 口のもうけは利益と損失の右へ。損なら左へ。
success: 布のページが0になり、利益と損失の右に30が入りました。
```

## 損も同じページへ
胡椒の口は今年、左に10残ったまま売り切れず、損になりました。損は利益と損失のページの左へ集めます。「Per 利益と損失 // A 胡椒、10」と仕訳帳に書き、元帳へ写しました。利益と損失のページは右30、左10で、右に20残っています。

```task
type: observe
entries:
  - { memo: 胡椒の口の損10ドゥカートを利益と損失のページへ移した, debit: [{ account: profit_and_loss, amount: 10 }], credit: [{ account: pepper_voyage, amount: 10 }] }
```

## 帳簿を閉じる
年の終わりです。『スンマ』は、帳簿がいっぱいになったときと、年ごとに、帳簿を閉じることを勧めています。閉じる前に検算をします。元帳のすべてのページの左の合計と右の合計を書き出し、同じになることを確かめる。右側の試算の欄がそれです。
検算が通ったら、利益と損失のページの残り(右30、左10で、右に20)を元手へ移します。これで今年のもうけ20が、商人の財産に積み上がります。左に「利益と損失20」、右に「元手20」です。

```task
type: post
transaction: 今年の利益と損失の残り20ドゥカートを元手へ移した
answer:
  debit: [{ account: profit_and_loss, amount: 20 }]
  credit: [{ account: owner_capital, amount: 20 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: closing_side_confused
    feedback: 利益と損失のページは右に20残っています。消すには反対の左に20を書き、元手の右へ移します。
  - match: { debit: [{ amount: 30 }] }
    feedback: 30は布のもうけだけです。胡椒の損10を引いた20が、今年のもうけです。
  - match: { credit: [{ account: cash }] }
    misconception: profit_is_cash
    feedback: もうけを元手に移しても、現金は動きません。現金は代金を受け取ったときに、すでに動いています。
  - match: { unbalanced: true }
    feedback: 借方と貸方には同じ額を書きます。どちらも20にしましょう。
hint: 右に残った20を左に書いて消し、同じ20を元手の右に書きます。
success: 元手が420になりました。人のページと残った品のページは、新しい帳簿の最初の行に写して、来年に持ち越します。
```

## 広まる
『スンマ』のあと、16世紀のうちにアントウェルペン、ロンドン、ニュルンベルクなどで、それぞれの言葉で書かれた簿記の本が出ました。商人の技は印刷とともに国境を越え、「ヴェネツィア式」と呼ばれながら広まっていきます。日本に届くのは1873年、『帳合之法』が西洋の簿記を紹介したときです。
それでも、この帳簿にはまだ無いものがあります。「今年のもうけ」は、今年閉じた口の分だけです。2年がかりの航海は、来年閉じるまで利益にも損にもなりません。船そのものを買ったら、どの口にかかった額にするかも決まっていません。『スンマ』は帳簿を年ごとに閉じることを勧めましたが、年ごとに利益を「決める」規則までは書いていないのです。

## ふりかえり
『スンマ』のヴェネツィア式は、覚え書き・仕訳帳・元帳の3帳簿、Per // Aの形の仕訳、口ごとのもうけを集める利益と損失のページ、検算してから帳簿を閉じる手順でできていました。いまの仕訳帳は2冊目の仕訳帳、いまの損益計算書は利益と損失のページの子孫です。
パチョーリは発明者ではなく記述者で、印刷がこの方法を広めました。複式簿記そのものは、彼より1世紀以上前の商人たちの帳簿に残っています。
次の時代は、商いの1口ではなく「年」でもうけを決めなければならなくなった人たちの話です。何年も使う船や機械を買った会社が、株主に配当を払うために、減価償却を生み出します。
