import { l, type L } from "./common.js";

export type Level = "bajo" | "medio" | "alto";
export const DIMENSIONS = ["C", "I", "D", "A", "T"] as const; // confidentiality, integrity, availability, authenticity, traceability
export type Dimension = (typeof DIMENSIONS)[number];
export type Category = "basica" | "media" | "alta";

export const DIMENSION_LABEL: Record<Dimension, L> = {
  C: l("Confidentiality", "Confidencialidad"), I: l("Integrity", "Integridad"), D: l("Availability", "Disponibilidad"), A: l("Authenticity", "Autenticidad"), T: l("Traceability", "Trazabilidad"),
};

/** Royal Decree 311/2022, Annex I: the category of a system is the highest level of any dimension. */
export function category(levels: Partial<Record<Dimension, Level>>): Category {
  const vals = Object.values(levels);
  if (vals.includes("alto")) return "alta";
  if (vals.includes("medio")) return "media";
  return "basica";
}

export interface Path { category: Category; conformity: L; audit: L; notes: L[] }
export function conformityPath(cat: Category): Path {
  const common = [
    l("Appoint security roles (information, service, system and security officers) and approve a security policy.", "Designe los roles de seguridad (responsables de la información, del servicio, del sistema y de seguridad) y apruebe una política de seguridad."),
    l("Run a risk analysis and publish a statement of applicability with the measures selected.", "Realice un análisis de riesgos y publique una declaración de aplicabilidad con las medidas seleccionadas."),
  ];
  if (cat === "basica") return { category: cat, conformity: l("Self-assessment and a declaration of conformity.", "Autoevaluación y declaración de conformidad."), audit: l("A formal audit is not mandatory for basic category.", "La auditoría formal no es obligatoria en categoría básica."), notes: common };
  return { category: cat, conformity: l("Certification of conformity issued by an accredited certification body.", "Certificación de conformidad emitida por una entidad de certificación acreditada."), audit: l("A regular audit at least every two years, and after substantial changes.", "Auditoría ordinaria al menos cada dos años y tras modificaciones sustanciales."), notes: [...common, cat === "alta" ? l("High category systems get the strictest measures and the closest supervision by the CCN.", "Los sistemas de categoría alta tienen las medidas más exigentes y la supervisión más cercana del CCN.") : l("Medium category needs the audit evidence ready before the certification body arrives.", "La categoría media necesita la evidencia de auditoría lista antes de la visita de la entidad certificadora.")] };
}

/** Control families of Annex II. Names only: control numbers inside a family change between editions, so check the CCN-STIC guides. */
export interface Family { id: string; name: L; weight: number; effort: "S" | "M" | "L" }
export const FAMILIES: Family[] = [
  { id: "org", name: l("Organisational framework", "Marco organizativo"), weight: 1.2, effort: "S" },
  { id: "op.pl", name: l("Planning (risk analysis, architecture, acquisition)", "Planificación (análisis de riesgos, arquitectura, adquisición)"), weight: 1.3, effort: "M" },
  { id: "op.acc", name: l("Access control", "Control de acceso"), weight: 1.4, effort: "M" },
  { id: "op.exp", name: l("Operation (inventory, configuration, patching, incidents, logs, keys)", "Explotación (inventario, configuración, parches, incidentes, registros, claves)"), weight: 1.5, effort: "L" },
  { id: "op.ext", name: l("External services", "Servicios externos"), weight: 1.1, effort: "M" },
  { id: "op.nub", name: l("Cloud services", "Servicios en la nube"), weight: 1.0, effort: "M" },
  { id: "op.cont", name: l("Service continuity", "Continuidad del servicio"), weight: 1.3, effort: "L" },
  { id: "op.mon", name: l("System monitoring", "Monitorización del sistema"), weight: 1.1, effort: "M" },
  { id: "mp.if", name: l("Facilities and infrastructure", "Instalaciones e infraestructuras"), weight: 0.7, effort: "M" },
  { id: "mp.per", name: l("Personnel management and training", "Gestión del personal y formación"), weight: 0.9, effort: "S" },
  { id: "mp.eq", name: l("Equipment protection", "Protección de los equipos"), weight: 0.9, effort: "M" },
  { id: "mp.com", name: l("Communications protection", "Protección de las comunicaciones"), weight: 1.1, effort: "M" },
  { id: "mp.si", name: l("Information media protection", "Protección de los soportes de información"), weight: 0.6, effort: "S" },
  { id: "mp.sw", name: l("Application protection", "Protección de las aplicaciones informáticas"), weight: 0.9, effort: "M" },
  { id: "mp.info", name: l("Information protection (encryption, backup, personal data)", "Protección de la información (cifrado, copias, datos personales)"), weight: 1.2, effort: "M" },
  { id: "mp.s", name: l("Service protection", "Protección de los servicios"), weight: 0.9, effort: "M" },
];

export interface PlanItem { family: Family; maturity: number | undefined; score: number }
const EFFORT = { S: 1, M: 2, L: 3 } as const;
/** Higher score first: weight times how far the family is from solid, divided by a mild effort penalty. Weights and effort are judgement values. */
export function plan(maturity: Record<string, number | undefined>): PlanItem[] {
  return FAMILIES.map((f) => {
    const m = maturity[f.id];
    const gap = m === 0 ? 1 : m === 1 ? 0.5 : m === 2 ? 0.05 : 0.8;
    return { family: f, maturity: m, score: Math.round((f.weight * gap * 10) / (1 + 0.15 * EFFORT[f.effort]) ) / 10 };
  }).sort((a, b) => b.score - a.score || a.family.id.localeCompare(b.family.id));
}
