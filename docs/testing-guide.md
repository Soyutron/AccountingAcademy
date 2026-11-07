# 自分でテストするときの手引き(M1)

更新日: 2026-11-07。当面はユーザー自身がテスターを務める(roadmap.md 4 章)。

## 1. 起動

```bash
pnpm db:start   # 初回のみ時間がかかる。キーは .env.local(.env.example 参照)
pnpm dev        # http://localhost:3000
```

進捗と回答はローカルの Supabase に匿名ユーザーとして保存される。ブラウザを変えると別の学習者になる。
やり直したいときは `pnpm db:reset`(全データが消える)。

## 2. 見るポイント(要件 6.2、ide-design.md)

学習者として 3 級パスを頭から進めながら、次を記録する。

| 観点 | 問い |
|---|---|
| 読む量 | 各ステップの説明は「読んでから動く」までに長すぎないか。2〜4 文の約束が守られているか |
| 操作 | 仕訳帳に入力して記帳するまでの手数は自然か。Enter で記帳できるか。科目名の補完は邪魔にならないか |
| 結果 | 記帳の直後に、右の財務諸表の「どこが動いたか」が目で追えるか。飛ぶ数字と ▲▼ は助けになるか、邪魔か |
| 誤り | わざと貸借を逆にしたとき、「あなたの仕訳 vs 期待される動き」と思い込みの説明で、何が違うか分かるか |
| 予想 | predict のステップで、予想が外れたときに納得できるか |
| 条件を変える | スライダーで式の意味が体で分かるか。目標に届いたときの手応えがあるか |
| 図解 | 図があるステップで、図が理解を助けたか。無くてもよい図はどれか |
| 用語 | 初めて出る用語が、その場の操作と結びついて説明されているか。ポップオーバーの「もっと見る」は使ったか |
| 続き | 途中で離脱して戻ったとき、「続きから」で違和感なく再開できるか |
| 端末 | スマートフォン幅で、タブの切り替えと下部のボタンが使えるか |

気づきは GitHub の Issue に 1 件ずつ(単元・ステップ・何が起きたか・どう感じたか)。

## 3. 指標の集計(ローカル Supabase)

回答ログは `public.attempts`、進捗は `public.unit_progress`。psql はコンテナにある。

```bash
docker exec -it supabase_db_AccountingAcademy psql -U postgres -d postgres
```

課題ごとの初回正答率(predict と post を比べると、理解と操作の差が見える):

```sql
with first_try as (
  select distinct on (user_id, exercise_id) user_id, exercise_id, correct
  from attempts order by user_id, exercise_id, created_at
)
select exercise_id,
       count(*)                           as learners,
       round(avg(correct::int) * 100, 0)  as first_try_correct_pct
from first_try
group by exercise_id
order by exercise_id;
```

思い込み(誤解)の出現回数と、同じ学習者での再発:

```sql
select misconception_id,
       count(*)                       as occurrences,
       count(distinct user_id)        as learners,
       count(*) - count(distinct user_id) as repeats
from attempts
where misconception_id is not null
group by misconception_id
order by occurrences desc;
```

単元の完走状況:

```sql
select unit_id, status, step, updated_at
from unit_progress
order by updated_at desc;
```

## 4. 判断の目安

- predict の初回正答率が単元を追うごとに上がっていれば、原理の理解が積み上がっている。
- 同じ思い込みが同じ学習者で繰り返し出るなら、その誤解の説明か、解きほぐす単元の導線を直す。
- 初回正答率が極端に低い課題は、説明文か誤答パターン(ヒント・フィードバック)を見直す。極端に高い課題は簡単すぎるか、答えが説明文に書いてある。
