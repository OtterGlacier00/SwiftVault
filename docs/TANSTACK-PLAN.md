# PIANO TANSTACK — SwiftVault (25 ott 2026)

> Ricerca fatta su tanstack.com (Start 1.0 stabile dal 13/10/2026).
> Regola già in vigore (STATO-PROGETTO "Piano B"): se hosting Cloudflare →
> TanStack Start. Coi pezzi qui sotto possiamo usare TanStack in entrambi i
> percorsi senza buttare lavoro.

## Panorama librerie (stato 10/2026)

| Libreria | React | Solid | Utile per SwiftVault? |
|---|---|---|---|
| **Start** (SSR + server functions + middleware, preset Vercel/CF) | 1.0 stabile ✓ | 1.0 stabile ✓ | **Percorso B (CF)**: sì, assiduo. Percorso A (Next/Vercel): no (conflitto con App Router) |
| **Router** (type-safe, search-params come stato) | ✓ | ✓ | Solo nel percorso B (in A c'è già App Router) |
| **Query** (cache dati client) | ✓ | ✓ | Marginalmente; il catalogo è import statico. Nice-to-have se nasce il preload del player o ricerca lazy |
| **Store** (stato + persist, core framework-agnostic) | ✓ | ✓ | **SÌ — il pezzo giusto ora**: progressi/resume/note oggi a mano in localStorage (`hub:*`) |
| **Pacer** (throttle/debounce) | ✓ | ✓ | **Sì**: il resume si salva "ogni 5s" a mano → pacer throttle/persist |
| **Virtual** (liste virtualizzate) | ✓ | ✓ | Sì per moduli lunghi (Appetizers: 26 lez) |
| Form / Table / Charts / AI / Ranger | ✓ | ✓/— | No (non ci sono form/tabelle in SwiftVault) |

## Percorso A — ReactToday (Next 16 + Vercel, piano corrente)

Adottare i pezzi **framework-agnostic** che sopravvivono a un eventuale
switch (core + adapter uguale anche su Solid):
1. **Store**: refactor "player state" in store core (`@tanstack/store`):
   `pos`, `done`, `notes` (una store per lezione o una mappa), persist su
   localStorage con migrazione a un'unica chiave versionata
   (le chiavi attuali restano leggibili per compat).
2. **Pacer** per il salvataggio del `currentTime` (il "5s" odierno), evitare
   l'accumulo di timer.
3. **Virtual** nella lista lezioni dei moduli >15 righe (es. Appetizers).
4. **Query** disabilitata per ora: il catalogo entra nel bundle come JSON.
   La ricerca resta client-side; se diventa pesante, lazy-load
   index.json → Query.
5. **Router/Start NON su Next**: il proxy Basic Auth resta `src/proxy.ts`.
   A solo-fine deploy Vercel tutto com'è: zero migrazioni.

Rischio: basso. Valore: ripulire lo stato client (oggi chiavi sparse) e
portare conformità con il percorso B.

## Percorso B — Solid (Piano B, CF Workers)

Con Start stabile 1.0, il Piano B non è più "branca verticale" ma una
migrazione reale e supportata da docs che hanno lo stesso albero di quella
React (identiche API, un `@tanstack/solid-*` a parte):

- Re-Scaffold: `@tanstack/solid-start` + `@tanstack/solid-router`
  (file-based), preset **Cloudflare Workers** (la regola esistente)
- **UI**: le componenti React → Solid (la parte più grossa: VideoPlayer,
  sidebar corsi/moduli, ricerca, PDF viewer). HTML/Tailwind si conserva,
  cambia il flusso di stato (signals vs hooks)
- **Auth**: `src/proxy.ts` → middleware di Start (Basic Auth nemmeno lì:
  stessa logica, codice server funzioni) — player e API media non cambiano
- **Stato**: niente da riscrivere se il percorso A adotta Store+Pacer ora:
  `useStore` (solid adapter) sugli stessi store
- **Data**: `catalog.json` import statico invariante; server function
  inutile (nessun DB) ma disponibile per futuri export progressi

Stima lavoro: la UI è ~1k linee — la giornata. Mantenere i pezzi comuni
(store core, load catalog, componenti Tailwind "dumb") rende la migrazione
un porting, non un riscrittura.

## Raccomandazione

1. **Ora (con media ormai tutte)**: percorso A, step 1-3 (Store, Pacer,
   Virtual). Piccoli commit framework-agnostic.
2. **Connector**: quando scatta il trigger Piano B (media su R2 o
   motivazione CF), un solo PR giga: scaffold Start-Solid → porta UI →
   middleware auth → deploy workers.dev test.
3. **Mai usare TanStack Router dentro Next**: doppio router = casini
   (aggiornamento URL, prefetch, HMR). Router solo nel percorso B.
