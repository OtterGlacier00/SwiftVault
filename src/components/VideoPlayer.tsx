"use client";

import { useEffect, useRef, useState } from "react";
import { lsGet, lsSet } from "@/lib/storage";

/**
 * Player HTML5 con "riprendi da dove eri": la posizione è salvata
 * in localStorage ogni 5 secondi e ripristinata a loadedmetadata.
 */
export default function VideoPlayer({ lessonId, src }: { lessonId: string; src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);
  const [resumeAt, setResumeAt] = useState<number | null>(null);

  useEffect(() => {
    const saved = lsGet<number>(`pos:${lessonId}`, 0);
    if (saved > 5) setResumeAt(saved);
  }, [lessonId]);

  const save = (t: number) => {
    lsSet(`pos:${lessonId}`, t);
    lastSaved.current = t;
  };

  function onLoadedMetadata() {
    const v = videoRef.current;
    if (!v) return;
    if (resumeAt !== null && Number.isFinite(v.duration) && resumeAt < v.duration - 15) {
      v.currentTime = Math.max(0, resumeAt - 3);
    }
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime - lastSaved.current >= 5) save(v.currentTime);
  }

  return (
    <div className="my-2.5">
      {src ? (
        <video
          ref={videoRef}
          className="w-full max-h-[70vh] rounded-xl bg-black border border-hairline"
          src={src}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onEnded={() => save(0)}
        />
      ) : (
        <p className="bg-panel border border-dashed border-hairline rounded-xl p-6 text-muted">
          URL del video non impostato in{" "}
          <code className="rounded bg-panel2 px-1 py-0.5 text-[0.9em] font-mono">
            src/data/catalog.json
          </code>
          . Imposta{" "}
          <code className="rounded bg-panel2 px-1 py-0.5 text-[0.9em] font-mono">src</code> a mano
          o con <code className="rounded bg-panel2 px-1 py-0.5 text-[0.9em] font-mono">pnpm catalog</code>{" "}
          (vedi README).
        </p>
      )}
      <div className="flex items-center gap-2.5 mt-2">
        {resumeAt !== null && (
          <span className="inline-block bg-panel2 border border-hairline text-muted text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
            in pausa a {fmt(resumeAt)}
          </span>
        )}
        <button
          className="inline-block px-3.5 py-2 rounded-[10px] border border-accent bg-transparent text-accent font-semibold text-sm cursor-pointer hover:brightness-110"
          onClick={() => {
            const v = videoRef.current;
            if (v) v.currentTime = 0;
            save(0);
            setResumeAt(null);
          }}
        >
          Ricomincia da capo
        </button>
      </div>
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
