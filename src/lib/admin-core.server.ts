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
  const [users, patents, waitlist, channels, settings, posts] = await Promise.all([
    supabaseAdmin.from("bot_users").select("*").order("created_at", { ascending: false }).limit(300),
    supabaseAdmin.from("patent_applications").select("*").order("created_at", { ascending: false }).limit(300),
    supabaseAdmin.from("waitlist").select("*").order("created_at", { ascending: false }).limit(300),
    supabaseAdmin.from("channels").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("app_settings").select("*"),
    supabaseAdmin.from("posts").select("*").order("created_at", { ascending: false }).limit(200),
  ]);
  return {
    users: users.data ?? [],
    patents: patents.data ?? [],
    waitlist: waitlist.data ?? [],
    channels: channels.data ?? [],
    settings: Object.fromEntries((settings.data ?? []).map((s) => [s.key, s.value])),
    posts: posts.data ?? [],
  };
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
