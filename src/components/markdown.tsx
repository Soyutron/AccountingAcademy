import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import wikiLink from "remark-wiki-link";
import { accountList, accountMap, glossaryMap } from "@/lib/content";
import { findAccountByName } from "@/lib/accounting";
import { parseJournalBlock, toEntryLines } from "@/lib/journal-block";
import { Term } from "./term";
import { JournalEditor } from "./journal-editor";
import { fromJournalEntry } from "@/lib/journal-editable";

// 単元本文の描画。[[id|表示語]] は用語ポップオーバー、```journal は仕訳エディタ(読み取り専用)になる

const TERM_HREF = /^\/glossary#(.+)$/;

const components: Components = {
  a: ({ href, className, children }) => {
    const m = href ? TERM_HREF.exec(href) : null;
    if (m && typeof className === "string" && className.includes("term")) {
      const entry = glossaryMap.get(m[1]);
      if (!entry) throw new Error(`用語 ${m[1]} が用語集にありません`);
      // [[id]] と書かれた(表示語が無い)ときは用語の名前を出す
      const label = String(children) === entry.id ? entry.name : children;
      return <Term entry={entry}>{label}</Term>;
    }
    return <a href={href}>{children}</a>;
  },
  // 仕訳ブロックを div で描画するため、pre は素通しにする
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    if (className === "language-journal") {
      const lines = parseJournalBlock(String(children));
      const entry = toEntryLines(lines, (name) => findAccountByName(name, accountList)?.id);
      return (
        <div className="my-4">
          <JournalEditor accounts={accountList} value={fromJournalEntry(entry, accountMap)} readOnly />
        </div>
      );
    }
    return className ? (
      <pre>
        <code className={className}>{children}</code>
      </pre>
    ) : (
      <code>{children}</code>
    );
  },
};

export function Markdown({ body }: { body: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[
        remarkGfm,
        [
          wikiLink,
          {
            aliasDivider: "|",
            pageResolver: (name: string) => [name],
            hrefTemplate: (id: string) => `/glossary#${id}`,
            wikiLinkClassName: "term",
            newClassName: "term-missing",
            permalinks: [...glossaryMap.keys()],
          },
        ],
      ]}
      components={components}
    >
      {body}
    </ReactMarkdown>
  );
}
