# PIANO TANSTACK — SwiftVault (25 ott 2026)

> Ricerca fatta su tanstack.com (Start **1.0 stabile** dal 13/10/2026).
> **DECISIONE (25/10 sera): drop di Next** — Vercel è Gold partner TanStack e
> percorso deploy **documentato ufficialmente** nelle guide Start → si migra a
> **TanStack Start in React**, deploy su Vercel. Il vecchio piano biforcuto
> ("Next su Vercel / Start solo se Cloudflare") non c'è più di mezzo: UNA
> codebase, sempre.

## Panorama librerie (stato 10/2026)

| Libreria | React | Solid | Utile per SwiftVault? |
|---|---|---|---|
| **Start** (SSR + server functions + middleware, deploy Vercel/CF/Nitro) | 1.0 stabile ✓ | 1.0 stabile ✓ | **Sì: diventa IL framework** (via Nitro → Vercel) |
| **Router** (type-safe, file-based, search-params come stato) | ✓ | ✓ | Sì: incluso in Start, sostituisce App Router |
| **Query** (cache dati client) | ✓ | ✓ | Marginalmente; catalogo = import statico. Se nasce preload player / ricerca lazy |
| **Store** (stato persist, core framework-agnostic) | ✓ | ✓ | **Sì**: progressi/resume/note oggi a mano in localStorage (`hub:*`) |
| **Pacer** (throttle/debounce) | ✓ | ✓ | **Sì**: salvataggio currentTime throttle |
| **Virtual** (liste virtualizzate) | ✓ | ✓ | Sì per moduli lunghi (Appetizers: 26 lezioni) |
| Form / Table / Charts / AI / Ranger | ✓ | ✓ | No (non ci sono form o tabelle) |

## Verifiche deploy Vercel (da tanstack.com/start-framework/docs → Hosting)

- **Vercel è percorso documentato**: "Deploy to Vercel — one-click deployment" e
  si compila con il plugin **Nitro** (`nitro` + `nitro/vite` in `vite.config.ts`,
  output `.output/`).
- ⚠️ Caveat onesto: Vercel NON è tra gli **Official Hosting Partners**
  (Cloudflare/Netlify/Railway lo sono); `nitro/vite` è "still under active
  development" per dichiarazione stessa delle docs. Rischio percepito: basso
  per SwiftVault (app personale, deploy semplice, media statici) — accettato.
- Cloudflare resta il preset più ufficiale (plugin CF dedicato): se mai
  si decidesse per CF, il port è quasi nullo — mezza giornata di config.
- Solid optionale anche in futuro: le librerie cambiano solo l'adapter
  (`@tanstack/solid-*`), lo store core è lo stesso. Non ci serve ora; se il
  codice segue il piano sotto l'eventuale port è UI-only.

## Migrazione Next → Start React (da fare PRIMA del primo deploy)

Media in volo non bloccano: `public/media` è **untracked** e `public/` funziona
uguale con Vite. Ordine previsto:

1. **Media finiti e committati** (swap AV1 → commit launchpad/swiftui →
   catalogo): così la migrazione parte da un albero pulito e thematic
2. **Scaffold**: `pnpm add @tanstack/react-start nitro @tanstack/react-router
   @vitejs/plugin-react`; `vite.config.ts`:
   `plugins: [tanstackStart(), nitro(), viteReact()]` +
   `@tailwindcss/vite` (Tailwind 4 rimane; il PostCSS lascia il posto
   al Vite plugin)
3. **Routes**: `src/routes/` file-based (App Router → Router):
   `/` (dashboard) · `/c/$course` (corso) · `/c/$course/$module/$lesson`
   (lezione + player). `next/link` → `Link`, `useParams`/`useSearchParams` →
   hooks del Router (search-params type-safe = bonus resume deep-link)
4. **Auth**: `src/proxy.ts` → server middleware di Start (stessa logica Basic
   Auth, env `SITE_USER`/`SITE_PASS`: dev senza env resta aperto, prod senza
   env → 500, identico a oggi)
5. **Componenti**: UI passa quasi intatta (client components senza direttive
   "use client"; `next/head` → `<head>` di Start; niente `next/image`)
6. **Rimozione Next**: disinstallare `next`, cancellare `next.config.ts`,
   `src/app/`, `.next`; reinstall node_modules
7. **Verifica locale**: `pnpm build` + `vite preview` → player OK, range
   request su `/media/*.mp4` OK, 401 senza auth, ricerca e resume OK
8. **Deploy Vercel** (o prima push e poi import): env vars, test post-deploy
   come da `STATO-PROGETTO` §Deploy

Stima: mezza giornata. Trade-off accettato: rinuncio a React Compiler
(legato a Next); il resto (Tailwind, TS, pnpm) sale senza attriti.

## Idea bonus già contemplata nel piano (riassunto)

1. **Store + Pacer + Virtual**: micro-commit nel codice portato
   (migliorano il player e sopravvivono a qualunque futuro hosting)
2. **Query**: differita: il catalogo entra nel bundle; se la ricerca cresce →
   lazy index
3. **Solid**: sempre opzionale; l'eventuale port resta UI-only grazie allo
   store core framework-agnostic
4. **Mai due router**: la regola si semplifica: sempre TanStack Router,
   mai App Router (Next esce di scena in ogni caso)
