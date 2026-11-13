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
