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
import logoAsset from "@/assets/logo.png.asset.json";
import { UiSwitch, useUi } from "@/lib/i18n";


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
  { icon: Bot, k: "step1" },
  { icon: ShieldCheck, k: "step2" },
  { icon: Landmark, k: "step3" },
];

const features = [
  { icon: Landmark, k: "f1" },
  { icon: ShieldCheck, k: "f2" },
  { icon: Users, k: "f3" },
  { icon: GraduationCap, k: "f4" },
  { icon: Baby, k: "f5" },
  { icon: FolderKanban, k: "f6" },
];

const audiences = [
  { icon: Sparkles, k: "a1" },
  { icon: Baby, k: "a2" },
  { icon: GraduationCap, k: "a3" },
  { icon: Briefcase, k: "a4" },
];

function Landing() {
  const { t } = useUi();
  return (
    <div className="min-h-screen hero-surface text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <span className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
          <img src={logoAsset.url} alt="KelajakHub logotipi" className="size-9" width={36} height={36} />
          Kelajak<span className="gold-text">Hub</span>
        </span>

        <div className="flex items-center gap-3 text-sm">
          <UiSwitch />
          <span className="hidden rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-accent sm:inline">
            {t("nav.live")}
          </span>
          <a
            href={BOT_URL}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Send className="size-4" /> {t("nav.openBot")}
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:pt-16">
        <p className="mb-5 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          {t("hero.badge")}
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
          {t("hero.title1")} <span className="gold-text">{t("hero.titleGold")}</span> {t("hero.title2")}
        </h1>
        <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {t("hero.text")}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href={BOT_URL}
            className="glow inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            {t("hero.cta")} <ArrowRight className="size-4" />
          </a>
          <a
            href="#steps"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold text-foreground transition hover:bg-secondary"
          >
            {t("hero.how")}
          </a>
        </div>
      </section>

      <section id="steps" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">{t("sec.steps")}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <article key={s.k} className="panel p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 font-display font-bold text-primary">
                  {i + 1}
                </span>
                <s.icon className="size-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">{t(`${s.k}.t`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`${s.k}.x`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">{t("sec.features")}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.k} className="panel p-6">
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{t(`${f.k}.t`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`${f.k}.x`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">{t("sec.audiences")}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a) => (
            <article key={a.k} className="panel p-6">
              <a.icon className="size-6 text-accent" />
              <h3 className="mt-4 text-base font-semibold">{t(`${a.k}.t`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`${a.k}.x`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="panel p-7 text-center sm:p-10">
          <Stamp className="mx-auto size-8 text-primary" />
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">{t("cta.title")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("cta.text")}
          </p>
          <a
            href={BOT_URL}
            className="glow mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Send className="size-4" /> {t("cta.button")}
          </a>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        {t("footer.rights")}{" "}
        <Link to="/app" className="underline-offset-4 hover:underline">
          {t("footer.miniapp")}
        </Link>
      </footer>
    </div>
  );
}
