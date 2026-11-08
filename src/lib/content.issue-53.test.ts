import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Issue #53: スマホ幅(タブ表示)では右に何も無いのに、文言が結果ペインを「右の表」などの位置で指していた
// 借方・貸方や貸借対照表の左右(「右の合計」「右に書く」など)は別の意味なので対象にしない
const PANE_BY_POSITION = /右の(表|貸借対照表|損益計算書|財務諸表|結果|「(結果|貸借対照表|損益計算書)」)|右側の「結果」|右で会社|真ん中の仕訳帳/;

const files = [
  ...readdirSync("content", { recursive: true, encoding: "utf8" }).map((f) => join("content", f)).filter((f) => /\.(md|ya?ml)$/.test(f)),
  ...readdirSync("src/components/ide").map((f) => join("src/components/ide", f)),
  "src/lib/grading.ts",
];

describe("結果ペインを画面の位置で指さない", () => {
  it.each(files)("%s", (file) => {
    const hits = readFileSync(file, "utf8").split("\n").filter((line) => PANE_BY_POSITION.test(line));
    expect(hits).toEqual([]);
  });
});
