# PIANO TANSTACK — SwiftVault (25 ott 2026)

> Ricerca fatta su tanstack.com (Start **1.0 stabile** dal 13/10/2026).
> **DECISIONE (25/10 sera): drop di Next** — Vercel è Gold partner TanStack e
> percorso deploy **documentato ufficialmente** nelle guide Start (via Nitro).
> Migrazione a **TanStack Start in React** PRIMA del primo deploy.
> Inventario librerie verificato live il 25/10/2026 tramite registry npm
> (versioni esistenti di ogni package React/Solid).

## Inventario completo sul sito — disponibilità React / Solid (verificato npm)

| Libreria | Categoria | Versione React | Versione Solid | SwiftVault |
|---|---|---|---|---|
| **Start** | framework | 1.169.4 ✓ | 1.169.4 ✓ | ✅ IL framework (React) |
| **Router** | framework | 1.170.46 ✓ | 1.170.43 ✓ | ✅ file-based + search-params |
| **Query** | data/state | 5.104.5 ✓ | 5.104.5 ✓ | ✅ (vedi sotto) |
| **Store** | data/state | 0.11.2 ✓ | 0.11.2 ✓ | ✅ progressi/resume/note |
| **DB** (beta) | data/state | 0.5.12 ✓ | 0.3.12 ✓ | ❌ (no server; futuro sync) |
| **Table** | ui | 9.3.1 ✓ | 9.3.1 ✓ | ❌ (nessuna griglia) |
| **Form** | ui | 1.33.5 ✓ | 1.33.5 ✓ | ❌ (nessun form) |
| **Charts** | ui | 1.1.0 ✓ | 1.1.0 ✓ | 🔶 fase 2: dashboard progressi |
| **Virtual** | ux | 3.14.22 ✓ | 3.13.49 ✓ | ✅ moduli >15 lezioni |
| **Pacer** | ux | 0.24.1 ✓ | 0.24.0 ✓ | ✅ throttle salvataggi |
| **Hotkeys** | ux | 0.17.0 ✓ | 0.17.0 ✓ | ✅ scorciatoie player |
| **Devtools** | tooling | 0.10.13 ✓ | 0.8.13 ✓ | ✅ panel in dev |
| **AI** | vanilla | — (vanilla 1.0.0, utilizzabile da React) | — | ❌ |
| **Markdown** | vanilla | — (vanilla 1.0.0 se note md in futuro) | — | 🔶 futuro |
| **Highlight** | vanilla | — (vanilla 1.1.0) | — | 🔶 futuro |
| **CLI** | tooling | 0.72.0 | — | ✅ scaffold migrazione |
| **Config** | tooling | 0.22.2 | — | ❌ (tooling per publisher) |

**Bilancio**: **12 librerie con adapter React E Solid in parallelo** (esatte le
versioni rilevate in npm), le altre 3 (AI / Markdown / Highlight) sono Vanilla
→ usabili da entrambi. La parità React/Solid è completa: un eventuale port
futuro tocca solo le componenti UI.

## Percorso di adozione: React su Vercel (con l'ordine degli step)

1. **CLI** `npx @tanstack/cli create` — scaffold del progetto (step 0 della
   migrazione)
2. **Start + Router** — `vite.config`: `[tanstackStart(), nitro(), viteReact()]`;
   route file-based `src/routes/`: `/` · `/c/$course` ·
   `/c/$course/$module/$lesson`; search-params type-safe per deep-link
   lezione e (futuro) timestamp del resume nella URL
3. **Store** — store core con persist per `pos`/`done`/`notes` una sola
   chiave versionata in localStorage (le chiavi `hub:*` vecchie restano
   lette per compat)
4. **Pacer** + Store — `throttle` di Pacer sostituisce il timer fatto a
   mano che salva il `currentTime` (oggi "ogni 5s")
5. **Hotkeys** — scorciatoie player: spazio play/pause, frecce ±10s,
   J/K/L stile YouTube, F fullscreen, N/P lezione precedente/successiva
6. **Virtual** — lista lezioni dei moduli lunghi (Appetizers: 26 lezioni)
7. **Query + Query Devtools** — lazy-load dell'indice di ricerca
   (`index.json` via fetch con cache) e prefetch media delle prossime
   lezioni via Router loader (integrazione ufficiale di Query con Start):
   da installare SOLO quando la ricerca non sta più nel bundle
8. **Devtools panel** — `@tanstack/react-devtools` in dev per ispezionare
   store/query; zero bundle in prod

### Le NON adottate (e perché)

- **DB** (beta): no server API in SwiftVault — ripescabile per un futuro
  sync client-server
- **Table / Form**: nessuna griglia o form nell'app (uso personale)
- **AI**: vanilla, nessun use-case
- **Config**: tooling per publisher di pacchetti, non per app
- **Markdown / Highlight** (vanilla): 🔶 futuro — note in markdown
  renderizzato e snippet di codice evidenziati, valutazione a tempo

## Skills di progetto installate (`.agents/skills/`) — quando entrano in gioco

Regola utente (25/10): usarle tutte durante il percorso TanStack.

| Skill | Quando | Come |
|---|---|---|
| **find-skills** | Step 0 migrazione (prima dello scaffold) | cercare nel registry skill utili al port (es. TanStack/Vite/Tailwind); installarle in `.agents/skills/` e aggiornare questa tabella |
| **frontend-design** | Step 5 componenti (se il port tocca la UI: dashboard/player) | identità visiva durante il porting: tipografia/palette intenzionale, evitare l'aspetto "template default" |
| **improve-codebase-architecture** | POST-migrazione (dopo la verifica step 7) | scan deepening-opportunities con report HTML: i seam nuovi resi possibili da Router/Store (adapter localStorage, interfacce catalogo). ⚠️ `disable-model-invocation: true` → invocabile solo dall'utente. ⚠️ richiede la skill "codebase-design" (vocabolario): **✅ INSTALLATA** (`mattpocock/skills@codebase-design`, 855K install — trovata via find-skills) |

Calendario: find-skills PRIMA, frontend-design DURANTE, improve-codebase-architecture DOPO.

## Login: homescreen pubblica (sostituisce il prompt nativo 401)

Problema oggi: Basic Auth usa **il prompt del browser** (quella finestra grigia
da ":wpa admin router") — pratico ma brutto, senza stesso marchingegno né
branding. Nel port si sostituisce con tutta materia propria app:

- **`/` pubblica**: chi non è autenticato vede la landing (titolo corsi,
  copertine, "contenuto riservato") con form di login
- **server function di login**: validate credenziali vs env
  `SITE_USER`/`SITE_PASS` → cookie di sessione **firmato** (secret da env
  `SESSION_SECRET`, con fallback automatico se assente), HttpOnly,
  SameSite=Lax, scadenza 30 giorni
- **middleware** sostituisce il Basic: cookie valido → let it go; assente →
  l'utente resta su `/` pubblica; route protette → redirect `/`. I media
  NON passano da qui: il secondo progetto accetta solo URL firmate HMAC
  (§Architettura deploy) — così niente doppio login né cookie cross-dominio
- **logout** per svuotare il cookie (piccolo bottone nel hub)
- compatibilità: Basic Auth continua a valere come fallback se il cookie
  non c'è (per client tipo download tool), come oggi
- `SESSION_SECRET` entra in env di Vercel assieme a SITE_USER/SITE_PASS

Buon motivo per attivare **frontend-design** durante step 5: la landing e
il hub meritano identità visiva propria (palette del sito corsi, tipografia
equa, non-tavola genitoriale di default).

## Migrazione Next → Start React (8 step — UNA fase da mezza giornata)

Media in volo non bloccano: `public/media` è **untracked** e `public/` funziona
uguale con Vite. Ordine previsto:

1. **Media finiti e committati** (swap AV1 → commit launchpad/swiftui →
   catalogo): così la migrazione parte da un albero pulito e tematico.
   Subito dopo: **find-skills** a caccia di skill utili (step 0)
2. **Scaffold**: `pnpm add @tanstack/react-start @tanstack/react-router
   nitro @vitejs/plugin-react`; `vite.config.ts`:
   `plugins: [tanstackStart(), nitro(), viteReact()]` +
   `@tailwindcss/vite` (Tailwind 4 rimane; il PostCSS lascia il posto
   al Vite plugin)
3. **Routes**: `src/routes/` file-based (App Router → Router):
   `/` (dashboard) · `/c/$course` (corso) · `/c/$course/$module/$lesson`
   (lezione + player). `next/link` → `Link`, `useParams`/`useSearchParams` →
   hooks del Router (search-params type-safe = bonus resume deep-link)
4. **Auth, versione moderna**: niente più prompt nativo 401 (quello stile
   "pagina di configurazione router"). Route pubblica `/login` con form →
   server function valida `SITE_USER`/`SITE_PASS` → **session cookie
   firmato**; il middleware protegge le route dell'app. I media sono sul
   **secondo progetto** (repo separato): si accedono con **URL firmate
   HMAC** generate dall'app (dettagli §Architettura deploy). Vedasi
   [§ Login: homescreen pubblica]
5. **Componenti**: UI passa quasi intatta (client components senza direttive
   "use client"; `next/head` → `<head>` di Start; niente `next/image`)
6. **Rimozione Next**: disinstallare `next`, cancellare `next.config.ts`,
   `src/app/`, `.next`; reinstall node_modules
7. **Verifica locale**: `pnpm build` + `vite preview` → player OK, range
   request su `/media/*.mp4` OK, 401 senza auth, ricerca e resume OK.
   A verifica verde: **frontend-design** SOLO se la UI merita un ritocco
   durante il port; **improve-codebase-architecture** post-migrazione
   (l'utente lo invoca a mano)
8. **Deploy Vercel** (o prima push e poi import): env vars
   `SITE_USER`, `SITE_PASS`, `SESSION_SECRET`, test post-deploy
   come da `STATO-PROGETTO` §Deploy (401 → ora redirect a `/login`)

Stima: mezza giornata. Trade-off accettato: rinuncio a React Compiler
(legato a Next); il resto (Tailwind, TS, pnpm) sale senza attriti.

## Architettura deploy: due repo — layout Vercel DA ACTUALIZZARE al port (25/10)

Split deciso: **solo i video sono uso personale** → repo media separato
privato (`swiftvault-media` su GitHub, submodule del repo codice) e il repo
codice diventa **public**. COME Vercel consuma i media al deploy: decisione
APERTA da prendere durante la migrazione — due varianti fattibili:

| | A. 1 app + fetch build-time | B. 2 progetti + URL firmate |
|---|---|---|
| Domini | **1** (app) | 2 (app + media) |
| Login | cookie moderno, solo | cookie moderno + HMAC sui media |
| Deploy codice (ogni push) | re-fetch/re-upload ~8 GB media | solo app, veloce |
| Deploy media | spinge il submodule push | solo il repo media |
| Secret | fine-grained `GH_TOKEN` (env Vercel) | `MEDIA_SIGN_SECRET` (su 2 progetti) |
| Note | Vercel NON monta i submodule privati → step build `fetch-media.mjs` con token | cookie non viaggia `*.vercel.app` (PSL) → HMAC generato dall'app, media project 404 senza token |

- 1 progetto Vercel per repo; entrambi Hobby free; banda condivisa
  d'account (limiti soft ~100 GB/mese: ok per uso personale)
- Media repo root = i corsi (`widgetkit/`, `ios-dev-launchpad/`, ...), mount
  submodule su `public/media`
- **Repo public va prima ripulito della history media**:
  `git filter-repo --path public/media --invert-paths`
  (WidgetKit AV1 committata non può stare in un repo public), poi push pulito
- Cloudflare resta opzione di PORT futuro: preset Workers ufficiale con R2
  binding nello stesso worker (1 dominio, cookie, zero egress) — il port
  resta mezza giornata

## Regole d'oro

1. **Store + Pacer + Virtual + Hotkeys**: adozione subito dopo il port
   (migliorano il player e sopravvivono a qualunque futuro hosting)
2. **Query**: solo quando serve davvero (ricerca lazy / prefetch), con
   devtools accese solo in dev
3. **DB / Table / Form / Config**: fuori — nessun uso reale per l'app
4. **Router**: sempre TanStack Router, mai App Router (Next esce di scena)
5. **Solid**: uguale-oppure (12/12 adapter paralleli verificati npm) →
   l'eventuale port tocca solo le componenti UI
