# 0006. ホスティングは VPS 1 台(さくらの VPS 4GB + Coolify)に Next.js と Supabase を同居させる

日付: 2026-11-07
状態: 採用(ユーザー決定 2026-11-07)

## 背景
ADR 0003 ではホスティングを未決とし、`output: 'standalone'` でホスト中立を保ってきた。候補は Vercel(Hobby は非商用のみ、Pro は月 20 ドル)、Cloudflare(OpenNext 経由で制約あり)、VPS。
Supabase クラウドは Free だと 1 週間アクセスがないと停止し、Pro は月 25 ドルかかる。本サービスの Supabase 利用は Auth と 2 テーブルだけで、全部入りのセルフホストは要らない。
固定費を抑え、商用化の制約を持たず、設定を CLI で再現できることを重視した。

## 決定
- **さくらの VPS 4GB(東京)1 台**に以下を同居させる。Supabase も東京に置く方針(architecture.md 7 章)と整合する。
- **Coolify** を PaaS 層にする。TLS(Let's Encrypt)、GitHub 連携の自動デプロイ、ヘルスチェック付きの無停止デプロイを任せる。設定は公式 CLI(`coolify`)と REST API で行い、Web 画面での手作業を残さない。
- **Next.js** は GitHub Actions で Docker イメージをビルドして GHCR に push し、Coolify はそれを pull して起動するだけにする(VPS 上でビルドしない)。`output: 'standalone'` は維持する。`CONTENT_VERSION` は Actions の `github.sha` を build-arg で渡す。
- **Supabase** はセルフホストを Postgres、GoTrue(Auth)、PostgREST、Kong の 4 サービスに削って動かす。Realtime、Storage、Studio、ログ分析、Edge Functions は入れない(architecture.md 3 章の方針通り)。匿名サインインは GoTrue の `GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED=true` で有効化する。マイグレーションは `supabase db push --db-url` で適用する。
- **VPS の契約だけ Web 画面**で行う(usacloud はさくらのクラウド専用で VPS には使えない)。初期設定(SSH 鍵、パケットフィルタ 22/80/443、unattended-upgrades、Coolify 導入)はスタートアップスクリプトで流す。
- **外部へのバックアップは置かない。** DB の中身は匿名ユーザーの進捗と回答ログだけで、消えても β のやり直しで済む。本登録(フェーズ 7)を始める前に再検討する。

## 検討した代替
- Vercel Hobby + Supabase クラウド Free: 最も手軽だが、Hobby は非商用限定、Supabase Free は停止する。有料化すると月 45 ドル超になる。
- Cloudflare(OpenNext): 無料枠は広いが、Next.js 16 を OpenNext 経由で動かす制約を β 前に踏む価値がない。
- Hetzner: 2026 年の値上げと安価プランの新規制限、最寄りがシンガポールで東京まで遠い。
- Dokploy: Coolify と同等だが Docker Swarm 前提で、1 台構成では利点がなく、情報量も少ない。
- 2GB プラン: Coolify + Next.js + 削った Supabase で 1〜1.5GB 使うため、ビルドや更新で足りなくなる。

## 影響
- 設計原則「ホスティング中立」は Docker で動くことに読み替える。ISR や特定ホストの API には引き続き依存しない。
- 追加する成果物: `Dockerfile`、イメージを GHCR に push する GitHub Actions、VPS のスタートアップスクリプト、Coolify の設定手順(docs)。
- Supabase イメージの更新は自分で追う。β 中は月 1 回を目安にする。
- メール認証(フェーズ 7)を足す時は SMTP が別途要る。
- 単一障害点になる。VPS が止まると学習も回答保存も止まるので、Coolify の通知(メール等)を最初に設定する。
