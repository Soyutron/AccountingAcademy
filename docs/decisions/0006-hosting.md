# 0006. ホスティングはVPS 1台(さくらのVPS 4GB + Coolify)にNext.jsとSupabaseを同居させる

日付: 2026-11-07
状態: 採用(ユーザー決定2026-11-07)

## 背景
ADR 0003ではホスティングを未決とし、`output: 'standalone'`でホスト中立を保ってきた。候補はVercel(Hobbyは非商用のみ、Proは月20ドル)、Cloudflare(OpenNext経由で制約あり)、VPS。
SupabaseクラウドはFreeだと1週間アクセスがないと停止し、Proは月25ドルかかる。本サービスのSupabase利用はAuthと2テーブルだけで、全部入りのセルフホストは要らない。
固定費を抑え、商用化の制約を持たず、設定をCLIで再現できることを重視した。

## 決定
- **さくらのVPS 4GB(東京)1台**に以下を同居させる。Supabaseも東京に置く方針(architecture.md 7章)と整合する。
- **Coolify** をPaaS層にする。TLS(Let's Encrypt)、GitHub連携の自動デプロイ、ヘルスチェック付きの無停止デプロイを任せる。設定は公式CLI(`coolify`)とREST APIで行い、Web画面での手作業を残さない。
- **Next.js** はGitHub ActionsでDockerイメージをビルドしてGHCRにpushし、Coolifyはそれをpullして起動するだけにする(VPS上でビルドしない)。`output: 'standalone'`は維持する。`CONTENT_VERSION`はActionsの`github.sha`をbuild-argで渡す。
- **Supabase** はセルフホストをPostgres、GoTrue(Auth)、PostgREST、Kongの4サービスに削って動かす。Realtime、Storage、Studio、ログ分析、Edge Functionsは入れない(architecture.md 3章の方針通り)。匿名サインインはGoTrueの`GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED=true`で有効化する。マイグレーションは`supabase db push --db-url`で適用する。
- **VPSの契約だけWeb画面**で行う(usacloudはさくらのクラウド専用でVPSには使えない)。初期設定(SSH鍵、パケットフィルタ22/80/443、unattended-upgrades、Coolify導入)はスタートアップスクリプトで流す。
- **外部へのバックアップは置かない。** DBの中身は匿名ユーザーの進捗と回答ログだけで、消えても β のやり直しで済む。本登録(フェーズ7)を始める前に再検討する。

## 検討した代替
- Vercel Hobby + SupabaseクラウドFree: 最も手軽だが、Hobbyは非商用限定、Supabase Freeは停止する。有料化すると月45ドル超になる。
- Cloudflare(OpenNext): 無料枠は広いが、Next.js 16をOpenNext経由で動かす制約を β 前に踏む価値がない。
- Hetzner: 2026年の値上げと安価プランの新規制限、最寄りがシンガポールで東京まで遠い。
- Dokploy: Coolifyと同等だがDocker Swarm前提で、1台構成では利点がなく、情報量も少ない。
- 2GBプラン: Coolify + Next.js + 削ったSupabaseで1〜1.5GB使うため、ビルドや更新で足りなくなる。

## 影響
- 設計原則「ホスティング中立」はDockerで動くことに読み替える。ISRや特定ホストのAPIには引き続き依存しない。
- 追加する成果物: `Dockerfile`、イメージをGHCRにpushするGitHub Actions、VPSのスタートアップスクリプト、Coolifyの設定手順(docs)。
- Supabaseイメージの更新は自分で追う。β 中は月1回を目安にする。
- メール認証(フェーズ7)を足す時はSMTPが別途要る。
- 単一障害点になる。VPSが止まると学習も回答保存も止まるので、Coolifyの通知(メール等)を最初に設定する。
