import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const ADMIN_EMAILS = process.env["ADMIN_EMAILS"]
  ? process.env["ADMIN_EMAILS"].split(",").map((e) => e.trim().toLowerCase())
  : ["dxasanovbek@gmail.com", "islomovfaxriddinshaxsiy1@gmail.com"];

const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] || "kelajakhubrasmiy";
const ADMIN_PIN = process.env["ADMIN_PIN"] || "1215";

type AdminSession = { email?: string };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "kh-admin",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function safeEqual(a: string, b: string) {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

export async function login(email: string, password: string, pin: string) {
  const normalized = email.trim().toLowerCase();
  const known = ADMIN_EMAILS.includes(normalized);
  const ok = known && safeEqual(password, ADMIN_PASSWORD) && safeEqual(pin, ADMIN_PIN);
  if (!ok) return { ok: false as const };
  const session = await useSession<AdminSession>(sessionConfig());
  await session.update({ email: normalized });
  return { ok: true as const, email: normalized };
}

export async function logout() {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
}

export async function currentAdmin() {
  const session = await useSession<AdminSession>(sessionConfig());
  return session.data.email ?? null;
}

async function requireAdmin() {
  const email = await currentAdmin();
  if (!email) throw new Error("Ruxsat yo'q");
  return email;
}

export async function dashboard() {
  await requireAdmin();
  const [users, patents, waitlist, channels, settings, posts, projects, investments, messages] = await Promise.all([
    supabaseAdmin.from("bot_users").select("*").order("created_at", { ascending: false }).limit(500),
    supabaseAdmin.from("patent_applications").select("*").order("created_at", { ascending: false }).limit(300),
    supabaseAdmin.from("waitlist").select("*").order("created_at", { ascending: false }).limit(300),
    supabaseAdmin.from("channels").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("app_settings").select("*"),
    supabaseAdmin.from("posts").select("*").order("created_at", { ascending: false }).limit(200),
    supabaseAdmin.from("projects").select("*").order("created_at", { ascending: false }).limit(300),
    supabaseAdmin.from("investments").select("*").order("created_at", { ascending: false }).limit(300),
    supabaseAdmin.from("messages").select("id", { count: "exact", head: true }),
  ]);

  const u = users.data ?? [];
  const p = patents.data ?? [];
  const inv = investments.data ?? [];
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const countRole = (role: string) => u.filter((x) => x.role === role).length;

  return {
    users: u,
    patents: p,
    waitlist: waitlist.data ?? [],
    channels: channels.data ?? [],
    settings: Object.fromEntries((settings.data ?? []).map((s) => [s.key, s.value])),
    posts: posts.data ?? [],
    projects: projects.data ?? [],
    investments: inv,
    stats: {
      users: u.length,
      verified: u.filter((x) => x.is_verified).length,
      phoneVerified: u.filter((x) => x.phone_verified).length,
      newUsers7d: u.filter((x) => new Date(x.created_at).getTime() > since).length,
      inventors: countRole("inventor"),
      mentors: countRole("mentor"),
      investors: countRole("investor"),
      parents: countRole("parent"),
      minors: u.filter((x) => x.birth_year && new Date().getFullYear() - x.birth_year < 16).length,
      projects: (projects.data ?? []).length,
      patents: p.length,
      patentsPendingParent: p.filter((x) => x.status === "pending_parent").length,
      patentsSent: p.filter((x) => x.status === "sent").length,
      patentsPatented: p.filter((x) => x.status === "patented").length,
      investments: inv.length,
      messages: messages.count ?? 0,
    },
  };
}

export async function deleteUser(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("bot_users").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function setUserRole(id: string, role: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from("bot_users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function setUserVerified(id: string, verified: boolean) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from("bot_users")
    .update({ is_verified: verified, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function deleteProject(id: string) {
  await requireAdmin();
  await supabaseAdmin.from("investments").delete().eq("project_id", id);
  await supabaseAdmin.from("mentor_links").delete().eq("project_id", id);
  const { error } = await supabaseAdmin.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function deletePatent(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("patent_applications").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function deleteWaitlist(id: string) {
  await requireAdmin();
  await supabaseAdmin.from("waitlist").delete().eq("id", id);
  return { ok: true as const };
}

export async function messageUser(id: string, text: string) {
  await requireAdmin();
  const { data: user } = await supabaseAdmin.from("bot_users").select("telegram_id").eq("id", id).maybeSingle();
  if (!user) throw new Error("Foydalanuvchi topilmadi");
  const { sendMessage } = await import("./bot.server");
  await sendMessage(Number(user.telegram_id), text);
  return { ok: true as const };
}

export async function addChannel(input: { chat_id: string; title: string; url: string }) {
  await requireAdmin();
  await supabaseAdmin.from("channels").insert(input);
  return { ok: true as const };
}

export async function removeChannel(id: string) {
  await requireAdmin();
  await supabaseAdmin.from("channels").delete().eq("id", id);
  return { ok: true as const };
}

export async function saveSetting(key: string, value: string) {
  await requireAdmin();
  await supabaseAdmin.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() });
  return { ok: true as const };
}

function letterFor(app: { title: string; description: string; digital_seal: string; created_at: string }, author: string, ministry: string) {
  return `${ministry}ga

RASMIY MUROJAAT (KelajakHub platformasi)

Muallif: ${author}
Ixtiro nomi: ${app.title}
Raqamli muhr: ${app.digital_seal}
Muhrlangan sana: ${new Date(app.created_at).toLocaleString("uz-UZ")}

Ixtiro tavsifi:
${app.description}

Yuqoridagi ishlanma KelajakHub platformasida raqamli muhrlangan va mualliflik daxlsizligi
qayd etilgan. Ixtironi rasmiy ekspertizadan o'tkazib, patent va davlat ro'yxatidan o'tkazish
uchun ko'rib chiqishingizni so'raymiz.

Hurmat bilan,
KelajakHub platformasi ma'muriyati`;
}

export async function sendToMinistry(applicationId: string) {
  const admin = await requireAdmin();
  const { data: app } = await supabaseAdmin
    .from("patent_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) throw new Error("Ariza topilmadi");

  const { data: settings } = await supabaseAdmin.from("app_settings").select("*");
  const map = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  const ministry = map["ministry_name"] ?? "Adliya vazirligi";

  let author = "Noma'lum muallif";
  if (app.user_id) {
    const { data: u } = await supabaseAdmin.from("bot_users").select("full_name, phone").eq("id", app.user_id).maybeSingle();
    if (u) author = `${u.full_name} (${u.phone})`;
  }

  const letter = letterFor(app, author, ministry);
  const ref = `KH/${new Date().getFullYear()}/${app.digital_seal}`;

  await supabaseAdmin
    .from("patent_applications")
    .update({ status: "sent", ministry_ref: ref, sent_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (app.telegram_id) {
    const { sendMessage } = await import("./bot.server");
    await sendMessage(
      Number(app.telegram_id),
      `📤 <b>Ixtironingiz vazirlikka yuborildi!</b>\n\n📜 ${app.title}\n🏛 ${ministry}\n🔖 Hujjat raqami: <code>${ref}</code>\n\nJavob kelganda sizga xabar beramiz.`,
    );
  }

  console.log(`[ministry] ${admin} sent application ${applicationId} as ${ref}`);
  return { ok: true as const, ref, letter };
}

export async function markPatented(applicationId: string) {
  await requireAdmin();
  await supabaseAdmin.from("patent_applications").update({ status: "patented" }).eq("id", applicationId);
  const { data: app } = await supabaseAdmin
    .from("patent_applications")
    .select("telegram_id, title")
    .eq("id", applicationId)
    .maybeSingle();
  if (app?.telegram_id) {
    const { sendMessage } = await import("./bot.server");
    await sendMessage(Number(app.telegram_id), `🏅 Tabriklaymiz! «${app.title}» ixtironiz patent oldi.`);
  }
  return { ok: true as const };
}

export async function broadcast(text: string) {
  await requireAdmin();
  const { data } = await supabaseAdmin.from("bot_users").select("telegram_id");
  const { sendMessage } = await import("./bot.server");
  let sent = 0;
  for (const u of data ?? []) {
    try {
      await sendMessage(Number(u.telegram_id), text);
      sent++;
    } catch {
      /* skip */
    }
  }
  return { ok: true as const, sent };
}

export async function letterPreview(applicationId: string) {
  await requireAdmin();
  const { data: app } = await supabaseAdmin.from("patent_applications").select("*").eq("id", applicationId).maybeSingle();
  if (!app) throw new Error("Ariza topilmadi");
  const { data: settings } = await supabaseAdmin.from("app_settings").select("*");
  const map = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  let author = "Noma'lum muallif";
  if (app.user_id) {
    const { data: u } = await supabaseAdmin.from("bot_users").select("full_name, phone").eq("id", app.user_id).maybeSingle();
    if (u) author = `${u.full_name} (${u.phone})`;
  }
  return { letter: letterFor(app, author, map["ministry_name"] ?? "Adliya vazirligi") };
}

export async function joinWaitlist(input: { full_name: string; role: string; contact: string }) {
  await supabaseAdmin.from("waitlist").insert(input);
  return { ok: true as const };
}
