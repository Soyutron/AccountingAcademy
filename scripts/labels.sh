#!/usr/bin/env bash
# 品質改善ループ(docs/quality-loop.md)が使うラベルをGitHubに作る。初回のみ。既存のラベルは説明と色を更新する。
set -eu
cd "$(dirname "$0")/.."
label() { gh label create "$1" --color "$2" --description "$3" --force; }
label needs-triage      e4e669 "triage-agentが再現と振り分けを行う"
label needs-info        d876e3 "再現しなかった。次の観測を待つ"
label ready-for-agent   0e8a16 "再現済み。issue-agentが修正する"
label ready-for-human   fbca04 "設計・デザイン・コンテンツ方針の判断が要る"
label agent:in-progress 1d76db "issue-agentが処理中"
label agent:needs-human b60205 "issue-agentが中断した。人が引き継ぐ"
label agent:verified    0052cc "統合後にmainで再現スクリプトが通った"
label type:bug      d73a4a "不具合(Monkeyか人が起票)"
label type:feature  a2eeef "機能(roadmapの項目を分解したもの)"
label type:content  0e8a16 "単元・概念・演習の追加や改訂"
label p1 b60205 "学習が進められない / データが壊れる"
label p2 d93f0b "誤った理解を招く / 保存されない / 操作が無言で失敗する"
label p3 fbca04 "見た目・文言・小さな違和感"
label area:ide      1d76db "会計IDEの操作と状態(ide-shellと各ペイン)"
label area:content  0e8a16 "解説・採点・誤解判定・用語・図(content/ とgrading)"
label area:progress 5319e7 "匿名サインイン・進捗と回答の保存・再開"
label area:ui       c5def5 "レイアウト・レスポンシブ・アクセシビリティ・アニメーション"
