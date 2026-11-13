import { shred, TOPICS } from "/lib/rfp.js";
import { checkRegister } from "/lib/dora.js";
import { category, conformityPath, plan as ensPlan, DIMENSIONS, DIMENSION_LABEL, FAMILIES } from "/lib/ens.js";
import { roi, validateModel } from "/lib/roi.js";
import { rfpMarkdown, doraMarkdown, ensMarkdown, roiMarkdown } from "/lib/reports.js";

const $ = (id) => document.getElementById(id);
const lang = () => $("lang").value;
const TODAY = new Date();

function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}
function table(headers, rows, classes = []) {
  const t = document.createElement("table");
  const h = document.createElement("tr");
  headers.forEach((x) => h.append(el("th", x)));
  t.append(h);
  rows.forEach((r) => {
    const tr = document.createElement("tr");
    r.forEach((c, i) => tr.append(el("td", String(c), classes[i] ? classes[i](c) : undefined)));
    t.append(tr);
  });
  return t;
}
function cards(items) {
  const box = el("div", undefined, "cards");
  for (const [label, value, cls] of items) { const c = el("div", undefined, `card ${cls ?? ""}`); c.append(el("b", String(value)), el("span", label)); box.append(c); }
  return box;
}
function panel(title, ...kids) { const p = el("div", undefined, "panel"); p.append(el("h2", title), ...kids); return p; }
function copyButton(getMd) {
  const b = el("button", "Copy markdown");
  b.type = "button";
  b.addEventListener("click", async () => { try { await navigator.clipboard.writeText(getMd()); b.textContent = "Copied"; setTimeout(() => { b.textContent = "Copy markdown"; }, 1500); } catch { /* clipboard blocked */ } });
  return b;
}
async function sample(name) { return (await fetch(`/examples/${name}`)).text(); }

// ---- tabs
document.querySelectorAll("#tabs button").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll("#tabs button").forEach((x) => x.classList.toggle("on", x === b));
  document.querySelectorAll(".tab").forEach((s) => { s.hidden = s.id !== `p-${b.dataset.tab}`; });
}));
$("lang").addEventListener("change", () => { runRfp(); runDora(); runEns(); runRoi(); });

// ---- RFP
const capSel = {};
for (const tp of TOPICS) {
  const l = document.createElement("label");
  const s = document.createElement("select");
  for (const [v, t] of [["no", "no"], ["partial", "partial"], ["yes", "yes"]]) { const o = el("option", t); o.value = v; s.append(o); }
  s.addEventListener("change", runRfp);
  capSel[tp.id] = s;
  l.append(el("span", tp.label.en), s);
  $("caps").append(l);
}
function runRfp() {
  const out = $("rfp-out");
  const have = [], partial = [];
  for (const [id, s] of Object.entries(capSel)) { if (s.value === "yes") have.push(id); else if (s.value === "partial") partial.push(id); }
  const r = shred($("rfp-text").value, { have, partial });
  out.replaceChildren();
  if (!r.requirements.length) { out.append(el("p", "No security requirements found yet. Paste RFP text with must, shall, deberá or se valorará.", "hint")); return; }
  const m = r.summary;
  out.append(cards([["Requirements", m.total], ["Mandatory", m.mandatory], ["Mandatory coverage", `${m.mandatoryCoverage}%`, m.mandatoryCoverage >= 90 ? "ok" : m.mandatoryCoverage >= 70 ? "warn" : "bad"], ["Gaps", m.gap, m.gap ? "bad" : "ok"], ["Partial", m.partial, m.partial ? "warn" : "ok"]]));
  if (r.topGaps.length) out.append(panel("Biggest gap topics", table(["Topic", "Mandatory", "Total"], r.topGaps.slice(0, 8).map((g) => [g.label[lang()], g.mandatory, g.total]))));
  const sc = { covered: "s-covered", partial: "s-partial", gap: "s-gap" };
  out.append(panel("Requirement matrix", table(["#", "Requirement", "Type", "Status", "NIS2", "ISO 27001:2022", "ENS"], r.requirements.map((q) => [q.n, q.text, q.mandatory ? "mandatory" : "desirable", q.status, q.nis2.map((x) => `21(2)(${x})`).join(", ") || "-", q.iso.join(", ") || "-", q.ens.join(", ") || "-"]), [null, null, null, (v) => sc[v]])));
  out.append(copyButton(() => rfpMarkdown(r, lang())));
}
$("rfp-text").addEventListener("input", runRfp);
$("rfp-sample").addEventListener("click", async () => {
  $("rfp-text").value = await sample("rfp-es.txt");
  const c = JSON.parse(await sample("capabilities.json"));
  for (const [id, s] of Object.entries(capSel)) s.value = (c.have ?? []).includes(id) ? "yes" : (c.partial ?? []).includes(id) ? "partial" : "no";
  runRfp();
});

// ---- DORA
function runDora() {
  const out = $("dora-out");
  out.replaceChildren();
  const text = $("dora-text").value;
  if (!text.trim()) return;
  const r = checkRegister(text, TODAY);
  if (r.errors.length) { out.append(el("p", r.errors.join("; "), "err")); return; }
  const s = r.summary;
  out.append(cards([["Contracts", s.contracts], ["Critical or important", s.critical], ["High findings", s.high, s.high ? "bad" : "ok"], ["Medium findings", s.medium, s.medium ? "warn" : "ok"], ["Ending in 12 months", s.expiring12m, s.expiring12m ? "warn" : "ok"], ["Clean contracts", s.fullyCompliant, "ok"]]));
  out.append(panel("Provider concentration", table(["Provider", "Contracts", "Critical"], r.concentration.map((c) => [c.provider, c.contracts, c.critical]))));
  const order = { high: 0, medium: 1, low: 2 };
  const rows = [...r.findings].sort((a, b) => order[a.severity] - order[b.severity] || a.row - b.row).map((f) => [f.row, f.contract, f.severity, f.message[lang()]]);
  out.append(panel("Findings", table(["Row", "Contract", "Severity", "Finding"], rows, [null, null, (v) => `s-${v}`])));
  out.append(copyButton(() => doraMarkdown(r, lang())));
}
$("dora-text").addEventListener("input", runDora);
$("dora-sample").addEventListener("click", async () => { $("dora-text").value = await sample("contracts.csv"); runDora(); });

// ---- ENS
const dimSel = {}, famSel = {};
for (const d of DIMENSIONS) {
  const l = document.createElement("label"), s = document.createElement("select");
  for (const v of ["bajo", "medio", "alto"]) { const o = el("option", v); o.value = v; s.append(o); }
  s.addEventListener("change", runEns);
  dimSel[d] = s;
  l.append(el("span", `${d} ${DIMENSION_LABEL[d].en}`), s);
  $("ens-dims").append(l);
}
for (const f of FAMILIES) {
  const l = document.createElement("label"), s = document.createElement("select");
  for (const [v, t] of [["", "unknown"], ["0", "none"], ["1", "partial"], ["2", "solid"]]) { const o = el("option", t); o.value = v; s.append(o); }
  s.addEventListener("change", runEns);
  famSel[f.id] = s;
  l.append(el("span", `${f.id} ${f.name.en}`), s);
  $("ens-fams").append(l);
}
function runEns() {
  const levels = {};
  for (const d of DIMENSIONS) levels[d] = dimSel[d].value;
  const maturity = {};
  for (const [id, s] of Object.entries(famSel)) if (s.value !== "") maturity[id] = Number(s.value);
  const cat = category(levels), path = conformityPath(cat), pl = ensPlan(maturity);
  const out = $("ens-out");
  out.replaceChildren();
  out.append(cards([["System category", cat.toUpperCase(), cat === "alta" ? "bad" : cat === "media" ? "warn" : "ok"]]));
  const notes = el("ul");
  for (const x of [path.conformity, path.audit, ...path.notes]) notes.append(el("li", x[lang()]));
  out.append(panel("Conformity path", notes));
  const lv = ["none", "partial", "solid"];
  out.append(panel("Work order by family", table(["#", "Family", "Maturity", "Effort", "Score"], pl.map((p, i) => [i + 1, `${p.family.id} ${p.family.name[lang()]}`, p.maturity === undefined ? "unknown" : lv[p.maturity], p.family.effort, p.score]))));
  out.append(copyButton(() => ensMarkdown(cat, levels, path, pl, lang())));
}

// ---- ROI
function runRoi() {
  const out = $("roi-out");
  out.replaceChildren();
  $("roi-err").textContent = "";
  const text = $("roi-text").value;
  if (!text.trim()) return;
  let r;
  try { r = roi(validateModel(JSON.parse(text))); } catch (e) { $("roi-err").textContent = e.message; $("roi-err").className = "hint err"; return; }
  const money = (n) => `${Math.round(n).toLocaleString("en-US")} ${r.currency}`;
  out.append(cards([["Expected annual benefit", money(r.annualBenefit)], ["Total cost", money(r.cost.total)], ["Net over horizon", money(r.netOverHorizon), r.netOverHorizon > 0 ? "ok" : "bad"], ["ROSI", `${(r.rosi * 100).toFixed(0)}%`], ["Payback", r.paybackMonths === null ? "never" : `${r.paybackMonths} mo`], ["P(net > 0)", `${(r.simulation.probPositive * 100).toFixed(0)}%`, r.simulation.probPositive >= 0.6 ? "ok" : "warn"]]));
  const max = Math.max(...r.scenarios.map((s) => s.aleBefore), 1);
  const bars = el("div");
  for (const s of r.scenarios) {
    const row = el("div"); row.append(el("b", s.name));
    const a = el("span", undefined, "bar"); a.style.width = `${Math.max(1, (s.aleBefore / max) * 100)}%`;
    const b = el("span", undefined, "bar after"); b.style.width = `${Math.max(1, (s.aleAfter / max) * 100)}%`;
    row.append(a, b, el("span", `${money(s.aleBefore)} before, ${money(s.aleAfter)} after`, "hint"));
    bars.append(row);
  }
  out.append(panel("Expected annual loss, before and after", bars));
  const sim = r.simulation;
  out.append(panel("Simulation", table(["Net P10", "Median", "P90"], [[money(sim.netP10), money(sim.netMedian), money(sim.netP90)]])));
  out.append(copyButton(() => roiMarkdown(r, lang())));
}
$("roi-text").addEventListener("input", runRoi);
$("roi-sample").addEventListener("click", async () => { $("roi-text").value = await sample("roi-model.json"); runRoi(); });

// start with the samples loaded so the page is never empty
$("rfp-sample").click();
$("dora-sample").click();
$("roi-sample").click();
runEns();
