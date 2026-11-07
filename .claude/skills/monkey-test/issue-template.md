# Issue の書式

タイトルは「<操作> すると <実際の挙動>(<条件>)」の形で、現象が一読で分かるように(例: 「行を削除で空にした直後に記帳すると、
貸借が空のまま『できました』になる(post ステップ)」)。

ラベル: `bug,needs-triage,<p1|p2|p3>,<area:ide|area:content|area:progress|area:ui>`。

- p1: 学習が進められない、データが壊れる、例外で画面が死ぬ
- p2: 誤った理解を招く(採点・解説・影響表示の誤り)、保存されない、操作が無言で失敗する
- p3: 見た目・文言・小さな違和感、UX 上の迷い

本文:

```
## 現象
(1〜3 行)

## 再現手順
1. `/units/<topic>/<unit>` を開く(新しいゲスト / 既存のゲスト)
2. 借方「現金」100000、貸方「資本金」100000 を入力し「記帳する」
3. …

## 期待
## 実際

## 実測
- 日時: 2026-11-08 02:13 JST、再現 3/3(新しいゲストでも再現)
- console / network: (check() の所見の抜粋)
- DB: (unit_progress / attempts の該当行)

## 影響
(学習者にとって何が困るか)

## 証拠
- スクリーンショット: `logs/monkey/<session>/shots/NN-….png`
- trace: `logs/monkey/<session>/trace-….zip`

## 再現スクリプト
(`e2e/repro/issue-<n>.spec.ts` にそのまま置ける Playwright の test 1 本。期待どおりなら通り、不具合があれば落ちる形)

---
Monkey テスト(人格: <人格名>)で検出。操作履歴: `logs/monkey/<session>/history.md`
```
