import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Stamp,
  Landmark,
  Users,
  GraduationCap,
  Baby,
  Briefcase,
  FolderKanban,
  ArrowRight,
  Send,
  Bot,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KelajakHub — Ixtironi patentlash platformasi" },
      {
        name: "description",
        content:
          "KelajakHub yosh ixtirochilarning g'oyalarini raqamli muhrlaydi va patent olish uchun vazirlik hamda Intellektual mulk agentligiga yo'naltiradi. Platforma ishlayapti — Telegram bot orqali kiring.",
      },
      { property: "og:title", content: "KelajakHub — G'oyangizni rasmiy patent darajasiga olib chiqing" },
      {
        property: "og:description",
        content:
          "Raqamli muhr, ekspertiza va vazirlikka rasmiy yo'naltirish. Ota-ona nazorati, mentorlar va investorlar bir platformada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const BOT_URL = "https://t.me/kelajakhubbot";

const steps = [
  {
    icon: Bot,
    title: "Botga kirib ro'yxatdan o'tish",
    text: "Telegram bot orqali rol tanlaysiz, ism va telefon raqamingizni kiritasiz. Raqam SMS kod bilan tasdiqlanadi.",
  },
  {
    icon: ShieldCheck,
    title: "Raqamli muhr (Timestamp)",
    text: "Ixtiro nomi va tavsifi yuborilishi bilan tizim muallif va vaqtni muhrlaydi — g'oya o'g'irlanishdan himoyalanadi.",
  },
  {
    icon: Landmark,
    title: "Vazirlikka yo'naltirish",
    text: "Ekspertizadan so'ng hujjatlar rasmiy xat bilan tegishli vazirlik va Intellektual mulk agentligiga yuboriladi.",
  },
];

const features = [
  { icon: Landmark, title: "Patentlash va vazirlik yo'naltirishi", text: "Har bir ariza ekspertizadan o'tadi va rasmiy xat bilan mas'ul idoraga yuboriladi." },
  { icon: ShieldCheck, title: "G'oyalar himoyasi", text: "Loyihalar raqamli mualliflik muhri bilan yopiq muhitda saqlanadi. Patent tarixi hech qachon o'chmaydi." },
  { icon: Users, title: "Jamoa izlash", text: "Loyihangiz uchun dasturchi, dizayner yoki muhandis toping va MVP yaratishni boshlang." },
  { icon: GraduationCap, title: "Mentorlar va AI mentor", text: "Ekspert mentorlar bilan chat, 24/7 ishlaydigan AI mentor va Telegram guruhida birgalikda ishlash." },
  { icon: Baby, title: "Ota-ona nazorati", text: "16 yoshgacha ixtirochilarning faoliyati ota-ona panelida ko'rinadi; roziliksiz investitsiya olinmaydi." },
  { icon: FolderKanban, title: "Kelajak portfeli", text: "Barcha ixtirolar, muhrlar va yutuqlar yagona raqamli portfelda saqlanadi." },
];

const audiences = [
  { icon: Sparkles, title: "Yosh ixtirochi", text: "G'oyani muhrlab patentlash, laboratoriya, jamoadosh va mentor topish." },
  { icon: Baby, title: "Ota-ona", text: "Farzand loyihalarini, patentlarini va investitsiya taklifларini nazorat qilish." },
  { icon: GraduationCap, title: "Mentor", text: "Loyihalarni ko'rish, muallif bilan chat va guruhda mentor sifatida yordam berish." },
  { icon: Briefcase, title: "Investor", text: "Loyiha nomi, logotipi va tavsifini o'rganib, investitsiya taklifi yuborish." },
];

function Landing() {
  return (
    <div className="min-h-screen hero-surface text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <span className="font-display text-lg font-bold tracking-tight">
          Kelajak<span className="gold-text">Hub</span>
        </span>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-accent sm:inline">
            Platforma ishlayapti
          </span>
          <a
            href={BOT_URL}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Send className="size-4" /> Botni ochish
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:pt-16">
        <p className="mb-5 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          Vazirlik va Intellektual mulk agentligiga to'g'ridan-to'g'ri yo'naltirish tizimi
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
          G'oyangizni kiriting va uni <span className="gold-text">rasmiy patent darajasiga</span> olib chiqing!
        </h1>
        <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          KelajakHub — yosh ixtirochilar va startapchilarning ishlanmalarini raqamli muhrlaydi, hujjatlashtiradi va patent
          olish uchun tegishli vazirlik hamda patent idoralariga yuboradi. Tizim hoziroq ishlayapti.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href={BOT_URL}
            className="glow inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Ixtironi hoziroq topshirish <ArrowRight className="size-4" />
          </a>
          <a
            href="#steps"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold text-foreground transition hover:bg-secondary"
          >
            Qanday ishlaydi?
          </a>
        </div>
      </section>

      <section id="steps" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">G'oyangiz patentga qanday aylanadi?</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <article key={s.title} className="panel p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 font-display font-bold text-primary">
                  {i + 1}
                </span>
                <s.icon className="size-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">Platformada nimalar bor?</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="panel p-6">
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">Kim uchun?</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a) => (
            <article key={a.title} className="panel p-6">
              <a.icon className="size-6 text-accent" />
              <h3 className="mt-4 text-base font-semibold">{a.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{a.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="panel p-7 text-center sm:p-10">
          <Stamp className="mx-auto size-8 text-primary" />
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Ixtironi bugun muhrlab qo'y</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Ro'yxatdan o'tish 2 daqiqa: rol tanlang, ismingizni yozing va SMS kod bilan telefon raqamingizni tasdiqlang.
            So'ng ixtironingizni yuboring — tizim uni darhol raqamli muhrlaydi.
          </p>
          <a
            href={BOT_URL}
            className="glow mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Send className="size-4" /> Telegram botni ochish
          </a>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © 2026 KelajakHub. Barcha huquqlar himoyalangan.{" "}
        <Link to="/app" className="underline-offset-4 hover:underline">
          Mini App
        </Link>
      </footer>
    </div>
  );
}
