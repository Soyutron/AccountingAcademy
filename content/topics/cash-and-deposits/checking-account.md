---
id: cash-and-deposits/checking-account
title: 小切手で払う
summary: 問屋への支払いに小切手を使うため当座預金を開き、振り出した小切手と受け取った小切手の記録の違い、残高を超えたときの当座借越を身につける
level: 1
order: 2
introduces: [checking_account, check, bank_overdraft]
concepts: [asset, liability]
requires: [cash-and-deposits/cash-over-and-short]
scenario:
  company: カフェ「マメノキ」
  opening:
    - { account: cash, amount: 297000 }
    - { account: bank_deposit, amount: 500000 }
    - { account: equipment, amount: 600000 }
    - { account: accounts_payable, amount: 60000 }
    - { account: loans_payable, amount: 300000 }
    - { account: capital_stock, amount: 1000000 }
    - { account: retained_earnings, amount: 40000 }
    - { account: sales, amount: 80000 }
    - { account: purchases, amount: 30000 }
    - { account: rent_expense, amount: 50000 }
    - { account: communication_expense, amount: 2000 }
    - { account: miscellaneous_loss, amount: 1000 }
---

## 小切手で払ってほしい
問屋から「毎月の支払いは小切手にしてもらえると助かる」と言われました。大きな金額の現金を持ち歩かなくて済むからです。
小切手で支払うには、銀行に専用の預金口座を開きます。これが [[checking_account|当座預金]] です。普通預金と違って利息は付きませんが、小切手を振り出せます。

```figure
type: flow
alt: 小切手を相手に渡すと、相手が銀行に持ち込み、自分の当座預金から引き落とされる
nodes: [小切手を書いて渡す, 相手が銀行へ持ち込む, 当座預金から引き落とし]
highlight: 2
```

## 当座預金を開く
銀行で当座取引の契約をして、普通預金から 200,000 円を当座預金に移しました。
お金が普通預金から当座預金へ動いただけです。どちらも資産なので、資産の合計は変わりません。左に当座預金、右に普通預金です。

```task
type: post
transaction: 当座預金口座を開き、普通預金から 200,000 円を振り替えた
answer:
  debit: [{ account: checking_account, amount: 200000 }]
  credit: [{ account: bank_deposit, amount: 200000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 増えるのは当座預金なので左、減るのは普通預金なので右です。
  - match: { credit: [{ account: cash }] }
    feedback: 今回は普通預金から移しました。手元の現金は動いていません。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 200,000 にしましょう。
hint: 左に当座預金 200,000、右に普通預金 200,000 です。
success: 貸借対照表に当座預金が現れ、普通預金が同じだけ減りました。資産の合計は変わっていません。
```

## 買掛金を小切手で払う
問屋への買掛金 60,000 円を、小切手を書いて支払いました。「この紙を銀行に持っていけば、当座預金から払います」という紙が [[check|小切手]] です。
小切手を渡した瞬間、手元の現金は減っていません。減るのは当座預金です。記帳の前に、5 つの箱がどう動くか予想してみましょう。

```task
type: predict
transaction: 問屋への買掛金 60,000 円を、小切手を振り出して支払った
entry:
  debit: [{ account: accounts_payable, amount: 60000 }]
  credit: [{ account: checking_account, amount: 60000 }]
answer: { asset: decrease, liability: decrease, equity: none, revenue: none, expense: none }
wrong_patterns:
  - match: { asset: none }
    misconception: check_is_cash
    feedback: 小切手を渡した分は、当座預金から引き落とされます。資産(当座預金)が減ります。
  - match: { expense: increase }
    misconception: payable_payment_is_purchase
    feedback: 仕入は商品を受け取ったときに記録済みです。今回は「払う義務」を果たしただけなので、費用は増えません。
  - match: { liability: none }
    feedback: 買掛金という「払う義務」が無くなります。負債が減ります。
hint: 買掛金(負債)と当座預金(資産)が同じだけ減ります。もうけは動きません。
success: 買掛金が消え、当座預金が 140,000 になりました。手元の現金は 297,000 のままです。
```

## 仕入も小切手で
新しい豆を 25,000 円分仕入れ、代金は小切手で払いました。
商品を受け取ったので左は仕入。右は、小切手を振り出したので当座預金です。「現金」と書きたくなりますが、自分が振り出した小切手は当座預金から落ちます。

```task
type: post
transaction: 問屋からコーヒー豆(商品)25,000 円分を仕入れ、代金は小切手を振り出して支払った
answer:
  debit: [{ account: purchases, amount: 25000 }]
  credit: [{ account: checking_account, amount: 25000 }]
wrong_patterns:
  - match: { swapped: true }
    feedback: 仕入は費用なので左、当座預金は減るので右です。
  - match: { credit: [{ account: cash }] }
    misconception: check_is_cash
    feedback: 自分が振り出した小切手は当座預金から引き落とされます。手元の現金は動きません。
  - match: { credit: [{ account: bank_deposit }] }
    feedback: 小切手が落ちるのは当座預金です。普通預金からは引き落とされません。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 25,000 にしましょう。
hint: 左に仕入 25,000、右に当座預金 25,000 です。
success: 当座預金が 115,000 になりました。小切手を振り出すたびに、ここから減っていきます。
```

## 受け取った小切手
近所の会社にコーヒー豆を 30,000 円分納め、代金としてその会社が振り出した小切手を受け取りました。
受け取った小切手は、銀行に持っていけばすぐお金に換えられます。だから、他人が振り出した小切手を受け取ったときは「現金」として記録します。自分が振り出すときの当座預金とは扱いが違います。

```task
type: post
transaction: 近所の会社にコーヒー豆(商品)30,000 円分を売り、代金として先方が振り出した小切手を受け取った
answer:
  debit: [{ account: cash, amount: 30000 }]
  credit: [{ account: sales, amount: 30000 }]
wrong_patterns:
  - match: { swapped: true }
    misconception: debit_means_increase
    feedback: 受け取った小切手(現金)が増えるので左、売上は右です。
  - match: { debit: [{ account: checking_account }] }
    misconception: check_is_cash
    feedback: 他人が振り出した小切手を受け取ったときは現金として扱います。当座預金に入れたわけではありません。
  - match: { debit: [{ account: accounts_receivable }] }
    feedback: 代金はもう小切手で受け取っています。「後で受け取る権利」ではありません。
  - match: { unbalanced: true }
    feedback: 左の合計と右の合計がそろっていません。どちらも 30,000 にしましょう。
hint: 左に現金 30,000、右に売上 30,000 です。
success: 現金が 327,000 に増えました。受け取った小切手は現金、振り出した小切手は当座預金。この違いを覚えておきましょう。
```

## 当座預金はいくら
当座預金を開いてから、小切手で 2 回支払いました。いまの当座預金の残高はいくらでしょう。右の貸借対照表を見ずに計算してから、確かめてみましょう。

```task
type: calc
question: いまの当座預金の残高はいくらですか(円)
answer: 115000
wrong_patterns:
  - match: 145000
    misconception: check_is_cash
    feedback: 受け取った小切手 30,000 円は現金に入れました。当座預金には足しません。
  - match: 140000
    feedback: 買掛金 60,000 円のあとに、仕入 25,000 円も小切手で払いました。
  - match: 85000
    feedback: 受け取った小切手は当座預金から引きません。200,000 − 60,000 − 25,000 です。
hint: 200,000 − 60,000 − 25,000。
success: 当座預金は 115,000 円。振り出した小切手の分だけ減っています。
```

## 残高を超えて振り出したら
もし当座預金が 100,000 円しかないときに、150,000 円の小切手を振り出したらどうなるでしょう。銀行と「当座借越契約」を結んでおくと、決められた限度まで銀行が立て替えてくれます。
超えた 50,000 円は銀行からの借金です。これが [[bank_overdraft|当座借越]] で、名前に「当座」と付いていても負債です。決算で残っていれば、借入金の仲間として右側に載ります。

```figure
type: elements
alt: 当座預金は資産の箱、当座借越は借入金と同じ負債の箱に入る
items:
  - { account: checking_account, highlight: true }
  - { account: bank_overdraft, highlight: true }
  - { account: loans_payable }
```

```journal
借方: 買掛金 150,000
貸方: 当座預金 100,000
貸方: 当座借越 50,000
```

## 箱に分ける
当座預金と当座借越、現金と買掛金。4 つの科目を 5 つの箱に分けてみましょう。
名前に「当座」が付いていても、片方は資産、もう片方は負債です。

```task
type: classify
accounts: [checking_account, bank_overdraft, cash, accounts_payable]
misconceptions:
  bank_overdraft:
    asset: overdraft_is_deposit
hint: 当座預金と現金は資産、当座借越と買掛金は負債です。
success: 当座預金は資産、当座借越は負債。「預金の残高がマイナスになった分は借金」と考えると分かりやすいです。
```

## ふりかえり
当座預金は小切手で支払うための預金です。自分が小切手を振り出せば当座預金が減り、他人の小切手を受け取れば現金が増えます。残高を超えて振り出した分は当座借越という負債です。
お金の置き場所が「現金」「普通預金」「当座預金」と増えても、どれも資産です。どこから出て、どこへ入ったかを正確に書くのが、このテーマで身につけたいことです。
次は、細かい支払いを担当者に任せる「小口現金」です。
