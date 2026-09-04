import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  adminAddChannel,
  adminBroadcast,
  adminDashboard,
  adminDeletePatent,
  adminDeleteProject,
  adminDeleteUser,
  adminDeleteWaitlist,
  adminLetterPreview,
  adminLogin,
  adminLogout,
  adminMarkPatented,
  adminMe,
  adminMessageUser,
  adminRemoveChannel,
  adminSaveSetting,
  adminSendToMinistry,
  adminSetUserRole,
  adminSetUserVerified,
} from "@/lib/admin.functions";
import { UiSwitch } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Boshqaruv paneli — KelajakHub" },
      { name: "description", content: "KelajakHub ichki boshqaruv paneli." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "KelajakHub boshqaruv paneli" },
      { property: "og:description", content: "Ichki boshqaruv paneli." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Dash = Awaited<ReturnType<typeof adminDashboard>>;

function AdminPage() {
  const me = useServerFn(adminMe);
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);
  const dashboard = useServerFn(adminDashboard);
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [data, setData] = useState<Dash | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await dashboard());
    } catch {
      setEmail(null);
    }
  }, [dashboard]);

  useEffect(() => {
    me()
      .then((r) => {
        setEmail(r.email);
        if (r.email) void refresh();
      })
      .finally(() => setChecked(true));
  }, [me, refresh]);

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await login({
      data: {
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
        pin: String(fd.get("pin") ?? ""),
      },
    }).catch(() => ({ ok: false as const }));
    if (!("ok" in res) || !res.ok) {
      toast.error("Email, parol yoki PIN xato.");
      return;
    }
    setEmail("email" in res ? (res.email ?? null) : null);
    await refresh();
  }

  if (!checked) {
    return (
      <main className="hero-surface flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
      </main>
    );
  }

  if (!email) {
    return (
      <main className="hero-surface flex min-h-screen items-center justify-center px-5">
        <form onSubmit={onLogin} className="panel w-full max-w-sm space-y-4 p-7">
          <h1 className="text-xl font-bold">Boshqaruv paneli</h1>
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            autoComplete="username"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Parol"
            autoComplete="current-password"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            name="pin"
            type="password"
            required
            inputMode="numeric"
            placeholder="PIN kod"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button className="glow w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Kirish</button>
        </form>
      </main>
    );
  }

  return (
    <main className="hero-surface min-h-screen px-4 py-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">KelajakHub boshqaruvi</h1>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="flex items-center gap-2">
            <UiSwitch />
            <button onClick={() => void refresh()} className="rounded-full border border-border px-4 py-2 text-sm">
              Yangilash
            </button>
            <button
              onClick={async () => {
                await logout();
                setEmail(null);
                setData(null);
              }}
              className="rounded-full border border-border px-4 py-2 text-sm"
            >
              Chiqish
            </button>
          </div>
        </header>

        {data && (
          <>
            <StatsSection stats={data.stats} />
            <PatentSection patents={data.patents} onChange={refresh} />
            <ProjectsSection projects={data.projects} users={data.users} onChange={refresh} />
            <ChannelSection channels={data.channels} onChange={refresh} />
            <SettingsSection settings={data.settings} onChange={refresh} />
            <BroadcastSection />
            <UsersSection users={data.users} onChange={refresh} />
            <WaitlistSection waitlist={data.waitlist} onChange={refresh} />
          </>
        )}
      </div>
    </main>
  );
}

function PatentSection({ patents, onChange }: { patents: Dash["patents"]; onChange: () => void }) {
  const send = useServerFn(adminSendToMinistry);
  const preview = useServerFn(adminLetterPreview);
  const patented = useServerFn(adminMarkPatented);
  const del = useServerFn(adminDeletePatent);
  const [letter, setLetter] = useState<string | null>(null);

  return (
    <section className="panel p-6">
      <h2 className="text-lg font-semibold">Patent arizalari</h2>
      <div className="mt-4 space-y-3">
        {patents.length === 0 && <p className="text-sm text-muted-foreground">Ariza yo'q.</p>}
        {patents.map((p) => (
          <article key={p.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{p.title}</h3>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">{p.status}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              muhr: <code className="text-primary">{p.digital_seal}</code>
              {p.ministry_ref ? ` · hujjat: ${p.ministry_ref}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  const res = await preview({ data: { id: p.id } });
                  setLetter(res.letter);
                }}
                className="rounded-full border border-border px-4 py-1.5 text-xs"
              >
                Xatni ko'rish
              </button>
              <button
                onClick={async () => {
                  const res = await send({ data: { id: p.id } });
                  setLetter(res.letter);
                  toast.success(`Vazirlikka yuborildi: ${res.ref}`);
                  onChange();
                }}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Vazirlikka yuborish
              </button>
              <button
                onClick={async () => {
                  await patented({ data: { id: p.id } });
                  toast.success("Patent olindi deb belgilandi");
                  onChange();
                }}
                className="rounded-full border border-accent px-4 py-1.5 text-xs text-accent"
              >
                Patent olindi
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`«${p.title}» arizasini butunlay o'chirasizmi?`)) return;
                  await del({ data: { id: p.id } });
                  toast.success("Ariza o'chirildi");
                  onChange();
                }}
                className="rounded-full border border-destructive px-4 py-1.5 text-xs text-destructive"
              >
                O'chirish
              </button>
            </div>
          </article>
        ))}
      </div>
      {letter && (
        <pre className="mt-5 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-secondary p-4 text-xs">{letter}</pre>
      )}
    </section>
  );
}

function ChannelSection({ channels, onChange }: { channels: Dash["channels"]; onChange: () => void }) {
  const add = useServerFn(adminAddChannel);
  const remove = useServerFn(adminRemoveChannel);
  return (
    <section className="panel p-6">
      <h2 className="text-lg font-semibold">Majburiy obuna kanallari</h2>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          try {
            await add({
              data: {
                chat_id: String(fd.get("chat_id") ?? ""),
                title: String(fd.get("title") ?? ""),
                url: String(fd.get("url") ?? ""),
              },
            });
            form.reset();
            onChange();
            toast.success("Kanal qo'shildi");
          } catch {
            toast.error("Kanal qo'shilmadi. Ma'lumotlarni tekshiring.");
          }
        }}
      >
        <input name="title" required placeholder="Kanal nomi" className="rounded-xl border border-input bg-background px-3 py-2 text-sm" />
        <input name="chat_id" required placeholder="@kanal yoki -100..." className="rounded-xl border border-input bg-background px-3 py-2 text-sm" />
        <input name="url" required placeholder="https://t.me/kanal" className="rounded-xl border border-input bg-background px-3 py-2 text-sm" />
        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Qo'shish</button>
      </form>
      <ul className="mt-4 space-y-2">
        {channels.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-2 text-sm">
            <span>
              {c.title} · <span className="text-muted-foreground">{c.chat_id}</span>
            </span>
            <button
              onClick={async () => {
                await remove({ data: { id: c.id } });
                onChange();
              }}
              className="text-xs text-destructive"
            >
              O'chirish
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Eslatma: bot kanalga administrator qilib qo'shilishi kerak, aks holda obunani tekshira olmaydi.
      </p>
    </section>
  );
}

function SettingsSection({ settings, onChange }: { settings: Dash["settings"]; onChange: () => void }) {
  const save = useServerFn(adminSaveSetting);
  return (
    <section className="panel p-6">
      <h2 className="text-lg font-semibold">Vazirlik sozlamalari</h2>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          await save({ data: { key: "ministry_name", value: String(fd.get("ministry_name") ?? "") } });
          await save({ data: { key: "ministry_email", value: String(fd.get("ministry_email") ?? "") } });
          onChange();
          toast.success("Saqlandi");
        }}
      >
        <input
          name="ministry_name"
          defaultValue={settings["ministry_name"] ?? ""}
          placeholder="Vazirlik nomi"
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          name="ministry_email"
          defaultValue={settings["ministry_email"] ?? ""}
          placeholder="Vazirlik email"
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Saqlash</button>
      </form>
    </section>
  );
}

function BroadcastSection() {
  const broadcast = useServerFn(adminBroadcast);
  const [busy, setBusy] = useState(false);
  return (
    <section className="panel p-6">
      <h2 className="text-lg font-semibold">Ommaviy xabar</h2>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          setBusy(true);
          try {
            const res = await broadcast({ data: { text: String(fd.get("text") ?? "") } });
            toast.success(`${res.sent} foydalanuvchiga yuborildi`);
            form.reset();
          } finally {
            setBusy(false);
          }
        }}
      >
        <textarea
          name="text"
          rows={3}
          required
          placeholder="Xabar matni"
          className="w-full rounded-xl border border-input bg-background p-3 text-sm"
        />
        <button disabled={busy} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? "Yuborilmoqda..." : "Yuborish"}
        </button>
      </form>
    </section>
  );
}

const STAT_LABELS: [keyof Dash["stats"], string][] = [
  ["users", "Foydalanuvchilar"],
  ["newUsers7d", "7 kunda yangi"],
  ["verified", "Tasdiqlangan"],
  ["phoneVerified", "Raqami tasdiqlangan"],
  ["inventors", "Ixtirochilar"],
  ["minors", "16 yoshgacha"],
  ["mentors", "Mentorlar"],
  ["investors", "Investorlar"],
  ["parents", "Ota-onalar"],
  ["projects", "Loyihalar"],
  ["patents", "Patent arizalari"],
  ["patentsPendingParent", "Ota-ona tasdig'i kutilmoqda"],
  ["patentsSent", "Vazirlikka yuborilgan"],
  ["patentsPatented", "Patent olgan"],
  ["investments", "Investitsiya takliflari"],
  ["messages", "Chat xabarlari"],
];

function StatsSection({ stats }: { stats: Dash["stats"] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {STAT_LABELS.map(([key, label]) => (
        <div key={key} className="panel p-4">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">{stats[key]}</p>
        </div>
      ))}
    </section>
  );
}

const ROLES = ["inventor", "mentor", "investor", "parent"] as const;

function UsersSection({ users, onChange }: { users: Dash["users"]; onChange: () => void }) {
  const del = useServerFn(adminDeleteUser);
  const setRole = useServerFn(adminSetUserRole);
  const setVerified = useServerFn(adminSetUserVerified);
  const message = useServerFn(adminMessageUser);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const needle = q.trim().toLowerCase();
  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (!needle) return true;
    return [u.full_name, u.username, u.phone, String(u.telegram_id), u.role]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(needle));
  });

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Foydalanuvchilar boshqaruvi</h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Qidirish: ism, telefon, username..."
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Barcha rollar</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{filtered.length} ta yozuv</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="py-2">Ism</th>
              <th className="py-2">Rol</th>
              <th className="py-2">Telefon</th>
              <th className="py-2">Yosh</th>
              <th className="py-2">Holat</th>
              <th className="py-2">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-border align-middle">
                <td className="py-2">
                  {u.full_name ?? "-"}
                  {u.username ? <span className="block text-xs text-muted-foreground">@{u.username}</span> : null}
                </td>
                <td className="py-2">
                  <select
                    value={ROLES.includes((u.role ?? "") as (typeof ROLES)[number]) ? (u.role as string) : ""}
                    onChange={async (e) => {
                      await setRole({ data: { id: u.id, role: e.target.value as (typeof ROLES)[number] } });
                      toast.success("Rol o'zgartirildi");
                      onChange();
                    }}
                    className="rounded-lg border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option value="">—</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2">{u.phone ?? "-"}</td>
                <td className="py-2">{u.birth_year ? new Date().getFullYear() - u.birth_year : "-"}</td>
                <td className="py-2">{u.is_verified ? "✅" : "⏳"}</td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        await setVerified({ data: { id: u.id, verified: !u.is_verified } });
                        onChange();
                      }}
                      className="rounded-full border border-border px-3 py-1 text-xs"
                    >
                      {u.is_verified ? "Bekor qilish" : "Tasdiqlash"}
                    </button>
                    <button
                      onClick={async () => {
                        const text = prompt("Xabar matni:");
                        if (!text) return;
                        try {
                          await message({ data: { id: u.id, text } });
                          toast.success("Xabar yuborildi");
                        } catch {
                          toast.error("Xabar yuborilmadi");
                        }
                      }}
                      className="rounded-full border border-border px-3 py-1 text-xs"
                    >
                      Xabar
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`${u.full_name ?? "Foydalanuvchi"} butunlay o'chirilsinmi?`)) return;
                        try {
                          await del({ data: { id: u.id } });
                          toast.success("O'chirildi");
                          onChange();
                        } catch {
                          toast.error("O'chirilmadi");
                        }
                      }}
                      className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive"
                    >
                      O'chirish
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-sm text-muted-foreground">
                  Hech narsa topilmadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProjectsSection({
  projects,
  users,
  onChange,
}: {
  projects: Dash["projects"];
  users: Dash["users"];
  onChange: () => void;
}) {
  const del = useServerFn(adminDeleteProject);
  const [q, setQ] = useState("");
  const byId = new Map(users.map((u) => [u.id, u]));
  const needle = q.trim().toLowerCase();
  const filtered = projects.filter(
    (p) => !needle || `${p.title} ${p.description}`.toLowerCase().includes(needle),
  );

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Loyihalar</h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Loyiha qidirish..."
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="mt-4 space-y-3">
        {filtered.map((p) => (
          <article key={p.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{p.title}</h3>
              <button
                onClick={async () => {
                  if (!confirm(`«${p.title}» loyihasi o'chirilsinmi?`)) return;
                  await del({ data: { id: p.id } });
                  toast.success("Loyiha o'chirildi");
                  onChange();
                }}
                className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive"
              >
                O'chirish
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Muallif: {byId.get(p.user_id)?.full_name ?? "—"}
              {p.funding_goal ? ` · maqsad: ${p.funding_goal}` : ""}
              {p.looking_for_team ? " · jamoa izlanmoqda" : ""}
            </p>
          </article>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Loyiha yo'q.</p>}
      </div>
    </section>
  );
}

function WaitlistSection({ waitlist, onChange }: { waitlist: Dash["waitlist"]; onChange: () => void }) {
  const del = useServerFn(adminDeleteWaitlist);
  return (
    <section className="panel p-6">
      <h2 className="text-lg font-semibold">Kutish ro'yxati</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {waitlist.map((w) => (
          <li key={w.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-2">
            <span>
              {w.full_name} · <span className="text-muted-foreground">{w.role}</span> · {w.contact}
            </span>
            <button
              onClick={async () => {
                await del({ data: { id: w.id } });
                onChange();
              }}
              className="text-xs text-destructive"
            >
              O'chirish
            </button>
          </li>
        ))}
        {waitlist.length === 0 && <li className="text-sm text-muted-foreground">Bo'sh.</li>}
      </ul>
    </section>
  );
}
