import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

async function callApi<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "So'rov bajarilmadi");
  return json;
}

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "KelajakHub Mini App — Ixtirochi kabineti" },
      { name: "description", content: "KelajakHub mini ilovasi: kelajak portfeli, laboratoriya, jamoa va ota-ona nazorati." },
      { property: "og:title", content: "KelajakHub Mini App" },
      { property: "og:description", content: "Ixtirochi kabineti: portfel, laboratoriya, jamoa va nazorat paneli." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MiniApp,
});

type Profile = {
  user: { full_name: string; role: string; phone: string; is_verified: boolean; parent_secret: string | null };
  patents: { id: string; title: string; status: string; digital_seal: string }[];
  teamPosts: { id: string; title: string; body: string }[];
  children: { id: string; full_name: string; phone: string; is_verified: boolean }[];
};

const TABS = [
  { id: "portfolio", label: "Portfel" },
  { id: "lab", label: "Laboratoriya" },
  { id: "team", label: "Jamoa" },
  { id: "parent", label: "Nazorat" },
] as const;

function MiniApp() {
  const load = useServerFn(miniProfile);
  const runLab = useServerFn(miniRunLab);
  const [initData, setInitData] = useState<string | null>(null);
  const [data, setData] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("portfolio");
  const [code, setCode] = useState("");
  const [labOut, setLabOut] = useState("");
  const [labBusy, setLabBusy] = useState(false);

  useEffect(() => {
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string; expand?: () => void } } }).Telegram;
    tg?.WebApp?.expand?.();
    const raw = tg?.WebApp?.initData ?? "";
    if (!raw) {
      setError("Bu sahifa Telegram bot ichida ochilishi kerak. @kelajakhubbot ga kiring va «Mini App» tugmasini bosing.");
      return;
    }
    setInitData(raw);
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab")) setTab(params.get("tab")!);
    load({ data: { initData: raw } })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [load]);

  async function onRun() {
    if (!initData || !code.trim()) return;
    setLabBusy(true);
    try {
      const res = await runLab({ data: { initData, code } });
      setLabOut(res.output);
    } catch (e) {
      setLabOut((e as Error).message);
    } finally {
      setLabBusy(false);
    }
  }

  if (error) {
    return (
      <main className="hero-surface flex min-h-screen items-center justify-center px-5 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="hero-surface flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
      </main>
    );
  }

  return (
    <main className="hero-surface min-h-screen px-4 py-6 text-foreground">
      <header className="mx-auto max-w-2xl">
        <h1 className="text-xl font-bold">
          Salom, <span className="gold-text">{data.user.full_name}</span>
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {data.user.role} · {data.user.phone} · {data.user.is_verified ? "tasdiqlangan ✅" : "tasdiqlanmagan ⏳"}
        </p>
      </header>

      <nav className="mx-auto mt-5 flex max-w-2xl gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className="mx-auto mt-5 max-w-2xl space-y-4">
        {tab === "portfolio" &&
          (data.patents.length ? (
            data.patents.map((p) => (
              <article key={p.id} className="panel p-4">
                <h2 className="font-semibold">{p.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Holat: {p.status} · muhr: <code className="text-primary">{p.digital_seal}</code>
                </p>
              </article>
            ))
          ) : (
            <p className="panel p-4 text-sm text-muted-foreground">
              Hozircha ixtiro yo'q. Botdagi «Ixtironi patentlash markaziga yuborish» tugmasidan foydalaning.
            </p>
          ))}

        {tab === "lab" && (
          <div className="panel space-y-3 p-4">
            <p className="text-sm text-muted-foreground">Kod yoki ixtiro g'oyangizni tekshirish uchun yozing.</p>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-input bg-background p-3 font-mono text-xs outline-none focus:border-primary"
              placeholder="function main() { ... }"
            />
            <button
              onClick={onRun}
              disabled={labBusy}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {labBusy ? "Tekshirilmoqda..." : "Tekshirish"}
            </button>
            {labOut && <pre className="whitespace-pre-wrap rounded-xl bg-secondary p-3 text-xs">{labOut}</pre>}
          </div>
        )}

        {tab === "team" &&
          (data.teamPosts.length ? (
            data.teamPosts.map((p) => (
              <article key={p.id} className="panel p-4">
                <h2 className="font-semibold">{p.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
              </article>
            ))
          ) : (
            <p className="panel p-4 text-sm text-muted-foreground">Hozircha jamoa e'lonlari yo'q.</p>
          ))}

        {tab === "parent" && (
          <div className="panel space-y-3 p-4">
            {data.user.parent_secret && (
              <p className="text-sm">
                Farzand uchun maxfiy raqam: <code className="text-primary">{data.user.parent_secret}</code>
              </p>
            )}
            {data.children.length ? (
              data.children.map((c) => (
                <div key={c.id} className="rounded-xl border border-border p-3 text-sm">
                  {c.full_name} · {c.phone} · {c.is_verified ? "tasdiqlangan ✅" : "kutilmoqda ⏳"}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Bog'langan farzand yo'q.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
