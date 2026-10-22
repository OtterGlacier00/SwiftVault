# SwiftVault — archivio personale dei corsi di Sean Allen

Un'app web **privata e gratuita** che sostituisce la scuola Teachable di Sean Allen
(il sito chiuderà il **24 novembre 2026**), usando i video che scarichi prima di quella data.

Scaffold di partenza: `create-next-app` (Next.js 16, Tailwind CSS 4, TypeScript, pnpm).

📚 **Documentazione operativa** in [`docs/`](./docs):
- [`docs/STATO-PROGETTO.md`](./docs/STATO-PROGETTO.md) — stato, media, deploy, migrazione R2
- [`docs/GUIDA-OPERATIVA.md`](./docs/GUIDA-OPERATIVA.md) — come aggiungere un modulo, passo-passo

## Cosa sa fare

- 📚 Corsi come su Teachable: moduli → lezioni
- ▶️ Player video che **riprende da dove eri** rimasto
- ✅ Spunta di **completamento** per lezione e barra di avanzamento per corso
- 🔎 **Ricerca** istantanea di lezioni e corsi
- 📝 **Note personali** per lezione (salvate nel browser)
- 📑 Vista **PDF** integrata
- 🔒 Accesso **privato con Basic Auth** via `src/proxy.ts` (in Next.js 16 il vecchio `middleware.ts` si chiama `proxy.ts`; GitHub Pages nel piano gratuito non offre autenticazione)

> ⚠️ **Nota di licenza.** I materiali di Sean Allen sono per *uso personale*
> e i termini vietano di ripubblicarli su server pubblici. Tieni l'hub con
> credenziali attive e non condividere l'URL: il materiale resta il tuo, in privato.

---

## 1. Setup locale

```bash
pnpm install     # solo la prima volta
pnpm dev         # → http://localhost:3000
```

In sviluppo il sito resta aperto senza login (vedi `src/proxy.ts`).

## 2. Scaricare i corsi (fai prima del 24 novembre!)

Vai su https://seanallen.teachable.com, entra in ogni corso e scarica
tutti i video e i PDF che ti interessano. Mantieni la struttura tipica di Teachable:

```
widgetkit\
  Getting Started\
    01 Welcome.mp4
    02 Create A Widget Layout.mp4
  Widget Basics\
    01 .........mp4
    cheatsheet.pdf
```

## 3. Generare il catalogo da un download

Lo script crea moduli dalle sub-cartelle, lezioni dai file, titoli puliti
(senza prefissi `01 -`), ordine naturale e URL `src`:

```powershell
pnpm catalog -- --course widgetkit --folder C:\Downloads\WidgetKit --base /media/widgetkit
```

- `--course` … id del corso in `src/data/catalog.json` (precompilato con
  WidgetKit, iOS Dev Launchpad e SwiftUI Fundamentals)
- `--folder` … cartella locale dove hai scaricato il corso (quella che contiene
  le sub-cartelle dei moduli, es. `Getting Started`)
- `--base` … base degli URL dei media; senza questo gli URL restano vuoti
  e li riempi a mano in `src/data/catalog.json`

Il comando è **incrementale**: sovrascrive solo il corso indicato, tutti gli
altri restano come sono.

Tipi di lezione riconosciuti: `video` (.mp4/.mov/.m4v/.webm), `pdf` (.pdf),
`file` (altro, scaricabile). Puoi aggiungere anche `link` (es. URL YouTube) a mano.

## 4. Dove mettere i media (gratuito)

### Per ora: dentro il repo Git (nuovo piano!)

1. Scarica il corso da Teachable **entro il 24 novembre**
2. Copia la cartella del corso (quella con i moduli) in:
   `public/media/<id-corso>/` — es. `public/media/widgetkit/Getting Started/01 ....mp4`
3. Genera il catalogo con `--base /media/widgetkit` → gli `src` puntano lì
4. I file in `public/media` sono **protetti dal Basic Auth** del proxy:
   senza login, `/media/...` risponde 401 come le pagine

Limiti da conoscere (Windows/GitHub):
- GitHub rifiuta **file singoli > 100 MB** (i video di Sean quasi sempre stanno sotto)
- Repo privato: limiti software di ~5 GB; per il piano di Studio completa ci sta
- Vercel Hobby: ~100 GB di bandwidth/mese — ben oltre l'uso personale

### Se un giorno servisse più spazio: Cloudflare R2 (10 GB gratis)

1. Account gratuito su [cloudflare.com](https://cloudflare.com) → **R2** → Create bucket
2. Attiva il **Public Development URL** (ottieni `https://pub-xxxxxxxx.r2.dev`)
3. Carica la cartella del corso nel bucket
4. Basta rieseguire lo script con
   `--base https://pub-xxxxxxxx.r2.dev/widgetkit`: **zero modifiche al codice**

## 5. Deploy su Vercel (gratis)

1. Pusha il repo su GitHub (il repo git locale è già inizializzato da create-next-app)
2. Su [vercel.com](https://vercel.com) → *Import project* → seleziona il repo
3. **Environment Variables** (OBBLIGATORIE in produzione):
   - `SITE_USER` = username di accesso
   - `SITE_PASS` = password di accesso
4. Deploy. Il sito chiede le credenziali al primo accesso, poi le ricorda.
   **Se non le imposti in produzione il sito risponde "500 missing SITE_USER"**
   invece di mostrare il contenuto per sbaglio.

## 6. Manutenzione

- Aggiungere/modificare lezioni → `src/data/catalog.json` o script del punto 3
- Un nuovo corso? Ri-esegui lo script con `--course <nuovo-id>` e una cartella nuova

### Idee per il futuro (dimmi quali vuoi)

- PWA installabile sul desktop/telefono
- Export/import di progressi e note (per non perderli cambiando PC)
- Contatore "ore di video" per piano di studio
