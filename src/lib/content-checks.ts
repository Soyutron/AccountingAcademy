// velite.config.tsのprepareから呼ぶ横断検査のうち、単体テストで固定するもの(docs/content-model.md 7章、ADR 0009)

interface UnitForCheck {
  kind: "lesson" | "history" | "forensics";
  level: number;
  sources?: { title: string; note?: string }[];
  steps: { task: { type: string } }[];
}

/** kindごとの課題の条件と、出典の必須を検査する */
export function unitKindErrors(u: UnitForCheck): string[] {
  const errors: string[] = [];
  const types = u.steps.map((st) => st.task.type);
  if (u.kind === "lesson") {
    if (!types.some((t) => t === "post" || t === "predict")) errors.push("postかpredictのステップが1つもない");
  } else if (!types.some((t) => t !== "observe")) {
    errors.push(`kind: ${u.kind}なのにobserve以外のステップが1つもない`);
  }
  if ((u.kind !== "lesson" || u.level >= 3) && !u.sources?.length) {
    errors.push(u.kind !== "lesson" ? `kind: ${u.kind}の単元にsourcesがない` : `深さ${u.level}の単元にsourcesがない`);
  }
  return errors;
}

/** パスはexamかeraのどちらかを持つ */
export function pathErrors(p: { exam?: unknown; era?: string }): string[] {
  return p.exam || p.era ? [] : ["examとeraのどちらも無い"];
}

/** 単元限定の科目(scenario.accounts)のIDは、全体マスタとも単元の中でも重ねない(docs/content-model.md 7.5) */
export function scenarioAccountErrors(local: { id: string }[], masterIds: ReadonlySet<string>): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const { id } of local) {
    if (masterIds.has(id)) errors.push(`scenario.accountsの${id}が全体マスタの勘定科目と重なる`);
    if (seen.has(id)) errors.push(`scenario.accountsの${id}が重複`);
    seen.add(id);
  }
  return errors;
}

/** その単元のopeningとtaskから参照できる勘定科目ID。全体マスタとその単元のscenario.accountsだけで、他の単元の科目は含めない */
export function unitAccountIds(masterIds: ReadonlySet<string>, local: { id: string }[]): Set<string> {
  return new Set([...masterIds, ...local.map((a) => a.id)]);
}

interface ClassifyForCheck {
  accounts?: string[];
  labels?: Record<string, string>;
  items?: { id: string; answer: string }[];
  misconceptions: Record<string, Record<string, string>>;
}

/** classifyの形と、labels + itemsの形の参照を検査する。accountsの形の科目と誤解はprepareが単元の科目で検査する(Issue #262) */
export function classifyErrors(t: ClassifyForCheck, misconceptionIds: ReadonlySet<string>): string[] {
  const errors: string[] = [];
  if (!t.labels) {
    if (!t.accounts) errors.push("classifyにaccountsもlabelsも無い");
    if (t.items) errors.push("itemsはlabelsと一緒に書く");
    return errors;
  }
  const labels = t.labels;
  if (t.accounts) errors.push("accountsとlabelsは一緒に書けない");
  if (Object.keys(labels).length < 2) errors.push("labelsの箱が2つ未満");
  if (!t.items) errors.push("labelsがあるのにitemsが無い");
  const itemIds = new Set<string>();
  for (const item of t.items ?? []) {
    if (itemIds.has(item.id)) errors.push(`itemsの${item.id}が重複`);
    itemIds.add(item.id);
    if (!Object.hasOwn(labels, item.answer)) errors.push(`items ${item.id}のanswer ${item.answer}がlabelsに無い`);
  }
  for (const [id, byBox] of Object.entries(t.misconceptions)) {
    if (!itemIds.has(id)) errors.push(`misconceptionsの${id}がitemsに無い`);
    for (const [box, mis] of Object.entries(byBox)) {
      if (!Object.hasOwn(labels, box)) errors.push(`misconceptions ${id}の箱${box}がlabelsに無い`);
      if (!misconceptionIds.has(mis)) errors.push(`誤解${mis}が存在しない`);
    }
  }
  return errors;
}
