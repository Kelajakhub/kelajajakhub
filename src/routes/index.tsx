import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
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
} from "lucide-react";
import { submitWaitlist } from "@/lib/admin.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KelajakHub — Ixtironi patentlash platformasi" },
      {
        name: "description",
        content:
          "KelajakHub yosh ixtirochilarning g'oyalarini raqamli muhrlaydi va patent olish uchun vazirlik hamda Intellektual mulk agentligiga yo'naltiradi.",
      },
      { property: "og:title", content: "KelajakHub — G'oyangizni rasmiy patent darajasiga olib chiqing" },
      {
        property: "og:description",
        content: "Raqamli muhr, ekspertiza va vazirlikka rasmiy yo'naltirish. Ota-ona nazorati, mentorlar va investorlar bir platformada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    icon: Stamp,
    title: "Ma'lumot kiritish",
    text: "Foydalanuvchi ixtiro tavsifi, chizmalari va mualliflik ma'lumotlarini platformaga xavfsiz yuklaydi.",
  },
  {
    icon: ShieldCheck,
    title: "Raqamli muhr (Timestamp)",
    text: "Tizim g'oya muallifi va vaqtini muhrlaydi, o'g'irlanishdan himoya qiladi.",
  },
  {
    icon: Landmark,
    title: "Vazirlikka yuborish",
    text: "Tayyor hujjatlar to'plami rasmiy patent va davlat ro'yxatidan o'tkazish uchun vazirlikka yo'naltiriladi.",
  },
];

const features = [
  { icon: Landmark, title: "Patentlash va vazirlik integratsiyasi", text: "G'oyalar ekspertizadan o'tkaziladi va rasmiy xat bilan mas'ul vazirlikka yuboriladi." },
  { icon: ShieldCheck, title: "G'oyalar himoyasi", text: "Har bir loyiha raqamli mualliflik daxlsizligi bilan yopiq muhitda saqlanadi." },
  { icon: Users, title: "Jamoa izlash", text: "Loyihangiz uchun yosh dasturchi yoki dizaynerlarni toping, MVP yarating." },
  { icon: GraduationCap, title: "Mentorlar tarmog'i", text: "Ekspertlardan professional maslahat va fikr-mulohaza oling." },
  { icon: Baby, title: "Ota-onalar nazorati", text: "16 yoshgacha ixtirochilar faoliyatini kuzatish uchun maxsus panel." },
  { icon: FolderKanban, title: "Kelajak portfeli", text: "Barcha tanlovlar va yutuqlaringiz yagona raqamli pasportda." },
];

const roles = [
  "Yosh ixtirochi (16 yoshgacha, pasporti yo'q)",
  "Ota-ona",
  "Mentor",
  "Investor",
];

function Landing() {
  const submit = useServerFn(submitWaitlist);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setPending(true);
    try {
      await submit({
        data: {
          full_name: String(fd.get("full_name") ?? ""),
          role: String(fd.get("role") ?? ""),
          contact: String(fd.get("contact") ?? ""),
        },
      });
      toast.success("Arizangiz qabul qilindi! Tizim ishga tushganda xabar beramiz.");
      form.reset();
    } catch {
      toast.error("Xatolik yuz berdi. Ma'lumotlarni tekshirib qayta urinib ko'ring.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen hero-surface text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <span className="font-display text-lg font-bold tracking-tight">
          Kelajak<span className="gold-text">Hub</span>
        </span>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden rounded-full border border-border px-3 py-1 text-muted-foreground sm:inline">
            Patent topshirish (Waitlist)
          </span>
          <a
            href="https://t.me/kelajakhub_bot"
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
          olish uchun tegishli vazirlik hamda patent idoralariga yuboradi.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href="#waitlist"
            className="glow inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Ariza qoldirish &amp; kutish ro'yxati <ArrowRight className="size-4" />
          </a>
          <a
            href="#steps"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold text-foreground transition hover:bg-secondary"
          >
            Patentlash bosqichlari
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
        <h2 className="text-2xl font-bold sm:text-3xl">Platformada nimalar bo'ladi?</h2>
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

      <section id="waitlist" className="mx-auto max-w-3xl px-5 py-16">
        <div className="panel p-7 sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">Katta ochilishga tayyormisiz?</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Platforma va vazirlik integratsiyasi jadal ishlab chiqilmoqda. Tizim ishga tushganida birinchilardan bo'lib
            kirish huquqiga ega bo'lish uchun ro'yxatdan o'ting.
          </p>
          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="full_name">
                Ism va familiyangiz
              </label>
              <input
                id="full_name"
                name="full_name"
                required
                maxLength={120}
                placeholder="Masalan: Anvarov Axror"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="role">
                Kim sifatida qo'shilyapsiz?
              </label>
              <select
                id="role"
                name="role"
                required
                defaultValue=""
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Tanlang...
                </option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="contact">
                Telegram username yoki Email
              </label>
              <input
                id="contact"
                name="contact"
                required
                maxLength={160}
                placeholder="@username yoki email@mail.com"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="glow w-full rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Yuborilmoqda..." : "Tizim ishga tushganda birinchilardan bo'lib xabar topish"}
            </button>
          </form>
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
