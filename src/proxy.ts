import { NextRequest, NextResponse } from "next/server";

/**
 * Protezione del sito con Basic Auth (convenzione "proxy" di Next.js 16,
 * ex middleware). Le credenziali sono le variabili d'ambiente SITE_USER e SITE_PASS.
 * Su Vercel: Settings > Environment Variables > SITE_USER e SITE_PASS.
 *
 * In sviluppo locale (pnpm dev), senza credenziali impostate, il sito resta
 * aperto per comodità; in produzione senza credenziali risponde con errore,
 * per non esporre mai il contenuto per sbaglio.
 */
export function proxy(req: NextRequest) {
  const user = process.env.SITE_USER;
  const pass = process.env.SITE_PASS;

  if (!user || !pass) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse(
      "Credenziali non configurate: imposta SITE_USER e SITE_PASS su Vercel.",
      { status: 500 }
    );
  }

  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const colon = decoded.indexOf(":");
    if (decoded.slice(0, colon) === user && decoded.slice(colon + 1) === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Accesso riservato all'utente autorizzato.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="swiftvault", charset="utf-8"' },
  });
}

export const config = {
  // Protegge tutte le pagine (esclude solo asset statici e favicon)
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
