import { Rng } from "./rng.js";

export interface Scenario { name: string; annualRate: number; lossMin: number; lossMode: number; lossMax: number }
export interface Control { name: string; oneOff?: number; annual?: number; reduces: Record<string, number> }
export interface Model { currency?: string; years?: number; iterations?: number; seed?: number; scenarios: Scenario[]; controls: Control[] }

export interface RoiResult {
  currency: string; years: number;
  scenarios: { name: string; annualRate: number; meanLoss: number; aleBefore: number; prevented: number; aleAfter: number }[];
  cost: { oneOff: number; annual: number; total: number };
  annualBenefit: number; netOverHorizon: number; rosi: number; paybackMonths: number | null;
  simulation: { iterations: number; netP10: number; netMedian: number; netP90: number; probPositive: number };
}

const pertMean = (s: Scenario): number => (s.lossMin + 4 * s.lossMode + s.lossMax) / 6;

export function validateModel(m: unknown): Model {
  if (typeof m !== "object" || m === null) throw new Error("model must be a JSON object");
  const o = m as Record<string, unknown>;
  const sc = o["scenarios"], co = o["controls"];
  if (!Array.isArray(sc) || sc.length === 0) throw new Error("scenarios must be a non-empty list");
  if (!Array.isArray(co) || co.length === 0) throw new Error("controls must be a non-empty list");
  const num = (v: unknown, what: string, min = 0): number => { if (typeof v !== "number" || !Number.isFinite(v) || v < min) throw new Error(`${what} must be a number >= ${min}`); return v; };
  const names = new Set<string>();
  const scenarios: Scenario[] = sc.map((x, i) => {
    const s = x as Record<string, unknown>;
    if (typeof s["name"] !== "string" || !s["name"]) throw new Error(`scenarios[${i}].name is required`);
    if (names.has(s["name"])) throw new Error(`duplicate scenario ${s["name"]}`);
    names.add(s["name"]);
    const lossMin = num(s["lossMin"], `scenarios[${i}].lossMin`), lossMode = num(s["lossMode"], `scenarios[${i}].lossMode`), lossMax = num(s["lossMax"], `scenarios[${i}].lossMax`);
    if (!(lossMin <= lossMode && lossMode <= lossMax)) throw new Error(`scenarios[${i}] needs lossMin <= lossMode <= lossMax`);
    return { name: s["name"], annualRate: num(s["annualRate"], `scenarios[${i}].annualRate`), lossMin, lossMode, lossMax };
  });
  const controls: Control[] = co.map((x, i) => {
    const c = x as Record<string, unknown>;
    if (typeof c["name"] !== "string" || !c["name"]) throw new Error(`controls[${i}].name is required`);
    const red = c["reduces"];
    if (typeof red !== "object" || red === null || Array.isArray(red)) throw new Error(`controls[${i}].reduces must be an object`);
    const reduces: Record<string, number> = {};
    for (const [k, v] of Object.entries(red)) {
      if (!names.has(k)) throw new Error(`controls[${i}] reduces unknown scenario ${k}`);
      if (typeof v !== "number" || v < 0 || v > 1) throw new Error(`controls[${i}].reduces.${k} must be between 0 and 1`);
      reduces[k] = v;
    }
    return { name: c["name"], oneOff: c["oneOff"] === undefined ? 0 : num(c["oneOff"], `controls[${i}].oneOff`), annual: c["annual"] === undefined ? 0 : num(c["annual"], `controls[${i}].annual`), reduces };
  });
  const years = o["years"] === undefined ? 3 : num(o["years"], "years", 1);
  const iterations = o["iterations"] === undefined ? 20000 : num(o["iterations"], "iterations", 100);
  return { currency: typeof o["currency"] === "string" ? o["currency"] : "EUR", years, iterations, seed: o["seed"] === undefined ? 7 : num(o["seed"], "seed"), scenarios, controls };
}

/** Controls act independently: the chance an event is prevented is 1 minus the product of (1 - reduction). */
export function preventedShare(m: Model, scenario: string): number {
  let keep = 1;
  for (const c of m.controls) keep *= 1 - (c.reduces[scenario] ?? 0);
  return 1 - keep;
}

function poisson(r: Rng, lambda: number): number {
  if (lambda <= 0) return 0;
  if (lambda > 30) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * r.normal()));
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= r.next(); } while (p > L);
  return k - 1;
}

export function roi(model: Model): RoiResult {
  const years = model.years ?? 3, iters = model.iterations ?? 20000;
  const oneOff = model.controls.reduce((a, c) => a + (c.oneOff ?? 0), 0);
  const annual = model.controls.reduce((a, c) => a + (c.annual ?? 0), 0);
  const total = oneOff + annual * years;
  const rows = model.scenarios.map((s) => {
    const meanLoss = pertMean(s);
    const before = s.annualRate * meanLoss;
    const share = preventedShare(model, s.name);
    return { name: s.name, annualRate: s.annualRate, meanLoss, aleBefore: before, prevented: before * share, aleAfter: before * (1 - share) };
  });
  const annualBenefit = rows.reduce((a, r) => a + r.prevented, 0);
  const net = annualBenefit * years - total;
  const yearly = annualBenefit - annual;
  const payback = oneOff === 0 ? 0 : yearly > 0 ? Math.round((oneOff / yearly) * 12 * 10) / 10 : null;
  const rng = new Rng(model.seed ?? 7);
  const nets: number[] = [];
  for (let i = 0; i < iters; i++) {
    let saved = 0;
    for (const s of model.scenarios) {
      const share = preventedShare(model, s.name);
      const n = poisson(rng, s.annualRate * years);
      for (let k = 0; k < n; k++) {
        const loss = rng.pert(s.lossMin, s.lossMode, s.lossMax);
        if (rng.next() < share) saved += loss;
      }
    }
    nets.push(saved - total);
  }
  nets.sort((a, b) => a - b);
  const q = (p: number): number => nets[Math.min(nets.length - 1, Math.floor(p * nets.length))]!;
  return { currency: model.currency ?? "EUR", years, scenarios: rows, cost: { oneOff, annual, total }, annualBenefit, netOverHorizon: net, rosi: total > 0 ? net / total : 0, paybackMonths: payback, simulation: { iterations: iters, netP10: q(0.1), netMedian: q(0.5), netP90: q(0.9), probPositive: nets.filter((x) => x > 0).length / nets.length } };
}
