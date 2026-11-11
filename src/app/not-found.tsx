import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="text-muted-foreground">
        URLが間違っているか、ページが移動・削除された可能性があります。次のどこかから学習を続けてください。
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <Link href="/" className="underline">
            トップへ戻る
          </Link>
          (学習パスとテーマの一覧)
        </li>
        <li>
          <Link href="/paths/boki-3" className="underline">
            3級合格パス
          </Link>
        </li>
        <li>
          <Link href="/glossary" className="underline">
            用語集
          </Link>
        </li>
      </ul>
    </div>
  );
}
