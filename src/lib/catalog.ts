import catalogData from "@/data/catalog.json";

export type LessonType = "video" | "pdf" | "file" | "link";

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  /** URL del media (video/PDF). Vuoto = non ancora impostato. */
  src?: string;
  /** Risorse extra della lezione (es. documentazione Apple, link esterni). */
  links?: Array<{ title: string; url: string }>;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  modules: Module[];
}

export const courses = (catalogData as { courses: Course[] }).courses;

export interface LessonEntry {
  course: Course;
  module: Module;
  lesson: Lesson;
}

/** Tutte le lezioni di un corso, in ordine (per prev/next e per i progressi). */
export function flattenLessons(course: Course): LessonEntry[] {
  return course.modules.flatMap((m) => m.lessons.map((lesson) => ({ course, module: m, lesson })));
}

/** Tutte le lezioni di tutti i corsi (per la ricerca). */
export function flattenAll(): LessonEntry[] {
  return courses.flatMap(flattenLessons);
}

export const TYPE_LABELS: Record<LessonType, string> = {
  video: "video",
  pdf: "pdf",
  file: "file",
  link: "link",
};
