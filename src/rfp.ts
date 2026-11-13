import { l, type L, type Lang } from "./common.js";

/** A topic a security requirement can be about, with its mapping to NIS2 Art. 21(2), ISO/IEC 27001:2022 Annex A and ENS control families. */
export interface Topic { id: string; label: L; re: RegExp; nis2?: string; iso: string[]; ens: string[] }

/** Matches from a word start (so "formación" does not hit inside "información") but allows word endings. */
const R = (s: string): RegExp => new RegExp(`(?<![\\p{L}\\p{N}])(?:${s})`, "iu");

export const TOPICS: Topic[] = [
  { id: "policy", label: l("Security policy and risk management", "Política de seguridad y gestión de riesgos"), re: R("security polic|risk assess|risk management|politica de seguridad|política de seguridad|an[aá]lisis de riesgos|gesti[oó]n de riesgos"), nis2: "a", iso: ["A.5.1", "Cl. 6.1"], ens: ["org", "op.pl"] },
  { id: "incident", label: l("Incident response and notification", "Respuesta y notificación de incidentes"), re: R("incident response|incident management|security incident|breach notif|gesti[oó]n de incidentes|respuesta a incidentes|incidentes de seguridad|notificaci[oó]n de (brechas|incidentes)"), nis2: "b", iso: ["A.5.24", "A.5.26"], ens: ["op.exp"] },
  { id: "logging", label: l("Logging and monitoring", "Registro y monitorización"), re: R("logging|audit trail|\\bSIEM\\b|monitor(ing|iz)|log retention|registro de actividad|trazabilidad|\\bSOC\\b"), nis2: "b", iso: ["A.8.15", "A.8.16"], ens: ["op.exp", "op.mon"] },
  { id: "backup", label: l("Backup and restore", "Copias de seguridad y restauración"), re: R("back-?up|restor(e|ation)|copias? de seguridad|restaura"), nis2: "c", iso: ["A.8.13"], ens: ["mp.info"] },
  { id: "bcp", label: l("Business continuity and disaster recovery", "Continuidad de negocio y recuperación ante desastres"), re: R("business continuity|disaster recovery|\\bRTO\\b|\\bRPO\\b|continuidad (de negocio|del servicio)|recuperaci[oó]n ante desastres|plan de contingencia"), nis2: "c", iso: ["A.5.29", "A.5.30"], ens: ["op.cont"] },
  { id: "supplier", label: l("Supply chain and subcontracting", "Cadena de suministro y subcontratación"), re: R("suppliers|third[- ]party|subcontract|supply chain|proveedores|subcontrat|cadena de suministro|terceros"), nis2: "d", iso: ["A.5.19", "A.5.20", "A.5.21", "A.5.22"], ens: ["op.ext"] },
  { id: "vuln", label: l("Vulnerability and patch management", "Gestión de vulnerabilidades y parches"), re: R("vulnerabilit|patch(ing| management)?|parche|actualizaciones de seguridad"), nis2: "e", iso: ["A.8.8"], ens: ["op.exp"] },
  { id: "network", label: l("Network security", "Seguridad de red"), re: R("firewall|segmentation|segmentaci[oó]n|\\bIDS\\b|\\bIPS\\b|\\bWAF\\b|DDoS|cortafuegos"), nis2: "e", iso: ["A.8.20", "A.8.22"], ens: ["mp.com"] },
  { id: "sdlc", label: l("Secure development", "Desarrollo seguro"), re: R("secure development|\\bSDLC\\b|code review|OWASP|desarrollo seguro|revisi[oó]n de c[oó]digo"), nis2: "e", iso: ["A.8.25", "A.8.28"], ens: ["mp.sw"] },
  { id: "change", label: l("Change management", "Gestión de cambios"), re: R("change management|gesti[oó]n de cambios"), nis2: "e", iso: ["A.8.32"], ens: ["op.exp"] },
  { id: "pentest", label: l("Security testing and audit", "Pruebas y auditoría de seguridad"), re: R("penetration test|pentest|security audit|red team|test(s)? de intrusi[oó]n|pruebas de penetraci[oó]n|auditor[ií]a de seguridad"), nis2: "f", iso: ["A.8.29", "A.5.35"], ens: ["op.mon"] },
  { id: "training", label: l("Awareness and training", "Concienciación y formación"), re: R("awareness|security training|training|concienciaci[oó]n|formaci[oó]n"), nis2: "g", iso: ["A.6.3"], ens: ["mp.per"] },
  { id: "malware", label: l("Malware protection", "Protección frente a código dañino"), re: R("anti-?virus|\\bEDR\\b|malware|anti-?malware|c[oó]digo da[nñ]ino|ransomware"), nis2: "g", iso: ["A.8.7"], ens: ["op.exp"] },
  { id: "crypto", label: l("Encryption and key management", "Cifrado y gestión de claves"), re: R("encrypt|cryptograph|\\bTLS\\b|\\bAES\\b|key management|cifrad|criptograf|gesti[oó]n de claves"), nis2: "h", iso: ["A.8.24"], ens: ["mp.info", "mp.com", "op.exp"] },
  { id: "access", label: l("Access control and least privilege", "Control de acceso y mínimo privilegio"), re: R("access control|least privilege|role-based|\\bRBAC\\b|privileged access|control de acceso|m[ií]nimo privilegio|privilegios"), nis2: "i", iso: ["A.5.15", "A.5.18", "A.8.2"], ens: ["op.acc"] },
  { id: "assets", label: l("Asset inventory", "Inventario de activos"), re: R("asset (inventory|management)|inventario de activos"), nis2: "i", iso: ["A.5.9"], ens: ["op.exp"] },
  { id: "hr", label: l("Personnel screening and confidentiality", "Verificación de personal y confidencialidad"), re: R("background check|screening|non-disclosure|\\bNDA\\b|antecedentes|acuerdo de confidencialidad|deber de secreto"), nis2: "i", iso: ["A.6.1", "A.6.6"], ens: ["mp.per"] },
  { id: "mfa", label: l("Multi-factor authentication", "Autenticación multifactor"), re: R("multi-?factor|\\bMFA\\b|\\b2FA\\b|two-factor|doble factor|multifactor|autenticaci[oó]n fuerte"), nis2: "j", iso: ["A.8.5"], ens: ["op.acc"] },
  { id: "physical", label: l("Physical security and data centres", "Seguridad física y centros de datos"), re: R("physical security|data cent(er|re)|physical access|seguridad f[ií]sica|centro de datos|acceso f[ií]sico"), iso: ["A.7.1", "A.7.2", "A.7.4"], ens: ["mp.if"] },
  { id: "privacy", label: l("Data protection and data location", "Protección de datos y ubicación de los datos"), re: R("GDPR|data protection|data (residency|location)|processing agreement|RGPD|LOPDGDD|protecci[oó]n de datos|ubicaci[oó]n de los datos|encargado del tratamiento"), iso: ["A.5.34"], ens: ["mp.info"] },
  { id: "iso27001", label: l("ISO/IEC 27001 certification", "Certificación ISO/IEC 27001"), re: R("ISO[ /]?(IEC )?27001"), nis2: "a", iso: ["Cl. 4-10"], ens: [] },
  { id: "enscert", label: l("ENS conformity", "Conformidad con el ENS"), re: R("\\bENS\\b|Esquema Nacional de Seguridad|RD 311/2022|Real Decreto 311/2022"), nis2: "a", iso: [], ens: ["all"] },
  { id: "nis2ref", label: l("NIS2 alignment", "Alineación con NIS2"), re: R("\\bNIS ?2\\b|2022/2555"), nis2: "a", iso: [], ens: [] },
  { id: "dora", label: l("DORA contractual provisions", "Disposiciones contractuales de DORA"), re: R("\\bDORA\\b|2022/2554|digital operational resilience"), nis2: "d", iso: ["A.5.19", "A.5.20"], ens: ["op.ext"] },
  { id: "sla", label: l("Service levels", "Niveles de servicio"), re: R("\\bSLA\\b|service level|availability of \\d|disponibilidad (del|de) \\d|niveles? de servicio"), iso: [], ens: ["op.ext"] },
];

/** Word-bounded alternation that also works next to accented letters, where \\b does not. */
const B = (alts: string): RegExp => new RegExp(`(?<![\\p{L}\\p{N}])(?:${alts})(?![\\p{L}\\p{N}])`, "iu");
const MANDATORY = B("must|shall|is required|are required|required to|will provide|will maintain|deber[aá]n?|debe[n]?|se requiere|ser[aá] obligatori[oa]|obligatori[oa]|requerir[aá]|exigible|es requisito|ser[aá]n requisito|realizar[aá]|dispondr[aá]|aplicar[aá]se|se aplicar[aá]");
const DESIRABLE = B("should|may|preferably|nice to have|desirable|se valorar[aá]|valorar[aá]n?|podr[aá]n?|preferiblemente|deseable|recomendable|se tendr[aá] en cuenta");

export type Status = "covered" | "partial" | "gap";
export interface Requirement { n: number; text: string; mandatory: boolean; topics: string[]; status: Status; nis2: string[]; iso: string[]; ens: string[] }
export interface Capabilities { have?: string[]; partial?: string[] }
export interface Shred {
  requirements: Requirement[];
  summary: { total: number; mandatory: number; covered: number; partial: number; gap: number; mandatoryGaps: number; mandatoryCoverage: number };
  topGaps: { topic: string; label: L; mandatory: number; total: number }[];
  language: Lang;
}

export function detectLang(text: string): Lang {
  const es = (text.match(/\b(el|la|los|las|deber[aá]|proveedor|servicio|seguridad|contrato|licitador|adjudicatari[oa]|de)\b/gi) ?? []).length;
  const en = (text.match(/\b(the|shall|must|supplier|service|security|contract|bidder|vendor|of)\b/gi) ?? []).length;
  return es > en ? "es" : "en";
}

export function splitCandidates(text: string): string[] {
  const out: string[] = [];
  for (const block of text.split(/\r?\n+/)) {
    const b = block.replace(/^\s*(?:[-*•]|\d+(?:\.\d+)*[.)]?|[a-z][.)])\s+/i, "").trim();
    if (!b) continue;
    for (const s of b.split(/(?<=[.;:])\s+(?=[A-ZÁÉÍÓÚÑ¿¡0-9"])/)) {
      const x = s.trim();
      if (x.length >= 20) out.push(x);
    }
  }
  return out;
}

export function shred(text: string, caps: Capabilities = {}): Shred {
  const have = new Set(caps.have ?? []);
  const partial = new Set(caps.partial ?? []);
  const reqs: Requirement[] = [];
  for (const s of splitCandidates(text)) {
    const mandatory = MANDATORY.test(s);
    if (!mandatory && !DESIRABLE.test(s)) continue;
    const hit = TOPICS.filter((tp) => tp.re.test(s));
    if (!hit.length) continue;
    const ids = hit.map((h) => h.id);
    const okAll = ids.every((i) => have.has(i));
    const okAny = ids.some((i) => have.has(i) || partial.has(i));
    const status: Status = okAll ? "covered" : okAny ? "partial" : "gap";
    const uniq = (a: (string | undefined)[]): string[] => [...new Set(a.filter((x): x is string => !!x))];
    reqs.push({ n: reqs.length + 1, text: s.length > 320 ? s.slice(0, 317) + "..." : s, mandatory, topics: ids, status, nis2: uniq(hit.map((h) => h.nis2)), iso: uniq(hit.flatMap((h) => h.iso)), ens: uniq(hit.flatMap((h) => h.ens)) });
  }
  const mand = reqs.filter((r) => r.mandatory);
  const count = (st: Status): number => reqs.filter((r) => r.status === st).length;
  const mandGaps = mand.filter((r) => r.status !== "covered").length;
  const per = new Map<string, { mandatory: number; total: number }>();
  for (const r of reqs) if (r.status !== "covered") for (const id of r.topics) {
    if (have.has(id)) continue;
    const e = per.get(id) ?? { mandatory: 0, total: 0 };
    e.total++; if (r.mandatory) e.mandatory++;
    per.set(id, e);
  }
  const topGaps = [...per.entries()].map(([topic, v]) => ({ topic, label: TOPICS.find((x) => x.id === topic)!.label, ...v })).sort((a, b) => b.mandatory - a.mandatory || b.total - a.total || a.topic.localeCompare(b.topic));
  return {
    requirements: reqs,
    summary: { total: reqs.length, mandatory: mand.length, covered: count("covered"), partial: count("partial"), gap: count("gap"), mandatoryGaps: mandGaps, mandatoryCoverage: mand.length ? Math.round(((mand.length - mandGaps) / mand.length) * 100) : 100 },
    topGaps,
    language: detectLang(text),
  };
}
