"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import { courses, flattenLessons, type LessonEntry } from "@/lib/catalog";
import { lsGet, lsRemove, lsSet } from "@/lib/storage";

const badge = "inline-block bg-panel2 border border-hairline text-muted text-xs px-2 py-0.5 rounded-full whitespace-nowrap";
const emptyBox = "bg-panel border border-dashed border-hairline rounded-xl p-6 text-muted";
const code = "rounded bg-panel2 px-1 py-0.5 text-[0.9em] font-mono";
const btn = "inline-block px-3.5 py-2 rounded-[10px] text-sm font-semibold cursor-pointer hover:brightness-110";

function LessonContent() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const courseId = params?.courseId ?? "";
  const lessonId = params?.lessonId ?? "";

  const course = courses.find((c) => c.id === courseId);
  if (!course) {
    return (
      <p>
        Corso &quot;{courseId}&quot; non trovato.{" "}
        <Link href="/" className="text-accent">
          ← Home
        </Link>
      </p>
    );
  }

  const flat = flattenLessons(course);
  const idx = flat.findIndex((e) => e.lesson.id === lessonId);
  if (idx === -1) {
    return (
      <p>
        Lezione &quot;{lessonId}&quot; non trovata.{" "}
        <Link href={`/c/${course.id}`} className="text-accent">
          ← {course.title}
        </Link>
      </p>
    );
  }

  return (
    <LessonBody
      entry={flat[idx]}
      prev={idx > 0 ? flat[idx - 1] : null}
      next={idx < flat.length - 1 ? flat[idx + 1] : null}
    />
  );
}

export default function LessonPage() {
  return (
    <Suspense fallback={null}>
      <LessonContent />
    </Suspense>
  );
}

function LessonBody({
  entry,
  prev,
  next,
}: {
  entry: LessonEntry;
  prev: LessonEntry | null;
  next: LessonEntry | null;
}) {
  const { course, module: mod, lesson } = entry;
  const [isDone, setIsDone] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    setIsDone(lsGet<boolean>(`done:${lesson.id}`, false));
    setNote(lsGet<string>(`note:${lesson.id}`, ""));
  }, [lesson.id]);

  const toggleDone = () => {
    const now = !isDone;
    setIsDone(now);
    if (now) lsSet(`done:${lesson.id}`, true);
    else lsRemove(`done:${lesson.id}`);
  };

  const missingSrc: Record<string, string> = {
    video: "Imposta src del video (URL R2 o altro hosting) in src/data/catalog.json.",
    pdf: "Imposta src del PDF in src/data/catalog.json.",
    file: "Il file non ha un src: aggiungilo in src/data/catalog.json.",
    link: "La risorsa esterna non ha un src: aggiungilo in src/data/catalog.json.",
  };

  return (
    <div>
      <p className="mb-1.5 flex items-center gap-2.5">
        <Link href={`/c/${course.id}`} className="text-accent">
          ← {course.title}
        </Link>
        <span className={badge}>{mod.title}</span>
      </p>

      <h1 className="text-[1.7rem] font-bold mb-2">{lesson.title}</h1>
      <div className="flex flex-wrap items-center gap-2.5 my-5">
        <span className={badge}>{lesson.type}</span>
        {isDone ? (
          <button
            className={`${btn} border border-success bg-success text-[#06281c]`}
            onClick={toggleDone}
          >
            ✓ Completata (clic per annullare)
          </button>
        ) : (
          <button
            className={`${btn} border border-accent bg-accent text-[#0a1422]`}
            onClick={toggleDone}
          >
            Segna come completata
          </button>
        )}
      </div>

      {lesson.type === "video" &&
        (lesson.src ? (
          <>
            <VideoPlayer lessonId={lesson.id} src={lesson.src} />
            <div className="flex flex-wrap items-center gap-2.5 mt-1 mb-2">
              <a
                className={`${btn} border border-accent bg-transparent text-accent`}
                href={lesson.src}
                target="_blank"
                rel="noreferrer"
              >
                ⬇ Scarica il video
              </a>
            </div>
          </>
        ) : (
          <p className={emptyBox}>{missingSrc.video}</p>
        ))}

      {lesson.type === "pdf" &&
        (lesson.src ? (
          <>
            <iframe
              className="w-full h-[70vh] border border-hairline rounded-xl bg-white"
              src={lesson.src}
              title={lesson.title}
            />
            <p className="text-sm text-muted">
              <a href={lesson.src} target="_blank" rel="noreferrer" className="text-accent">
                Apri il PDF in una nuova scheda ↗
              </a>
            </p>
          </>
        ) : (
          <p className={emptyBox}>{missingSrc.pdf}</p>
        ))}

      {lesson.type === "file" &&
        (lesson.src ? (
          <a className={`${btn} border border-accent bg-accent text-[#0a1422]`} href={lesson.src} target="_blank" rel="noreferrer">
            Apri / scarica il file ↗
          </a>
        ) : (
          <p className={emptyBox}>{missingSrc.file}</p>
        ))}

      {lesson.type === "link" &&
        (lesson.src ? (
          <a className={`${btn} border border-accent bg-accent text-[#0a1422]`} href={lesson.src} target="_blank" rel="noreferrer">
            Apri la risorsa esterna ↗
          </a>
        ) : (
          <p className={emptyBox}>{missingSrc.link}</p>
        ))}

      {lesson.links && lesson.links.length > 0 && (
        <>
          <h2 className="text-lg font-bold mt-6 mb-2.5">Materiale e link della lezione</h2>
          <ul className="list-none p-0 m-0">
            {lesson.links.map((l) => (
              <li key={l.url} className="py-1.5 border-b border-hairline">
                <a href={l.url} target="_blank" rel="noreferrer" className="text-accent">
                  {l.title} ↗
                </a>
                <span className="text-muted text-xs ml-2">{l.url}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2.5 my-5">
        {prev && (
          <Link href={`/c/${course.id}/l/${prev.lesson.id}`} className={`${btn} border border-accent bg-transparent text-accent`}>
            ← Lezione precedente
          </Link>
        )}
        {next && (
          <Link href={`/c/${course.id}/l/${next.lesson.id}`} className={`${btn} border border-accent bg-transparent text-accent`}>
            Lezione successiva →
          </Link>
        )}
      </div>

      <h2 className="text-lg font-bold mt-6 mb-2.5">Note personali</h2>
      <textarea
        className="w-full min-h-[140px] bg-panel border border-hairline rounded-[10px] text-ink p-3 text-[0.95rem] resize-y placeholder:text-muted focus:outline-none focus:border-accent"
        placeholder="Appunti su questa lezione (salvati nel browser)…"
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          lsSet(`note:${lesson.id}`, e.target.value);
        }}
      />
    </div>
  );
}
