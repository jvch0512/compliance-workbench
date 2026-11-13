#!/usr/bin/env node
import { appendFileSync, readFileSync } from "node:fs";
import type { Lang } from "./common.js";
import { shred, type Capabilities } from "./rfp.js";
import { checkRegister } from "./dora.js";
import { category, conformityPath, plan as ensPlan, DIMENSIONS, type Dimension, type Level } from "./ens.js";
import { roi, validateModel } from "./roi.js";
import { gate } from "./nis2gate.js";
import { doraMarkdown, ensMarkdown, rfpMarkdown, roiMarkdown } from "./reports.js";

const USAGE = `compliance-forge <command> FILE [options]

  rfp   FILE.txt   [--have capabilities.json] [--fail-on-mandatory-gap]   shred an RFP into mapped requirements
  dora  FILE.csv   [--today YYYY-MM-DD]                                    check a register of ICT contracts (exit 1 on high findings)
  ens   FILE.json                                                          ENS category, conformity path and work order
  roi   FILE.json                                                          security business case with simulation
  nis2  FILE.json  [--max-none N] [--summary]                              NIS2 readiness gate for CI (exit 1 on failure)

common: --lang en|es   --json
Nothing leaves your machine.`;

function fail(msg: string): number { console.error(`error: ${msg}`); return 2; }

function main(argv: string[]): number {
  const [cmd, ...rest] = argv.slice(2);
  if (!cmd || cmd === "--help" || cmd === "-h") { console.log(USAGE); return cmd ? 0 : 2; }
  let lang: Lang = "en", json = false, file: string | undefined, have: string | undefined, today: string | undefined, maxNone = 0, summary = false, failMand = false;
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]!;
    if (a === "--json") json = true;
    else if (a === "--summary") summary = true;
    else if (a === "--fail-on-mandatory-gap") failMand = true;
    else if (a === "--lang") { const v = rest[++i]; if (v !== "en" && v !== "es") return fail("--lang must be en or es"); lang = v; }
    else if (a === "--have") have = rest[++i];
    else if (a === "--today") today = rest[++i];
    else if (a === "--max-none") { maxNone = Number(rest[++i]); if (!Number.isInteger(maxNone) || maxNone < 0) return fail("--max-none must be a non-negative integer"); }
    else if (a.startsWith("-")) return fail(`unknown option ${a}`);
    else file = a;
  }
  if (!file) return fail("missing FILE");
  try {
    const raw = readFileSync(file, "utf8");
    const out = (obj: unknown, md: string): void => console.log(json ? JSON.stringify(obj, null, 2) : md);
    if (cmd === "rfp") {
      const caps: Capabilities = have ? (JSON.parse(readFileSync(have, "utf8")) as Capabilities) : {};
      const s = shred(raw, caps);
      out(s, rfpMarkdown(s, lang));
      return failMand && s.summary.mandatoryGaps > 0 ? 1 : 0;
    }
    if (cmd === "dora") {
      const d = today ? new Date(`${today}T00:00:00Z`) : new Date();
      if (Number.isNaN(d.getTime())) return fail("--today must be YYYY-MM-DD");
      const r = checkRegister(raw, d);
      if (r.errors.length) { console.error(`error: ${r.errors.join("; ")}`); return 2; }
      out(r, doraMarkdown(r, lang));
      return r.summary.high > 0 ? 1 : 0;
    }
    if (cmd === "ens") {
      const p = JSON.parse(raw) as { levels?: Partial<Record<Dimension, Level>>; maturity?: Record<string, number> };
      const levels = p.levels ?? {};
      for (const [k, v] of Object.entries(levels)) if (!(DIMENSIONS as readonly string[]).includes(k) || !["bajo", "medio", "alto"].includes(v as string)) return fail(`levels.${k} must be one of C I D A T with bajo, medio or alto`);
      const cat = category(levels);
      const path = conformityPath(cat);
      const pl = ensPlan(p.maturity ?? {});
      out({ category: cat, path, plan: pl }, ensMarkdown(cat, levels, path, pl, lang));
      return 0;
    }
    if (cmd === "roi") {
      const r = roi(validateModel(JSON.parse(raw)));
      out(r, roiMarkdown(r, lang));
      return 0;
    }
    if (cmd === "nis2") {
      const g = gate(JSON.parse(raw), maxNone, lang);
      out(g, g.markdown);
      const sf = process.env["GITHUB_STEP_SUMMARY"];
      if (summary && sf) appendFileSync(sf, g.markdown + "\n");
      return g.pass ? 0 : 1;
    }
    return fail(`unknown command ${cmd}`);
  } catch (e) {
    return fail((e as Error).message);
  }
}
process.exit(main(process.argv));
