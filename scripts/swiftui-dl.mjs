// Downloader "SwiftUI Fundamentals" (Teachable 1178002) -> Downloads\swiftui-fundamentals\
// Stessa pipeline di launchpad-dl.mjs (scan/resolved da %TEMP%\opencode\collect\).
// Uso: node scripts/swiftui-dl.mjs

import fs from 'node:fs';
import path from 'node:path';

const COLLECT = path.join(process.env.TEMP || '.', 'opencode', 'collect');
const ROOT = 'C:/Users/Stefy/Downloads/swiftui-fundamentals';

const cur = JSON.parse(fs.readFileSync(path.join(ROOT, '_curriculum.json'), 'utf8'));
const scan = [];
for (const b of ['1', '2', '3']) scan.push(...JSON.parse(fs.readFileSync(path.join(COLLECT, `swiftui-scan-${b}.json`), 'utf8')));
const resolved = [];
for (const b of ['1', '2', '3']) resolved.push(...JSON.parse(fs.readFileSync(path.join(COLLECT, `swiftui-resolved-${b}.json`), 'utf8')));
const retryFiles = ['swiftui-retry-1', 'swiftui-retry-2', 'swiftui-retry-3'].map(f => path.join(COLLECT, f + '.json')).filter(fs.existsSync);
for (const f of retryFiles) {
  const arr = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const o of arr) { const i = resolved.findIndex(x => x.id === o.id); if (i >= 0) resolved[i] = o; else resolved.push(o); }
  console.log('[retry] override da', path.basename(f), arr.length);
}

const scanId = new Map(scan.map(s => [s.id, s]));
const urlId = new Map(resolved.filter(o => o.ok).map(o => [o.id, o]));
const sane = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim();

const expectedIds = cur.sections.flatMap(s => s.lessons.map(l => l.id));
const missingScan = expectedIds.filter(id => !scanId.has(id));
const missingUrl = expectedIds.filter(id => !urlId.has(id) && scanId.get(id)?.video?.dl);
if (missingScan.length) { console.error('[FATAL] id senza scan:', missingScan); process.exit(1); }
if (missingUrl.length) console.warn('[warn] lezioni senza video (ok):', missingUrl.join(','));

const mp4s = [];
const attachments = [];
const log = [];

for (const sec of cur.sections) {
  const folder = path.join(ROOT, sane(sec.section));
  const resDir = path.join(folder, '_risorse');
  let txt = `\n\n=== ${sec.section} ===\n`;
  sec.lessons.forEach((L, i) => {
    const n = String(i + 1).padStart(2, '0');
    const s = scanId.get(L.id);
    const v = urlId.get(L.id);
    if (v && v.len) mp4s.push({ id: L.id, n, out: path.join(folder, `${n} - ${sane(L.title)}.mp4`), url: v.url, size: v.len });
    const fi = (s?.files || []).filter(f => f.url && /^https?:/i.test(f.url)).map(f => {
      const name = sane(decodeURIComponent(f.url.split('/').pop().replace(/^[A-Za-z0-9]{12,20}_/, '')));
      attachments.push({ url: f.url, out: path.join(resDir, name) });
      return '  - ' + name;
    });
    txt += `\n\n———\n${n} — ${L.title}\n\n${s?.text || '(nessuna nota — lezione senza testo/video)'}${fi.length ? '\n\nFile:\n' + fi.join('\n') : ''}`;
  });
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'Nuovo documento di testo.txt'), txt + '\n', 'utf8');
  if (attachments.some(a => a.out.startsWith(resDir))) fs.mkdirSync(resDir, { recursive: true });
  log.push(`${sec.section}: ${sec.lessons.length} lezioni`);
}
console.log('[sezioni]\n  ' + log.join('\n  '));
console.log(`[dl] video: ${mp4s.length}, allegati: ${attachments.length}, GB video: ${(mp4s.reduce((n, x) => n + x.size, 0) / 1e9).toFixed(2)}`);

let failed = [];
async function dl(url, out, size) {
  const dir = path.dirname(out); fs.mkdirSync(dir, { recursive: true });
  if (size && fs.existsSync(out) && fs.statSync(out).size === size) { console.log(`[ok] ${path.basename(out)} (già presente)`); return; }
  const tmp = out + '.part';
  const partSize = fs.existsSync(tmp) ? fs.statSync(tmp).size : 0;
  let res;
  for (let i = 1; i <= 4; i++) {
    try { res = await fetch(url, partSize ? { headers: { Range: `bytes=${partSize}-` } } : {}); break; }
    catch (e) { if (i === 4) throw e; await new Promise(r => setTimeout(r, 3000 * i)); }
  }
  if (!res.ok && !(partSize && res.status === 206)) throw new Error(`http ${res.status}`);
  const started = Date.now();
  const w = fs.createWriteStream(tmp, { flags: partSize ? 'a' : 'w' });
  const reader = res.body.getReader();
  let got = partSize, lastLog = started;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    got += value.length;
    w.write(Buffer.from(value));
    if (Date.now() - lastLog > 20000) { lastLog = Date.now(); process.stdout.write(`  ${path.basename(out)}: ${(got / 1e6).toFixed(0)}MB @${((got - partSize) / (Date.now() - started) / 1e6).toFixed(1)}MB/s\n`); }
  }
  w.end(); await new Promise(r => w.on('close', r));
  fs.renameSync(tmp, out);
  console.log(`[ok] ${path.basename(out)}  ${(got / 1e6).toFixed(1)}MB in ${((Date.now() - started) / 1000).toFixed(0)}s${got !== size && size ? '  size-mismatch' : ''}`);
}

for (const a of attachments) {
  try { await dl(a.url, a.out); } catch (e) { failed.push({ out: a.out, e: String(e).slice(0, 200) }); console.error(`[FAIL] ${path.basename(a.out)} ${e}`); }
}
for (const v of mp4s) {
  try { await dl(v.url, v.out, v.size); } catch (e) { failed.push({ out: v.out, e: String(e).slice(0, 200) }); console.error(`[FAIL] ${path.basename(v.out)} ${e}`); }
}
fs.writeFileSync(path.join(COLLECT, 'swiftui-dl-final.json'), JSON.stringify({ failed, ts: new Date().toISOString() }, null, 1));
console.log(`[FINE] falliti: ${failed.length}`);
