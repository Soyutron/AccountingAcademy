# AccountingAcademy(仮名)

会計を基礎から専門領域まで、原理・概念・構造の理解を軸に体系的に学べる Web サービス。
学習体験は **会計 IDE**: Codecademy(https://www.codecademy.com/)のように、物語と課題・仕訳帳・財務諸表を 1 画面に置き、
仕訳を記帳すると貸借対照表と損益計算書がその場で動く。
ビジョンと現状のギャップは [docs/vision.md](docs/vision.md)、開発方針とロードマップは [docs/roadmap.md](docs/roadmap.md)、
要件は [docs/requirements.md](docs/requirements.md)、学習体験は [docs/ide-design.md](docs/ide-design.md)、コンテンツ構造は [docs/content-model.md](docs/content-model.md) が正本。

## 開発プロセス

立ち上げ期(フェーズ 0〜4)は完了し、以降は [docs/roadmap.md](docs/roadmap.md) のマイルストーン(M1〜M6)で進める。
決めたことは `docs/decisions/` に ADR として残す。下表は立ち上げ期の記録。

| # | フェーズ | 主な成果物 | 出口条件 | 状態 |
|---|---|---|---|---|
| 0 | リポジトリ整理 | 流用元の削除、`CLAUDE.md` / `README.md` の置き換え | Ludogenesis 由来のファイルが残っていない | 完了(2026-11-07) |
| 1 | 要件定義 | `docs/requirements.md` | 「未決事項」が空になり、MVP の範囲が確定している | ほぼ完了(未決 6 件) |
| 2 | コンテンツ設計 | `docs/content-model.md`、3 級範囲のテーマ・単元一覧、サンプル 1 テーマ | 演習形式と執筆テンプレートが 3 級の全論点を表現できると確認できた | 進行中 |
| 3 | 技術選定 | `docs/tech-stack.md`(比較)、ADR 0003、`docs/architecture.md` | ユーザーがスタックを決定し、ADR 0003 が「採用」になっている | 完了(2026-11-07。ホスティングのみ未決) |
| 4 | 縦スライス | 選定したスタックで 1 テーマ分(単元・用語ポップオーバー・仕訳エディタ・演習採点と誤解検出・匿名ユーザーでの進捗保存)を動かす。捨てずに MVP の土台にする | 学習ループが成立し、`content-model.md` 8 章の検証項目に答えが出ている | 完了(2026-11-07。E2E `e2e/learning-loop.spec.ts` で確認) |
| 5 | MVP 実装 | 会計 IDE(3 ペイン、ステップ型単元、財務諸表のリアルタイム更新、誤りの視覚化)・3 級パス・用語集・匿名ユーザーの進捗 | 3 級パスを 1 本通しで学習できる | ロードマップ M1〜M3 に引き継ぎ(2026-11-07 時点で 13 単元) |
| 6 | コンテンツ量産・β検証 | 3 級全範囲 + 深掘り 2〜3 テーマ、ホスティング決定、プライバシーポリシー、テスター 10 名の検証 | 要件 6.2 の検証結果が出て、教育方針の有効性を判断できた | 未着手 |
| 7 | 本登録 | メール / Google での本登録(匿名ユーザーの昇格)、プロフィール | 匿名 → 本登録で履歴が引き継がれる | 未着手 |
| 8 | 公開・拡張 | 2 級パス、深さ 3〜4 の単元、模擬試験 | 継続的な運用に入る | 未着手 |

フェーズ 2 と 4 は並行してよい。演習形式と用語の仕組み(2)は縦スライス(4)で検証して固める。
技術選定(3)を縦スライスの前に置いたのは、選定済みのスタックで書けば縦スライスを捨てずに済むため。

## 開発環境

```bash
pnpm install
pnpm db:start            # Supabase ローカルスタック(Docker)。出力されたキーを .env.local に書く(.env.example 参照)
pnpm dev                 # http://localhost:3000
pnpm test                # 採点エンジンなどの単体テスト
pnpm content             # コンテンツ検査だけ実行
pnpm exec playwright test  # E2E(開発サーバーとローカル Supabase を使う。コンテンツを読んで全単元を自動で解く)
```

CI(GitHub Actions)は push と pull request で lint・型・単体テスト・ビルドと、ローカル Supabase を立てた E2E を実行する。

## ディレクトリ

```
docs/vision.md          プロダクトビジョン、会計ならではの学び方、現状とのギャップ
docs/roadmap.md         開発方針とマイルストーン
docs/requirements.md    要件定義(正本)
docs/ide-design.md      会計 IDE の画面構成・ステップの種類・学習フロー
docs/visual-guidelines.md 図解・イラスト・アニメーションの方針と図解ブロックの仕様
docs/assets-ledger.md   外部素材の台帳
docs/testing-guide.md   自分でテストするときの見るポイントと指標の集計 SQL
docs/content-model.md   コンテンツ構造・記述形式・ステップの課題・用語集
docs/tech-stack.md      技術選定の比較(記録)、Skills / MCP 一覧
docs/architecture.md    採用した構成、責務の配置、データモデル、誤解検出の仕組み
docs/decisions/         ADR(設計判断の理由)
content/                学習コンテンツ(Markdown + YAML)。velite.config.ts で検査
src/                    Next.js アプリ(app: ページ、components: UI、lib: 採点・会計計算・進捗保存)
supabase/               ローカルスタック設定とマイグレーション
```
