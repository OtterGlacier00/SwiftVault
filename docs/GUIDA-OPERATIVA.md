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

## 4. Debug visivo

Player/progressi/note si verificano a livello browser: aprire
`http://localhost:3000/c/widgetkit` con dev server (`pnpm dev`), player deve
mostrare durata ✓. Il resume si salva ogni 5s in localStorage (`hub:pos:<id>`),
i progressi sono `hub:done:<id>`, note `hub:note:<id>`.
