import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// 文言そのものではなく、理由に当たる語が節の本文にあるかだけを見る
const body = readFileSync("content/topics/depreciation/straight-line.md", "utf8");
const section = (title: string) => body.split(`## ${title}`)[1]?.split("```task")[0] ?? "";

test("定額法の本文が、定額法・残存価額・月割りの理由を述べている", () => {
  expect.soft(section("1年分を決める")).toMatch(/同じように/);
  expect.soft(section("最後に残る価値")).toMatch(/取り戻|使って消えたものではない/);
  expect.soft(section("使った月の分だけ")).toMatch(/まだ使っていない/);
});
