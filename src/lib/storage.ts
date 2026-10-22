/**
 * Persistenza lato browser (localStorage) con prefisso "hub:".
 * Salvataggi: lezioni completate (done:), posizione video (pos:), note (note:).
 */

const PREFIX = "hub:";

export function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // quota piena o storage disabilitato: ignora in silenzio
  }
}

export function lsRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // ignora
  }
}

export type DoneMap = Record<string, boolean>;

/** Mappa { lezioneId: true } di tutte le lezioni segnate complete. */
export function loadAllDone(): DoneMap {
  const out: DoneMap = {};
  if (typeof window === "undefined") return out;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(PREFIX + "done:")) {
        out[key.slice((PREFIX + "done:").length)] = true;
      }
    }
  } catch {
    // ignora
  }
  return out;
}
