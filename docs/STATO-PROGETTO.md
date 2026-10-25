# STATO PROGETTO — SwiftVault

> Documento di handoff: da leggere a inizio sessione (umano o agente).
> Ultimo aggiornamento: 25 ottobre 2026.

## Unicorn essenziale](mission)

App web **Next.js 16** (`create-next-app` default: src/, Tailwind 4, TS, pnpm,
React Compiler, proxy.ts) che sostituisce la scuola Teachable di Sean Allen
(chiusa il **24 novembre 2026**). Video scaricati e dentro il repo privato,
app deployata con Basic Auth su Vercel. Zero costi, uso personale.

⚠️ **Licenza**: materiali per uso personale; vietato esporli pubblicamente
(no mirror su server): per questo il hub richiede credenziali e la strategia
media è "nel repo privato". Non proporre YouTube/R2 public senza averlo
discusso (la discussione sulle opzioni c'è: YT private o R2 public sono state
valutate e scartate: Content ID/strike e lock-in).

## Struttura chiave

- `src/data/catalog.json` → corsi/moduli/lezioni. **Sorgente di verità** (lo
  script la rigenera per corso con marge incremental).
- `src/proxy.ts` → Basic Auth (convenzione Next 16 per il vecchio middleware).
  Credenziali: env `SITE_USER` / `SITE_PASS`. In dev (senza env) resta aperto;
  in produzione senza env → **500** per non esporre niente.
- `public/media/<corso>/<modulo>/NN - nome file.mp4` → i video.
  `public/media/<corso>/<modulo>/_risorse/` → zip/swift/avatar di progetto,
  NON lezioni: lo script li salta; si agganciano alle lezioni con `links`.
- `scripts/build-catalog.mjs` → generatore catalogo (merge per modulo).
- `scripts/apply-links.mjs` → creato volatile per mappare i allegati: nasce e
  muore ad ogni modulo (vedi GUIDA-OPERATIVA).
- Funzioni app: player con resume (localStorage), progressi, note per lezione,
  ricerca, PDF, download interni (`/media/...` con download attr), link esterni.

## Stato media (al 25 ott) — ⚠️ bloccati su GitHub per 8 file

- **WidgetKit: 8 moduli, 63 lezioni** (~3,5 GB totali sotto public/media)
  - Getting Started (5), Monthly Theme (7), Repo Watcher/Network (15),
    Configuration & Intents (9)
  - **Live Activities & Dynamic Island (6)** — zips BasketballSim starter/complete/iOS17
  - **Lock Screen Widgets (2)** — zip + nota padding iOS 17 (txt in _risorse)
  - **Widget #3 Swift Calendar (13)** — Date+Ext.swift, zip SwiftCal×5,
    WWDC SwiftData ×5, nota zip SwiftCal-iOS18-UI mancante (coperto dallo zip
    "Curso completo" aggiornato iOS 26, agganciato sia a lez 12 che a lez 1
    di Getting Started)
  - **WWDC 2023 (6, solo link esterni Apple, tipo "link")** — modulo manuale
    senza media; lez 04/05 di SwiftCal eranorand nombre "(parte 2)" nel file
- **Nuovo corso `how-i-became-an-ios-dev`**: ebook PDF di Sean (15 MB, type "pdf",
  viewer integrato via iframe) in modulo "Il Libro"
- iOS Dev Launchpad + SwiftUI Fundamentals: ancora da scaricare

**BLOCCO HARD: 8 video nuovi superano il limite di GitHub (100 MiB)** (max 139,7):
quella parte NON è commitabile/pushabile così com'è. Da decidere una di due
strade (sotto: R2 ovvero re-encode AV1 dei soli over-limit). Fin ad allora i
media nuovi restano NON-commitati (in working tree: visibili in dev, invisibili
a git).

## Le due strade per il blocco GitHub (verdetto da prendere)

- **A. R2 ORA** (consigliata): tutti i media fuori repo (git filter-repo sui
  vecchi blob pre-push, repo solo-codice), catalog --base → URL r2.dev. 10 GB
  free, egress 0. Richiede: account CF + bucket creati da te (UI browser).
- **B. AV1 re-encode SOLO degli 8 file >100 MiB**: si entra sotto 100 MiB ognuno,
  il resto del repo resta com'è (totale ~3,5 GB). ffmpeg CRF ~32: test di
  qualità su 1 video prima di lanciare il lotto. Zero account esterni, perdita
  di qualità (bassa su screencast) definitiva.

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

## Piano B: tutto-Cloudflare (con TanStack Start)

Regola decisa: **se si va di Cloudflare per l'host del sito, NON con Next+OpenNext**
(adapter che emula Node su Workers — layer di più, punti deboli su streaming/
cacheComponents/middleware). Si migra a **TanStack Start** (preset Cloudflare
Workers ufficiale, SSR nativo sul runtime).

- Trigger: quando i media vanno su R2 (e comunque dopo che i 2 corsi sono
  completi e deployati), eventuale test A/B su workers.dev
- Cosa si ricicla: `catalog.json` e gli script, `VideoPlayer`/resume/progressi
  (localStorage = client-side, identico), Tailwind 4, componenti UI
- Cosa si riscrive: le route App Router → TanStack Router (file-based),
  `proxy.ts` → middleware lato Worker (Basic Auth stessa logica)
- Media su R2 comunque inevitabile su CF (Pages: 20k file / ~25 MiB per file)
- Auth alternativa con dominio custom su CF (dominio a pagamento): CF Access
  gratis fino a 50 utenti — da valutare solo allora
- **vinext SCARTATA** (feb 2026, v1.0 set 2026): "reimplementazione AI di Next
  su Vite" (1 ingegnere, 1 settimana) — stesso problema di OpenNext (codebase
  che vive in un layer non-Next + Next che rincorre), supporto a lungo termine
  non impegnato e 2 pivot CF su Next-on-Workers in 12 mesi. Non è il ponte:
  è un clone sperimentale. Decisione utente, definitiva.

> Rimane il piano A: Vercel + il Next attuale, già testato. Il piano B è
>_documentato prima di servire_, così non si decide sotto pressione.

## Deploy (da fare: non ancora fatto)

1. `git remote add origin git@github.com:<user>/swiftvault.git` → push (privato)
2. Vercel: Import repo → **Environment Variables**: `SITE_USER`, `SITE_PASS`
   (⚠️ `.env.local` attuale usa le demo `stefy/test`: CAMBIARE prima del deploy)
3. Test post-deploy: senza login → 401; con → 200; `/media/...` senza login → 401

## Cosa fare il prossimo giro

- [ ] Scarica da Teachable: iOS Dev Launchpad + SwiftUI Fundamentals (entro 24/11)
- [ ] Per ogni modulo: GUIDA-OPERATIVA.md §1
- [ ] Aggiornare questa pagina (contatore moduli e dimensione repo)
- [ ] Quando tutti i video: primo push + deploy; considerare spostamento R2

## Roadmap facoltativa

- PWA installabile · export/import progressi e note · contatore ore video
