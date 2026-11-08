import { parse as parseYaml } from "yaml";
import { defineConfig, s, z } from "velite";

// コンテンツのスキーマと横断検査。構造の定義は docs/content-model.md、画面と学習フローは docs/ide-design.md が正本

const element = s.enum(["asset", "liability", "equity", "revenue", "expense"]);
const change = s.enum(["increase", "decrease", "none"]);
const idList = s.array(s.string()).default([]);

const account = s.object({
  id: s.string(),
  name: s.string(),
  aliases: s.array(s.string()).default([]),
  // 読み(ひらがな)。仕訳エディタの候補検索と用語集の検索で引く。別名(aliases)とは混ぜない
  reading: s.array(s.string()).default([]),
  short: s.string(),
  element,
  contra: s.boolean().default(false),
  why: s.string(),
  // 用語集とポップオーバーの「例:」。概念と同じ役割(docs/content-model.md 4 節)
  example: s.string().optional(),
  concepts: idList,
});

const concept = s.object({
  id: s.string(),
  name: s.string(),
  short: s.string(),
  summary: s.string(),
  example: s.string(),
  requires: idList,
  related: idList,
  contrasts: idList,
});

const misconception = s.object({
  id: s.string(),
  name: s.string(),
  description: s.string(),
  correct: s.string(),
  concepts: idList,
  remediation: s.string(),
});

const journalLine = s.object({ account: s.string(), amount: s.number().int().positive() });
const journalEntry = s.object({
  date: s.string().optional(),
  memo: s.string().optional(),
  debit: s.array(journalLine).min(1),
  credit: s.array(journalLine).min(1),
});
const journalLinePattern = s.object({ account: s.string().optional(), amount: s.number().int().optional() });
const effect = s.object({ asset: change, liability: change, equity: change, revenue: change, expense: change });
const effectPattern = effect.partial();

const wrongPattern = <T extends z.ZodTypeAny>(match: T) =>
  s.object({ match, misconception: s.string().optional(), feedback: s.string() });

// ステップの課題。種類は docs/ide-design.md 3 章
const taskBase = { hint: s.string().optional(), success: s.string().optional() };
export const taskSchema = s.discriminatedUnion("type", [
  s.object({ type: s.literal("observe"), entries: s.array(journalEntry).default([]) }),
  s.object({
    ...taskBase,
    type: s.literal("post"),
    transaction: s.string(),
    answer: journalEntry,
    alternatives: s.array(journalEntry).default([]),
    wrong_patterns: s
      .array(
        wrongPattern(
          s.object({
            swapped: s.literal(true).optional(),
            unbalanced: s.literal(true).optional(),
            debit: s.array(journalLinePattern).optional(),
            credit: s.array(journalLinePattern).optional(),
          }),
        ),
      )
      .default([]),
  }),
  s.object({
    ...taskBase,
    type: s.literal("predict"),
    transaction: s.string(),
    entry: journalEntry,
    answer: effect,
    wrong_patterns: s.array(wrongPattern(effectPattern)).default([]),
  }),
  s.object({
    ...taskBase,
    type: s.literal("tweak"),
    formula: s.enum(["straight_line"]),
    params: s
      .array(
        s.object({
          id: s.string(),
          label: s.string(),
          value: s.number(),
          min: s.number(),
          max: s.number(),
          step: s.number().positive(),
          unit: s.string().default(""),
        }),
      )
      .min(1),
    goal: s.object({ output: s.string(), equals: s.number(), label: s.string() }),
  }),
  s.object({
    ...taskBase,
    type: s.literal("classify"),
    accounts: s.array(s.string()).min(2),
    // 科目 → 間違えた要素 → 誤解 ID
    misconceptions: s.record(s.string(), s.record(s.string(), s.string())).default({}),
  }),
  s.object({
    ...taskBase,
    type: s.literal("calc"),
    question: s.string(),
    answer: s.number().int(),
    wrong_patterns: s.array(wrongPattern(s.number().int())).default([]),
  }),
]);
export type Task = z.infer<typeof taskSchema>;

// 図解ブロック(docs/visual-guidelines.md 5 章)。alt は必須
const amountItem = s.object({ account: s.string().optional(), label: s.string().optional(), amount: s.number().int() });
const simpleFigure = s.discriminatedUnion("type", [
  s.object({
    type: s.literal("elements"),
    alt: s.string(),
    items: s.array(s.object({ account: s.string(), highlight: s.boolean().default(false) })).min(1),
  }),
  s.object({ type: s.literal("flow"), alt: s.string(), nodes: s.array(s.string()).min(2), highlight: s.number().int().min(0).optional() }),
  s.object({
    type: s.literal("timeline"),
    alt: s.string(),
    total: s.number().int().positive(),
    periods: s.number().int().min(2).max(12),
    unit: s.string().default("年"),
    label: s.string().optional(),
  }),
  s.object({
    type: s.literal("taccount"),
    alt: s.string(),
    account: s.string(),
    debit: s.array(s.object({ label: s.string(), amount: s.number().int().positive() })).default([]),
    credit: s.array(s.object({ label: s.string(), amount: s.number().int().positive() })).default([]),
  }),
  s.object({
    type: s.literal("proportion"),
    alt: s.string(),
    assets: s.array(amountItem).min(1),
    liabilities: s.array(amountItem).default([]),
    equity: s.array(amountItem).default([]),
  }),
]);
export const figureSchema = s.discriminatedUnion("type", [
  ...simpleFigure.options,
  s.object({
    type: s.literal("compare"),
    alt: s.string(),
    left: s.object({ title: s.string(), figure: simpleFigure }),
    right: s.object({ title: s.string(), figure: simpleFigure }),
  }),
]);
export type Figure = z.infer<typeof figureSchema>;
const FIGURE_BLOCK = /```figure\s*\n([\s\S]*?)```/g;

/** 図解の中で参照している勘定科目 ID */
function figureAccounts(f: Figure): string[] {
  switch (f.type) {
    case "elements":
      return f.items.map((i) => i.account);
    case "taccount":
      return [f.account];
    case "proportion":
      return [...f.assets, ...f.liabilities, ...f.equity].flatMap((i) => (i.account ? [i.account] : []));
    case "compare":
      return [...figureAccounts(f.left.figure), ...figureAccounts(f.right.figure)];
    default:
      return [];
  }
}

export interface Step {
  title: string;
  narrative: string;
  task: Task;
  figures: Figure[];
}

// 単元本文を「## 見出し」ごとのステップに分け、```task ブロックを課題として解釈する
const TASK_BLOCK = /```task\s*\n([\s\S]*?)```/;
function parseSteps(body: string, ctx: z.RefinementCtx): Step[] {
  const chunks = body.split(/^## /m).filter((c) => c.trim());
  const steps: Step[] = [];
  chunks.forEach((chunk, i) => {
    const newline = chunk.indexOf("\n");
    const title = (newline === -1 ? chunk : chunk.slice(0, newline)).trim();
    const rest = newline === -1 ? "" : chunk.slice(newline + 1);
    const m = TASK_BLOCK.exec(rest);
    let task: Task = { type: "observe", entries: [] };
    if (m) {
      const parsed = taskSchema.safeParse(parseYaml(m[1]));
      if (!parsed.success) {
        ctx.addIssue({ code: "custom", message: `ステップ ${i + 1}「${title}」の task: ${parsed.error.issues.map((e) => `${e.path.join(".")} ${e.message}`).join("; ")}` });
        return;
      }
      task = parsed.data;
    }
    const narrative = (m ? rest.replace(TASK_BLOCK, "") : rest).trim();
    const figures: Figure[] = [];
    for (const fm of narrative.matchAll(FIGURE_BLOCK)) {
      const parsed = figureSchema.safeParse(parseYaml(fm[1]));
      if (!parsed.success) {
        ctx.addIssue({ code: "custom", message: `ステップ ${i + 1}「${title}」の figure: ${parsed.error.issues.map((e) => `${e.path.join(".")} ${e.message}`).join("; ")}` });
        return;
      }
      figures.push(parsed.data);
    }
    steps.push({ title, narrative, task, figures });
  });
  return steps;
}

const TERM_REF = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
const FORMULA_OUTPUTS: Record<string, string[]> = {
  straight_line: ["annual_depreciation", "period_depreciation", "book_value_end"],
};
const FORMULA_PARAMS: Record<string, string[]> = {
  straight_line: ["cost", "residual_value", "useful_life", "months"],
};

export default defineConfig({
  root: "content",
  output: { clean: true },
  collections: {
    accounts: { name: "Accounts", pattern: "accounts.yaml", single: true, schema: s.object({ accounts: s.array(account) }) },
    misconceptions: {
      name: "Misconceptions",
      pattern: "misconceptions.yaml",
      single: true,
      schema: s.object({ misconceptions: s.array(misconception) }),
    },
    domains: {
      name: "Domain",
      pattern: "concepts/*.yaml",
      schema: s.object({ id: s.string(), title: s.string(), order: s.number(), concepts: s.array(concept) }),
    },
    topics: {
      name: "Topic",
      pattern: "topics/*/topic.yaml",
      schema: s.object({ id: s.string(), title: s.string(), domain: s.string(), summary: s.string(), order: s.number(), hidden: s.boolean().default(false) }),
    },
    units: {
      name: "Unit",
      pattern: "topics/*/*.md",
      schema: s
        .object({
          id: s.string(),
          title: s.string(),
          summary: s.string(),
          level: s.number().int().min(1).max(4),
          order: s.number(),
          introduces: idList,
          concepts: idList,
          requires: idList,
          scenario: s.object({
            company: s.string(),
            opening: s.array(journalLine).default([]),
          }),
          path: s.path(),
          body: s.raw(),
        })
        .transform((u, ctx) => ({ ...u, topic: u.path.split("/")[1], steps: parseSteps(u.body, ctx) })),
    },
    paths: {
      name: "LearningPath",
      pattern: "paths/*.yaml",
      schema: s.object({
        id: s.string(),
        title: s.string(),
        summary: s.string(),
        exam: s.object({ name: s.string(), format: s.string(), source: s.string() }),
        sections: s.array(s.object({ title: s.string(), units: s.array(s.string()).min(1) })),
      }),
    },
  },
  prepare: ({ accounts, misconceptions, domains, topics, units, paths }) => {
    const errors: string[] = [];
    const accountIds = new Set(accounts.accounts.map((a) => a.id));
    const conceptIds = new Set(domains.flatMap((d) => d.concepts.map((c) => c.id)));
    const conceptById = new Map(domains.flatMap((d) => d.concepts.map((c) => [c.id, c] as const)));
    const misconceptionIds = new Set(misconceptions.misconceptions.map((m) => m.id));
    const unitById = new Map(units.map((u) => [u.id, u]));
    const domainIds = new Set(domains.map((d) => d.id));
    const topicIds = new Set(topics.map((t) => t.id));

    const dup = (label: string, ids: string[]) => {
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) errors.push(`${label} の ID が重複: ${id}`);
        seen.add(id);
      }
    };
    dup("勘定科目", accounts.accounts.map((a) => a.id));
    dup("概念", domains.flatMap((d) => d.concepts.map((c) => c.id)));
    dup("誤解", misconceptions.misconceptions.map((m) => m.id));
    dup("単元", units.map((u) => u.id));
    dup("テーマ", topics.map((t) => t.id));
    // 概念と勘定科目で同じ ID は「同じ用語」として用語集で 1 項目にまとめる(src/lib/content.ts)。名前が違えば別物なので拒否する
    for (const a of accounts.accounts) {
      const c = conceptById.get(a.id);
      if (c && c.name !== a.name) errors.push(`勘定科目 ${a.id}(${a.name})と概念 ${c.id}(${c.name})が同じ ID で名前が違う`);
    }

    const requireConcept = (id: string, where: string) => {
      if (!conceptIds.has(id)) errors.push(`${where}: 概念 ${id} が存在しない`);
    };
    const requireAccount = (id: string, where: string) => {
      if (!accountIds.has(id)) errors.push(`${where}: 勘定科目 ${id} が存在しない`);
    };
    const requireUnit = (id: string, where: string) => {
      if (!unitById.has(id)) errors.push(`${where}: 単元 ${id} が存在しない`);
    };
    const requireMisconception = (id: string | undefined, where: string) => {
      if (id && !misconceptionIds.has(id)) errors.push(`${where}: 誤解 ${id} が存在しない`);
    };
    const checkEntry = (entry: { debit: { account: string; amount: number }[]; credit: { account: string; amount: number }[] }, where: string) => {
      const sum = (lines: { amount: number }[]) => lines.reduce((t, l) => t + l.amount, 0);
      if (sum(entry.debit) !== sum(entry.credit)) errors.push(`${where}: 借方合計と貸方合計が一致しない`);
      [...entry.debit, ...entry.credit].forEach((l) => requireAccount(l.account, where));
    };
    const sameEntry = (a: { debit: { account: string; amount: number }[]; credit: { account: string; amount: number }[] }, b: typeof a) => {
      const key = (e: typeof a) => JSON.stringify([e.debit, e.credit].map((lines) => lines.map((l) => `${l.account}:${l.amount}`).sort()));
      return key(a) === key(b);
    };

    for (const a of accounts.accounts) a.concepts.forEach((c) => requireConcept(c, `勘定科目 ${a.id}`));
    for (const m of misconceptions.misconceptions) {
      m.concepts.forEach((c) => requireConcept(c, `誤解 ${m.id}`));
      requireUnit(m.remediation, `誤解 ${m.id} の remediation`);
    }
    for (const d of domains) {
      for (const c of d.concepts) [...c.requires, ...c.related, ...c.contrasts].forEach((r) => requireConcept(r, `概念 ${c.id}`));
    }
    for (const t of topics) if (!domainIds.has(t.domain)) errors.push(`テーマ ${t.id}: 分野 ${t.domain} が存在しない`);

    // 前提単元を辿って「説明済みの概念」を集める。循環は検出してエラーにする
    const explainedCache = new Map<string, Set<string>>();
    const explained = (unitId: string, stack: string[] = []): Set<string> => {
      const cached = explainedCache.get(unitId);
      if (cached) return cached;
      if (stack.includes(unitId)) {
        errors.push(`単元の前提が循環: ${[...stack, unitId].join(" -> ")}`);
        return new Set();
      }
      const unit = unitById.get(unitId);
      if (!unit) return new Set();
      const result = new Set(unit.introduces);
      for (const req of unit.requires) explained(req, [...stack, unitId]).forEach((c) => result.add(c));
      explainedCache.set(unitId, result);
      return result;
    };

    for (const u of units) {
      const where = `単元 ${u.id}`;
      if (!topicIds.has(u.topic)) errors.push(`${where}: テーマ ${u.topic} の topic.yaml がない`);
      if (u.id !== u.path.replace(/^topics\//, "")) errors.push(`${where}: id とファイルパス ${u.path} が一致しない`);
      u.introduces.forEach((c) => requireConcept(c, where));
      u.concepts.forEach((c) => requireConcept(c, where));
      u.requires.forEach((r) => requireUnit(r, `${where} の requires`));
      u.scenario.opening.forEach((l) => requireAccount(l.account, `${where} の opening`));

      if (u.steps.length < 4) errors.push(`${where}: ステップが ${u.steps.length} 個しかない(4 個以上)`);
      if (u.steps.length > 0 && u.steps[0].task.type !== "observe") errors.push(`${where}: 最初のステップは observe(導入)にする`);
      if (u.steps.length > 0 && !u.steps[u.steps.length - 1].title.includes("ふりかえり")) errors.push(`${where}: 最後のステップの見出しに「ふりかえり」を含める`);
      if (!u.steps.some((st) => st.task.type === "post" || st.task.type === "predict")) errors.push(`${where}: post か predict のステップが 1 つもない`);

      const known = explained(u.id);
      const used = new Set<string>();
      u.steps.forEach((st, i) => {
        const w = `${where} ステップ ${i + 1}「${st.title}」`;
        if (!st.narrative.trim()) errors.push(`${w}: 説明文がない`);
        if (st.figures.length > 1) errors.push(`${w}: 図解は 1 ステップに 1 つまで`);
        st.figures.forEach((f) => {
          figureAccounts(f).forEach((a) => requireAccount(a, `${w} の図解`));
          if (f.type === "proportion") {
            const sum = (items: { amount: number }[]) => items.reduce((t, i) => t + i.amount, 0);
            if (sum(f.assets) !== sum(f.liabilities) + sum(f.equity)) errors.push(`${w} の図解: 資産の合計が負債 + 純資産と一致しない`);
          }
        });
        for (const line of st.narrative.split("\n")) {
          if (line.trimStart().startsWith("|") && /\[\[[^\]]*\|/.test(line)) errors.push(`${w}: 表の中では [[id|表示語]] が使えない。[[id]] と書く`);
        }
        for (const m of st.narrative.matchAll(TERM_REF)) {
          const id = m[1];
          used.add(id);
          if (!conceptIds.has(id) && !accountIds.has(id)) errors.push(`${w}: 用語 ${id} が概念にも勘定科目にもない`);
          if (conceptIds.has(id) && !known.has(id)) errors.push(`${w}: 概念 ${id} を未説明のまま使っている(introduces か requires に含める)`);
        }
        const t = st.task;
        switch (t.type) {
          case "observe":
            t.entries.forEach((e) => checkEntry(e, w));
            break;
          case "post":
            [t.answer, ...t.alternatives].forEach((e) => checkEntry(e, w));
            t.wrong_patterns.forEach((p) => {
              requireMisconception(p.misconception, w);
              [...(p.match.debit ?? []), ...(p.match.credit ?? [])].forEach((l) => l.account && requireAccount(l.account, w));
              if (p.match.debit && p.match.credit) {
                const full = [...p.match.debit, ...p.match.credit].every((l) => l.account && l.amount);
                if (full && sameEntry({ debit: p.match.debit, credit: p.match.credit } as typeof t.answer, t.answer)) errors.push(`${w}: 正解と同じ仕訳が誤答パターンにある`);
              }
            });
            break;
          case "predict":
            checkEntry(t.entry, w);
            t.wrong_patterns.forEach((p) => requireMisconception(p.misconception, w));
            break;
          case "tweak": {
            const outputs = FORMULA_OUTPUTS[t.formula];
            if (!outputs.includes(t.goal.output)) errors.push(`${w}: goal.output ${t.goal.output} は ${t.formula} の出力(${outputs.join(", ")})にない`);
            t.params.forEach((p) => {
              if (!FORMULA_PARAMS[t.formula].includes(p.id)) errors.push(`${w}: パラメータ ${p.id} は ${t.formula} にない`);
              if (p.value < p.min || p.value > p.max) errors.push(`${w}: パラメータ ${p.id} の初期値が範囲外`);
            });
            break;
          }
          case "classify":
            t.accounts.forEach((a) => requireAccount(a, w));
            Object.entries(t.misconceptions).forEach(([acc, byElement]) => {
              requireAccount(acc, w);
              Object.values(byElement).forEach((m) => requireMisconception(m, w));
            });
            break;
          case "calc":
            t.wrong_patterns.forEach((p) => {
              requireMisconception(p.misconception, w);
              if (p.match === t.answer) errors.push(`${w}: 正解と同じ値が誤答パターンにある`);
            });
            break;
        }
      });
      u.introduces.forEach((c) => {
        if (!used.has(c)) errors.push(`${where}: introduces の ${c} が本文で [[${c}]] として使われていない`);
      });
    }

    const visiting = new Set<string>();
    const done = new Set<string>();
    const visit = (id: string, stack: string[]) => {
      if (done.has(id)) return;
      if (visiting.has(id)) {
        errors.push(`概念の前提が循環: ${[...stack, id].join(" -> ")}`);
        return;
      }
      visiting.add(id);
      conceptById.get(id)?.requires.forEach((r) => visit(r, [...stack, id]));
      visiting.delete(id);
      done.add(id);
    };
    conceptIds.forEach((id) => visit(id, []));

    for (const p of paths) {
      const seen: string[] = [];
      for (const section of p.sections) {
        for (const unitId of section.units) {
          requireUnit(unitId, `パス ${p.id}`);
          unitById.get(unitId)?.requires.forEach((r) => {
            if (!seen.includes(r)) errors.push(`パス ${p.id}: 単元 ${unitId} の前提 ${r} がパス内で先に出てこない`);
          });
          seen.push(unitId);
        }
      }
    }

    if (errors.length > 0) throw new Error(`コンテンツ検査で ${errors.length} 件のエラー:\n- ${errors.join("\n- ")}`);
  },
});
