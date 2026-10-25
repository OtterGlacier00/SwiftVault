# GUIDA OPERATIVA — come aggiungere un modulo (e non incazzarsela)

La routine collaudata, con le trappole già incontrate. Comandi da PowerShell
nella root del progetto.

## 1. Aggiungere un modulo scaricato da Teachable

1. **Numerare** i video se Teachable non lo fa: `01 - Nome.mp4`, `02 - ...`
   (ordine didattico; lo script toglie i prefissi dai titoli)
2. Inserire in `public/media/widgetkit/<Nome Modulo>/`:
   - i video `.mp4` nella root del modulo
   - le RISORSE (zip progetti, .swift, avatar, README…) in `_risorse/`
3. Leggere il txt di risorse di Teachable se c'è: indica quale zip/link va a
   quale lezione (chiave: **lezione N**)
4. Generare il catalogo (percorso reale, non `...`):
   ```powershell
   node scripts\build-catalog.mjs --course widgetkit --folder "public\media\widgetkit" --base /media/widgetkit
   ```
   o per altro corso: `--course ios-dev-launchpad --folder "public\media\ios-dev-launchpad" --base /media/ios-dev-launchpad`
5. Agganciare le risorse del txt con `scripts/apply-links.mjs` (modello nel §3)
6. Verifiche: `pnpm run build` → BUILD OK (in PS usare `*> $null; $LASTEXITCODE`)
7. Commit tematici (regola fissa):
   ```powershell
   git add public/media; git commit -m 'media: WidgetKit - modulo X'
   git add src/data; git commit -m 'catalogo: modulo X con risorse'
   ```

Convenzioni solidale (non reinventare):
- **merge, non replace**: lo script unisce i moduli per id (per azzerare con
  intenzione: flag `--replace`)
- **link manuali preservati** tra rigenerazioni (chiave `moduloId:titolo pulito`):
  i `links` scritti a mano in catalog.json sopravvivono a rinomina/regenerazioni
- cartelle che iniziano con `_` → saltate dallo script (asset, non lezioni)
- URL: lo script codifica per segmento (`encodeURIComponent`) — nomi con `#`,
  `&`, spazi sono sicuri

## 2. Trappole note (lezione appresa la dura)

- **PowerShell**: `npm`/`pnpm` ps1 bloccati? usare `npm.cmd` / `pnpm.cmd`.
  `node -e '<js>'` con virgolette doppie viene strappato → **non fare JSON
  inline**: scrivi un file `.mjs` temporaneo ed eseguilo.
- **Copy-Item**: `Copy-Item src\* dest -Recurse` su dest inesistente crea
  roba spuria → `New-Item -ItemType Directory` per la destinazione prima.
- **Messaggi git**: le virgolette/parole nel `-m '...'` a PowerShell rompono
  l'argomento → usare solo `'...'` semplice; amend possibile solo pre-push.
- **Next 16**: `middleware.ts` ora si chiama `src/proxy.ts` (funzione `proxy`);
  pagine client con `useParams` vanno avvolte in `<Suspense>` (cacheComponents).
- **Dev server .next**: i test di produzione falliscono se `next dev` ha
  sovrascritto `.next` → rigenerare la build prima di `next start`.
- **Screenshot con login**: il proxy chiede auth se `.env.local` ha credenziali;
  per gli screenshot spostare temporaneamente `.env.local` → `.env.local.bak`,
  poi RIpristinare.
- **auth test prod** (routine): start con env su porta 3002 →
  senza login 401 · sbagliate 401 · corrette 200 · `/media/x` senza login 401.

## 3. Modello `apply-links.mjs` (copia, adatta i numeri, esegui, elimina)

```js
import { readFileSync, writeFileSync } from "node:fs";
const path = "src/data/catalog.json";
const d = JSON.parse(readFileSync(path, "utf8"));
const m = d.courses.find((x) => x.id === "widgetkit")
  .modules.find((x) => x.id === "<modulo-id>");
const base = "/media/widgetkit/<Nome%20-%20Modulo>/_risorse/";
const byNum = (n) => m.lessons.find((x) => new RegExp(`-0?${n}-`).test(x.id));
const put = (n, links) => { const l = byNum(n); if (!l) throw new Error("lezione " + n); l.links = links; };

put(2, [{ title: "Scarica: progetto.zip", url: base + "progetto.zip" }]);
put(4, [{ title: "Doc Apple", url: "https://developer.apple.com/..." }]);

writeFileSync(path, JSON.stringify(d, null, 2) + "\n");
```

Titoli link: interno `/media/...` → "Scarica: …" (cover download attr);
esterno → titolo normale (apre in nuova scheda).

## 5. Scarico di un corso Teachable (pipeline 2026 — collaudata su Launchpad/SwiftUI)

Agente + browser OpenCode con sessione Teachable loggata; **i cookie NON
escono mai dal tab** (httpOnly: il network capture li redige comunque).

1. **Relay locale**: `node scripts\teachable-relay.mjs 8800` (background).
   Endpoint: `POST /<nome>` salvo `%TEMP%\opencode\collect\<nome>.json`,
   `GET /<nome>` li rilegge, `GET /stat` elenca.
2. **Curriculum** via `browser.evaluate` nel tab autenticato: sezioni =
   `.course-section` (titolo + `a[href*="/lectures/"]`), salvare in
   `Downloads\<corso>\_curriculum.json` (titoli + id; la sezione `*BONUS*`
   eventualmente esclusa a valle, non nello scarico).
3. **Scan** per batch di ~23 lezioni (limite 60s per evaluate): in-page
   `fetch('/courses/<id>/lectures/<lid>')` → regex sui blocchi
   `<!-- DEBUG: attachment.id=N, kind=video|text|… -->` — ATTO: il markup
   usa **apici singoli** (`href='...'`), i regex classici su `"` falliscono.
   kind=video → dl `hotmart_lecture_video_download_link`; kind=text → note
   lezione; other-kinds: `files[]` con href `https?` (direct, senza cookie).
   → POST `swiftui-scan-N` al relay.
4. **Resolve URL firmati** (batch ~15, il 60s tocca): `fetch(dl,
   {redirect:'follow'})` → `response.url` è un presigned S3
   (`X-Amz-Expires=18000`, **5h di validità**); `response.body.cancel()`.
   → POST al relay `swiftui-resolved-N`.
5. **Download resumable** (`node scripts\swiftui-dl.mjs` in background):
   legge `_curriculum.json` + scan + resolved; struttura
   `<Modulo>/NN - Title.mp4` + `_risorse/` (nome pulito: via
   `[hash12-20]_`), txt `Nuovo documento di testo.txt` per modulo con note;
   skip sezione BONUS se non in `_curriculum.json`.
   **I falliti `http 400`** = firma S3 invalidata (casuale): à fine run
   rilevoli da `swiftui-dl-final.json`; risolvi SOLO quegli id (stessa
   procedura del punto 4 → `swiftui-retry-1`) e rilancia il downloader
   (resumable: i presenti con size giusta saltano).
6. **Media nel repo**:
   ```powershell
   robocopy "Downloads\<corso>" "public\media\<corso>" /E /XO /NFL /NDL /NJH /NP `
     /XF "Nuovo documento di testo.txt" "_curriculum.json" @($overLimit)
   # $overLimit = mp4 >= 100MiB (non copiarli: arriveranno AV1)
   ``` 
7. **AV1 solo-necessari**: `powershell -File scripts\av1-necessari.ps1`
   (background, ~7-8 min/file grande): scorre Downloads di entrambi i corsi,
   encode 720p CRF34 gli >100 MiB (skip se stage già valido) **e poi fa
   swap NEW-aware** (crea il file nel repo se manca). Rilanciabile dopo il
   primo giro (per file arrivati dopo lo scan).
8. **Catalogo**: `node scripts\build-catalog.mjs --course <id> --folder
   "Downloads\<corso>" --base "/media/<id>"` (EditMode: i `.txt` sono skip
   di default ora; le lezioni senza video NON vengono generate — escluse o
   aggiunte manuali come `link`).
9. **Commit tematici**: media corso · media corso AV1-ready · catalogo · docs.

> Lezioni tipo "upsell-only" (niente video, solo facebook-group) e
> lezioni "link esterno senza asset" restano fuori dal catalogo: documentate
> nei txt per-modulo.

## 6. Debug visivo

Player/progressi/note si verificano a livello browser: aprire
`http://localhost:3000/c/widgetkit` con dev server (`pnpm dev`), player deve
mostrare durata ✓. Il resume si salva ogni 5s in localStorage (`hub:pos:<id>`),
i progressi sono `hub:done:<id>`, note `hub:note:<id>`.
