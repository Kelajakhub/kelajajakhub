import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { UiSwitch } from "@/lib/i18n";

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
      {
        name: "description",
        content: "KelajakHub mini ilovasi: loyihalar, patent portfeli, mentor chat, investitsiya va ota-ona nazorati.",
      },
      { property: "og:title", content: "KelajakHub Mini App" },
      {
        property: "og:description",
        content: "Ixtirochi kabineti: loyihalar, patentlar, mentor va AI chat, investitsiya va nazorat paneli.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MiniApp,
});

type Project = {
  id: string;
  title: string;
  description: string | null;
  logo_url: string | null;
  funding_goal: string | null;
  looking_for_team: boolean | null;
  team_note: string | null;
  telegram_group_url: string | null;
};

type Profile = {
  user: {
    id: string;
    full_name: string;
    role: string;
    phone: string;
    is_verified: boolean;
    has_parent: boolean;
    parent_secret: string | null;
    age?: number | null;
    is_minor?: boolean;
  };
  patents: { id: string; title: string; status: string; digital_seal: string }[];
  myProjects: Project[];
  mentors: { id: string; full_name: string | null; expertise: string | null; bio: string | null }[];
  conversations: { id: string; kind: string; title: string; updated_at: string }[];
  teamAds: { id: string; title: string; team_note: string | null; telegram_group_url: string | null; owner: string }[];
  children: { id: string; full_name: string | null; phone: string | null; is_verified: boolean }[];
  childProjects: Project[];
  childPatents: { id: string; title: string; status: string; digital_seal: string; consent_url?: string | null }[];
  investorFeed: { id: string; title: string; description: string | null; logo_url: string | null; funding_goal: string | null; owner: string }[];
  myInvestments: { id: string; project_id: string; amount: string; status: string }[];
  incomingInvestments: { id: string; amount: string; status: string; investor: string; message: string | null }[];
  parentPendingInvestments: { id: string; amount: string; status: string; investor: string; message: string | null }[];
  mentorProjects: { id: string; title: string; description: string | null; telegram_group_url: string | null; owner: string }[];
};

type Chat = {
  conversationId: string;
  kind: string;
  meId: string;
  messages: { id: string; sender_id: string | null; sender_role: string; body: string; created_at: string }[];
};

type TabDef = { id: string; label: string; icon: string };

const ALL_TABS: Record<string, TabDef> = {
  home: { id: "home", label: "Bosh", icon: "🏠" },
  projects: { id: "projects", label: "Loyihalar", icon: "🚀" },
  chat: { id: "chat", label: "Mentor", icon: "💬" },
  invest: { id: "invest", label: "Investitsiya", icon: "💰" },
  parent: { id: "parent", label: "Nazorat", icon: "🛡" },
};

function tabsFor(role: string, isMinor: boolean): TabDef[] {
  const ids =
    role === "parent"
      ? ["home", "parent", "chat"]
      : role === "mentor"
        ? ["home", "chat", "projects"]
        : role === "investor"
          ? ["home", "invest", "chat"]
          : isMinor
            ? ["home", "projects", "chat"]
            : ["home", "projects", "chat", "invest"];
  return ids.map((id) => ALL_TABS[id]!);
}

function MiniApp() {
  const [initData, setInitData] = useState<string | null>(null);
  const [data, setData] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("home");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string; expand?: () => void; ready?: () => void } } })
      .Telegram;
    tg?.WebApp?.ready?.();
    tg?.WebApp?.expand?.();
    const raw = tg?.WebApp?.initData ?? "";
    if (!raw) {
      setError("Bu sahifa Telegram bot ichida ochilishi kerak. @kelajakhubbot ga kiring va «KelajakHub» tugmasini bosing.");
      return;
    }
    setInitData(raw);
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t) setTab(t);
    callApi<Profile>("/api/public/miniapp/profile", { initData: raw })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  async function reload() {
    if (!initData) return;
    const fresh = await callApi<Profile>("/api/public/miniapp/profile", { initData });
    setData(fresh);
  }

  async function rpc<T>(action: string, payload: Record<string, unknown>): Promise<T | null> {
    if (!initData) return null;
    setBusy(true);
    try {
      const res = await callApi<T>("/api/public/miniapp/rpc", { initData, action, payload });
      return res;
    } catch (e) {
      setToast((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  if (error) {
    return (
      <main className="ios-shell flex min-h-screen items-center justify-center px-6 text-center">
        <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="ios-shell flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </main>
    );
  }

  const isMinor = Boolean(data.user.is_minor ?? (data.user.age != null && data.user.age < 16));
  const tabs = tabsFor(data.user.role, isMinor);
  const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0]!.id;

  return (
    <main className="ios-shell min-h-screen pb-28 text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 px-5 pb-3 pt-5 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">KelajakHub</p>
            <h1 className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight">{data.user.full_name}</h1>
          </div>
          <UiSwitch compact />
        </div>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {roleLabel(data.user.role)}
          {isMinor ? " (16 yoshgacha)" : ""} · {data.user.phone || "raqam yo'q"} ·{" "}
          {data.user.is_verified ? "tasdiqlangan" : "tasdiqlanmagan"}
        </p>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-4">
        {activeTab === "home" && <HomeTab data={data} onTab={setTab} />}
        {activeTab === "projects" && <ProjectsTab data={data} busy={busy} rpc={rpc} reload={reload} setToast={setToast} />}
        {activeTab === "chat" && <ChatTab data={data} initData={initData} rpc={rpc} reload={reload} />}
        {activeTab === "invest" && <InvestTab data={data} busy={busy} rpc={rpc} reload={reload} setToast={setToast} />}
        {activeTab === "parent" && <ParentTab data={data} rpc={rpc} reload={reload} setToast={setToast} />}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-30 w-[88%] max-w-sm -translate-x-1/2 rounded-2xl bg-foreground/90 px-4 py-3 text-center text-[13px] text-background shadow-lg">
          {toast}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-stretch justify-between px-2 pb-5 pt-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition ${
                activeTab === t.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="text-[18px] leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    inventor: "Ixtirochi",
    parent: "Ota-ona",
    mentor: "Mentor",
    investor: "Investor",
  };
  return map[role] ?? role;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm ${className}`}>{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-5 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</h2>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <Card className="text-[13px] text-muted-foreground">{children}</Card>;
}

/* ---------------------------------- Bosh ---------------------------------- */

function HomeTab({ data, onTab }: { data: Profile; onTab: (t: string) => void }) {
  const stats = [
    { label: "Loyihalar", value: data.myProjects.length, tab: "projects" },
    { label: "Patentlar", value: data.patents.length, tab: "home" },
    { label: "Suhbatlar", value: data.conversations.length, tab: "chat" },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <button key={s.label} onClick={() => onTab(s.tab)} className="rounded-2xl border border-border/70 bg-card/80 p-3 text-left">
            <p className="text-[22px] font-bold leading-none">{s.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{s.label}</p>
          </button>
        ))}
      </div>

      <SectionTitle>Patent portfeli</SectionTitle>
      {data.patents.length ? (
        <div className="space-y-2">
          {data.patents.map((p) => (
            <Card key={p.id}>
              <h3 className="text-[15px] font-semibold">{p.title}</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Holat: {p.status} · muhr: <code className="text-primary">{p.digital_seal}</code>
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <Empty>Hozircha ixtiro yo'q. Botdagi «Ixtironi patentlash markaziga yuborish» tugmasidan foydalaning.</Empty>
      )}

      <SectionTitle>Jamoa izlayotgan loyihalar</SectionTitle>
      {data.teamAds.length ? (
        <div className="space-y-2">
          {data.teamAds.map((t) => (
            <Card key={t.id}>
              <h3 className="text-[15px] font-semibold">{t.title}</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">{t.team_note ?? "Jamoaga a'zo kerak."}</p>
              <p className="mt-2 text-[12px] text-muted-foreground">Muallif: {t.owner}</p>
              {t.telegram_group_url && (
                <a href={t.telegram_group_url} className="mt-2 inline-block text-[13px] font-medium text-primary">
                  Guruhga qo'shilish →
                </a>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Empty>Hozircha jamoa e'lonlari yo'q.</Empty>
      )}

      {data.user.role === "mentor" && (
        <>
          <SectionTitle>Mentorlik loyihalari</SectionTitle>
          {data.mentorProjects.length ? (
            <div className="space-y-2">
              {data.mentorProjects.map((p) => (
                <Card key={p.id}>
                  <h3 className="text-[15px] font-semibold">{p.title}</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">{p.description}</p>
                  <p className="mt-2 text-[12px] text-muted-foreground">Ixtirochi: {p.owner}</p>
                  {p.telegram_group_url && (
                    <a href={p.telegram_group_url} className="mt-2 inline-block text-[13px] font-medium text-primary">
                      Loyiha guruhiga kirish →
                    </a>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Empty>Hozircha sizga ulangan loyiha yo'q.</Empty>
          )}
        </>
      )}
    </div>
  );
}

/* -------------------------------- Loyihalar -------------------------------- */

function ProjectsTab({
  data,
  busy,
  rpc,
  reload,
  setToast,
}: {
  data: Profile;
  busy: boolean;
  rpc: <T>(a: string, p: Record<string, unknown>) => Promise<T | null>;
  reload: () => Promise<void>;
  setToast: (m: string) => void;
}) {
  const [form, setForm] = useState({
    id: "",
    title: "",
    description: "",
    logo_url: "",
    funding_goal: "",
    looking_for_team: false,
    team_note: "",
    telegram_group_url: "",
  });
  const [mentorFor, setMentorFor] = useState<string | null>(null);

  function edit(p: Project) {
    setForm({
      id: p.id,
      title: p.title,
      description: p.description ?? "",
      logo_url: p.logo_url ?? "",
      funding_goal: p.funding_goal ?? "",
      looking_for_team: Boolean(p.looking_for_team),
      team_note: p.team_note ?? "",
      telegram_group_url: p.telegram_group_url ?? "",
    });
  }

  async function save() {
    if (form.title.trim().length < 2 || form.description.trim().length < 5) {
      setToast("Loyiha nomi va tavsifini to'liq kiriting.");
      return;
    }
    const res = await rpc<{ ok: boolean }>("saveProject", {
      ...(form.id ? { id: form.id } : {}),
      title: form.title.trim(),
      description: form.description.trim(),
      logo_url: form.logo_url.trim() || null,
      funding_goal: form.funding_goal.trim() || null,
      looking_for_team: form.looking_for_team,
      team_note: form.team_note.trim() || null,
      telegram_group_url: form.telegram_group_url.trim() || null,
    });
    if (res?.ok) {
      setForm({
        id: "",
        title: "",
        description: "",
        logo_url: "",
        funding_goal: "",
        looking_for_team: false,
        team_note: "",
        telegram_group_url: "",
      });
      setToast("Loyiha saqlandi");
      await reload();
    }
  }

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <h2 className="text-[15px] font-semibold">{form.id ? "Loyihani tahrirlash" : "Yangi loyiha"}</h2>
        <Field label="Nomi" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <Field label="Tavsif" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
        <Field label="Logo havolasi" value={form.logo_url} onChange={(v) => setForm({ ...form, logo_url: v })} />
        <Field label="Investitsiya maqsadi" value={form.funding_goal} onChange={(v) => setForm({ ...form, funding_goal: v })} />
        <label className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2.5 text-[14px]">
          Jamoa izlayapman
          <input
            type="checkbox"
            checked={form.looking_for_team}
            onChange={(e) => setForm({ ...form, looking_for_team: e.target.checked })}
            className="h-5 w-5 accent-primary"
          />
        </label>
        {form.looking_for_team && (
          <Field label="Kim kerak?" value={form.team_note} onChange={(v) => setForm({ ...form, team_note: v })} textarea />
        )}
        <Field
          label="Telegram guruh havolasi"
          value={form.telegram_group_url}
          onChange={(v) => setForm({ ...form, telegram_group_url: v })}
        />
        <button
          onClick={save}
          disabled={busy}
          className="w-full rounded-xl bg-primary py-3 text-[15px] font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </Card>

      <SectionTitle>Mening loyihalarim</SectionTitle>
      {data.myProjects.length ? (
        data.myProjects.map((p) => (
          <Card key={p.id} className="space-y-2">
            <h3 className="text-[15px] font-semibold">{p.title}</h3>
            <p className="text-[13px] text-muted-foreground">{p.description}</p>
            {p.funding_goal && <p className="text-[12px] text-muted-foreground">Maqsad: {p.funding_goal}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => edit(p)} className="rounded-xl border border-border px-3 py-2 text-[13px]">
                Tahrirlash
              </button>
              <button
                onClick={() => setMentorFor(mentorFor === p.id ? null : p.id)}
                className="rounded-xl bg-secondary px-3 py-2 text-[13px] font-medium"
              >
                Mentor ulash
              </button>
            </div>
            {mentorFor === p.id && (
              <div className="space-y-2 pt-1">
                {data.mentors.length ? (
                  data.mentors.map((m) => (
                    <button
                      key={m.id}
                      onClick={async () => {
                        const res = await rpc<{ ok: boolean }>("connectMentor", { projectId: p.id, mentorId: m.id });
                        if (res?.ok) {
                          setToast("Mentorga so'rov yuborildi");
                          setMentorFor(null);
                          await reload();
                        }
                      }}
                      className="w-full rounded-xl border border-border px-3 py-2 text-left text-[13px]"
                    >
                      <span className="font-medium">{m.full_name ?? "Mentor"}</span>
                      {m.expertise && <span className="text-muted-foreground"> · {m.expertise}</span>}
                    </button>
                  ))
                ) : (
                  <p className="text-[13px] text-muted-foreground">Hozircha mentor ro'yxatdan o'tmagan.</p>
                )}
              </div>
            )}
          </Card>
        ))
      ) : (
        <Empty>Hozircha loyiha yo'q — yuqoridagi formadan qo'shing.</Empty>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary"
        />
      )}
    </label>
  );
}

/* ---------------------------------- Chat ---------------------------------- */

function ChatTab({
  data,
  initData,
  rpc,
  reload,
}: {
  data: Profile;
  initData: string | null;
  rpc: <T>(a: string, p: Record<string, unknown>) => Promise<T | null>;
  reload: () => Promise<void>;
}) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  async function open(payload: Record<string, unknown>) {
    const res = await rpc<Chat>("openChat", payload);
    if (res) setChat(res);
  }

  async function send() {
    if (!chat || !text.trim() || !initData) return;
    setSending(true);
    const res = await rpc<Chat>("sendMessage", { conversationId: chat.conversationId, body: text.trim() });
    setSending(false);
    if (res) {
      setChat(res);
      setText("");
      await reload();
    }
  }

  if (chat) {
    return (
      <div className="space-y-3">
        <button onClick={() => setChat(null)} className="text-[14px] font-medium text-primary">
          ← Suhbatlar
        </button>
        <Card className="max-h-[52vh] space-y-2 overflow-y-auto">
          {chat.messages.length ? (
            chat.messages.map((m) => {
              const mine = m.sender_id === chat.meId && m.sender_role !== "ai";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[14px] ${
                      mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {m.body}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-[13px] text-muted-foreground">Suhbatni boshlang.</p>
          )}
          <div ref={endRef} />
        </Card>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Xabar yozing..."
            className="flex-1 rounded-full border border-input bg-background px-4 py-3 text-[14px] outline-none focus:border-primary"
          />
          <button
            onClick={send}
            disabled={sending}
            className="rounded-full bg-primary px-5 text-[14px] font-semibold text-primary-foreground disabled:opacity-60"
          >
            {sending ? "..." : "Yuborish"}
          </button>
        </div>
        <p className="px-1 text-[11px] text-muted-foreground">Chat tarixi 30 kundan keyin avtomatik o'chiriladi. Patent tarixi hech qachon o'chmaydi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => open({ ai: true })}
        className="w-full rounded-2xl bg-primary p-4 text-left text-primary-foreground"
      >
        <p className="text-[15px] font-semibold">🤖 AI Mentor</p>
        <p className="mt-0.5 text-[12px] opacity-80">G'oya, patent va prototip bo'yicha darhol maslahat</p>
      </button>

      <SectionTitle>Suhbatlar</SectionTitle>
      {data.conversations.length ? (
        data.conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => open({ conversationId: c.id })}
            className="block w-full rounded-2xl border border-border/70 bg-card/80 p-4 text-left"
          >
            <p className="text-[15px] font-semibold">{c.title}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{new Date(c.updated_at).toLocaleString("uz-UZ")}</p>
          </button>
        ))
      ) : (
        <Empty>Hozircha suhbat yo'q.</Empty>
      )}

      <SectionTitle>Mentorlar</SectionTitle>
      {data.mentors.length ? (
        data.mentors.map((m) => (
          <button
            key={m.id}
            onClick={() => open({ mentorId: m.id })}
            className="block w-full rounded-2xl border border-border/70 bg-card/80 p-4 text-left"
          >
            <p className="text-[15px] font-semibold">{m.full_name ?? "Mentor"}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{m.expertise ?? m.bio ?? "Mentor"}</p>
          </button>
        ))
      ) : (
        <Empty>Hozircha mentor yo'q.</Empty>
      )}
    </div>
  );
}

/* ------------------------------- Investitsiya ------------------------------ */

function InvestTab({
  data,
  busy,
  rpc,
  reload,
  setToast,
}: {
  data: Profile;
  busy: boolean;
  rpc: <T>(a: string, p: Record<string, unknown>) => Promise<T | null>;
  reload: () => Promise<void>;
  setToast: (m: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  if (data.user.role !== "investor") {
    return (
      <div className="space-y-3">
        <SectionTitle>Loyihamga kelgan takliflar</SectionTitle>
        {data.incomingInvestments.length ? (
          data.incomingInvestments.map((i) => (
            <Card key={i.id}>
              <p className="text-[15px] font-semibold">{i.amount}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{i.message}</p>
              <p className="mt-2 text-[12px] text-muted-foreground">
                Investor: {i.investor} · holat: {statusLabel(i.status)}
              </p>
            </Card>
          ))
        ) : (
          <Empty>Hozircha investitsiya taklifi yo'q. Loyihangizni to'liq to'ldirsangiz, investorlar ko'radi.</Empty>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionTitle>Loyihalar</SectionTitle>
      {data.investorFeed.length ? (
        data.investorFeed.map((p) => (
          <Card key={p.id} className="space-y-2">
            <div className="flex items-center gap-3">
              {p.logo_url && <img src={p.logo_url} alt={p.title} className="h-11 w-11 rounded-xl object-cover" />}
              <div>
                <h3 className="text-[15px] font-semibold">{p.title}</h3>
                <p className="text-[12px] text-muted-foreground">{p.owner}</p>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground">{p.description}</p>
            {p.funding_goal && <p className="text-[12px] text-muted-foreground">Maqsad: {p.funding_goal}</p>}
            <button
              onClick={() => setOpen(open === p.id ? null : p.id)}
              className="rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground"
            >
              Investitsiya taklif qilish
            </button>
            {open === p.id && (
              <div className="space-y-2 pt-1">
                <Field label="Summa" value={amount} onChange={setAmount} />
                <Field label="Xabar" value={message} onChange={setMessage} textarea />
                <button
                  disabled={busy}
                  onClick={async () => {
                    if (!amount.trim()) return setToast("Summani kiriting.");
                    const res = await rpc<{ ok: boolean; needsParent: boolean }>("invest", {
                      projectId: p.id,
                      amount: amount.trim(),
                      message: message.trim(),
                    });
                    if (res?.ok) {
                      setToast(res.needsParent ? "Taklif yuborildi — ota-ona roziligi kutilmoqda" : "Taklif yuborildi");
                      setOpen(null);
                      setAmount("");
                      setMessage("");
                      await reload();
                    }
                  }}
                  className="w-full rounded-xl bg-secondary py-2.5 text-[14px] font-semibold disabled:opacity-60"
                >
                  Yuborish
                </button>
              </div>
            )}
          </Card>
        ))
      ) : (
        <Empty>Hozircha loyiha yo'q.</Empty>
      )}

      <SectionTitle>Mening takliflarim</SectionTitle>
      {data.myInvestments.length ? (
        data.myInvestments.map((i) => (
          <Card key={i.id}>
            <p className="text-[15px] font-semibold">{i.amount}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Holat: {statusLabel(i.status)}</p>
          </Card>
        ))
      ) : (
        <Empty>Hozircha taklif yubormadingiz.</Empty>
      )}
    </div>
  );
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending_parent: "ota-ona roziligi kutilmoqda",
    approved: "tasdiqlangan",
    rejected: "rad etilgan",
  };
  return map[s] ?? s;
}

/* --------------------------------- Nazorat -------------------------------- */

function ParentTab({
  data,
  rpc,
  reload,
  setToast,
}: {
  data: Profile;
  rpc: <T>(a: string, p: Record<string, unknown>) => Promise<T | null>;
  reload: () => Promise<void>;
  setToast: (m: string) => void;
}) {
  return (
    <div className="space-y-3">
      {data.user.parent_secret && (
        <Card>
          <p className="text-[13px] text-muted-foreground">Farzand uchun maxfiy raqam</p>
          <p className="mt-1 text-[22px] font-bold tracking-widest text-primary">{data.user.parent_secret}</p>
        </Card>
      )}

      <SectionTitle>Farzandlar</SectionTitle>
      {data.children.length ? (
        data.children.map((c) => (
          <Card key={c.id}>
            <p className="text-[15px] font-semibold">{c.full_name}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {c.phone} · {c.is_verified ? "tasdiqlangan" : "kutilmoqda"}
            </p>
          </Card>
        ))
      ) : (
        <Empty>Bog'langan farzand yo'q. Farzandingiz botda maxfiy raqamni kiritishi kerak.</Empty>
      )}

      <SectionTitle>Farzand loyihalari</SectionTitle>
      {data.childProjects.length ? (
        data.childProjects.map((p) => (
          <Card key={p.id}>
            <p className="text-[15px] font-semibold">{p.title}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{p.description}</p>
            {p.telegram_group_url && (
              <a href={p.telegram_group_url} className="mt-2 inline-block text-[13px] font-medium text-primary">
                Guruh faoliyatini kuzatish →
              </a>
            )}
          </Card>
        ))
      ) : (
        <Empty>Loyiha yo'q.</Empty>
      )}

      <SectionTitle>Farzand patentlari</SectionTitle>
      {data.childPatents.length ? (
        data.childPatents.map((p) => (
          <Card key={p.id}>
            <p className="text-[15px] font-semibold">{p.title}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {statusLabel(p.status)} · <code className="text-primary">{p.digital_seal}</code>
            </p>
            {p.status === "pending_parent" && p.consent_url && (
              <>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  Ariza sizning rasmiy roziligingizni kutmoqda. OneID orqali tasdiqlagach, hujjatlar Adliya vazirligi va
                  Intellektual mulk agentligiga yuboriladi.
                </p>
                <a
                  href={p.consent_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block rounded-xl bg-primary py-2.5 text-center text-[14px] font-semibold text-primary-foreground"
                >
                  🏛 OneID orqali kiring va arizani tasdiqlang
                </a>
              </>
            )}
          </Card>
        ))
      ) : (
        <Empty>Patent yo'q.</Empty>
      )}


      <SectionTitle>Rozilik kutayotgan investitsiyalar</SectionTitle>
      {data.parentPendingInvestments.length ? (
        data.parentPendingInvestments.map((i) => (
          <Card key={i.id} className="space-y-2">
            <p className="text-[15px] font-semibold">{i.amount}</p>
            <p className="text-[13px] text-muted-foreground">{i.message}</p>
            <p className="text-[12px] text-muted-foreground">
              Investor: {i.investor} · holat: {statusLabel(i.status)}
            </p>
            {i.status === "pending_parent" && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={async () => {
                    const res = await rpc<{ ok: boolean }>("parentDecision", { investmentId: i.id, approve: true });
                    if (res?.ok) {
                      setToast("Rozilik berildi");
                      await reload();
                    }
                  }}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-[14px] font-semibold text-primary-foreground"
                >
                  Rozilik
                </button>
                <button
                  onClick={async () => {
                    const res = await rpc<{ ok: boolean }>("parentDecision", { investmentId: i.id, approve: false });
                    if (res?.ok) {
                      setToast("Rad etildi");
                      await reload();
                    }
                  }}
                  className="flex-1 rounded-xl border border-border py-2.5 text-[14px] font-semibold"
                >
                  Rad etish
                </button>
              </div>
            )}
          </Card>
        ))
      ) : (
        <Empty>Rozilik kutayotgan taklif yo'q.</Empty>
      )}
    </div>
  );
}
