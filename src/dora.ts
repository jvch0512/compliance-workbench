import { l, type L } from "./common.js";

/** Readiness check of a register of ICT third-party contracts against DORA Art. 28 to 30. Not the official ITS reporting template. */
export interface Contract { row: number; id: string; provider: string; lei: string; country: string; service: string; critical: boolean; startDate: string; endDate: string; subcontractors: number | undefined; flags: Record<Clause, boolean | undefined> }

/** Art. 30(2) apply to all ICT contracts, Art. 30(3) add duties for critical or important functions. */
export const CLAUSES = ["services", "dataLocation", "dataProtection", "dataReturn", "sla", "incidentSupport", "authorityCooperation", "termination", "awareness", "subcontracting", "contingency", "tlpt", "audit", "exit"] as const;
export type Clause = (typeof CLAUSES)[number];
export const CLAUSE_INFO: Record<Clause, { ref: string; label: L; criticalOnly: boolean }> = {
  services: { ref: "30(2)(a)", label: l("Full description of services and subcontracting conditions", "Descripción completa de los servicios y condiciones de subcontratación"), criticalOnly: false },
  dataLocation: { ref: "30(2)(b)", label: l("Locations where services and data are processed", "Ubicaciones de prestación del servicio y tratamiento de datos"), criticalOnly: false },
  dataProtection: { ref: "30(2)(c)", label: l("Availability, authenticity, integrity and confidentiality of data", "Disponibilidad, autenticidad, integridad y confidencialidad de los datos"), criticalOnly: false },
  dataReturn: { ref: "30(2)(d)", label: l("Access, recovery and return of data on insolvency or termination", "Acceso, recuperación y devolución de datos en insolvencia o resolución"), criticalOnly: false },
  sla: { ref: "30(2)(e)", label: l("Service level descriptions", "Descripción de los niveles de servicio"), criticalOnly: false },
  incidentSupport: { ref: "30(2)(f)", label: l("Assistance in ICT incidents at no extra or at a predetermined cost", "Asistencia en incidentes TIC sin coste adicional o a coste predeterminado"), criticalOnly: false },
  authorityCooperation: { ref: "30(2)(g)", label: l("Cooperation with competent and resolution authorities", "Cooperación con las autoridades competentes y de resolución"), criticalOnly: false },
  termination: { ref: "30(2)(h)", label: l("Termination rights and minimum notice periods", "Derechos de resolución y plazos mínimos de preaviso"), criticalOnly: false },
  awareness: { ref: "30(2)(i)", label: l("Participation in the entity's ICT security awareness programmes", "Participación en los programas de concienciación en seguridad TIC"), criticalOnly: false },
  subcontracting: { ref: "30(3)", label: l("Subcontracting conditions for critical or important functions", "Condiciones de subcontratación para funciones críticas o importantes"), criticalOnly: true },
  contingency: { ref: "30(3)(c)", label: l("Business contingency plans and testing", "Planes de contingencia y pruebas"), criticalOnly: true },
  tlpt: { ref: "30(3)(d)", label: l("Participation in threat-led penetration testing", "Participación en pruebas de penetración basadas en amenazas (TLPT)"), criticalOnly: true },
  audit: { ref: "30(3)(e)", label: l("Unrestricted rights of access, inspection and audit", "Derechos ilimitados de acceso, inspección y auditoría"), criticalOnly: true },
  exit: { ref: "30(3)(f)", label: l("Exit strategy with a mandatory transition period", "Estrategia de salida con periodo de transición obligatorio"), criticalOnly: true },
};

export type Severity = "high" | "medium" | "low";
export interface Finding { row: number; contract: string; severity: Severity; code: string; message: L }
export interface DoraReport {
  contracts: Contract[]; findings: Finding[]; errors: string[];
  concentration: { provider: string; contracts: number; critical: number }[];
  summary: { contracts: number; critical: number; providers: number; high: number; medium: number; low: number; expiring12m: number; fullyCompliant: number };
}

/** RFC 4180 style CSV with quoted fields. Handles ',' or ';' separators and a BOM. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/)[0] ?? "";
  const sep = (first.match(/;/g) ?? []).length > (first.match(/,/g) ?? []).length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], f = "", q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && src[i + 1] === "\n") i++; row.push(f); if (row.some((x) => x.trim() !== "")) rows.push(row); row = []; f = ""; }
    else f += c;
  }
  row.push(f);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

/** ISO 17442 LEI: 20 alphanumerics with an ISO 7064 MOD 97-10 check. */
export function validLei(lei: string): boolean {
  if (!/^[A-Z0-9]{18}[0-9]{2}$/.test(lei)) return false;
  let rem = 0;
  for (const ch of lei) {
    const v = /[0-9]/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const d of v) rem = (rem * 10 + Number(d)) % 97;
  }
  return rem === 1;
}

const yes = (v: string): boolean | undefined => {
  const x = v.trim().toLowerCase();
  if (["yes", "y", "true", "1", "si", "sí", "s"].includes(x)) return true;
  if (["no", "n", "false", "0"].includes(x)) return false;
  return undefined;
};
const squash = (h: string): string => h.trim().toLowerCase().replace(/[\s_-]+/g, "");
const CANON: Record<string, string> = {};
for (const k of ["id", "provider", "lei", "country", "service", "critical", "startDate", "endDate", "subcontractors", ...CLAUSES]) CANON[squash(k)] = k;
Object.assign(CANON, { contractid: "id", providername: "provider", providerlei: "lei", servicedescription: "service", criticalfunction: "critical", criticalorimportant: "critical", contingencyplans: "contingency", exitstrategy: "exit", auditrights: "audit", terminationrights: "termination", securityawareness: "awareness", incidentassistance: "incidentSupport" });
const norm = (h: string): string => CANON[squash(h)] ?? h.trim();

export function checkRegister(csv: string, today: Date = new Date()): DoraReport {
  const rows = parseCsv(csv);
  const errors: string[] = [];
  const findings: Finding[] = [];
  const contracts: Contract[] = [];
  if (rows.length < 2) return { contracts, findings, errors: ["The register needs a header row and at least one contract."], concentration: [], summary: { contracts: 0, critical: 0, providers: 0, high: 0, medium: 0, low: 0, expiring12m: 0, fullyCompliant: 0 } };
  const head = rows[0]!.map(norm);
  for (const need of ["id", "provider", "lei", "critical"]) if (!head.includes(need)) errors.push(`Missing column: ${need}`);
  if (errors.length) return { contracts, findings, errors, concentration: [], summary: { contracts: 0, critical: 0, providers: 0, high: 0, medium: 0, low: 0, expiring12m: 0, fullyCompliant: 0 } };
  const get = (r: string[], k: string): string => (r[head.indexOf(k)] ?? "").trim();
  const seen = new Set<string>();
  const horizon = new Date(today.getTime() + 365 * 86400000);
  rows.slice(1).forEach((r, idx) => {
    const row = idx + 2;
    const id = get(r, "id") || `row-${row}`;
    const critical = yes(get(r, "critical")) === true;
    const flags = {} as Record<Clause, boolean | undefined>;
    for (const c of CLAUSES) flags[c] = head.includes(c) ? yes(get(r, c)) : undefined;
    const subRaw = get(r, "subcontractors");
    const sub = subRaw === "" ? undefined : Number(subRaw);
    const c: Contract = { row, id, provider: get(r, "provider"), lei: get(r, "lei").toUpperCase(), country: get(r, "country"), service: get(r, "service"), critical, startDate: get(r, "startDate"), endDate: get(r, "endDate"), subcontractors: sub !== undefined && Number.isFinite(sub) ? sub : undefined, flags };
    contracts.push(c);
    const add = (severity: Severity, code: string, en: string, es: string): void => { findings.push({ row, contract: id, severity, code, message: l(en, es) }); };
    if (seen.has(id)) add("high", "duplicate-id", `Contract id ${id} appears more than once.`, `El identificador de contrato ${id} aparece más de una vez.`);
    seen.add(id);
    if (!c.provider) add("high", "no-provider", "No provider name.", "Sin nombre de proveedor.");
    if (!c.lei) add("medium", "no-lei", "No LEI for the provider. Use another unique identifier only where a LEI does not exist.", "Sin LEI del proveedor. Use otro identificador único solo cuando no exista LEI.");
    else if (!validLei(c.lei)) add("high", "bad-lei", `LEI ${c.lei} fails the format or check digits.`, `El LEI ${c.lei} no supera el formato o los dígitos de control.`);
    if (get(r, "critical") !== "" && yes(get(r, "critical")) === undefined) add("medium", "bad-critical", "Critical or important flag is not yes or no.", "El indicador de función crítica o importante no es sí o no.");
    if (get(r, "critical") === "") add("medium", "no-critical", "Not stated whether the contract supports a critical or important function.", "No se indica si el contrato apoya una función crítica o importante.");
    const end = c.endDate ? new Date(c.endDate) : undefined;
    if (c.endDate && (!end || Number.isNaN(end.getTime()))) add("low", "bad-date", `End date ${c.endDate} is not a valid ISO date.`, `La fecha de fin ${c.endDate} no es una fecha ISO válida.`);
    else if (end && end < today) add("medium", "expired", "The contract end date is in the past.", "La fecha de fin del contrato ya ha pasado.");
    else if (end && end <= horizon) add(critical ? "medium" : "low", "expiring", "The contract ends within 12 months: plan renewal with DORA clauses or an exit.", "El contrato termina en menos de 12 meses: planifique la renovación con cláusulas DORA o la salida.");
    for (const cl of CLAUSES) {
      const info = CLAUSE_INFO[cl];
      if (info.criticalOnly && !critical) continue;
      const v = flags[cl];
      if (v === true) continue;
      const sev: Severity = info.criticalOnly || cl === "audit" ? "high" : "medium";
      if (v === false) add(sev, `missing-${cl}`, `Art. ${info.ref} missing: ${info.label.en}.`, `Falta art. ${info.ref}: ${info.label.es}.`);
      else if (head.includes(cl)) add("low", `unknown-${cl}`, `Art. ${info.ref} not answered: ${info.label.en}.`, `Sin respuesta art. ${info.ref}: ${info.label.es}.`);
      else add("low", `unknown-${cl}`, `Art. ${info.ref} not tracked (no column): ${info.label.en}.`, `Art. ${info.ref} sin seguimiento (sin columna): ${info.label.es}.`);
    }
    if (critical && c.subcontractors !== undefined && c.subcontractors > 0 && flags.subcontracting !== true) add("high", "subcontractors-unmanaged", `${c.subcontractors} subcontractor(s) on a critical function without subcontracting conditions.`, `${c.subcontractors} subcontratista(s) en una función crítica sin condiciones de subcontratación.`);
  });
  const byProv = new Map<string, { contracts: number; critical: number }>();
  for (const c of contracts) { const k = c.lei || c.provider || c.id; const e = byProv.get(k) ?? { contracts: 0, critical: 0 }; e.contracts++; if (c.critical) e.critical++; byProv.set(k, e); }
  const nameOf = (k: string): string => contracts.find((c) => (c.lei || c.provider || c.id) === k)?.provider || k;
  const concentration = [...byProv.entries()].map(([k, v]) => ({ provider: nameOf(k), ...v })).sort((a, b) => b.critical - a.critical || b.contracts - a.contracts || a.provider.localeCompare(b.provider));
  const sevCount = (s: Severity): number => findings.filter((f) => f.severity === s).length;
  const bad = new Set(findings.filter((f) => f.severity !== "low").map((f) => f.row));
  const expiring = findings.filter((f) => f.code === "expiring").length;
  return { contracts, findings, errors, concentration, summary: { contracts: contracts.length, critical: contracts.filter((c) => c.critical).length, providers: byProv.size, high: sevCount("high"), medium: sevCount("medium"), low: sevCount("low"), expiring12m: expiring, fullyCompliant: contracts.filter((c) => !bad.has(c.row)).length } };
}
