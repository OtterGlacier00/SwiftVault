"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Progress from "@/components/Progress";
import { courses, flattenLessons } from "@/lib/catalog";
import { loadAllDone, lsRemove, lsSet } from "@/lib/storage";

function CourseContent() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? "";
  const course = courses.find((c) => c.id === courseId);

  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setDone(loadAllDone());
  }, [courseId]);

  const flat = course ? flattenLessons(course) : [];
  const dn = flat.filter((x) => done[x.lesson.id]).length;

  const toggleLesson = (id: string) => {
    const isDone = !done[id];
    setDone((prev) => ({ ...prev, [id]: isDone }));
    if (isDone) lsSet(`done:${id}`, true);
    else lsRemove(`done:${id}`);
  };

  if (!course) {
    return (
      <p>
        Corso &quot;{courseId}&quot; non trovato.{" "}
        <Link href="/" className="text-accent">
          ← Torna alla home
        </Link>
      </p>
    );
  }

  return (
    <div>
      <p className="mb-1.5">
        <Link href="/" className="text-accent">
          ← Home
        </Link>
      </p>
      <h1 className="text-[1.7rem] font-bold mb-2">{course.title}</h1>
      {course.subtitle && <p className="text-muted">{course.subtitle}</p>}
      {course.description && <p className="text-muted text-sm">{course.description}</p>}
      <div className="flex flex-wrap items-center gap-2.5 my-5">
        <Progress value={dn} total={flat.length} />
      </div>

      {course.modules.length === 0 && (
        <p className="bg-panel border border-dashed border-hairline rounded-xl p-6 text-muted">
          Curriculum ancora vuoto: scarica i video entro il 24 novembre e genera il modulo con{" "}
          <code className="rounded bg-panel2 px-1 py-0.5 text-[0.9em] font-mono">pnpm catalog</code>{" "}
          (vedi README).
        </p>
      )}

      {course.modules.map((m) => (
        <section key={m.id}>
          <h2 className="text-lg font-bold mt-6 mb-2.5">{m.title}</h2>
          <ul className="list-none p-0 m-0">
            {m.lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="flex items-center gap-2.5 px-2.5 py-2 border-b border-hairline hover:bg-panel2"
              >
                <button
                  className={
                    done[lesson.id]
                      ? "w-[22px] h-[22px] rounded-md text-xs leading-none border border-success bg-success text-[#06281c] cursor-pointer flex-none"
                      : "w-[22px] h-[22px] rounded-md text-xs leading-none border border-hairline bg-transparent text-muted cursor-pointer flex-none"
                  }
                  aria-label={done[lesson.id] ? "Lezione completata" : "Segna lezione completata"}
                  onClick={() => toggleLesson(lesson.id)}
                >
                  ✓
                </button>
                <Link
                  href={`/c/${course.id}/l/${lesson.id}`}
                  className={
                    done[lesson.id] ? "flex-1 line-through text-muted" : "flex-1 text-ink"
                  }
                >
                  {lesson.title}
                </Link>
                <span className="inline-block bg-panel2 border border-hairline text-muted text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                  {lesson.type}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {flat.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 my-5">
          <button
            className="inline-block px-3.5 py-2 rounded-[10px] border border-accent bg-transparent text-accent font-semibold text-sm cursor-pointer hover:brightness-110"
            onClick={() => {
              if (!window.confirm("Azzerare i progressi di questo corso?")) return;
              flat.forEach((x) => lsRemove(`done:${x.lesson.id}`));
              setDone({});
            }}
          >
            Azzera progressi del corso
          </button>
        </div>
      )}
    </div>
  );
}

export default function CoursePage() {
  return (
    <Suspense fallback={null}>
      <CourseContent />
    </Suspense>
  );
}
