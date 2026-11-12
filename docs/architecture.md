# アーキテクチャ(v0.1)

更新日: 2026-11-07
状態: 採用(ADR 0003)。決定済み: Next.js、Supabase(DB・認証)をMVPから使う。ホスティング: VPS 1台(さくらのVPS 4GB + Coolify)にNext.jsとSupabaseを同居(ADR 0006)。

## 1. 設計原則
1. **採点と解説はコンテンツだけで完結させる。** 正誤判定にDBやAPIを挟まない。
2. **学習者の行動(回答・進捗)は最初の1回目からDBに残す。** ゲストも匿名ユーザーとして同じ経路で保存する。誤解の検出とコンテンツ改善の材料になるため。
3. **コンテンツはリポジトリで管理し、ビルド時に検査する。** DBには置かない。
4. **ホスティング中立。** Next.jsの標準出力(Nodeランタイム)をDockerで動かし、特定ホストの固有機能に依存しない。ホストはVPS + Coolify(ADR 0006)。
5. 各機能に必要な仕組みだけを入れる。将来の拡張は「妨げない」ことで担保し、先回りして作らない。

## 2. 全体構成

```
content/ (Markdown + YAML, git)
   │ velite build: zod 検証 + 横断検査(用語の未説明・前提の循環・貸借一致・誤答パターンの整合)
   ▼
.velite/ (型付き JSON)  ──▶ Next.js(App Router)
                              ├ 解説・用語集・概念マップ・パス: ビルド時に静的生成(generateStaticParams)
                              ├ 演習・仕訳エディタ: クライアントコンポーネント。採点エンジンは純粋関数
                              └ 進捗・回答の読み書き: supabase-js(RLS)。セッションは @supabase/ssr の標準構成
                                               │
                                               ▼
                                     Supabase(Postgres + Auth)
                                       auth.users(匿名 → 本登録に昇格)
                                       unit_progress / attempts
```

- 「静的エクスポート(`output: 'export'`)」は前提にしない。解説ページは静的生成されるので速さは変わらず、認証と進捗の部分だけが動的になる。
- Next.jsの出力は`output: 'standalone'`にしておく。VercelでもCloudflare(OpenNext)でもDockerを置けるホストでも同じものが動く。

## 3. 責務の配置(ご質問への回答)

### 3.1 採点と解説の表示 — DB不要、アプリ内で完結
- 採点の入力は「演習の定義(期待値・誤答パターン)」「勘定科目マスタ」「学習者の回答」。前二者はビルド時にバンドルされるデータ、後者はブラウザ内にある。
- 採点エンジンは副作用のない関数(`grade(exercise, answer) → {correct, misconception?, feedback}`)。Vitestで網羅的にテストでき、オフラインでも動く。
- サーバー採点が必要になるのは「正解を隠したい」「不正を防ぎたい」場合だが、本サービスは解答後に正解と解説を見せる前提で、点数に利害もない。したがって不要。
- 解説も同様にコンテンツから描画する。DBを挟むと遅延と障害点が増えるだけで、得るものがない。
- DBに書くのは採点の **結果**(どの演習に何と答え、正誤と検出した誤解は何か)であり、採点そのものではない。

### 3.2 ゲストの学習履歴 — MVPからDBに保存する(匿名ユーザー)
選択肢の比較:

| 方式 | 長所 | 短所 |
|---|---|---|
| A. ブラウザ保存のみ(localStorage) | 最も単純。個人情報を扱わない | ブラウザを変える・消すと消える。学習者をまたいだ分析(どの誤解が多いか)ができない。本登録時に「引き継ぎ」の仕組みを別途作ることになる |
| **B. Supabase匿名サインイン + DB保存(推奨)** | ゲストと本登録ユーザーが同じコード経路。本登録は匿名ユーザーの昇格(メール追加 / OAuth連携)で済み、引き継ぎ処理が要らない。全学習者の回答をSQLで分析できる。RLSで本人以外は読めない | 常時オンライン前提(学習サイトとして妥当)。匿名ユーザーが溜まる(定期削除が要る)。匿名サインインにIPあたりの回数制限がある(既定30回 / 時。企業研修などNAT配下で多人数が使うときは設定変更) |
| C. ローカル優先 + 同期 | オフラインでも動く | 競合解決とキューが必要で、MVPには過剰 |

Bを採る理由は要件そのもの。「誤解を検出し理解へ導く」には回答の蓄積が要り、「ゲストで始めて後から引き継ぐ」には匿名ユーザーの昇格がそのまま対応する。
運用上の決まり:
- 匿名サインインはページ表示時ではなく **最初の回答の書き込みの直前** に行う(閲覧だけの訪問者やクローラにユーザーを作らない)。回答より前の進捗(説明だけのステップを読み進めた位置)は保存しない。
- 匿名ユーザーは最終活動から90日で削除する(Postgresのcron)。本登録ユーザーは削除しない。
- 匿名でも回答データは行動履歴なので、β 開始時点からプライバシーポリシーを置く(個人情報保護法上は個人関連情報の扱いになる想定。本登録でメールを持った時点で個人情報)。

### 3.3 問題・解説データの管理 — リポジトリ(content as code)。Supabaseには置かない
| 方式 | 長所 | 短所 |
|---|---|---|
| **A. リポジトリで管理し、ビルド時に検証(推奨)** | gitで差分・レビュー・巻き戻しができる。zodと横断検査(用語の未説明、前提の循環、貸借一致)をビルドで強制できる。型付きで参照できる。AIエージェントがMarkdown / YAMLを直接書ける。DB障害がコンテンツ表示に波及しない | 更新にデプロイが要る(CIで自動化すれば数分)。開発者以外が編集するには向かない |
| B. Supabaseに一元管理 | 実行時に編集できる。CMS画面を作れば非開発者も編集できる。SQLで問い合わせられる | 検証ロジックをアプリかDBに移す必要があり、横断検査が難しい。差分・レビュー・バージョンの仕組みを自作することになる。編集UIか投入スクリプトが要る。表示がDBに依存する |

個人開発でコンテンツの執筆者は自分(とAIエージェント)だけなので、Aが圧倒的に有利。
回答データの分析でコンテンツと突き合わせたいときは、`attempts`に`exercise_id`と`content_version`(gitのコミット)を持たせれば、ビルド成果物のJSONと結合できる。
コンテンツの索引(演習ID、概念ID、誤解ID)をDBにミラーするのは、SQLだけで分析したくなったときに足す。

### 3.4 SupabaseをMVPから入れることについて
入れる。理由は3.2の通り。ただし範囲は **Auth(匿名 + メール / Google)と2テーブル** に限る。Storage、Edge Functions、Realtimeは使わない。
ORMは入れない。supabase-js + RLS + `supabase gen types`で足りる(テーブルが2つで、サーバー側の複雑なクエリが無い)。Drizzleは必要になってから。

## 4. データモデル(MVP)

```sql
-- 学習者はauth.usersをそのまま使う(匿名 / 本登録の区別はis_anonymous)

create table unit_progress (
  user_id     uuid references auth.users on delete cascade,
  unit_id     text not null,                       -- 例: depreciation/straight-line
  status      text not null check (status in ('started','completed')),
  updated_at  timestamptz not null default now(),
  step        integer not null default 0,         -- 最後に到達したステップ。before updateトリガーで後退させない(completedも戻さない。範囲外の値だけreset_out_of_range_stepで0に戻す)
  primary key (user_id, unit_id)
);

create table attempts (
  id               bigint generated always as identity primary key,
  user_id          uuid references auth.users on delete cascade,
  unit_id          text not null,
  exercise_id      text not null,                  -- 例: depreciation/straight-line#3
  correct          boolean not null,
  misconception_id text,                           -- 採点エンジンが検出した誤解。nullは未検出
  answer           jsonb not null,                 -- 学習者の回答そのもの(事後分析用)
  content_version  text not null,                  -- コンテンツのコミット
  created_at       timestamptz not null default now()
);
-- RLS: いずれもuser_id = auth.uid()の行だけselect / insert可。update / deleteはunit_progressのみ本人に許可
```

概念ごとの習熟度や誤解の回数は、この2表から計算する(MVPはクエリかアプリ側の集計。永続化した派生表は要らない)。

## 5. 認証と学習者ID
- 学習者ID = `auth.users.id`。ブラウザ側でUUIDを自前生成しない(content-model.md 6章の`learner_id`はこれに置き換える)。
- 流れ: 閲覧(未認証)→ 最初の回答時に`signInAnonymously()` → 以後の回答・進捗を保存 → 本登録は`updateUser({ email })`または`linkIdentity()`(Google)。IDは変わらないので履歴は自動的に引き継がれる。
- セッションはSupabase公式のNext.js App Router構成(`@supabase/ssr`、cookie、middlewareでのリフレッシュ)に従う。独自のセッション管理を書かない。

## 6. 誤解の検出と理解への誘導(肝)

「正解か不正解か」ではなく「**どの誤解で間違えたか**」を判定し、その誤解を解く説明へ導く。仕組みは4層。

### 6.1 誤解をコンテンツとして定義する
`misconceptions.yaml`に、よくある誤解をIDつきで持つ。例:
- `debit_means_increase`: 「借方 = 増加」と覚えている(負債・純資産・収益では逆)
- `contra_as_liability`: 減価償却累計額を負債だと思っている
- `expense_at_payment`: 支払った時点で費用になると思っている(発生主義の未理解)
- `no_cost_allocation`: 固定資産の購入額を全額その期の費用にする
各誤解は「何を誤解しているか」「正しい理解」「解きほぐす単元・概念」を持つ(→ content-model.md)。

### 6.2 演習に「誤答パターン」を付ける
選択式では各誤選択肢に、入力式では期待される誤答に、誤解IDを紐づける。
```yaml
- type: journal
  answer: { debit: [{account: depreciation_expense, amount: 100000}], credit: [{account: accumulated_depreciation, amount: 100000}] }
  wrong_patterns:
    - match: { swapped: true }                                   # 借方と貸方が逆
      misconception: debit_means_increase
      feedback: 費用は借方で増えます。減価償却費は費用なので借方です。
    - match: { credit: [{account: building}] }                   # 建物を直接減らしている
      misconception: direct_writeoff_vs_contra
      feedback: 間接法では建物の金額はそのままにして、減価償却累計額で減価を表します。
    - match: { debit: [{amount: 1000000}] }                      # 全額費用
      misconception: no_cost_allocation
      feedback: 建物は10年使うので、1年分だけを費用にします。
```
採点エンジンは正解と照合し、外れたら誤答パターンを順に照合して、該当した誤解IDと個別のフィードバックを返す。どれにも当たらなければ汎用の解説を出す。
誤答パターンの網羅性は回答ログ(`attempts.answer`)から継続的に補う。これが「ゲストの回答も保存する」理由の核心。

### 6.3 単元内の演習順で「どこで躓いたか」を切り分ける
各単元の演習は`effect`(5要素の増減)→ `journal`(仕訳)→ `statement`(財務諸表への影響)→ `why`(理由)の順を基本にする。
- effectが正しくjournalが誤り → 機械的な誤り(科目名・貸借の位置)
- effectから誤り → 概念の誤解(要素の分類や取引の理解)
- journalが正しくstatementが誤り → 処理は覚えたが影響を理解していない
この切り分けで、同じ「不正解」でも導く先(用語の確認か、原理の単元に戻るか)を変える。

### 6.4 学習者モデルと介入
- 概念ごとの習熟: 直近の回答の正答率(MVPは単純な比率。アルゴリズムの高度化は後)。
- 誤解ごとの回数: 同じ誤解IDが2回出たら、次の演習の前に短い「立ち止まり」(その誤解を解く1画面の説明 + 診断問題1問)を挟む。3回なら前提単元へ戻ることを提案する。
- 概念マップに習熟と誤解を重ねて表示する(どの概念が弱いか一目で分かる)。
- 全学習者の集計: 誤解IDごとの発生率、演習ごとの初回正答率をSQLで出し、解説と誤答パターンを改善する。

### 6.5 構造化の方針(再掲、content-model.mdが正本)
- 概念は「なぜ必要か」「何を意味するか」「何とつながるか」を必ず持つ(short / summary / example、requires / related / contrasts)。
- 試験の級ではなく深さで積み、どの深さから入っても前提を辿れる。
- 勘定科目は5要素と「なぜその要素か」を持ち、仕訳エディタの影響表示と要素分類の演習の両方がこれを参照する。

## 7. ホスティング
決定: さくらのVPS 4GB(東京)1台にCoolifyを置き、Next.js(GHCRのイメージをpull)と、Postgres / GoTrue / PostgREST / Kongに削ったSupabaseを同居させる(ADR 0006)。
守ること: `output: 'standalone'`、ISRや特定ホストのAPIに依存しない、環境変数は`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`の2つだけ。
外部バックアップは置かない(β 中のDBは匿名ユーザーの進捗と回答ログだけ)。本登録(フェーズ7)の前に再検討する。

## 8. 開発環境
- Supabase CLIのローカルスタック(Docker)で開発・テストする。本番プロジェクトへはマイグレーションをCLIで適用する。
- 採点エンジン・コンテンツ検査はSupabaseなしでVitest。進捗保存のE2EはローカルSupabaseに対してPlaywright。実プロジェクトを叩くテストは書かない。
