"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Progress from "@/components/Progress";
import { courses, flattenAll, flattenLessons } from "@/lib/catalog";
import { loadAllDone } from "@/lib/storage";

export default function Home() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    setDone(loadAllDone());
  }, []);

  const query = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!query) return [];
    return flattenAll().filter(
      (e) =>
        e.lesson.title.toLowerCase().includes(query) ||
        e.course.title.toLowerCase().includes(query)
    );
  }, [query]);

  const total = useMemo(() => flattenAll().length, []);
  const doneCount = useMemo(
    () => flattenAll().filter((e) => done[e.lesson.id]).length,
    [done]
  );

  return (
    <div>
      <section>
        <h1 className="text-[1.7rem] font-bold mb-2">I tuoi corsi, senza dashboard.</h1>
        <p className="text-muted mb-5">
          {courses.length} corsi · {total} lezioni · {doneCount} completate
        </p>
      </section>

      <input
        className="w-full px-3.5 py-2.5 rounded-[10px] border border-hairline bg-panel text-ink text-base placeholder:text-muted focus:outline-none focus:border-accent"
        type="search"
        placeholder="Cerca una lezione o un corso…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {query ? (
        <section>
          <h2 className="text-lg font-bold mt-6 mb-2.5">{results.length} risultati</h2>
          {results.map((e) => (
            <Link
              key={e.lesson.id}
              href={`/c/${e.course.id}/l/${e.lesson.id}`}
              className="flex items-center gap-2.5 px-2.5 py-2 border-b border-hairline text-ink hover:bg-panel2"
            >
              <span className="flex-1">{e.lesson.title}</span>
              <span className="inline-block bg-panel2 border border-hairline text-muted text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                {e.course.title}
              </span>
            </Link>
          ))}
        </section>
      ) : (
        <section className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5 mt-4">
          {courses.map((c) => {
            const fl = flattenLessons(c);
            const dn = fl.filter((x) => done[x.lesson.id]).length;
            return (
              <Link
                key={c.id}
                href={`/c/${c.id}`}
                className="block bg-panel border border-hairline rounded-xl px-4.5 py-4 text-ink hover:border-accent hover:no-underline"
              >
                <h2 className="text-lg font-bold mb-1">{c.title}</h2>
                {c.subtitle && <p className="text-muted text-sm">{c.subtitle}</p>}
                <Progress value={dn} total={fl.length} />
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
