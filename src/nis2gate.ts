import { plan, gaps } from "./nis2/plan.js";
import { parseProfile } from "./nis2/parse.js";
import type { Lang } from "./common.js";

export interface GateResult { status: string; inScope: boolean; none: string[]; unknown: string[]; maxNone: number; pass: boolean; markdown: string }

export function gate(input: unknown, maxNone: number, lang: Lang): GateResult {
  const p = parseProfile(input);
  const pl = plan(p);
  const st = pl.scope.nis2.status;
  const inScope = st === "essential" || st === "important" || st === "check";
  const gs = gaps(p);
  const none = gs.filter((g) => g.level === "none").map((g) => g.ref);
  const unknown = gs.filter((g) => g.level === "unknown").map((g) => g.ref);
  const pass = !inScope || none.length <= maxNone;
  const L = lang === "es"
    ? { h: "Comprobación de preparación NIS2", status: "Condición", scope: "Ámbito", gaps: "Medidas del art. 21(2) sin implantar", unk: "Medidas sin evaluar", res: "Resultado", pass: "CORRECTO", fail: "FALLO", limit: "límite permitido", none: "ninguna", ss: { essential: "entidad esencial", important: "entidad importante", out: "fuera del ámbito", check: "revisar designación" } as Record<string, string> }
    : { h: "NIS2 readiness check", status: "Status", scope: "Scope", gaps: "Art. 21(2) measures with no implementation", unk: "Measures not assessed", res: "Result", pass: "PASS", fail: "FAIL", limit: "allowed", none: "none", ss: { essential: "essential entity", important: "important entity", out: "out of scope", check: "check designation" } as Record<string, string> };
  const top = pl.gaps.filter((g) => g.level === "none" || g.level === "unknown").slice(0, 5);
  const md = [
    `## ${L.h}${p.name ? `: ${p.name}` : ""}`, "",
    `- **${L.status}**: ${L.ss[st]}`,
    `- **${L.scope}**: ${pl.scope.nis2.headline[lang]}`,
    `- **${L.gaps}**: ${none.length ? none.join(", ") : L.none} (${L.limit}: ${maxNone})`,
    `- **${L.unk}**: ${unknown.length ? unknown.join(", ") : L.none}`,
    `- **${L.res}**: ${pass ? L.pass : L.fail}`, "",
    ...top.map((g) => `1. ${g.ref} ${g.name[lang]} (${g.level})`), "",
    `> ${pl.scope.caveats[0]![lang]}`, "",
  ].join("\n");
  return { status: st, inScope, none, unknown, maxNone, pass, markdown: md };
}
