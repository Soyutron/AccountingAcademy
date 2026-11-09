import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const src = readFileSync("content/topics/merchandise/three-account-method.md", "utf8");

// 「## 見出し」から次の見出しまでを取り出す
function section(heading: string): string {
  const body = src.split(`## ${heading}\n`)[1];
  if (body === undefined) throw new Error(`見出しが無い: ${heading}`);
  return body.split(/^## /m)[0];
}

// 売れ残りは財産だと後の単元で習うので、性質ではなく記帳の工夫を理由にする
test("仕入と売上: 仕入を費用にする理由を「いずれ売れる」にしない", () => {
  expect(src).not.toContain("いずれ売れて");
  expect(src).not.toContain("「使った分」として記録");
  for (const heading of ["豆を仕入れる", "ふりかえり"]) {
    expect(section(heading)).toContain("調べなくて済む");
    expect(section(heading)).toContain("決算");
  }
  expect(section("ふりかえり")).toContain("繰越商品");
});
