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
const SKIP_EXT = new Set([".db", ".ini", ".json"]);

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
  .filter((d) => d.name !== ".DS_Store" && !d.name.startsWith("."));

if (files.length === 0) {
  console.error("Nessun file trovato nella cartella indicata.");
  process.exit(1);
}

const relPosix = (d) => relative(folder, d.parentPath).split(sep).join("/") + "/" + d.name;

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
  const src = base ? `${base.replace(/\/+$/, "")}/${encodeURI(relPosix(d))}` : "";

  modules.get(moduleId).lessons.push({
    id: `${courseId}-${moduleId}-${slugify(lessonName) || "lesson"}`,
    title: prettyTitle(lessonName),
    type,
    src,
  });
}

// ordine naturale dentro ogni modulo ("lezione 2" prima di "lezione 10")
for (const m of modules.values()) {
  m.lessons.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" }));
}

const generatedModules = [...modules.values()];

// ---------- merge nel catalogo ----------
const catalogPath = join(projectRoot, "src", "data", "catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const idx = catalog.courses.findIndex((c) => c.id === courseId);
const oldIdx = idx !== -1 ? catalog.courses[idx] : null;

// Preserva i "links" aggiunti a mano alle lezioni (chiave: lesson id)
const oldLinks = new Map();
for (const m of oldIdx?.modules ?? []) {
  for (const l of m.lessons) {
    if (l.links?.length) oldLinks.set(l.id, l.links);
  }
}
for (const m of generatedModules) {
  for (const l of m.lessons) {
    if (oldLinks.has(l.id)) l.links = oldLinks.get(l.id);
  }
}

const generated = {
  id: courseId,
  title: idx !== -1 ? catalog.courses[idx].title : courseId,
  modules: generatedModules,
};
const old = oldIdx;
generated.description = old?.description;
generated.subtitle = old?.subtitle;
generated.url = old?.url;

if (idx !== -1) catalog.courses[idx] = generated;
else catalog.courses.push(generated);

writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");

const lessonCount = generatedModules.reduce((n, m) => n + m.lessons.length, 0);
console.log(`✔ ${courseId}: ${generatedModules.length} moduli, ${lessonCount} lezioni aggiunte in data/catalog.json`);
if (!base) console.log("⚠ Nota: nessun --base: gli src dei media sono vuoti, riempi l'URL a mano o ritenta con --base.");
