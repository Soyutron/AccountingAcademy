"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TUTORIAL_UNIT_ID, updateTutorial, useTutorialState } from "@/lib/tutorial-store";

// 「使い方」: 各機能の説明と、チュートリアルのやり直し・表示設定

const FEATURES: { title: string; body: string }[] = [
  { title: "ガイド(左)", body: "物語と「やること」。ステップごとに 2〜4 文。迷ったら「ヒントを見る」、2 回間違えたら「答えを見る」。" },
  { title: "仕訳帳(中央)", body: "科目と金額を入れて「記帳する」。科目は途中まで打つと候補が出ます。金額欄で Enter でも記帳できます。" },
  { title: "影響の表示", body: "入力中の仕訳で 5 要素と当期純利益がどう動くかを、記帳の前に見せます。" },
  { title: "結果(右)", body: "貸借対照表と損益計算書。記帳のたびに動いた行が光り、▲▼ で差分が出ます。科目名に触れると意味と要素が出ます。" },
  { title: "会社のかたち", body: "資産と、負債 + 純資産の帯。会社の構造を一目で。" },
  { title: "帳簿をさかのぼる", body: "結果の上のスライダーで、記帳を 1 件ずつ巻き戻して会社の姿を見られます。" },
  { title: "総勘定元帳(T 勘定)", body: "中央のタブで、科目ごとの増減を左右に分けて見られます。" },
  { title: "予想して記帳する", body: "一部のステップでは、記帳の前に 5 要素の動きを予想します。外れても実際の動きと比べて進めます。" },
  { title: "5 つの箱に分ける(仕分けボード)", body: "科目を選んでから、入れる箱を押します。全部入れたら「確認する」。間違えた科目は赤く示されます。" },
  { title: "金額で答える", body: "結果の表や問題文から金額を読み取って入力し、「確認する」(Enter でも可)。" },
  { title: "条件を変える", body: "スライダーで金額や年数を動かし、計算結果がどう変わるかを試します。" },
  { title: "続きから", body: "途中でやめても、次に開いたときに前回のステップから再開できます(同じブラウザ)。" },
];

export function HelpDialog({ onRestartTour }: { onRestartTour?: () => void }) {
  const state = useTutorialState();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-tour="help-button">
          使い方
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>会計 IDE の使い方</DialogTitle>
          <DialogDescription>各機能の説明と、チュートリアルの設定です。</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {onRestartTour ? (
            // 同じページでツアーを始めるので、ダイアログを閉じないとツアーがモーダルの背後に隠れる
            <DialogClose asChild>
              <Button size="sm" onClick={onRestartTour}>
                チュートリアルを最初から
              </Button>
            </DialogClose>
          ) : (
            <Button size="sm" asChild>
              <Link href={`/units/${TUTORIAL_UNIT_ID}?tour=1`}>チュートリアルを最初から</Link>
            </Button>
          )}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={state.enabled} onChange={(e) => updateTutorial({ enabled: e.target.checked })} />
            初めて単元を開いたときにチュートリアルを案内する
          </label>
        </div>
        <dl className="space-y-3 text-sm">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <dt className="font-semibold">{f.title}</dt>
              <dd className="text-muted-foreground">{f.body}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
