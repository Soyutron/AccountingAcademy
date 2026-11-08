# コンテンツモデル(v0.4)

更新日: 2026-11-07
状態: 草案。フェーズ 3 のプロトタイプで検証して固める。ADR 0002 の決定を具体化したもの。

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
分野はナビゲーション用の分類であり、知識の正本はテーマ以下。

### 1.2 深さ(level)
| level | 名称 | 目安 |
|---|---|---|
| 1 | 入門 | 概念の存在理由と基本的な処理。3 級で初めて触れる範囲 |
| 2 | 基礎 | 標準的な処理と計算。3 級〜2 級 |
| 3 | 応用 | 複数の方法、例外、他テーマとの組み合わせ。2 級〜1 級 |
| 4 | 専門 | 会計基準・理論的背景・実務上の論点。1 級・会計士・税理士・実務 |

深さは試験の級と一致させない。級との対応はパスで決める。

### 1.3 用語(専門用語の扱い)
専門用語は独立した型を作らず、**概念(Concept)と勘定科目(Account)がそのまま用語集の項目**になる。
「用語」とは本文中で `[[id]]` と書かれた概念または勘定科目への参照のこと。
概念と勘定科目が同じ ID を持つもの(小口現金、当座預金など)は同じ用語とみなし、用語集では 1 項目にまとめる(概念の説明に勘定科目の要素を足す。名前が違えばビルドで拒否)。

段階的な理解のため、概念は 3 段階の説明を持つ。
| 段階 | フィールド | 長さ | 表示場所 |
|---|---|---|---|
| 1 | `short` | 一文 | ホバー / タップのポップオーバー |
| 2 | `summary` + `example` | 数文 + 具体例 1 つ | ポップオーバーの「もっと見る」、用語集の項目 |
| 3 | 単元本文 | 制限なし | その概念を `introduces` する単元へのリンク |

初出時の説明は本文で行う(ポップオーバーに頼らない)。単元の frontmatter に `introduces`(この単元で初めて説明する概念)を書き、
本文で `[[id]]` として使う概念は、その単元の `introduces` か、`requires` で辿れる前提単元の `introduces` に含まれていなければならない(ビルドで検査)。
これにより「説明していない用語を使う」ことを機械的に防ぐ。

### 1.4 単元の構造(ステップ型)
単元は 1 つの小さな会社の物語で、`## 見出し` ごとのステップに分かれる(docs/ide-design.md 4 章)。
各ステップ = 2〜4 文の説明(Markdown)+ 任意の ```task ブロック(YAML)。task が無いステップは observe(読むだけ)。

````markdown
---
id: bookkeeping-basics/five-elements
title: 5 つの要素と仕訳
summary: カフェを開業しながら、お金の動きを 5 つの箱に分けて記録する方法を身につける
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
あなたは今日、小さなカフェを開きます。元手は貯金の 1,000,000 円。
これから 1 か月の出来事を、右側の帳簿に記録していきましょう。

## 元手を会社に入れる
貯金の 1,000,000 円を会社の現金にしました。
左に「現金 1,000,000」、右に「資本金 1,000,000」と入れて、記帳してみましょう。

```task
type: post
transaction: 元手として現金 1,000,000 円を出資した
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
- ステップは 4 つ以上。最初のステップは observe(導入)、最後の見出しに「ふりかえり」を含める。post か predict が 1 つ以上。
- 要件 1 章の 5 つの観点(何を / なぜ / 原理 / 処理 / つながり)は節ではなく流れに埋め込む。導入が「何を・なぜ」、操作ステップが「原理・処理」、ふりかえりが「つながり」。
- `introduces` の概念は説明文で `[[id]]` として使い、操作の直後に名前を付ける書き方にする(「左側を [[debit_credit|借方]] と呼びます」)。

## 2. ステップの課題の種類

四択は使わない。種類と狙いは docs/ide-design.md 3 章。task ブロックの形:

| type | 必須項目 | 確認 |
|---|---|---|
| observe | `entries`(自動で記帳する仕訳。省略可) | なし |
| post | `transaction`、`answer`(仕訳)、`alternatives`、`wrong_patterns`(swapped / unbalanced / debit / credit)、`hint`、`success` | 仕訳の一致(行順不同)。不一致なら誤答パターンで誤解を判定 |
| predict | `transaction`、`entry`(確認後に記帳される仕訳)、`answer`(5 要素の increase / decrease / none)、`wrong_patterns`(部分一致) | 予想と答えの一致。外れても実際の動きを見せて進める |
| tweak | `formula`(straight_line)、`params`(id / label / value / min / max / step / unit)、`goal`(output / equals / label)。straight_line の当期分と期末の帳簿価額は `months` を params に含めたときだけ出る | 式の出力が目標値と一致 |
| classify | `accounts`(科目 ID の配列)、`misconceptions`(科目 → 間違えた要素 → 誤解 ID) | 全科目が正しい箱 |
| calc | `question`、`answer`、`wrong_patterns`(値) | 値の一致 |

採点は `{correct, misconception?, feedback}` を返す。post の不正解では、学習者の仕訳の影響と期待される影響を 5 要素で並べて見せる。

## 3. 記述形式

content as code。ディレクトリは技術選定後に確定するが、ファイル形式は次の通り。

```
content/
  accounts.yaml                 勘定科目マスタ
  misconceptions.yaml           よくある誤解
  concepts/<domain>.yaml        概念と関係(分野ごとに 1 ファイル)
  topics/<topic-id>/
    topic.yaml                  テーマのメタデータ
    <unit-id>.md                単元(frontmatter + ステップ。課題は ```task ブロック)
  paths/<path-id>.yaml          学習パス
```

### 3.1 勘定科目マスタ(accounts.yaml)
```yaml
- id: depreciation_expense
  name: 減価償却費
  short: 固定資産の購入代金のうち、今年の分として費用にした金額
  element: expense            # asset | liability | equity | revenue | expense
  why: 固定資産の取得原価のうち当期の使用によって消費された部分を費用として認識するため
  concepts: [cost_allocation]
- id: accumulated_depreciation
  name: 減価償却累計額
  aliases: [建物減価償却累計額, 備品減価償却累計額, 車両運搬具減価償却累計額]
  element: asset
  contra: true                # 評価勘定。資産の控除項目で、増加は貸方
  why: 固定資産の帳簿価額を直接減らさず、取得原価と減価の累計を別々に見せるため
  concepts: [cost_allocation, contra_account]
```

### 3.2 概念(concepts/assets.yaml)
```yaml
- id: cost_allocation
  name: 費用配分の原則
  short: 長く使うものの購入代金を、使う期間に分けて費用にする考え方
  summary: 資産の取得原価を、その資産が使われる期間にわたって費用として配分する考え方。収益と費用を同じ期間に対応させるためにある。
  example: 100 万円のトラックを 5 年使うなら、買った年に 100 万円の費用にするのではなく、毎年 20 万円ずつ費用にする。
  requires: [accrual_basis, five_elements]
  related: [depreciation, amortization]
- id: depreciation
  name: 減価償却
  short: 建物や備品などの購入代金を、使える年数に分けて毎年少しずつ費用にすること
  summary: 有形固定資産の取得原価を耐用年数にわたって費用配分する手続き。費用配分の原則を固定資産に適用したもの。
  example: 耐用年数 10 年の建物 1,000 万円を、毎年 100 万円ずつ減価償却費にする。
  requires: [cost_allocation, tangible_fixed_assets]
  contrasts: [impairment]
```

### 3.3 単元
1.4 の通り。`*.exercises.yaml` は廃止し、課題はステップの ```task ブロックに書く。

### 3.4 仕訳・図解ブロックと用語参照
```figure ブロック(YAML)は図解(docs/visual-guidelines.md 5 章)。`alt` 必須、1 ステップに 1 つまで。YAML なので「50,000」のようにカンマを含む文字列は引用符で囲む(`["豆の代金 50,000", ...]`)。

説明文中の ```journal ブロックは読み取り専用の仕訳エディタ(影響表示つき)として描画する。
`[[id]]` / `[[id|表示語]]` は用語参照。`[[id]]` だけのときは用語の名前が表示される。表(`|` 区切り)の中では `[[id]]` の形だけを使う(ビルドで検査)。

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
      feedback: 建物は 10 年使うので、1 年分だけを費用にします。
```

### 3.6 学習パス(paths/boki-3.yaml)
```yaml
id: boki-3
title: 簿記 3 級合格パス
exam:
  name: 日商簿記検定 3 級
  format: ネット試験(CBT)または統一試験。60 分、3 題以内、商業簿記のみ、70 点以上で合格
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
- 単元・パス・演習が参照する概念 ID、単元 ID、勘定科目 ID がすべて存在する。
- 単元の `requires` と概念の `requires` に循環がない。
- パス内の単元は、その `requires` がパス内で先に出現する(出現しない場合は警告)。
- journal 演習の借方合計と貸方合計が一致する。
- ステップの説明文の `[[id]]` が参照する概念・勘定科目が、その単元の `introduces` か、`requires` を辿った前提単元の `introduces` に含まれる(未説明の用語の使用を防ぐ)。
- ステップ数、最初の observe、最後の「ふりかえり」、post / predict の存在、task の各項目(仕訳の貸借一致、科目・誤解の存在、tweak の式とパラメータ)。
- `introduces` に挙げた概念が本文で少なくとも 1 回 `[[id]]` として使われている。
- すべての概念に `short` / `summary` / `example` がある。
- 誤答パターンの `misconception` が `misconceptions.yaml` に存在し、誤解の `remediation` が実在する単元を指す。
- journal の誤答パターンが正解と一致しない(正解を誤答として登録していない)。

## 5. 用語集
- 項目 = すべての概念 + 勘定科目。ビルド時に生成する(別データを持たない)。
- 各項目: short、summary、example、要素(勘定科目のみ)、前提・関連・対比、`introduces` している単元へのリンク、登場する単元の一覧。
- 検索: 日本語の部分一致(名前、別名、short)。クライアント側で完結させる。
- 絞り込み: 「学習済みの単元で登場した用語」(進捗レコードから算出)で復習用に絞れる。

## 6. 学習者の回答と進捗
Supabase の `unit_progress` / `attempts` に保存する(architecture.md 4 章)。学習者 ID は Supabase Auth のユーザー ID で、匿名でも本登録でも同じ。
課題 ID は `<unit-id>#<ステップ番号(0 始まり)>`。`unit_progress.step` に最後に到達したステップを持ち、途中から再開する。回答そのものと検出した誤解 ID、コンテンツのコミットを残し、誤答パターンの改善に使う。

## 7. MVP のコンテンツ量(見積)
- 3 級範囲: 約 12 テーマ、深さ 1〜2 の単元 40〜50、演習 250 前後。
- 深掘り対象(減価償却、貸倒引当金、商品売買)に深さ 3 の単元を各 2〜3 追加。
- 勘定科目マスタ: 3 級範囲で約 60 科目、深掘り分を含めて約 80。
- 概念: 100〜150。

## 8. 会計 IDE 化で分かったこと(2026-11-07)
- 3 単元(28 ステップ)をステップ型で書き直し、E2E(`e2e/learning-loop.spec.ts`)がコンテンツを読んで全ステップを自動で解き切る。コンテンツを増やしても同じテストで検証できる。
- `scenario.opening` は正の残高しか表せず、評価勘定(減価償却累計額)を開始残高に置けない。複数年のシナリオでは「期を締める」(収益・費用を繰越利益剰余金へ振り替える)機能も要る。2 級範囲に入る前に対応する。
- 誤りの視覚化(あなたの仕訳の影響 vs 期待される影響)と、予想と実際の比較は、仕訳エディタの影響計算をそのまま流用できた。

## 9. 縦スライスで検証したこと(2026-11-07、IDE 化前)
- 3 単元(5 要素と仕訳 / 減価償却とは何か / 定額法)をこの形式で書けた。`introduces` と `requires` による「未説明の用語」の検査は機能し、執筆時に実際にエラーを出して直した。
- 仕訳を伴わない単元(伝票・補助簿)での 5 節テンプレートの妥当性は未検証(該当単元を書く時に確認)。
- 仕訳エディタの影響表示は本文の仕訳例にも演習にも同じものを使う。「純資産」は当期純利益を含む定義で表示し、演習の問い方と揃えた。
- 表(`|` 区切り)の中では `[[id|表示語]]` が使えないことが分かり、検査を追加した(3.3)。
- 用語ポップオーバーは PC のホバーとスマートフォンのタップの両方で動く。本文の用語リンクの多さ(初出のみ強調するか)と、`effect` / `statement` が「理解した感」を与えるかは、β のテスターで確かめる。
- 概念マップはまだ作っていない。テーマ単位で足りるかは実装時に判断する。
