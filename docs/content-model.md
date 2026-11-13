# コンテンツモデル(v0.4)

更新日: 2026-11-07
状態: 草案。フェーズ3のプロトタイプで検証して固める。ADR 0002の決定を具体化したもの。

## 1. 構造

```
分野 (Domain)
 └ テーマ (Topic)            例: 減価償却
    └ 単元 (Unit)            例: 減価償却とは何か(深さ1) / 定額法(深さ2) / 定率法・生産高比例法(深さ3) / 減損との関係(深さ4)
       ├ 解説 (Markdown)
       ├ 演習 (Exercise) × n
       └ 扱う概念 (Concept) への参照

概念 (Concept)                例: 費用配分の原則、取得原価、減価償却累計額
 └ 関係: requires(前提) / related(関連) / contrasts(対比)

勘定科目 (Account)            例: 減価償却費 → 費用、減価償却累計額 → 資産(評価勘定)
 └ 要素・増加側・なぜその要素か・関連概念

学習パス (Path)               例: 簿記 3 級合格パス
 └ セクション → 単元の順序付き参照 + 試験固有情報

誤解 (Misconception)          例: 「借方 = 増加」と覚えている
 └ 何を誤解しているか / 正しい理解 / 解きほぐす概念・単元。演習の誤答パターンから参照される
```

### 1.1 分野(当面の案)
簿記の構造 / 資産 / 負債・純資産 / 収益・費用 / 決算 / 原価計算 / 連結・企業結合 / 税務会計 / 会計制度と理論。
試験範囲の外に、会計の歴史(`history`)と不正会計(`forensics`)を置く(ADR 0009、7章)。
分野はナビゲーション用の分類であり、知識の正本はテーマ以下。

### 1.2 深さ(level)
| level | 名称 | 目安 |
|---|---|---|
| 1 | 入門 | 概念の存在理由と基本的な処理。3級で初めて触れる範囲 |
| 2 | 基礎 | 標準的な処理と計算。3級〜2級 |
| 3 | 応用 | 複数の方法、例外、他テーマとの組み合わせ。2級〜1級 |
| 4 | 専門 | 会計基準・理論的背景・実務上の論点。1級・会計士・税理士・実務 |

深さは試験の級と一致させない。級との対応はパスで決める。

### 1.3 用語(専門用語の扱い)
専門用語は独立した型を作らず、**概念(Concept)と勘定科目(Account)がそのまま用語集の項目**になる。
「用語」とは本文中で`[[id]]`と書かれた概念または勘定科目への参照のこと。
概念と勘定科目が同じIDを持つもの(小口現金、当座預金など)は同じ用語とみなし、用語集では1項目にまとめる(概念の説明に勘定科目の要素を足す。名前が違えばビルドで拒否)。

段階的な理解のため、概念は3段階の説明を持つ。
| 段階 | フィールド | 長さ | 表示場所 |
|---|---|---|---|
| 1 | `short` | 一文 | ホバー / タップのポップオーバー |
| 2 | `summary` + `example` | 数文 + 具体例1つ | ポップオーバーの「もっと見る」、用語集の項目 |
| 3 | 単元本文 | 制限なし | その概念を`introduces`する単元へのリンク |

初出時の説明は本文で行う(ポップオーバーに頼らない)。単元のfrontmatterに`introduces`(この単元で初めて説明する概念)を書き、
本文で`[[id]]`として使う概念は、その単元の`introduces`か、`requires`で辿れる前提単元の`introduces`に含まれていなければならない(ビルドで検査)。
これにより「説明していない用語を使う」ことを機械的に防ぐ。
概念・勘定科目の`short`と誤解の説明(`correct`)は、最初にその概念を`introduces`する単元の読者が読める語で書く(その単元で未定義の用語を使わない)。

### 1.4 単元の構造(ステップ型)
単元は1つの小さな会社の物語で、`## 見出し`ごとのステップに分かれる(docs/ide-design.md 4章)。
`scenario`の残高と時系列の継続は同じテーマ内に限る。テーマをまたぐときは、前の単元の続きと読まれないよう冒頭で時点を示す(「少し時間を戻して」など)。
各ステップ = 短い説明(Markdown)+ 任意の```taskブロック(YAML)。taskが無いステップはobserve(読むだけ)。

````markdown
---
id: bookkeeping-basics/five-elements
title: 5つの要素と仕訳
summary: カフェを開業しながら、お金の動きを5つの箱に分けて記録する方法を身につける
level: 1
order: 1
introduces: [transaction, five_elements, asset, ...]
concepts: []
requires: []
scenario:
  company: カフェ「マメノキ」
  opening: []                       # 開始時の残高。空なら白紙から始める
---

## カフェを開く
あなたは今日、小さなカフェを開きます。元手は貯金の1,000,000円。
これから1か月の出来事を、右側の帳簿に記録していきましょう。

## 元手を会社に入れる
貯金の1,000,000円を会社の現金にしました。
左に「現金1,000,000」、右に「資本金1,000,000」と入れて、記帳してみましょう。

```task
type: post
transaction: 元手として現金1,000,000円を出資した
answer:
  debit: [{ account: cash, amount: 1000000 }]
  credit: [{ account: capital_stock, amount: 1000000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 現金は左(借方)で増えます。入れ替えてみましょう。
hint: 現金が増えるので左、その元手である資本金が右です。
success: 結果の貸借対照表に、現金と資本金が同時に現れました。
```

## ふりかえり
...(学んだこと、つながり、次の単元)
````

ルール(ビルドで検査):
- ステップは4つ以上。最初のステップはobserve(導入)、最後の見出しに「ふりかえり」を含める。postかpredictが1つ以上。
- 要件1章の5つの観点(何を / なぜ / 原理 / 処理 / つながり)は節ではなく流れに埋め込む。導入が「何を・なぜ」、操作ステップが「原理・処理」、ふりかえりが「つながり」。
- `introduces`の概念は説明文で`[[id]]`として使い、操作の直後に名前を付ける書き方にする(「左側を[[debit_credit|借方]]と呼びます」)。

## 2. ステップの課題の種類

四択は使わない。種類と狙いはdocs/ide-design.md 3章。taskブロックの形:

| type | 必須項目 | 確認 |
|---|---|---|
| observe | `entries`(自動で記帳する仕訳。省略可) | なし |
| post | `transaction`、`answer`(仕訳)、`alternatives`、`wrong_patterns`(swapped / unbalanced / debit / credit)、`hint`、`success` | 仕訳の一致(行順不同)。不一致なら誤答パターンで誤解を判定(swappedは金額を問わず科目の左右が逆なら当たる。行パターンは、正解にもパターンにも無い行がその側にあると当たらない) |
| predict | `transaction`、`entry`(確認後に記帳される仕訳)、`answer`(5要素のincrease / decrease / none)、`elements`(問う要素。省略すれば5要素すべて。まだ定義していない要素を問わないために絞る)、`wrong_patterns`(部分一致。`elements`で問う要素だけ) | 予想と答えの一致。外れても実際の動きを見せて進める。一致した誤答パターンはすべて説明する |
| tweak | `formula`(straight_line)、`params`(id / label / value / min / max / step / unit)、`goal`(output / equals / label)。straight_lineの当期分と期末の帳簿価額は`months`をparamsに含めたときだけ出る | 式の出力が目標値と一致 |
| classify | `accounts`(科目IDの配列)か、`labels`(箱のID → 表示名)と`items`(項目のID・表示・正解の箱。7.2)。`misconceptions`(項目 → 間違えた箱 → 誤解ID) | 全項目が正しい箱 |
| calc | `question`、`answer`、`wrong_patterns`(値) | 値の一致 |

採点は`{correct, misconception?, feedback}`を返す。postの不正解では、学習者の仕訳の影響と期待される影響を5要素で並べて見せる。

## 3. 記述形式

content as code。ディレクトリは技術選定後に確定するが、ファイル形式は次の通り。

```
content/
  accounts.yaml                 勘定科目マスタ
  misconceptions.yaml           よくある誤解
  concepts/<domain>.yaml        概念と関係(分野ごとに1ファイル)
  topics/<topic-id>/
    topic.yaml                  テーマのメタデータ
    <unit-id>.md                単元(frontmatter + ステップ。課題は```taskブロック)
  paths/<path-id>.yaml          学習パス
```

### 3.1 勘定科目マスタ(accounts.yaml)
```yaml
- id: depreciation_expense
  name: 減価償却費
  short: 固定資産の購入代金のうち、今年の分として費用にした金額
  element: expense            # asset | liability | equity | revenue | expense
  why: 固定資産の取得原価のうち当期の使用によって消費された部分を費用として認識するためです。   # 文として閉じる。誤答説明と「費用に分類する理由:」に続けて出す
  example: 100万円のトラックを5年使うなら、1年目の減価償却費は20万円。   # 用語集・ポップオーバーの「例:」
  concepts: [cost_allocation]
- id: accumulated_depreciation
  name: 減価償却累計額
  aliases: [建物減価償却累計額, 備品減価償却累計額, 車両運搬具減価償却累計額]
  reading: [げんかしょうきゃくるいけいがく]   # ひらがなの読み。科目欄の候補検索と用語集の検索で引く(別名とは分ける)
  element: asset
  contra: true                # 評価勘定。資産の控除項目で、増加は貸方
  why: 固定資産の帳簿価額を直接減らさず、取得原価と減価の累計を別々に見せるためです。
  concepts: [cost_allocation, contra_account]
- id: cash_over_and_short
  name: 現金過不足
  element: asset              # 仮勘定でも、残高をふだん置く側を書く
  temporary: true             # 仮勘定。決算の財務諸表に載せられず、必ず本来の科目へ振り替える科目だけに付ける(仮払金・仮受金は資産・負債のまま)
  why: 原因が分かるまで現金の差額を置いておく仮の科目(仮勘定)で、資産でも負債でもないからです。
```
仮勘定の残高が`element`と逆の側に出たとき(現金過不足の貸方残)、結果の貸借対照表は△を付けずに逆側の部(負債の部)へ正の金額で並べ、科目名に「(仮)」を付ける。用語集とポップオーバーのバッジは要素ではなく「仮勘定」と出す。5要素への影響(`computeImpact`)は`element`の側で数える。

### 3.2 概念(concepts/assets.yaml)
```yaml
- id: cost_allocation
  name: 費用配分の原則
  aliases: [費用配分]                  # 別名(表記の揺れ)。用語集の検索で引く(読みとは分ける)
  reading: [ひようはいぶんのげんそく]   # ひらがなの読み。用語集の検索で引く
  short: 長く使うものの購入代金を、使う期間に分けて費用にする考え方
  summary: 資産の取得原価を、その資産が使われる期間にわたって費用として配分する考え方。収益と費用を同じ期間に対応させるためにある。
  example: 100万円のトラックを5年使うなら、買った年に100万円の費用にするのではなく、毎年20万円ずつ費用にする。
  requires: [accrual_basis, five_elements]
  related: [depreciation, amortization]
- id: depreciation
  name: 減価償却
  short: 建物や備品などの購入代金を、使える年数に分けて毎年少しずつ費用にすること
  summary: 有形固定資産の取得原価を耐用年数にわたって費用配分する手続き。費用配分の原則を固定資産に適用したもの。
  example: 耐用年数10年の建物1,000万円を、毎年100万円ずつ減価償却費にする。
  requires: [cost_allocation, tangible_fixed_assets]
  contrasts: [impairment]
```

### 3.3 単元
1.4の通り。`*.exercises.yaml`は廃止し、課題はステップの```taskブロックに書く。

### 3.4 仕訳・図解ブロックと用語参照
```figureブロック(YAML)は図解(docs/visual-guidelines.md 5章)。`alt`必須、1ステップに1つまで。YAMLなので「50,000」のようにカンマを含む文字列は引用符で囲む(`["豆の代金50,000", ...]`)。

説明文中の```journalブロックは読み取り専用の仕訳エディタ(影響表示つき)として描画する。
`[[id]]` / `[[id|表示語]]`は用語参照。`[[id]]`だけのときは用語の名前が表示される。表(`|`区切り)の中では`[[id]]`の形だけを使う(ビルドで検査)。

### 3.5 誤解(misconceptions.yaml)
```yaml
- id: debit_means_increase
  name: 借方は常に増加
  description: 「借方 = 増える、貸方 = 減る」と覚えている。資産と費用では正しいが、負債・純資産・収益では逆になる
  correct: 増減の側は要素によって決まる。資産・費用は借方で増え、負債・純資産・収益は貸方で増える
  concepts: [five_elements, debit_credit]
  remediation: bookkeeping-basics/five-elements      # 立ち止まりで案内する単元
- id: no_cost_allocation
  name: 購入時に全額費用
  description: 長く使う資産の購入額を、買った期の費用に全額計上する
  correct: 使う期間にわたって費用を配分する(費用配分の原則)
  concepts: [cost_allocation, depreciation]
  remediation: depreciation/what-is-depreciation
```

演習側の記述例(journal):
```yaml
- type: journal
  prompt: ...
  answer: { debit: [{account: depreciation_expense, amount: 100000}], credit: [{account: accumulated_depreciation, amount: 100000}] }
  wrong_patterns:
    - match: { swapped: true }
      misconception: debit_means_increase
      feedback: 費用は借方で増えます。減価償却費は費用なので借方です。
    - match: { debit: [{amount: 1000000}] }
      misconception: no_cost_allocation
      feedback: 建物は10年使うので、1年分だけを費用にします。
```

### 3.6 学習パス(paths/boki-3.yaml)
```yaml
id: boki-3
title: 簿記3級合格パス
exam:
  name: 日商簿記検定3級
  format: ネット試験(CBT)または統一試験。60分、3題以内、商業簿記のみ、70点以上で合格
  source: https://www.kentei.ne.jp/bookkeeping
sections:
  - title: 簿記の仕組み
    units: [bookkeeping-basics/five-elements, bookkeeping-basics/journal-and-ledger, bookkeeping-basics/trial-balance]
  - title: 商品売買
    units: [merchandise/three-account-method, merchandise/returns-and-costs, ...]
  - title: 固定資産
    units: [fixed-assets/acquisition, depreciation/what-is-depreciation, depreciation/straight-line, fixed-assets/disposal]
```

## 4. ビルド時の検査
- 単元・パス・演習が参照する概念ID、単元ID、勘定科目IDがすべて存在する。
- 単元の`requires`と概念の`requires`に循環がない。
- パス内の単元は、その`requires`がパス内で先に出現する(出現しない場合は警告)。
- journal演習の借方合計と貸方合計が一致する。
- ステップの説明文の`[[id]]`が参照する概念・勘定科目が、その単元の`introduces`か、`requires`を辿った前提単元の`introduces`に含まれる(未説明の用語の使用を防ぐ)。
- ステップ数、最初のobserve、最後の「ふりかえり」、post / predictの存在、taskの各項目(仕訳の貸借一致、科目・誤解の存在、tweakの式とパラメータ)。
- `introduces`に挙げた概念が本文で少なくとも1回`[[id]]`として使われている。
- すべての概念に`short` / `summary` / `example`がある。
- 誤答パターンの`misconception`が`misconceptions.yaml`に存在し、誤解の`remediation`が実在する単元を指す。
- journalの誤答パターンが正解と一致しない(正解を誤答として登録していない)。

## 5. 用語集
- 項目 = すべての概念 + 勘定科目。ビルド時に生成する(別データを持たない)。
- 各項目: short、summary、example、要素(勘定科目のみ)、前提・関連・対比、`introduces`している単元へのリンク、登場する単元の一覧。
- 検索: 日本語の部分一致(名前、別名、short)。クライアント側で完結させる。
- 絞り込み: 「学習済みの単元で登場した用語」(進捗レコードから算出)で復習用に絞れる。

## 6. 学習者の回答と進捗
Supabaseの`unit_progress` / `attempts`に保存する(architecture.md 4章)。学習者IDはSupabase AuthのユーザーIDで、匿名でも本登録でも同じ。
課題IDは`<unit-id>#<ステップ番号(0始まり)>`。`unit_progress.step`に最後に到達したステップを持ち、途中から再開する。回答そのものと検出した誤解ID、コンテンツのコミットを残し、誤答パターンの改善に使う。

## 7. MVPのコンテンツ量(見積)
- 3級範囲: 約12テーマ、深さ1〜2の単元40〜50、演習250前後。
- 深掘り対象(減価償却、貸倒引当金、商品売買)に深さ3の単元を各2〜3追加。
- 勘定科目マスタ: 3級範囲で約60科目、深掘り分を含めて約80。
- 概念: 100〜150。

## 8. 会計IDE化で分かったこと(2026-11-07)
- 3単元(28ステップ)をステップ型で書き直し、E2E(`e2e/learning-loop.spec.ts`)がコンテンツを読んで全ステップを自動で解き切る。コンテンツを増やしても同じテストで検証できる。
- `scenario.opening`は正の残高しか表せず、評価勘定(減価償却累計額)を開始残高に置けない。複数年のシナリオでは「期を締める」(収益・費用を繰越利益剰余金へ振り替える)機能も要る。2級範囲に入る前に対応する。
- 誤りの視覚化(あなたの仕訳の影響vs期待される影響)と、予想と実際の比較は、仕訳エディタの影響計算をそのまま流用できた。

## 9. 縦スライスで検証したこと(2026-11-07、IDE化前)
- 3単元(5要素と仕訳 / 減価償却とは何か / 定額法)をこの形式で書けた。`introduces`と`requires`による「未説明の用語」の検査は機能し、執筆時に実際にエラーを出して直した。
- 仕訳を伴わない単元(伝票・補助簿)での5節テンプレートの妥当性は未検証(該当単元を書く時に確認)。
- 仕訳エディタの影響表示は本文の仕訳例にも演習にも同じものを使う。「純資産」は当期純利益を含む定義で表示し、演習の問い方と揃えた。
- 表(`|`区切り)の中では`[[id|表示語]]`が使えないことが分かり、検査を追加した(3.3)。
- 用語ポップオーバーはPCのホバーとスマートフォンのタップの両方で動く。本文の用語リンクの多さ(初出のみ強調するか)と、`effect` / `statement`が「理解した感」を与えるかは、β のテスターで確かめる。
- 概念マップはまだ作っていない。テーマ単位で足りるかは実装時に判断する。

## 7. 試験範囲外の単元(歴史・不正会計)
ADR 0009で決めた。分野`history`(時代ごとのテーマ)と`forensics`(手口ごとのテーマ)に置き、パスは目的別パスとして持つ。知識の正本がテーマ軸であることは変わらない。

### 7.1 単元のfrontmatterに足す項目
```yaml
kind: history            # lesson(既定)| history | forensics
sources:                 # kindがhistory / forensicsでは必須。深さ3〜4でも必須にする(ビジョン7.1)
  - title: ルカ・パチョーリ『スンマ』(1494年)第9部第11論
    note: 覚え書き・仕訳帳・元帳の3帳簿。原典はパブリックドメイン
scenario:
  company: ヴェネツィアの商人バルトロメオの店
  era: 1385年3月、ヴェネツィア     # 時代と舞台。ガイドの冒頭と帳簿ペインの見出しに出す
  currency: ドゥカート              # 金額の単位。既定は円。表示と入力の解釈(「円」の除去など)をこの単位に寄せる
  view: none                       # 帳簿ペインの段階。none | ledger | statements(既定)。docs/ide-design.md 11章
  accounts:                        # この単元だけで使う勘定科目(人名勘定、航海ごとの商品勘定)。全体マスタには載せない
    - { id: giovanni, name: ジョヴァンニ, element: asset, why: 相手がこちらに負う残高を置く人名勘定です。 }
  opening: []
```

### 7.2 課題の条件
- `kind: lesson`は従来どおり、postかpredictが1つ以上。
- `kind: history` / `forensics`は、種類を問わずtaskが1つ以上。読み物だけの単元は作れない。
- classifyは箱を任意にできる。`accounts`の代わりに`labels`(箱のIDと表示名)と`items`(並べる項目のID・表示・正解の箱)を書く。`misconceptions`は`項目 → 間違えた箱 → 誤解ID`。`accounts`を書いた従来の形は、箱を5要素とみなす。
- debug(バグ探し。M3)は、`entries`(記帳済みの仕訳。1件だけ誤りがあり、片側が空でもよい)の中から誤りの行を指し、直す課題。`answer`は`index`(0始まり)と`entry`(直した仕訳)。`wrong_patterns`の`match`は`{ index }`。学習者が行を選び、仕訳を直して確認すると、試算の左右がそろう。原稿の例は`birth-of-double-entry/venture-profit-and-double-entry`の「写し忘れを見つける」。
- observeの`entries`は`scenario.accounts`の科目も使える。historyの単元では、現代の科目(`cash`など)と単元限定の科目を混ぜてよい。

### 7.3 パスのfrontmatter
`exam`を任意にし、試験に紐づかないパスは`era`(時代順の説明)を持てる。`exam`と`era`の両方を省いたパスは拒否する。

### 7.4 執筆とレビューのルール
- 史実は著作物ではないが、通史や解説書の文章は転記しない(ADR 0007)。一次資料がパブリックドメインなら引用できる。
- 年号・人名・帳簿名は、`sources`に挙げた一次資料か通史で照合する。「ヴェネツィアで複式簿記が発明された」のような通説の誤りを書かない。
- 不正会計で実在企業を扱う単元は、第三者委員会の調査報告書など公開資料を`sources`に持ち、報告書が認定した事実と単元の推測を本文で分ける。初期は架空の事例だけにする。
- 歴史パスの最初の節は`bookkeeping-basics/five-elements`。歴史単元は現代の5要素と借方・貸方を前提にしてよく、複式簿記を教え直さない。

### 7.5 ビルド検査に足すもの
- `kind`ごとのtaskの条件(7.2)。
- `kind`が`history` / `forensics`、または`level`が3以上の単元に`sources`がある。
- `scenario.accounts`のIDが全体マスタと重ならず、その単元のtaskと`opening`からだけ参照される。
- labels付きclassifyの`items`の`answer`が`labels`に存在し、`misconceptions`のキーが`items`と`labels`に存在する。
