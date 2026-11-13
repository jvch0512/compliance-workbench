import { cell, type Lang } from "./common.js";
import { CLAUSE_INFO, type DoraReport } from "./dora.js";
import { DIMENSIONS, DIMENSION_LABEL, type Category, type Level, type Path, type PlanItem } from "./ens.js";
import type { RoiResult } from "./roi.js";
import { TOPICS, type Shred } from "./rfp.js";

const money = (n: number, cur: string): string => `${Math.round(n).toLocaleString("en-US")} ${cur}`;

export function rfpMarkdown(s: Shred, lang: Lang): string {
  const es = lang === "es";
  const o: string[] = [];
  o.push(`# ${es ? "Requisitos de seguridad del pliego" : "RFP security requirements"}`, "");
  const m = s.summary;
  o.push(`- ${es ? "Requisitos detectados" : "Requirements found"}: ${m.total} (${m.mandatory} ${es ? "obligatorios" : "mandatory"})`);
  o.push(`- ${es ? "Cubiertos" : "Covered"}: ${m.covered}, ${es ? "parciales" : "partial"}: ${m.partial}, ${es ? "brechas" : "gaps"}: ${m.gap}`);
  o.push(`- ${es ? "Cobertura de obligatorios" : "Mandatory coverage"}: ${m.mandatoryCoverage}% (${m.mandatoryGaps} ${es ? "sin cubrir del todo" : "not fully covered"})`, "");
  if (s.topGaps.length) {
    o.push(`## ${es ? "Temas con más brecha" : "Biggest gap topics"}`, "", `| ${es ? "Tema" : "Topic"} | ${es ? "Obligatorios" : "Mandatory"} | ${es ? "Total" : "Total"} |`, "|---|---|---|");
    for (const g of s.topGaps.slice(0, 8)) o.push(`| ${cell(g.label[lang])} | ${g.mandatory} | ${g.total} |`);
    o.push("");
  }
  o.push(`## ${es ? "Matriz de requisitos" : "Requirement matrix"}`, "", `| # | ${es ? "Requisito" : "Requirement"} | ${es ? "Tipo" : "Type"} | ${es ? "Estado" : "Status"} | NIS2 | ISO 27001:2022 | ENS |`, "|---|---|---|---|---|---|---|");
  const st = { covered: es ? "cubierto" : "covered", partial: es ? "parcial" : "partial", gap: es ? "brecha" : "gap" };
  for (const r of s.requirements) o.push(`| ${r.n} | ${cell(r.text)} | ${r.mandatory ? (es ? "obligatorio" : "mandatory") : (es ? "valorable" : "desirable")} | ${st[r.status]} | ${r.nis2.map((x) => `21(2)(${x})`).join(", ") || "-"} | ${r.iso.join(", ") || "-"} | ${r.ens.join(", ") || "-"} |`);
  o.push("", `> ${es ? "Los temas se detectan por palabras clave: revise cada fila. Las referencias ENS están a nivel de familia." : "Topics are detected by keywords: review every row. ENS references are at family level."}`, "");
  void TOPICS;
  return o.join("\n");
}

export function doraMarkdown(r: DoraReport, lang: Lang): string {
  const es = lang === "es";
  const o: string[] = [`# ${es ? "Comprobación del registro de contratos TIC (DORA)" : "DORA ICT contract register check"}`, ""];
  if (r.errors.length) { o.push(...r.errors.map((e) => `- ${e}`), ""); return o.join("\n"); }
  const s = r.summary;
  o.push(`- ${es ? "Contratos" : "Contracts"}: ${s.contracts} (${s.critical} ${es ? "críticos o importantes" : "critical or important"}), ${es ? "proveedores" : "providers"}: ${s.providers}`);
  o.push(`- ${es ? "Hallazgos" : "Findings"}: ${s.high} ${es ? "altos" : "high"}, ${s.medium} ${es ? "medios" : "medium"}, ${s.low} ${es ? "bajos" : "low"}`);
  o.push(`- ${es ? "Contratos sin hallazgos altos ni medios" : "Contracts with no high or medium findings"}: ${s.fullyCompliant}`);
  o.push(`- ${es ? "Terminan en 12 meses" : "Ending within 12 months"}: ${s.expiring12m}`, "");
  o.push(`## ${es ? "Concentración de proveedores" : "Provider concentration"}`, "", `| ${es ? "Proveedor" : "Provider"} | ${es ? "Contratos" : "Contracts"} | ${es ? "Críticos" : "Critical"} |`, "|---|---|---|");
  for (const c of r.concentration) o.push(`| ${cell(c.provider)} | ${c.contracts} | ${c.critical} |`);
  o.push("", `## ${es ? "Hallazgos" : "Findings"}`, "", `| ${es ? "Fila" : "Row"} | ${es ? "Contrato" : "Contract"} | ${es ? "Gravedad" : "Severity"} | ${es ? "Hallazgo" : "Finding"} |`, "|---|---|---|---|");
  const order = { high: 0, medium: 1, low: 2 } as const;
  for (const f of [...r.findings].sort((a, b) => order[a.severity] - order[b.severity] || a.row - b.row)) o.push(`| ${f.row} | ${cell(f.contract)} | ${f.severity} | ${cell(f.message[lang])} |`);
  o.push("", `> ${es ? "Es una comprobación de preparación de los arts. 28 a 30, no la plantilla oficial de reporte del registro de información. Confirme con asesoría jurídica." : "This is a readiness check of Arts. 28 to 30, not the official register of information reporting template. Confirm with counsel."}`, "");
  void CLAUSE_INFO;
  return o.join("\n");
}

export function ensMarkdown(cat: Category, levels: Partial<Record<(typeof DIMENSIONS)[number], Level>>, path: Path, plan: PlanItem[], lang: Lang): string {
  const es = lang === "es";
  const o: string[] = [`# ${es ? "Plan de conformidad ENS" : "ENS conformity plan"}`, ""];
  o.push(`| ${es ? "Dimensión" : "Dimension"} | ${es ? "Nivel" : "Level"} |`, "|---|---|");
  for (const d of DIMENSIONS) o.push(`| ${DIMENSION_LABEL[d][lang]} | ${levels[d] ?? "-"} |`);
  o.push("", `**${es ? "Categoría del sistema" : "System category"}: ${cat.toUpperCase()}**`, "", `- ${es ? "Conformidad" : "Conformity"}: ${path.conformity[lang]}`, `- ${es ? "Auditoría" : "Audit"}: ${path.audit[lang]}`);
  for (const n of path.notes) o.push(`- ${n[lang]}`);
  o.push("", `## ${es ? "Orden de trabajo por familia" : "Work order by family"}`, "", `| # | ${es ? "Familia" : "Family"} | ${es ? "Madurez" : "Maturity"} | ${es ? "Esfuerzo" : "Effort"} | ${es ? "Puntuación" : "Score"} |`, "|---|---|---|---|---|");
  const lv = (m: number | undefined): string => (m === 0 ? (es ? "ninguna" : "none") : m === 1 ? (es ? "parcial" : "partial") : m === 2 ? (es ? "sólida" : "solid") : (es ? "desconocida" : "unknown"));
  plan.forEach((p, i) => o.push(`| ${i + 1} | ${p.family.id} ${p.family.name[lang]} | ${lv(p.maturity)} | ${p.family.effort} | ${p.score} |`));
  o.push("", `> ${es ? "Pesos y esfuerzo son valores de criterio. Los números de control dentro de cada familia cambian entre ediciones: consulte las guías CCN-STIC." : "Weights and effort are judgement values. Control numbers inside each family change between editions: check the CCN-STIC guides."}`, "");
  return o.join("\n");
}

export function roiMarkdown(r: RoiResult, lang: Lang): string {
  const es = lang === "es";
  const c = r.currency;
  const o: string[] = [`# ${es ? "Caso de negocio de seguridad" : "Security business case"}`, ""];
  o.push(`| ${es ? "Escenario" : "Scenario"} | ${es ? "Frecuencia/año" : "Rate/year"} | ${es ? "Pérdida media" : "Mean loss"} | ${es ? "Pérdida anual esperada" : "Expected annual loss"} | ${es ? "Evitada" : "Prevented"} | ${es ? "Residual" : "Residual"} |`, "|---|---|---|---|---|---|");
  for (const s of r.scenarios) o.push(`| ${cell(s.name)} | ${s.annualRate} | ${money(s.meanLoss, c)} | ${money(s.aleBefore, c)} | ${money(s.prevented, c)} | ${money(s.aleAfter, c)} |`);
  o.push("", `- ${es ? "Coste" : "Cost"}: ${money(r.cost.oneOff, c)} ${es ? "único" : "one-off"} + ${money(r.cost.annual, c)} ${es ? "al año" : "per year"} = ${money(r.cost.total, c)} ${es ? "en" : "over"} ${r.years} ${es ? "años" : "years"}`);
  o.push(`- ${es ? "Beneficio anual esperado" : "Expected annual benefit"}: ${money(r.annualBenefit, c)}`);
  o.push(`- ${es ? "Beneficio neto en el horizonte" : "Net benefit over the horizon"}: ${money(r.netOverHorizon, c)}`);
  o.push(`- ROSI: ${(r.rosi * 100).toFixed(0)}%`);
  o.push(`- ${es ? "Recuperación de la inversión" : "Payback"}: ${r.paybackMonths === null ? (es ? "no se recupera" : "not recovered") : `${r.paybackMonths} ${es ? "meses" : "months"}`}`);
  const sim = r.simulation;
  o.push("", `## ${es ? "Simulación" : "Simulation"} (${sim.iterations.toLocaleString("en-US")} ${es ? "iteraciones" : "runs"})`, "", `- ${es ? "Neto" : "Net"} P10 / ${es ? "mediana" : "median"} / P90: ${money(sim.netP10, c)} / ${money(sim.netMedian, c)} / ${money(sim.netP90, c)}`, `- ${es ? "Probabilidad de beneficio neto positivo" : "Probability of a positive net benefit"}: ${(sim.probPositive * 100).toFixed(0)}%`);
  if (r.netOverHorizon > 0 && sim.netMedian < 0) o.push(`- ${es ? "El valor esperado lo mueven pérdidas raras y grandes: en la mayoría de las simulaciones no ocurre ninguna y la inversión no se recupera en el horizonte. Preséntelo como seguro, no como ahorro garantizado." : "The expected value is driven by rare large losses: in most runs none happens and the spend is not recovered within the horizon. Present it as insurance, not a guaranteed saving."}`);
  o.push("", `> ${es ? "Las estimaciones de entrada son suyas, no datos de la industria: el resultado es tan bueno como ellas. Los controles actúan de forma independiente." : "The inputs are your estimates, not industry data: the result is only as good as they are. Controls are assumed to act independently."}`, "");
  return o.join("\n");
}
