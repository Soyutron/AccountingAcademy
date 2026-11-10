import { type Task, canRevealAnswer } from "@/lib/grading";

// ヘルプの話題の正本。「?」のポップオーバー・「使い方」はこの表から文言を引く(docs/help-design.md 4 章)

export type HelpCategory = "guide" | "work" | "result" | "task" | "progress";

export interface HelpContext {
  taskType: Task["type"];
  postedCount: number;
  isLast: boolean;
  hasHint: boolean;
}

export interface HelpTopic {
  id: string;
  category: HelpCategory;
  title: string;
  // 「?」用。1〜2 文
  short: string;
  // 「使い方」用。手順とキーボードの別手段。4 文まで。課題の種類で言えることが変わる話題は関数にする
  body: string | ((ctx: HelpContext) => string);
  // 「いまの画面でできること」に入れる条件。無ければ常に
  when?: (ctx: HelpContext) => boolean;
  // 「場所を示す」で光らせる要素(data-tour の値)と、スマートフォンで切り替えるペイン
  target?: string;
  pane?: "guide" | "work" | "result";
}

export const HELP_CATEGORIES: { id: HelpCategory; label: string }[] = [
  { id: "guide", label: "ガイド(読む)" },
  { id: "work", label: "ワークスペース(書く)" },
  { id: "result", label: "結果(見る)" },
  { id: "task", label: "課題の種類" },
  { id: "progress", label: "進め方" },
];

const canWrite = (c: HelpContext) => c.taskType === "post" || (c.taskType === "observe" && c.isLast);

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "guide",
    category: "guide",
    title: "ガイドの読み方",
    target: "guide",
    pane: "guide",
    short: "ガイドに、物語と「やること」が出ます。読んだらすぐ手を動かします。",
    body: "ガイドに、物語と「やること」が出ます。ステップごとに 2〜4 文だけなので、読んだらすぐ手を動かします。問題文の金額を押すと、仕訳帳の金額欄に入ります。",
  },
  {
    id: "hint",
    category: "guide",
    title: "ヒントと答え",
    target: "hint",
    pane: "guide",
    short: "迷ったら「ヒントを見る」で手がかりが出ます。2 回間違えると「答えを見る」も使えます。",
    body: (c) =>
      canRevealAnswer(c.taskType)
        ? "迷ったら「ヒントを見る」で手がかりが出ます。2 回間違えると「答えを見る」も使えます。答えを見ても次へ進めますが、できれば見る前にもう一度だけ試してみましょう。"
        : "迷ったら「ヒントを見る」で手がかりが出ます。",
    when: (c) => c.hasHint,
  },
  {
    id: "journal",
    category: "work",
    title: "仕訳帳に書く",
    target: "journal",
    pane: "work",
    short: "科目と金額を入れて「記帳する」を押します。科目は途中まで打つと候補が出ます。",
    // post は不一致も採点するので押せる。止めるのは採点の無い自由に試すだけ(Issue #199)
    body: (c) =>
      `科目と金額を入れて「記帳する」を押します。科目は途中まで打つと候補が出ます。金額欄で Enter を押しても記帳できます。${
        c.taskType === "observe" && c.isLast ? "借方と貸方の合計がそろうまで「記帳する」は押せません。" : "借方と貸方の合計がそろっていないまま押すと、そろえるよう案内が出ます。"
      }`,
    when: canWrite,
  },
  {
    id: "impact",
    category: "work",
    title: "影響の表示",
    target: "impact",
    pane: "work",
    short: "入力中の仕訳で 5 要素と当期純利益がどう動くかを、記帳する前に見せます。",
    body: "入力中の仕訳で 5 要素と当期純利益がどう動くかを、記帳する前に見せます。動く要素だけに色が付きます。借方と貸方の合計がそろうと「一致」になります。",
    when: canWrite,
  },
  {
    id: "posted",
    category: "work",
    title: "記帳済みの一覧",
    short: "記帳した仕訳が下に積まれていきます。いちばん新しいものに枠が付きます。",
    body: "記帳した仕訳が「仕訳帳(記帳済み)」タブに積まれていきます。この単元で記帳したものに枠が付きます。科目名に触れると意味と要素が出ます。",
  },
  {
    id: "ledger",
    category: "work",
    title: "総勘定元帳(T 勘定)",
    target: "ledger",
    pane: "work",
    short: "科目ごとの増減を左右に分けて見られます。ワークスペースのタブで切り替えます。",
    body: "「総勘定元帳(T 勘定)」タブで、科目ごとの増減を左右に分けて見られます。仕訳帳は取引の順、元帳は科目ごと、という見方の違いが分かります。",
  },
  {
    id: "statements",
    category: "result",
    title: "貸借対照表と損益計算書",
    target: "statements",
    pane: "result",
    short: "記帳のたびに結果の表が動きます。動いた行が光り、▲▼ で差分が出ます。",
    body: "記帳のたびに結果の表が動きます。動いた行が光り、▲▼ で前のステップとの差分が出ます。科目名に触れると意味と要素が出ます。貸借対照表の左右の合計は、いつも一致します。",
  },
  {
    id: "shape",
    category: "result",
    title: "会社のかたち",
    target: "shape",
    pane: "result",
    short: "左の帯が資産、右の帯が負債と純資産です。同じ幅になり、記帳のたびに中身が変わります。",
    body: "貸借対照表の上の帯です。左が資産、右が負債と純資産で、幅はいつも同じになります。記帳のたびに中身の割合が変わるので、「資産は負債と純資産でまかなわれる」構造が目で分かります。",
    when: (c) => c.postedCount >= 1,
  },
  {
    id: "rewind",
    category: "result",
    title: "帳簿をさかのぼる",
    target: "rewind",
    pane: "result",
    short: "結果の上のスライダーで、記帳を 1 件ずつ巻き戻せます。動かすと、その時点の会社の姿になります。",
    body: "結果の上のスライダーで、記帳を 1 件ずつ巻き戻せます。動かすと、その時点の貸借対照表と損益計算書になります。矢印キーでも動かせます。「最新に戻る」で戻ります。",
    when: (c) => c.postedCount >= 2,
  },
  {
    id: "changed",
    category: "result",
    title: "このステップで動いた要素",
    short: "このステップの記帳で、5 要素のどれがいくら動いたかをまとめて出します。",
    body: "結果の下に、このステップの記帳で 5 要素のどれがいくら動いたかをまとめて出します。表のどこが変わったか分からなくなったら、ここを見ます。",
  },
  {
    id: "predict",
    category: "task",
    title: "予想して記帳する",
    target: "task-predict",
    pane: "work",
    short: "記帳の前に、5 要素がどう動くかを選びます。外れても実際の動きと見比べて進めます。",
    body: "記帳の前に、5 要素それぞれが増えるか減るか変わらないかを選びます。「予想して記帳する」を押すと記帳され、予想と実際の動きが並びます。外れても進めます。処理を覚えるより、影響を考える練習です。",
    when: (c) => c.taskType === "predict",
  },
  {
    id: "classify",
    category: "task",
    title: "5 つの箱に分ける",
    target: "task-classify",
    pane: "work",
    short: "科目を箱へドラッグするか、科目を押してから箱を押します。全部入れたら「確認する」。",
    body: "科目を箱(資産・負債・純資産・収益・費用)へドラッグするか、科目を押してから入れる箱を押します。タッチ操作では科目を少し長押ししてから動かします。全部入れたら「確認する」。間違えた科目は赤く示され、なぜその要素かの説明が出ます。",
    when: (c) => c.taskType === "classify",
  },
  {
    id: "calc",
    category: "task",
    title: "金額で答える",
    target: "task-calc",
    pane: "work",
    short: "問題文を読んで金額を入力し、「確認する」を押します。",
    body: "問題文を読んで金額を入力し、「確認する」を押します(Enter でも可)。桁区切りのカンマや「円」は付けても付けなくても構いません。",
    when: (c) => c.taskType === "calc",
  },
  {
    id: "tweak",
    category: "task",
    title: "条件を変える",
    target: "task-tweak",
    pane: "work",
    short: "スライダーで金額や年数を動かし、計算結果がどう変わるかを試します。目標の値にすると次へ進めます。",
    body: "スライダーで金額や年数を動かし、計算結果がどう変わるかをその場で見ます。目標の値になると「できました」が出て次へ進めます。矢印キーでも 1 目盛りずつ動かせます。",
    when: (c) => c.taskType === "tweak",
  },
  {
    id: "sandbox",
    category: "task",
    title: "自由に試す",
    target: "task-sandbox",
    pane: "work",
    short: "最後のステップでは、好きな取引を記帳して財務諸表がどう動くか確かめられます。",
    body: "最後のステップでは、好きな取引を記帳して財務諸表がどう動くか確かめられます。採点はありません。借方と貸方の合計がそろえば記帳できます。",
    when: (c) => c.taskType === "observe" && c.isLast,
  },
  {
    id: "steps",
    category: "progress",
    title: "ステップと「次へ」",
    target: "next-button",
    short: "上の「ステップ n / N」が進み具合です。課題ができると下の「次へ →」が押せます。",
    body: "上の「ステップ n / N」が進み具合です。課題ができると下の「次へ →」が押せます。「← 前へ」で見直しに戻れ、達成したステップには「次へ」でまた進めます。",
  },
  {
    id: "resume",
    category: "progress",
    title: "続きから",
    short: "途中でやめても、次に開いたときに前回のステップから再開できます(同じブラウザ)。",
    body: "途中でやめても、次に開いたときにガイドの上に「続きから」が出て、前回のステップから再開できます。案内は最初のステップにいる間だけ出ます。進み具合は同じブラウザに保存されます。",
  },
];

const byId = new Map(HELP_TOPICS.map((t) => [t.id, t]));

export function helpTopic(id: string): HelpTopic {
  const t = byId.get(id);
  if (!t) throw new Error(`help topic not found: ${id}`);
  return t;
}

// 初めて画面に出たときに案内を出す課題の種類(docs/help-design.md 5.2)
export const FIRST_TIME_IDS = ["predict", "classify", "calc", "tweak", "sandbox"] as const;

/** 現在のステップで初出の案内を出す話題。該当しなければ null */
export function firstTimeTopic(ctx: HelpContext): HelpTopic | null {
  const id = ctx.taskType === "observe" ? (ctx.isLast ? "sandbox" : null) : ctx.taskType === "post" ? null : ctx.taskType;
  return id ? helpTopic(id) : null;
}

export function topicBody(t: HelpTopic, ctx: HelpContext): string {
  return typeof t.body === "string" ? t.body : t.body(ctx);
}

/** 「場所を示す」を付けるか: 対象があり、いまの画面に出ている */
export function canShowTarget(t: HelpTopic, ctx: HelpContext): boolean {
  return Boolean(t.target) && (!t.when || t.when(ctx));
}

/** 「いまの画面でできること」。ガイド → ワークスペース → 結果 → 課題の順(表の順)で、条件を満たす話題だけ */
export function currentTopics(ctx: HelpContext): HelpTopic[] {
  return HELP_TOPICS.filter((t) => t.when && t.when(ctx));
}
