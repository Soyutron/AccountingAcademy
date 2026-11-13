import type { Metadata } from "next";

export const metadata: Metadata = { title: "プライバシーポリシー" };

// 運営者名と問い合わせ先は正式名称の決定(#76)で置き換える。法的な文言は運営者が最終確認する
const ISSUES_URL = "https://github.com/Soyutron/openboki/issues";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 space-y-6 leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:pt-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
        <p className="text-muted-foreground">
          Open簿記の運営者(以下「運営者」)が、学習者の情報をどう取得し、何に使い、いつ消すかを定めます。
        </p>
      </div>

      <section className="space-y-2">
        <h2>取得する情報</h2>
        <p>
          ログインは要りません。単元を読むだけでは何も保存しません。最初に課題へ回答した時点で匿名のユーザーを作り、次の情報を保存します。
        </p>
        <ul>
          <li>匿名ユーザーID: ランダムに作る識別子で、氏名やメールアドレスとは結び付きません。</li>
          <li>回答: 課題ごとの回答内容、正誤、判定した誤解の種類、回答した日時。</li>
          <li>進捗: 単元ごとの開始・完了と、どのステップまで進んだか。</li>
          <li>
            ブラウザが送る情報: IPアドレス、ブラウザの種類、アクセスした日時とURL。サーバーのアクセスログに残り、障害の調査と不正なアクセスへの対処にだけ使います。
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>利用目的</h2>
        <p>
          回答と進捗は、別の日に続きから学べるようにするためと、どの課題でどの誤解が起きているかを見つけて教材を直すために使います。広告や、学習と関係のない目的には使いません。
        </p>
      </section>

      <section className="space-y-2">
        <h2>保存期間</h2>
        <p>
          匿名ユーザーは、最終活動(進捗の更新か回答の保存)から90日たつと、そのユーザーの回答と進捗をまとめて自動で削除します。削除したあとは同じブラウザでも続きから再開できません。
        </p>
      </section>

      <section className="space-y-2">
        <h2>公開する情報と第三者への提供</h2>
        <p>
          学習者ひとりひとりの回答や進捗は公開しません。教材の改善のために、課題ごとの正答率や誤解の分布のような、個人を特定できない形に集計した数字を公開することがあります。
        </p>
        <p>法令に基づく場合を除き、取得した情報を第三者に提供・販売しません。</p>
      </section>

      <section className="space-y-2">
        <h2>Cookieとローカルストレージ</h2>
        <ul>
          <li>Cookie: 匿名ユーザーのログイン状態(セッション)を保つために使います。</li>
          <li>ローカルストレージ: 選んだテーマとライト・ダークの表示、操作ツアーを見たかどうかを、お使いのブラウザの中にだけ保存します。</li>
        </ul>
        <p>
          アクセス解析や広告のためのCookieは使いません。ブラウザのサイトデータを消すと、匿名ユーザーとのつながりも切れ、それまでの進捗を引き継げなくなります。
        </p>
      </section>

      <section className="space-y-2">
        <h2>問い合わせ先</h2>
        <p>
          このポリシーと情報の扱いについての問い合わせは、
          <a href={ISSUES_URL} className="underline underline-offset-2 hover:text-foreground">
            GitHub Issues
          </a>
          で受け付けます。Issueは公開されるので、個人を特定できる情報は書かないでください。
        </p>
      </section>

      <section className="space-y-2">
        <h2>改定</h2>
        <p>
          内容を変えるときは、このページを更新し、改定日を書き換えます。取得する情報や利用目的が広がる変更は、施行の前にこのページとリポジトリで告知します。
        </p>
        <p className="text-muted-foreground">制定: 2026年11月13日</p>
      </section>
    </article>
  );
}
