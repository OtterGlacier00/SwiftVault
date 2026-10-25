// apply-links-auto.mjs — JOIN automatico scan Teachable ↔ curriculum ↔ catalog.json
// Aggancia a ogni lezione: allegati (kind=file, in _risorse) + URL esterni
// presenti nel testo della lezione. Le lezioni SENZA video con URL Apple WWDC
// diventano lezioni di tipo "link" (precedente WidgetKit). Nessun lavoro manuale.
//
// Uso: node scripts/apply-links-auto.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const COLLECT = 'C:/Users/Stefy/AppData/Local/Temp/opencode/collect'
const CATALOG = path.join(ROOT, 'src/data/catalog.json')
const DL = 'C:/Users/Stefy/Downloads'

const COURSES = [
  {
    course: 'ios-dev-launchpad',
    campus: 'iOS Dev Launchpad',
    scans: [1, 2, 3].map(i => `${COLLECT}/launchpad-scan-${i}.json`),
    curriculum: `${DL}/ios-dev-launchpad/_curriculum.json`,
  },
  {
    course: 'swiftui-fundamentals',
    campus: 'SwiftUI Fundamentals',
    scans: [1, 2, 3].map(i => `${COLLECT}/swiftui-scan-${i}.json`),
    curriculum: `${DL}/swiftui-fundamentals/_curriculum.json`,
  },
]

const slugify = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
// URL path segment style del catalogo: solo i spazi -> %20
const encPath = (p) => p.replace(/ /g, '%20')

// Il HTML dei testi Teachable concatena URL e etichette senza spazi
// ("... /10064/WWDC 2021 - ...", "/sf-symbols/SFSymbols - ...", "?q=asyncSwift ...").
// Regole di taglio (osservate nella bucassicizione effettiva dei 2 corsi):
const cleanUrl = (u) => {
  u = u.replace(/[),.]+$/, '')
  // 1. Apple video play: base wwdc<anno>/<id>
  const play = u.match(/^(https?:\/\/developer\.apple\.com\/videos\/play\/wwdc\d+\/\d+)/)
  if (play) return play[1]
  // 2. Apple ricerca WWDC: taglia la parte con inizio etichetta dopo q=
  //    (SENZA /i: altrimenti [a-z] catturerebbe la maiuscola incollata!)
  const search = u.match(/^(https?:\/\/developer\.apple\.com\/videos\/wwdc\d+\/\?q=[a-z0-9\-+]+)/)
  if (search) return search[1]
  // 3. sf-symbols: fine al path canonico
  const sf = u.match(/^(https?:\/\/developer\.apple\.com\/sf-symbols\/)/)
  if (sf) return sf[1]
  // 4. digit→maiuscola: confine URL/etichette (es ".../41611WWDC 2021")
  let out = u.replace(/(?<=\d)[A-Z].*$/, '')
  // 4b. etichetta incollata IN CODA (".../iosSwiftLee:", "...comDonny Wals:")
  out = out.replace(/(?<=[a-z0-9/])[A-Z][a-zA-Z' ]+:$/, '')
  // 4c. nome incollato a fine path (".../guidelines/Sean", "…/1Paul Hudson")
  out = out.replace(/(?<=\/)[A-Z][a-z]+$/, '')
  // 4d. caps-run in coda dopo minuscola (".../do-itMark")
  out = out.replace(/(?<=[a-z'])[A-Z][a-z]+$/, '')
  // 5. dominio+etichetta incollata senza path ("swiftwithmajid.comSwift", "...comiOS":
  //    l'i minuscola di "iOS" veniva inglobata nel TLD dal vecchio regex -> parsing per etichette)
  const rest = out.split('//')[1] ?? ''
  if (!rest.includes('/')) {
    const last = rest.split('.').pop() ?? ''
    // TLD piu lunghi prima (evita che "co" divorhi "com"); il resto incollato
    // DEVE contenere una maiuscola, altrimenti non c'e' glue
    for (const t of ['com', 'org', 'net', 'dev', 'info', 'edu', 'app', 'io', 'me', 'co', 'tv', 'it']) {
      if (!last.startsWith(t)) continue
      const glue = last.slice(t.length)
      if (glue && /[A-Z]/.test(glue)) out = out.slice(0, out.length - glue.length)
      break
    }
  }
  return out
}

const linkFromUrl = (u) => {
  u = cleanUrl(u)
  return { title: `Link: ${u.split('//')[1].replace(/^www\./, '').replace(/\/$/, '')}`, url: u }
}

const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'))
const report = { lessonsLinked: 0, downloads: 0, extranl: 0, skipKind: {}, unmatched: [], newLink: [] }

for (const C of COURSES) {
  const cur = JSON.parse(readFileSync(C.curriculum, 'utf8'))
  // scan: tutte le lezioni lette in pagina (id -> dati)
  const scanMap = new Map()
  for (const f of C.scans) {
    if (!existsSync(f)) continue
    for (const row of JSON.parse(readFileSync(f, 'utf8'))) scanMap.set(String(row.id), row)
  }

  const modules = catalog.courses.find(c => c.id === C.course)?.modules ?? []
  // curriculum lesson → module section (indexed per le ricerche)
  for (const section of cur.sections ?? []) {
    const mod = modules.find(m => slugify(m.title) === slugify(section.section))
    if (!mod) { report.unmatched.push(`[MODULO] ${C.course} :: ${section.section}`); continue }
    for (const lesson of section.lessons ?? []) {
      const data = scanMap.get(String(lesson.id))
      if (!data) { report.unmatched.push(`[SCAN] ${C.course} :: ${section.section} :: ${lesson.title}`); continue }

      const catLessons = (mod.lessons ?? []).filter(l => l.type !== 'link')

      // links candidati
      const newLinks = []
      for (const f of data.files ?? []) {
        if (f.kind === 'file' && f.url) {
          // nome pulito: hash20 + '_' -> basename (URL percent-encoded)
          const base = decodeURIComponent(f.url.split('/').pop() ?? '')
          const name = base.slice(base.indexOf('_') + 1)
          const local = path.join(DL, C.course, section.section, '_risorse', name)
          if (!existsSync(local)) { report.unmatched.push(`[FILE-MISSING] ${name} (${section.section})`); continue }
          newLinks.push({ title: `Scarica: ${name}`, url: `/media/${C.course}/${encPath(section.section)}/_risorse/${encPath(name)}` })
          report.downloads++
        } else {
          report.skipKind[f.kind] = (report.skipKind[f.kind] ?? 0) + 1
        }
      }
      // URL esterni dal testo: etichette incollate alle URL -> cleanUrl
      const wwdc = [...new Set(((data.text ?? '').match(
        /https?:\/\/developer\.apple\.com\/videos\/play\/wwdc\d+\/\d+\/?/g,
      ) ?? []).map(u => cleanUrl(u)))]
      const others = [...new Set(
        ((data.text ?? '').match(/https?:\/\/[^\s]+/g) ?? [])
          .flatMap(t => t.split(/(?=https?:\/\/)/)) // current: + URL dentro lo stesso token
          .map(cleanUrl),
      )].filter(u => u && !wwdc.some(w => u.startsWith(w)))
      const urls = [...wwdc, ...others]
      for (const u of others) {
        const l = linkFromUrl(u)
        if (l && l.url) newLinks.push(l)
      }
      for (const w of wwdc) {
        newLinks.push({ title: `Link: Apple WWDC (${w.split('/play/')[1]})`, url: w })
      }

      const target = catLessons.find(l => slugify(l.title) === slugify(lesson.title))
      if (target) {
        target.links = [...(target.links ?? [])]
        for (const nl of newLinks) if (!target.links.some(x => x.url === nl.url)) target.links.push(nl)
        if (newLinks.length) report.lessonsLinked++
      } else if (wwdc.length && lesson.id !== '41889750') {
        // lezione senza video ma con URL WWDC nel testo → type "link"
        // (precedente WidgetKit: il lesson aggrega più video WWDC, ultimo come src)
        const id = `${C.course}-${slugify(section.section)}-${slugify(lesson.title)}`
        if (mod.lessons.some(l => l.id === id)) continue // idempotente
        const extra = wwdc.length > 1
          ? wwdc.slice(0, -1).map(w => ({ title: `Link: Apple WWDC (${w.split('/play/')[1]})`, url: w }))
          : []
        mod.lessons.push({
          id,
          title: lesson.title,
          type: 'link',
          src: wwdc[wwdc.length - 1],
          ...(extra.length ? { links: extra } : {}),
        })
        report.newLink.push(`${mod.title} :: ${lesson.title} -> ${wwdc.join(' + ')}`)
      } else if (!target && urls.length && lesson.id !== '41889750') {
        report.unmatched.push(`[NO-VIDEO-NO-LINK] ${section.section} :: ${lesson.title}`)
      }
    }
  }
  // numerazione: le lezioni "link" aggiungono un modulo esistente, NESSUN numero disturbato
}

writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n')
console.log('lessons con links aggiunti:', report.lessonsLinked)
console.log('downloads agganciati:', report.downloads)
console.log('kind agganciati:', report.skipKind)
console.log('lezioni link NEW NEW:', report.newLink)
console.log('unmatched:', report.unmatched.length ? report.unmatched : 'zero')
