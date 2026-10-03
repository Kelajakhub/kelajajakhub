export type Lesson = {
  id: string;
  youtubeId: string;
  category: "debocha" | "dasturlash" | "dizayn" | "startup";
  title: string;
  author: string;
  channel: string;
  about: string;
  topic: string;
};

export const LESSON_CATEGORIES: { id: Lesson["category"]; label: string; icon: string }[] = [
  { id: "debocha", label: "Debocha", icon: "📖" },
  { id: "dasturlash", label: "Dasturlash", icon: "💻" },
  { id: "dizayn", label: "Grafik dizayn", icon: "🎨" },
  { id: "startup", label: "Startup", icon: "🚀" },
];

export const LESSONS: Lesson[] = [
  {
    id: "debocha-sariqdev",
    youtubeId: "nitlLnbp7ak",
    category: "debocha",
    title: "Python darslari: kirish va mohirdev.uz bilan tanishuv",
    author: "Anvar Narzullayev",
    channel: "Sariq dev",
    about: "Anvar Narzullayev — Sariq dev kanali va mohirdev.uz platformasi asoschilaridan, o'zbek tilida dasturlashni o'rgatuvchi mashhur ustoz.",
    topic: "Dasturlashni o'rganishga kirish, darslar tuzilmasi, o'rganish yo'li",
  },
  {
    id: "debocha-startup",
    youtubeId: "UhDerZAYM48",
    category: "debocha",
    title: "Start up'lar uchun pul ko'p, g'oya kam",
    author: "Muhammad Xalil, Dilmurod Khodiev",
    channel: "Alohida mavzu",
    about: "Muhammad Xalil — Startup Garage venchur studiyasi va Mohirdev asoschisi. Suhbat «Alohida mavzu» loyihasi tomonidan tayyorlangan.",
    topic: "Startap nima, TAM, traction, MRR, venchur fondlar, faunder hislatlari",
  },
  {
    id: "python-1",
    youtubeId: "fj_GLU344bQ",
    category: "dasturlash",
    title: "Python: o'rnatish va birinchi dastur",
    author: "Botir Ziyatov",
    channel: "Botir Ziyatov",
    about: "Botir Ziyatov — o'zbek tilida Python, Django va Telegram bot darslari bilan tanilgan dasturchi va ustoz.",
    topic: "Python'ni kompyuterga o'rnatish, interpretator, print bilan birinchi dastur",
  },
  {
    id: "python-4",
    youtubeId: "_DE6yNyu_sQ",
    category: "dasturlash",
    title: "Python dasturlash tili — 4-dars",
    author: "Transformers Education jamoasi",
    channel: "Transformers Education",
    about: "Transformers Education — Toshkentdagi bolalar va yoshlar uchun dasturlash va robototexnika ta'lim markazi.",
    topic: "Python asoslari: o'zgaruvchilar, amallar, oddiy dasturlar",
  },
  {
    id: "figma-1",
    youtubeId: "5-nfh6ILj90",
    category: "dizayn",
    title: "Figma'da veb-sayt dizaynini chizish (1-qism)",
    author: "Muhammadaziz Xabibullayev",
    channel: "Muhammadaziz Xabibullayev",
    about: "Muhammadaziz Xabibullayev — talabalar uchun Figma va veb-dizayn bo'yicha amaliy darslar tayyorlovchi muallif.",
    topic: "Figma: frame, shakllar, matn, veb-sayt maketini chizish, dizayndan kodga o'tish",
  },
  {
    id: "startup-1",
    youtubeId: "atttjLrCFeI",
    category: "startup",
    title: "Nega ko'p startaplar o'ladi?",
    author: "Usmon Rahimjonov, Ulug'bek Ismatov",
    channel: "Founder's cafe",
    about: "Founder's cafe — UzCombinator podkasti. Mehmon Usmon Rahimjonov O'zbekiston startap ekotizimida 10 yildan beri faol.",
    topic: "Startap muvaffaqiyati sabablari, nega startaplar yopiladi, investor bilan xatolar",
  },
  {
    id: "startup-2",
    youtubeId: "zfjh71MJUkc",
    category: "startup",
    title: "Startapga pul beramiz!",
    author: "Muhammad Xalil",
    channel: "Founder's cafe",
    about: "Muhammad Xalil — Startup Garage asoschisi, o'nlab startaplar asoschisi. Founder's cafe podkastida suhbat.",
    topic: "Startapga investitsiya, akselyatorlar, jamoa, O'zbekiston ekotizimi",
  },
  {
    id: "startup-3",
    youtubeId: "GlUMcqjw54g",
    category: "startup",
    title: "O'zbekistonda startup uchun pul bor, lekin sizga bermaydi",
    author: "Abdulazal Toshxo'jayev",
    channel: "Founder's cafe",
    about: "Abdulazal Toshxo'jayev — venchur investitsiya bo'yicha mutaxassis, Founder's cafe mehmoni.",
    topic: "Venchur investitsiya, fondlar fondi, VC qanday startapni tanlaydi, product-market fit",
  },
];
