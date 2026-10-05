export type Lesson = {
  id: string;
  youtubeId: string;
  category: "dasturlash" | "dizayn" | "startup";
  title: string;
  author: string;
  channel: string;
  about: string;
  topic: string;
};

export const LESSON_CATEGORIES: { id: Lesson["category"]; label: string; icon: string }[] = [
  { id: "dasturlash", label: "Dasturlash", icon: "💻" },
  { id: "dizayn", label: "Grafik dizayn", icon: "🎨" },
  { id: "startup", label: "Startup", icon: "🚀" },
];
