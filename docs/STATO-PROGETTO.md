# STATO PROGETTO — SwiftVault

> Documento di handoff: da leggere a inizio sessione (umano o agente).
> Ultimo aggiornamento: 24 ottobre 2026.

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

## Stato media (al 24 ott)

- WidgetKit: 4 moduli, 36 lezioni in repo (~1.5 GB)
  - Getting Started (5), Monthly Theme (7), Repo Watcher/Network (15),
    Configuration & Intents (9)
- iOS Dev Launchpad: curriculum vuoto (scaricabile — 60+ video)
- SwiftUI Fundamentals: curriculum vuoto (scaricabile)
- Tutti i file sono rinominati con prefissi `NN - ` per l'ordine didattico.

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
