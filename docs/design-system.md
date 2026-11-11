# デザインシステムとテーマ(v0.1)

更新日: 2026-11-08
状態: 採用(ADR 0008)。実装済み(`src/themes/`)。配色・書体・形を「テーマ」として切り替えられる形で定義し、レイアウトと操作は全テーマで共通にする。
5要素の記号と使い方は`docs/ide-design.md` 8章、図解・イラスト・アニメーションは`docs/visual-guidelines.md`。

## 1. 考え方

1. **テーマは色・書体・形だけを変える。** レイアウト、ペイン構成、余白のスケール、コンポーネントの構造、記号(◆▲●＋－)、アイコン(Lucide)、動きの規則はテーマで変えない。テーマごとに別のUIを作らない。
2. **テーマはCSS変数の束。** 1テーマ = 1つのCSSファイル(ライトとダークの2ブロック)。コンポーネントは意味トークン(2章)だけを参照し、色の生値を書かない。
3. **テーマ間で学習の視覚言語は揺らさない。** 5要素の色相の系統(青・赤・紫・緑・橙)、記号、状態の形(帯・下線・文字)は全テーマで共通。テーマが変えるのはその中の具体的な色味。
4. **テーマは貢献の入口。** テーマの追加はコンテンツの追加と同じくPRで受ける。CSS 1ファイルと登録1行、スクリーンショットで完結し、ビルド時の検査(6章)を通れば採用できる。
5. **仕組みは小さく始める。** リポジトリ内のテーマを切り替える機能だけを作る(3章)。利用者が自分のテーマを作って共有する仕組み(7章)は、テーマを作る人が実際に現れてから足す。

## 2. トークン

トークンは5つの層に分ける。上の層はテーマが値を決め、コンポーネントは意味・要素・状態・形・書体の層だけを使う。

### 2.1 意味(shadcn/uiの変数を踏襲し、ペイン面を足す)

| トークン | 用途 |
|---|---|
| `--background` / `--foreground` | ページの地と文字 |
| `--card` / `--card-foreground`、`--popover` / `--popover-foreground` | カード、ポップオーバー |
| `--primary` / `--primary-foreground` | 主ボタン、進捗の点、リンク、フォーカスリング(`--ring`も同じ値) |
| `--secondary`、`--muted` / `--muted-foreground`、`--accent` / `--accent-foreground` | 補助面、控えめな文字、ホバー面(shadcnの意味のまま) |
| `--brand-accent` | ブランドの差し色。ロゴの印、達成の紙吹雪、イラストの再着色。**状態には使わない** |
| `--border` / `--input` | 枠線 |
| `--rule` | 帳簿の罫線(財務諸表・仕訳帳の行の区切り)。`--border`より淡い |
| `--surface-guide` / `--surface-work` / `--surface-result` | 会計IDEの3ペインの面。「読む」「書く」「見る」を面の色で分ける |
| `--destructive` | shadcn互換(削除ボタン)。入力エラーには`--error-fg`を使う |

### 2.2 要素(5要素 × 4役割)

`--el-<element>-fg` / `-bg` / `-border` / `-bar`。elementは`asset` / `liability` / `equity` / `revenue` / `expense`。
fgは文字、bgはチップと見出しの面、borderは枠、barは影響バーと比例図の帯。
色相の系統は固定: 資産 = 青系、負債 = 赤系、純資産 = 紫系、収益 = 緑系、費用 = 橙系。テーマはこの中で色味を選ぶ。

### 2.3 状態(要素と別系統)

| トークン | 用途 | 形 |
|---|---|---|
| `--ok-bg` / `--ok-fg` | 「できました」の帯 | 面 + ✓ + 文 |
| `--hint-bg` / `--hint-fg` | ヒント | 面(淡い中立色)+ アイコン + 文 |
| `--diff-fg` | 期待とのずれ(数字、下線、▲▼) | **文字と線だけ。面のトークンは存在しない** |
| `--error-fg` | 入力エラー(存在しない科目、貸借不一致) | **文字と線だけ** |
| `--changed-bg` | 財務諸表で動いた行 | 面。要素色・状態色のどれとも違う中立の色 |

状態と要素は「形」で区別する。要素はチップとして面を塗る。ずれとエラーは面を塗らない。できましたの帯は`--primary`系の色を使い、収益の緑と値を揃えない。

### 2.4 形

| トークン | 用途 |
|---|---|
| `--radius` | 基準の角丸。shadcnの派生(`--radius-sm` 〜)はここから計算される。IDEの入力セルは`--radius-sm`、カードは`--radius-lg`、チップはpill |

### 2.5 書体

| トークン | 用途 |
|---|---|
| `--type-heading` | 見出し、単元名、主ボタン(Tailwindでは`font-heading`) |
| `--type-body` | 本文(`font-sans`) |
| `--type-mono` | 金額、科目コード、ステップ番号(`font-mono`)。金額は常に`tabular-nums`で右揃え |

テーマは書体を **フォント登録簿**(`src/themes/fonts.ts`)から選ぶ。登録簿はnext/fontで読み込む書体の一覧で、テーマはそのCSS変数(`--font-zen-maru-gothic`など)を`--type-heading`などに入れて参照する。登録簿に無い書体はテーマから使えない(登録簿への追加は別のPRで、ライセンスと重さを確認して足す)。next/fontはサブセットごとの`@font-face`を出すだけなので、ダウンロードされるのは実際に使われている書体だけで済む。

## 3. 仕組み

### 3.1 ファイル

```
src/themes/
  index.ts          テーマの登録簿: { id, name, description, author, preview: [主色, 背景, 差し色] }
  fonts.ts          フォント登録簿(next/font)
  town-shop.css     街の小さな会社(既定)
  ai-shu.css        藍と朱
  ledger-paper.css  帳簿用紙
  workbench.css     ワークベンチ
  themes.test.ts    必須トークンとコントラストの検査(6章)
```

テーマCSSの形:

```css
/* 街の小さな会社。カフェ「マメノキ」の物語を主役にした暖色のテーマ。作者: ... */
[data-theme="town-shop"] {
  --background: #fbf7f1;
  /* ... 2章のトークンをすべて書く ... */
}
[data-theme="town-shop"][data-mode="dark"] {
  --background: #1b1714;
  /* ... 同じトークンをダークの値で ... */
}
```

- 色は6桁のhexで書く(検査が単純になり、貢献者にも分かりやすい)。
- ライトとダークの両方を必ず書く。ダークはOSの設定に追従する基本機能なので、テーマごとに省略できない。
- `globals.css`は全テーマのCSSを`@import`し、`@theme inline`で各トークンをTailwindのクラスに対応させる(`bg-asset-bg`、`text-diff-fg`、`bg-surface-guide`など)。`src/lib/elements.ts`のクラス名はこれらに置き換える。
- shadcnの`.dark`クラスはやめ、`@custom-variant dark (&:where([data-mode="dark"], [data-mode="dark"] *))`にする。

### 3.2 切り替え

- `<html data-theme="town-shop" data-mode="light">`を起点にする。サーバーは常に既定テーマで描き、`<head>`の小さなインラインスクリプトが描画前にlocalStorageの値(`theme` / `mode`)で属性を置き換える(ちらつき防止)。
- modeは`auto` / `light` / `dark`の3択。`auto`は`prefers-color-scheme`に追従し、変更も監視する。
- ヘッダーに「テーマ」ボタンを置き、ポップオーバーでテーマ一覧(名前 + 3色のプレビュー)とmodeを選ぶ。
- 保存先はlocalStorageのみ。DBには置かない(閲覧だけでユーザーを作らない方針と一致する)。本登録(M5)でアカウントの設定として同期することを検討する。開いている別タブには`storage`イベントで反映する。
- E2Eは既定テーマで走る。テーマ切替のE2Eは「切り替えたら`data-theme`が変わり、再読み込みで保持される」の1本だけ。

### 3.3 変えないもの

レイアウトと3ペイン、タブ、ステップ進行、余白のスケール(Tailwindの既定)、コンポーネントの構造(Button / Card / Tabs / Dialogの中身)、5要素の記号、Lucideのアイコン、アニメーションの規則(`docs/visual-guidelines.md` 3.3)、イラストの形(色は`--brand-accent`で再着色)。

## 4. 全テーマ共通の規則

1. **5要素は色 + 記号 + 名前。** 色だけで区別させない。色相の系統(2.2)を守る。
2. **状態は形で分ける。** ずれとエラーは面を塗らない(トークンが無い)。できましたの帯は収益と同じ値を使わない。エラーの文字色は負債の文字色と同じ値を使わない。
3. **コントラストはAA。** 文字トークンはその背景に対して4.5:1以上(6章で検査)。
4. **主ボタンは画面に1つ。** 記帳する / 確認する / 次へ のうち、いま押すべきものだけ`--primary`で塗る。他は枠だけ。
5. **金額は等幅・右揃え・`tabular-nums`。** 合計行は上に実線、総合計は二重線(帳簿の作法)。それ以外の行は`--rule`。
6. **ブランドの差し色は状態に使わない。** `--brand-accent`は装飾と祝い(ロゴの印、紙吹雪、イラスト)だけ。
7. **見出しの段は5つ。** 13 / 15 / 18 / 22 / 28px。本文15px、財務諸表13px。

## 5. 既定テーマ「街の小さな会社」(town-shop)

カフェ「マメノキ」の物語を主役にする。オートミール色の紙、豆の木の緑、はちみつ色の差し色、丸みのある書体。
比較時(ADR 0008の資料)に指摘した「主色の緑が収益と、はちみつ色が費用と衝突する」問題は次で避ける。

- 主色は青寄りの深い緑(`#1E6B62`)、収益は黄緑(`#4A7510`)に寄せ、色相と明度の両方で離す。
- はちみつ色は`--brand-accent`に置き、状態には使わない(4章6)。
- ずれは焦げ茶の文字と下線、エラーはレンガ色の文字だけ。負債はチップの面で塗るので形で区別される。

### ライト

| 層 | トークン | 値 |
|---|---|---|
| 意味 | background / foreground | `#FBF7F1` / `#2B251F` |
| | card、popover | `#FFFFFF` |
| | primary / primary-foreground | `#1E6B62` / `#FFFFFF` |
| | brand-accent | `#E0A23A` |
| | muted / muted-foreground | `#F5EEE3` / `#6B6158` |
| | border / input / rule | `#E3D9CB` / `#E3D9CB` / `#EFE7DA` |
| | surface-guide / surface-work / surface-result | `#F5EEE3` / `#FFFFFF` / `#FFFFFF` |
| 要素 | asset fg / bg / border / bar | `#1A6C9E` / `#E3F0F8` / `#A0C9E3` / `#4A9BD1` |
| | liability | `#B2383A` / `#FAE7E6` / `#E8A7A5` / `#D46A6B` |
| | equity | `#7A4BA8` / `#F1EAF9` / `#CBB3E6` / `#9C78CC` |
| | revenue | `#4A7510` / `#EEF5DF` / `#BCD58E` / `#8DB83A` |
| | expense | `#8F5208` / `#FCEFD8` / `#EFC98C` / `#E08A3C` |
| 状態 | ok-bg / ok-fg | `#E3F1EC` / `#1B5A4A` |
| | hint-bg / hint-fg | `#F5EEE3` / `#2B251F` |
| | diff-fg、error-fg | `#5B3A22`、`#B3402E` |
| | changed-bg | `#F3EBDD` |
| 形 | radius | `0.75rem` |
| 書体 | heading / sans / mono | Zen Maru Gothic / BIZ UDPGothic / IBM Plex Mono |

### ダーク

| 層 | トークン | 値 |
|---|---|---|
| 意味 | background / foreground | `#1B1714` / `#F0EBE3` |
| | card、popover | `#241F1A` |
| | primary / primary-foreground | `#5CC0AD` / `#0E2A22` |
| | brand-accent | `#F2BD5B` |
| | muted / muted-foreground | `#201B17` / `#A39A8F` |
| | border / input / rule | `#3A332C` / `#3A332C` / `#342E27` |
| | surface-guide / surface-work / surface-result | `#201B17` / `#241F1A` / `#241F1A` |
| 要素 | asset | `#86C2EA` / `#16293A` / `#2A4B66` / `#4A9BD1` |
| | liability | `#F0999A` / `#3E1D1E` / `#6E3738` / `#D46A6B` |
| | equity | `#CBB1EE` / `#2D2341` / `#4F3E70` / `#9C78CC` |
| | revenue | `#B5D97A` / `#26361A` / `#46662A` / `#8DB83A` |
| | expense | `#F3C47C` / `#3F2C11` / `#70501F` / `#E08A3C` |
| 状態 | ok-bg / ok-fg | `#173129` / `#B4E6D4` |
| | hint-bg / hint-fg | `#201B17` / `#F0EBE3` |
| | diff-fg、error-fg | `#E6CDB0`、`#F29C8A` |
| | changed-bg | `#3A3020` |

他の3テーマ(藍と朱 / 帳簿用紙 / ワークベンチ)の値は比較資料のモックの値を出発点にし、実装時に6章の検査を通る形に整える。

## 6. 検査(vitest)

`src/themes/themes.test.ts`が各テーマCSSを読み、次を確かめる。外部ライブラリは使わず、hexからの相対輝度計算だけで足りる。

1. 登録簿にあるテーマのCSSが存在し、ライトとダークの両ブロックに2章のトークンがすべてある。
2. 文字と背景の組のコントラストが4.5:1以上: foreground / background、muted-foreground / background、primary-foreground / primary、各要素のfg / bg、ok-fg / ok-bg、hint-fg / hint-bg、diff-fgとerror-fg / 各surface、card-foreground / card。
3. 4章2の値の分離: ok-bg ≠ revenue bg、error-fg ≠ liability fg。

コントラスト不足はテスト失敗としてPRで分かる。目視のレビュー(スクリーンショット)は検査の代わりにならないが、PRテンプレートでライト・ダーク各1枚を求める。

## 7. 将来(開始条件つき)

- **テーマの書き出し・読み込み**: テーマをJSONで書き出し、貼り付けて読み込む(localStorageに保存)。VS Codeの設定共有に相当。開始条件: リポジトリへのテーマPRが運営者以外から2件以上。
- **テーマのギャラリー**: READMEまたはサイト上に全テーマのスクリーンショットと作者を並べる。開始条件: テーマが6つ以上。
- **アカウントへの同期**: 本登録(M5)で、選んだテーマを設定として保存する。
- **イラストの差し替え**: テーマがスポットイラストの再着色だけでなくイラスト集を選べるようにする。開始条件: unDraw以外の素材を採用したとき(ADR 0004の見直しが先)。

## 8. 貢献の手順(CONTRIBUTINGに転記する)

1. `src/themes/<id>.css`を既定テーマからコピーして色を変える(idは英語のkebab-case)。
2. `src/themes/index.ts`に1行登録する。書体は登録簿から選ぶ。
3. `make test`で検査を通す。`make dev`でテーマを切り替えてライト・ダークのスクリーンショットを撮る。
4. PRに、テーマの意図(どんな人に、どんな場面で)、スクリーンショット2枚、色の出典(和色名など)があれば添える。
