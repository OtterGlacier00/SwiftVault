# STATO PROGETTO — SwiftVault

> Documento di handoff: da leggere a inizio sessione (umano o agente).
> Ultimo aggiornamento: 25 ottobre 2026.

## Missione essenziale

App web **TanStack Start 1.0 React** (migrata da Next.js 16 — decisione
25/10/2026: Vercel Gold partner TanStack, drop Next, deploy Vercel via Nitro;
dettagli e percorso in `TANSTACK-PLAN.md`; `create-next-app` base originale:
src/, Tailwind 4, TS, pnpm). Sostituisce la scuola Teachable di Sean Allen
(chiusa il **24 novembre 2026**). Video scaricati e dentro il repo privato,
app deployata con Basic Auth su Vercel. Zero costi, uso personale.

⚠️ **Licenza**: materiali per uso personale; vietato esporli pubblicamente
(no mirror su server): per questo il hub richiede credenziali e la strategia
media è "nel repo privato". Non proporre YouTube/R2 public senza averlo
discusso (la discussione sulle opzioni c'è: YT private o R2 public sono state
valutate e scartate: Content ID/strike e lock-in).

## Struttura chiave

- `src/data/catalog.json` → corsi/moduli/lezioni. **Sorgente di verità** (lo
  script la rigenera per corso con merge incrementale).
- `src/proxy.ts` → Basic Auth (convenzione Next 16 per il vecchio middleware).
  Credenziali: env `SITE_USER` / `SITE_PASS`. In dev (senza env) resta aperto;
  in produzione senza env → **500** per non esporre niente.
- `public/media/<corso>/<modulo>/NN - nome file.mp4` → i video.
  `public/media/<corso>/<modulo>/_risorse/` → zip/swift/avatar di progetto,
  NON lezioni: lo script li salta; si agganciano alle lezioni con `links`.
- `scripts/build-catalog.mjs` → generatore catalogo (merge per modulo).
- `scripts/apply-links.mjs` → creato volatile per mappare gli allegati: nasce e
  muore ad ogni modulo (vedi GUIDA-OPERATIVA).
- **Pipeline scarico Teachable (2026)**: `scripts/teachable-relay.mjs`
  (collettore HTTP locale: la pagina autenticata nel browser OpenCode
  invia scan/URL firmati al relay, i cookie NON escono mai dal tab) +
  `scripts/launchpad-dl.mjs` / `scripts/swiftui-dl.mjs` (downloader resumable
  da URL firmati S3, validi ~5h, skip sezione BONUS, txt note automatici) +
  `scripts/av1-necessari.ps1` (encode AV1 dei soli mp4 >100 MiB + swap NEW-aware).
  Dettagli in GUIDA-OPERATIVA §5.
- Funzioni app: player con resume (localStorage), progressi, note per lezione,
  ricerca, PDF, download interni (`/media/...` con download attr), link esterni.

## Stato media (25 oct pomeriggio)

- **WidgetKit: COMMITTATO AL 100%** — 8 moduli, 63 lezioni, ~3,5 GB → ~3,3 GB
  (gli 8 file over-limit encodati AV1 720p CRF34: 105-140 MiB → 54-76 MiB,
  **-59% medio**, commit `e2b9629`). WWDC 2023 = modulo manuale "link"
- **iOS Dev Launchpad: SCARICATO COMPLETO** — 12 moduli, 67 video (3,9 GB,
  2 lezioni solo-upsell senza media: escluse dal catalogo, note nel txt),
  35 allegati (playground Challenge/Solution, zip progetti), txt note
  per-modulo in `Downloads\ios-dev-launchpad`. Catalogo generato
  (12 moduli / 67 lezioni), commit in attesa dello swap AV1 dei 6 over-limit
- **SwiftUI Fundamentals: SCARICATO COMPLETO** — 9 moduli, 68 video (4,75 GB),
  11 allegati (Weather, Frameworks, Scanner, Appetizers), lezioni "WWDC -
  What's New in SwiftUI" e "iOS 15&16 Updates - Not Applicable" senza media
  (escluse dal catalogo). 60 mp4 già in repo; 6 over-limit (8+2) in AV1/necessari.
  Catalogo generato (9 moduli / 68 lezioni)
- **AV1 solo-necessari IN CORSO**: 12 file >100 MiB (6 launchpad + 8 swiftui,
  2 in doppio pass) — scene `scripts/av1-necessari.ps1`, skip sezione BONUS mai
  scaricata; profilo 720p·CRF34·preset10·g·audio copy·faststart
- `how-i-became-an-ios-dev`: ebook PDF con viewer iframe ✓

**Nessun file >100 MiB resterà nel repo** (il guardaroba "AV1-tutto" è stato
revocato: i file H.264 sotto il limite restano originali).

## Blocco GitHub risolto (che vie erano)

Due strade valutate a suo tempo:
- **A. R2**: scartata (decisione utente).
- **B. AV1 re-encode**: scelta in versione ridotta "solo i file >100 MiB"
  (decisione rivista la sera stessa: prima si disse "tutta la libreria",
  poi si è направлении al minimo necessario per rientrare nei 100 MiB).
  WidgetKit fase 1 completata così; launchpad/swiftui via `av1-necessari.ps1`.
  **Regola valida per i file già committati**: non ricomprimere → la history
  avrebbe doppio blob (H.264 ma anche AV1). Encode PRIMA del commit.

## Limite pratico e il piano "quando si gonfia"

GitHub: file singoli < 100 MB, repo privato consigliato ≤ ~5 GB.
Attuale ~1.5 GB → quando superiamo comodamente 3–4 GB (o push lenti):

**Migrazione a Cloudflare R2** (10 GB gratis, egress gratis):
1. bucket + abilita Public Development URL → `https://pub-XXXX.r2.dev`
2. `pnpm catalog -- --course <id> --folder "public\media\<id>" --base https://pub-XXXX.r2.dev/<id>`
3. su Vercel è già tutto ok: gli src cambiano solo nel catalog.json
   (il proxy non protege R2: le URL r2.dev sono raggiungibili da chi ne ha l'URL
   → accettare o passare a domain privato+token; da decidere eventualmente:
   le alternative private costo $ sono state escluse).

## Framework: TanStack Start (decisione 25/10/2026 — drop di Next)

Prima la regola era condizionale ("se hosting Cloudflare → TanStack Start,
mai Next+OpenNext"). **Ora è incondizionale**: si droppa Next e si migra a
**TanStack Start 1.0 React** prima del primo deploy, perché:

- Vercel è **Gold partner** TanStack e il deploy Vercel è **documentato**
  nelle guide Start (via plugin `nitro/vite` — caveat: Nitro layer "under
  active development", rischio accettato per un'app semplice)
- Un'unica codebase amica di qualunque hosting futuro (CF preset ufficiale
  = spostamento mezza giornata)
- Da 1.0 STABILE (13/10/2026) con docs anche per **Solid** (eventuale port
  futuro UI-only, non richiesto ora)
- **Piano di migrazione in 8 step: `TANSTACK-PLAN.md`** (mezza giornata)

- Cosa si ricicla: `catalog.json` e tutti gli script, player/resume/progressi
  (localStorage = client-side, identico), Tailwind 4, componenti UI
- Cosa si riscrive: le route App Router → `src/routes/` TanStack Router
  (file-based), `proxy.ts` → middleware/server di Start (Basic Auth stessa
  logica, stessi env)
- **vinext SCARTATA** (feb 2026, v1.0 set 2026): "reimplementazione AI di Next
  su Vite" (1 ingegnere, 1 settimana) — codebase che vive in un layer
  non-Next, supporto a lungo termine non impegnato e 2 pivot CF su
  Next-on-Workers in 12 mesi. Non è il ponte: è un clone sperimentale.
  Decisione utente, definitiva.

## Deploy (da fare dopo Migrazione — 2 repo; layout Vercel da decidere al port)

1. **Ripulire la history media** di `swiftvault`:
   `git filter-repo --path public/media --invert-paths` (WidgetKit AV1
   committata non va in un repo public) — dopo: repo PUBLIC
2. **Repo `swiftvault-media`** (private `OtterGlacier00/swiftvault-media`,
   root = corsi): widgetkit push, poi launchpad e swiftui a fine AV1;
   si aggiungerà come **submodule** in `public/media`
3. Vercel: **una o due varianti a scelta durante il port** (tabella
   pro/contro in `TANSTACK-PLAN.md` §Architettura deploy):
   - A: 1 app + `fetch-media.mjs` build-time con `GH_TOKEN` fine-grained
   - B: 2 progetti + URL firmate HMAC (`MEDIA_SIGN_SECRET` x2)
   env sempre: `SITE_USER`, `SITE_PASS`, `SESSION_SECRET` (+ variante)
   (⚠️ `.env.local` attuale usa le demo `stefy/test`: CAMBIARE prima del deploy)
4. Test post-deploy: `/` pubblica → login moderno; con login → 200;
   media accessibili solo da app autenticata (cookie o URL firmata)

## Decisione media: AV1 **solo necessari** (25 ott 2026, rivista sera)

Prima decisione "re-encode AV1 su TUTTA la libreria"; **rivista a serata**:
si encodano con AV1 **solo gli mp4 >100 MiB** (limite GitHub), il resto resta
H.264 originale (nessuna perdita di qualità inutile, niente blob doppi nel
git history). Profilo tenuto: **720p · CRF 34 · preset 10 · g=240 ·
audio copy · faststart** (--720p stabilito nei test di qualità). Misurato su
CPU i3-2100: ~75 fps (2,5x realtime) → un file grande ~7-8 min.

- WidgetKit: i 8 file over-limit **fatti, swappati e committati**
  (commit `e2b9629`, -59% medio)
- Launchpad + SwiftUI: `scripts/av1-necessari.ps1` (encode + swap NEW-aware:
  l'originale può anche non essere già nel repo). Secondo pass possibile con
  skip se lo stage è già valido (per i file arrivati dopo il primo scan)
- Nomi/path IDENTICI → il catalogo non si tocca; mai commitare H.264 che
  verrà poi sostituito: i blob resterebbero in history
- ffmpeg via winget (Gyan.FFmpeg, alias in Links). Playback AV1:
  Chromium/Edge ok, WMP no

## Cosa fare il prossimo giro

- [x] Scarica da Teachable: iOS Dev Launchpad ✓ + SwiftUI Fundamentals ✓
      (script `launchpad-dl.mjs` / `swiftui-dl.mjs`, retry automatico oath URL
      scadute: risolvi i falliti in-page e rilancia — i già scaricati skip)
- [x] AV1 fase 1 WidgetKit (commit `e2b9629`)
- [ ] Fine `av1-necessari` (12 file) → swap → verifica ZERO >100 MiB
- [ ] Commit media: launchpad (61 H.264 + 6 AV1) e swiftui (60 H.264 + 8 AV1)
      SEPARATI (tematici), poi `src/data/catalog.json` + docs contatori
- [ ] Lez 2 senza media (Launchpad: "Where to go…", "Did you like SwiftUI?";
      SwiftUI: "WWDC - What's New in SwiftUI") — decidere: "link" manuale nel
      catalogo o restano escluse (oggi: escluse, note nei txt per-modulo)
- [ ] Aggancio `links` per le _risorse dei 2 corsi nuovi
      (GUIDA §3 modello, oppure mapping già nei downloader: da derivare)
- [ ] `pnpm run build` → OK → commit catalogo/docs
- [ ] **Migrazione Next → TanStack Start React** (8 step in `TANSTACK-PLAN.md`:
      scaffold Vite/Nitro, `src/routes/`, auth middleware, remove Next) →
      build OK locale
- [ ] **Split repo**: `swiftvault-media` privato (root = corsi) + **submodule**
      su `public/media` + `git filter-repo` per togliere i media dalla
      history + repo codice PUBLIC
- [ ] Push GitHub (repo public — gh già autenticato: OtterGlacier00) +
      deploy Vercel in versione A o B a scelta durante il port
      (⚠️ cambiare password demo `stefy/test` PRIMA del deploy)
- [ ] Test post-deploy: `/` → login moderno; route → 200 col cookie;
      media solo dopo autenticazione

## Roadmap facoltativa

- PWA installabile · export/import progressi e note · contatore ore video
