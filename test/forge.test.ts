import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { shred, splitCandidates, detectLang, TOPICS } from "../src/rfp.js";
import { checkRegister, parseCsv, validLei, CLAUSES } from "../src/dora.js";
import { category, conformityPath, plan as ensPlan, FAMILIES } from "../src/ens.js";
import { roi, validateModel, preventedShare } from "../src/roi.js";
import { gate } from "../src/nis2gate.js";
import { rfpMarkdown, doraMarkdown, ensMarkdown, roiMarkdown } from "../src/reports.js";

const read = (f: string): string => readFileSync(`examples/${f}`, "utf8");
const TODAY = new Date("2026-11-13T00:00:00Z");

test("rfp: language detection", () => {
  assert.equal(detectLang(read("rfp-es.txt")), "es");
  assert.equal(detectLang("The supplier shall encrypt all data of the service."), "en");
});

test("rfp: splitting strips numbering and keeps sentences", () => {
  const c = splitCandidates("3.1. The supplier must encrypt data in transit.\n- Second line that is long enough to keep. Third sentence here that is long enough.");
  assert.equal(c[0], "The supplier must encrypt data in transit.");
  assert.equal(c.length, 3);
});

test("rfp: accented Spanish modals are recognised", () => {
  const s = shred("El adjudicatario deberá cifrar los datos con TLS.\nSe valorará disponer de un SIEM propio con registros.");
  assert.equal(s.requirements.length, 2);
  assert.equal(s.requirements[0]!.mandatory, true);
  assert.equal(s.requirements[1]!.mandatory, false);
});

test("rfp: topics do not match inside longer words", () => {
  const s = shred("La información de la entidad deberá cifrarse con AES.");
  assert.deepEqual(s.requirements[0]!.topics, ["crypto"]);
});

test("rfp: sentences without a modal or without a topic are ignored", () => {
  const s = shred("The supplier encrypts all data in transit.\nThe supplier must deliver on time and within budget.");
  assert.equal(s.requirements.length, 0);
});

test("rfp: coverage statuses", () => {
  const text = "The supplier must enforce MFA and encryption.";
  assert.equal(shred(text, { have: ["mfa", "crypto"] }).requirements[0]!.status, "covered");
  assert.equal(shred(text, { have: ["mfa"] }).requirements[0]!.status, "partial");
  assert.equal(shred(text, { partial: ["crypto"] }).requirements[0]!.status, "partial");
  assert.equal(shred(text, {}).requirements[0]!.status, "gap");
});

test("rfp: sample numbers", () => {
  const s = shred(read("rfp-es.txt"), JSON.parse(read("capabilities.json")));
  assert.equal(s.summary.total, 15);
  assert.equal(s.summary.mandatory, 13);
  assert.equal(s.summary.covered + s.summary.partial + s.summary.gap, 15);
  assert.equal(s.summary.gap, 0);
  assert.deepEqual(s.topGaps.filter((g) => g.mandatory > 0).map((g) => g.topic).sort(), ["bcp", "enscert", "nis2ref", "supplier"]);
});

test("rfp: every topic is mapped and ids are unique", () => {
  assert.equal(new Set(TOPICS.map((x) => x.id)).size, TOPICS.length);
  for (const tp of TOPICS) { assert.ok(tp.label.en && tp.label.es); assert.ok(!!tp.nis2 || tp.iso.length + tp.ens.length > 0, tp.id); }
});

test("rfp: no gap topic is reported when the capability is held", () => {
  const s = shred("The supplier must enforce MFA and must run penetration tests.", { have: ["mfa"] });
  assert.deepEqual(s.topGaps.map((g) => g.topic), ["pentest"]);
});

test("dora: LEI check digits", () => {
  assert.equal(validLei("5493001KJTIIGC8Y1R12"), true);
  assert.equal(validLei("5493001KJTIIGC8Y1R13"), false);
  assert.equal(validLei("short"), false);
  assert.equal(validLei("5493001kjtiigc8y1r12"), false);
});

test("dora: csv parser handles quotes, semicolons and BOM", () => {
  assert.deepEqual(parseCsv('a,b\n"x, y","he said ""hi"""\n'), [["a", "b"], ["x, y", 'he said "hi"']]);
  assert.deepEqual(parseCsv("﻿a;b\n1;2"), [["a", "b"], ["1", "2"]]);
});

test("dora: sample register findings", () => {
  const r = checkRegister(read("contracts.csv"), TODAY);
  assert.equal(r.summary.contracts, 7);
  assert.equal(r.summary.critical, 4);
  assert.equal(r.summary.providers, 6);
  const codes = r.findings.map((f) => f.code);
  assert.ok(codes.includes("bad-lei") && codes.includes("no-lei") && codes.includes("expired") && codes.includes("expiring"));
  assert.ok(codes.includes("missing-tlpt") && codes.includes("missing-exit") && codes.includes("missing-audit") && codes.includes("missing-subcontracting") && codes.includes("subcontractors-unmanaged"));
  assert.equal(r.findings.filter((f) => f.severity === "low").length, 0);
  assert.equal(r.summary.fullyCompliant, 2);
});

test("dora: critical-only clauses are skipped for non-critical contracts", () => {
  const r = checkRegister(read("contracts.csv"), TODAY);
  const nonCritical = r.findings.filter((f) => f.contract === "C-002");
  assert.ok(!nonCritical.some((f) => f.code.includes("tlpt") || f.code.includes("exit")));
});

test("dora: duplicates, missing columns, header aliases", () => {
  const dup = checkRegister("contract_id,provider_name,provider_lei,critical_function\nA,P,5493001KJTIIGC8Y1R12,no\nA,P,5493001KJTIIGC8Y1R12,no\n", TODAY);
  assert.ok(dup.findings.some((f) => f.code === "duplicate-id"));
  assert.ok(dup.findings.some((f) => f.code === "unknown-services"));
  assert.ok(checkRegister("a,b\n1,2\n", TODAY).errors[0]!.includes("Missing column"));
  assert.ok(checkRegister("", TODAY).errors.length === 1);
  assert.equal(CLAUSES.length, 14);
});

test("dora: unanswered cell is low, explicit no is medium or high", () => {
  const csv = "id,provider,lei,critical,services,audit\nX,P,5493001KJTIIGC8Y1R12,yes,,no\n";
  const r = checkRegister(csv, TODAY);
  assert.ok(r.findings.some((f) => f.code === "unknown-services" && f.severity === "low"));
  assert.ok(r.findings.some((f) => f.code === "missing-audit" && f.severity === "high"));
});

test("ens: category is the highest dimension", () => {
  assert.equal(category({ C: "bajo", I: "bajo" }), "basica");
  assert.equal(category({ C: "bajo", I: "medio" }), "media");
  assert.equal(category({ C: "medio", D: "alto" }), "alta");
  assert.equal(category({}), "basica");
});

test("ens: conformity path by category", () => {
  assert.ok(conformityPath("basica").conformity.en.includes("Self-assessment"));
  assert.ok(conformityPath("media").conformity.en.includes("Certification"));
  assert.ok(conformityPath("alta").audit.en.includes("two years"));
});

test("ens: plan ranks none above unknown above partial above solid", () => {
  const p = ensPlan({ "op.acc": 0, "op.exp": 1, "mp.sw": 2 });
  const rank = (id: string): number => p.findIndex((x) => x.family.id === id);
  assert.ok(rank("op.acc") < rank("op.exp"));
  assert.ok(rank("op.exp") < rank("mp.sw"));
  assert.equal(p.length, FAMILIES.length);
  assert.equal(p[p.length - 1]!.maturity, 2);
});

test("roi: validation", () => {
  assert.throws(() => validateModel(null), /object/);
  assert.throws(() => validateModel({ scenarios: [], controls: [{}] }), /non-empty/);
  const s = { name: "A", annualRate: 1, lossMin: 1, lossMode: 2, lossMax: 3 };
  assert.throws(() => validateModel({ scenarios: [{ ...s, lossMode: 9 }], controls: [{ name: "c", reduces: {} }] }), /lossMin <= lossMode/);
  assert.throws(() => validateModel({ scenarios: [s], controls: [{ name: "c", reduces: { B: 0.5 } }] }), /unknown scenario/);
  assert.throws(() => validateModel({ scenarios: [s], controls: [{ name: "c", reduces: { A: 1.5 } }] }), /between 0 and 1/);
  assert.throws(() => validateModel({ scenarios: [s, s], controls: [{ name: "c", reduces: {} }] }), /duplicate/);
});

test("roi: independent controls combine multiplicatively", () => {
  const m = validateModel({ scenarios: [{ name: "A", annualRate: 1, lossMin: 100, lossMode: 100, lossMax: 100 }], controls: [{ name: "x", reduces: { A: 0.5 } }, { name: "y", reduces: { A: 0.5 } }] });
  assert.equal(preventedShare(m, "A"), 0.75);
});

test("roi: deterministic arithmetic", () => {
  const m = validateModel({ years: 2, iterations: 2000, seed: 1, scenarios: [{ name: "A", annualRate: 1, lossMin: 100, lossMode: 100, lossMax: 100 }], controls: [{ name: "x", oneOff: 50, annual: 10, reduces: { A: 0.5 } }] });
  const r = roi(m);
  assert.equal(r.annualBenefit, 50);
  assert.equal(r.cost.total, 70);
  assert.equal(r.netOverHorizon, 30);
  assert.equal(Math.round(r.rosi * 100), 43);
  assert.equal(r.paybackMonths, 15);
  assert.ok(r.simulation.probPositive > 0 && r.simulation.probPositive < 1);
});

test("roi: same seed same numbers, payback null when the control costs more than it saves", () => {
  const m = validateModel(JSON.parse(read("roi-model.json")));
  assert.deepEqual(roi(m).simulation, roi(m).simulation);
  const bad = validateModel({ scenarios: [{ name: "A", annualRate: 1, lossMin: 10, lossMode: 10, lossMax: 10 }], controls: [{ name: "x", oneOff: 100, annual: 50, reduces: { A: 0.5 } }] });
  assert.equal(roi(bad).paybackMonths, null);
});

test("nis2 gate: scope and threshold", () => {
  const fail = gate(JSON.parse(read("nis2-fail.json")), 0, "en");
  assert.equal(fail.pass, false);
  assert.deepEqual(fail.none, ["21(2)(c)", "21(2)(d)", "21(2)(f)"]);
  assert.equal(gate(JSON.parse(read("nis2-fail.json")), 3, "en").pass, true);
  assert.equal(gate(JSON.parse(read("nis2-pass.json")), 0, "en").pass, true);
  const out = gate({ country: "ES", sector: "other", employees: 5, turnoverMEur: 1, balanceSheetMEur: 1, maturity: { a: 0 } }, 0, "en");
  assert.equal(out.inScope, false);
  assert.equal(out.pass, true);
  assert.ok(gate(JSON.parse(read("nis2-fail.json")), 0, "es").markdown.includes("FALLO"));
});

test("reports: both languages, no em dashes, no pipes breaking tables", () => {
  const s = shred(read("rfp-es.txt"), JSON.parse(read("capabilities.json")));
  const d = checkRegister(read("contracts.csv"), TODAY);
  const r = roi(validateModel(JSON.parse(read("roi-model.json"))));
  const levels = { C: "medio", D: "alto" } as const;
  for (const lang of ["en", "es"] as const) {
    const all = [rfpMarkdown(s, lang), doraMarkdown(d, lang), ensMarkdown("alta", levels, conformityPath("alta"), ensPlan({}), lang), roiMarkdown(r, lang)].join("\n");
    assert.ok(!all.includes("—"), lang);
    assert.ok(all.length > 1000);
  }
  assert.ok(rfpMarkdown(shred("El proveedor deberá usar MFA | y cifrado."), "es").includes("\\|"));
});

test("cli: commands, exit codes and the step summary", () => {
  const run = (env: Record<string, string>, ...a: string[]) => spawnSync("node", ["dist/src/cli.js", ...a], { encoding: "utf8", env: { ...process.env, ...env } });
  assert.equal(run({}, "rfp", "examples/rfp-es.txt", "--have", "examples/capabilities.json").status, 0);
  assert.equal(run({}, "rfp", "examples/rfp-es.txt", "--have", "examples/capabilities.json", "--fail-on-mandatory-gap").status, 1);
  assert.equal(run({}, "dora", "examples/contracts.csv", "--today", "2026-11-13").status, 1);
  assert.equal(run({}, "ens", "examples/ens-profile.json", "--lang", "es").status, 0);
  assert.equal(run({}, "roi", "examples/roi-model.json", "--json").status, 0);
  assert.equal(run({}, "nis2", "examples/nis2-pass.json").status, 0);
  assert.equal(run({}, "nis2", "examples/nis2-fail.json").status, 1);
  assert.equal(run({}, "nis2", "examples/nis2-fail.json", "--max-none", "x").status, 2);
  assert.equal(run({}, "bogus", "x").status, 2);
  assert.equal(run({}).status, 2);
  assert.equal(run({}, "rfp").status, 2);
  assert.equal(run({}, "rfp", "nope.txt").status, 2);
  assert.equal(run({}, "dora", "examples/contracts.csv", "--today", "nonsense").status, 2);
  const f = `/tmp/forge-summary-${process.pid}.md`;
  run({ GITHUB_STEP_SUMMARY: f }, "nis2", "examples/nis2-pass.json", "--summary");
  assert.ok(readFileSync(f, "utf8").includes("NIS2 readiness check"));
});
