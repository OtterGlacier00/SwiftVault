#!/usr/bin/env node
/**
 * Genera automaticamente i moduli/lezioni di un corso in data/catalog.json
 * a partire dalla struttura di cartelle dei materiali scaricati da Teachable.
 *
 * Uso:
 *   node scripts/build-catalog.mjs --course widgetkit --folder <cartella-download> --base <url-base-online>
 *
 * Esempio:
 *   node scripts/build-catalog.mjs --course widgetkit --folder C:\Downloads\widgetkit --base https://pub-XXXX.r2.dev/widgetkit
 *
 * Convenzione cartelle (consigliata, è quella tipica di Teachable):
 *   widgetkit/
 *     Getting Started/
 *       01 Welcome.mp4
 *       02 ............mp4
 *     Widget Basics/
 *       01 ............mp4
 *       cheatsheet.pdf
 *
 * - Ogni sottocartella di primo livello  ->  un modulo
 * - Ogni file                            ->  una lezione (mp4/mov/webm video, pdf, resto: file)
 * - I titoli perdono il prefisso numerico "01 - "
 * - Se non c'è --base gli src restano vuoti e li riempi a mano in catalog.json
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, extname, relative, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, "..");

// ---------- argomenti ----------
function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const courseId = arg("--course");
const folder = arg("--folder");
const base = arg("--base") || "";

if (!courseId || !folder) {
  console.error(
    "Uso: node scripts/build-catalog.mjs --course <id-corso> --folder <cartella-download> [--base <url>]\n" +
      "Gli id dei corsi disponibili sono in data/catalog.json."
  );
  process.exit(1);
}
if (!existsSync(folder)) {
  console.error(`Cartella non trovata: ${folder}`);
  process.exit(1);
}

// ---------- tipi supportati ----------
const VIDEO_EXT = new Set([".mp4", ".m4v", ".mov", ".webm"]);
const PDF_EXT = new Set([".pdf"]);
const SKIP_EXT = new Set([".db", ".ini", ".json", ".txt"]); // txt = note per-modulo generate a parte, non lezioni

// ---------- util ----------
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** "02 - Create A Widget Layout" -> "Create A Widget Layout" */
const prettyTitle = (stem) => stem.replace(/^\d+\s*[-–—_.]*\s*/, "").trim() || stem;

// ---------- raccolta file ----------
const files = readdirSync(folder, { withFileTypes: true, recursive: true })
  .filter((d) => d.isFile())
  .filter((d) => !SKIP_EXT.has(extname(d.name).toLowerCase()))
  .filter((d) => d.name !== ".DS_Store" && !d.name.startsWith("."))
  // Convenzione: le cartelle che iniziano con "_" contengono asset RISORSE
  // (zip di progetto, swift, ecc.) invocate dalle lezioni tramite "links",
  // non sono lezioni e non finiscono nel catalogo.
  .filter((d) => !relative(folder, d.parentPath).split(sep).some((s) => s.startsWith("_")));

if (files.length === 0) {
  console.error("Nessun file trovato nella cartella indicata.");
  process.exit(1);
}

const relPosix = (d) => relative(folder, d.parentPath).split(sep).join("/") + "/" + d.name;

/* URL sicuro: ogni segmento del percorso via encodeURIComponent ("#" e spazi
   compresi), i "/" reali restano separatori. */
const relUrl = (d) => relPosix(d).split("/").map(encodeURIComponent).join("/");

const modules = new Map();
for (const d of files) {
  const rel = relative(folder, d.parentPath);
  const segs = rel.split(sep).filter(Boolean);

  const moduleId = segs.length > 0 ? `${slugify(segs[0]) || "root"}` : "root";
  const moduleTitle = segs.length > 0 ? prettyTitle(segs[0]) : "Lezioni";

  if (!modules.has(moduleId)) modules.set(moduleId, { id: moduleId, title: moduleTitle, lessons: [] });

  const ext = extname(d.name).toLowerCase();
  const lessonName = basename(d.name, extname(d.name));
  const type = VIDEO_EXT.has(ext) ? "video" : PDF_EXT.has(ext) ? "pdf" : "file";
  const src = base ? `${base.replace(/\/+$/, "")}/${relUrl(d)}` : "";

  modules.get(moduleId).lessons.push({
    id: `${courseId}-${moduleId}-${slugify(lessonName) || "lesson"}`,
    title: prettyTitle(lessonName),
    type,
    src,
    _key: relPosix(d),
  });
}

// ordine "naturale" col nome file ("02 - x" prima di "10 - x"):
// così prev/next e progressi seguono l'ordine didattico originale
for (const m of modules.values()) {
  m.lessons.sort((a, b) => a._key.localeCompare(b._key, undefined, { numeric: true, sensitivity: "base" }));
  m.lessons.forEach((l) => delete l._key);
}

const generatedModules = [...modules.values()];

// ---------- merge nel catalogo ----------
const catalogPath = join(projectRoot, "src", "data", "catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const idx = catalog.courses.findIndex((c) => c.id === courseId);
const oldIdx = idx !== -1 ? catalog.courses[idx] : null;

// Preserva i "links" aggiunti a mano alle lezioni. La chiave è
// "moduloId:titolo pulito" (e non l'id): così sopravvive ai rinomina file
// (01-nome, 02-nome...) che cambiano l'id ma non il titolo.
const oldLinks = new Map();
for (const m of oldIdx?.modules ?? []) {
  for (const l of m.lessons) {
    if (l.links?.length) oldLinks.set(`${m.id}:${l.title}`, l.links);
  }
}

/**
 * Merge dei moduli: quelli generati sostituiscono i corrispondenti (stesso id)
 * e vengono aggiunti se nuovi. Con --replace si sostituisce TUTTO il corso
 * (comodo se vuoi rimuovere a mano da catalog.json i moduli desueti).
 */
let modulesOut;
if (process.argv.includes("--replace")) {
  modulesOut = generatedModules;
} else {
  const byId = new Map([...(oldIdx?.modules ?? [])].map((m) => [m.id, m]));
  for (const g of generatedModules) byId.set(g.id, g);
  modulesOut = [...byId.values()];
}

for (const m of modulesOut) {
  for (const l of m.lessons) {
    if (oldLinks.has(`${m.id}:${l.title}`)) l.links = oldLinks.get(`${m.id}:${l.title}`);
  }
}

const generated = {
  id: courseId,
  title: idx !== -1 ? catalog.courses[idx].title : courseId,
  modules: modulesOut,
};
const old = oldIdx;
generated.description = old?.description;
generated.subtitle = old?.subtitle;
generated.url = old?.url;

if (idx !== -1) catalog.courses[idx] = generated;
else catalog.courses.push(generated);

writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");

const lessonCount = modulesOut.reduce((n, m) => n + m.lessons.length, 0);
console.log(`✔ ${courseId}: ora ${modulesOut.length} moduli, ${lessonCount} lezioni (merge). Generati ora: ${generatedModules.length} moduli da ${folder}`);
if (!base) console.log("⚠ Nota: nessun --base: gli src dei media sono vuoti, riempi l'URL a mano o ritenta con --base.");
