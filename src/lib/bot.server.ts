/**
 * KelajakHub Telegram bot logic (server-only).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { otpMessage, sendSms, smsConfigured } from "@/lib/sms.server";

const API = () => `https://api.telegram.org/bot${process.env["TELEGRAM_BOT_TOKEN"]}`;
const MINI_APP_ORIGIN = "https://kelajajakhub.lovable.app";

export type BotUser = {
  id: string;
  telegram_id: number;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  parent_phone: string | null;
  parent_id: string | null;
  parent_secret: string | null;
  is_verified: boolean;
  phone_verified: boolean;
  otp_code: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
  otp_sent_at: string | null;
  state: string;
  state_data: Record<string, unknown>;
};


export const ROLES: Record<string, string> = {
  inventor: "Yosh ixtirochi (16 yoshgacha)",
  parent: "Ota-ona",
  mentor: "Mentor",
  investor: "Investor",
};

export function webAppUrl(path = "/app") {
  return new URL(path, MINI_APP_ORIGIN).toString();
}

async function refreshMiniAppMenu(chatId: number) {
  await tg("setChatMenuButton", {
    chat_id: chatId,
    menu_button: {
      type: "web_app",
      text: "KelajakHub",
      web_app: { url: webAppUrl() },
    },
  });
}

async function tg(method: string, body: unknown) {
  const res = await fetch(`${API()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result?: unknown; description?: string };
  if (!json.ok) console.error(`[telegram] ${method} failed: ${json.description}`);
  return json;
}

export async function sendMessage(chatId: number, text: string, extra: Record<string, unknown> = {}) {
  return tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });
}

/* ---------------------------------- keyboards --------------------------------- */

const MENUS: Record<string, string[][]> = {
  inventor: [
    ["🤖 AI mentor bilan bog'lanish", "🧪 Laboratoriya"],
    ["🧩 Jamoadosh topish", "🎓 Mentorlar tarmog'i"],
    ["📜 Ixtironi patentlash markaziga yuborish"],
    ["💼 Investorlarga topshirish", "🗂 Kelajak portfeli"],
    ["👨‍👩‍👦 Ota-ona bilan bog'lanish", "🚀 Mini App"],
  ],
  parent: [
    ["👦 Farzandlarim", "➕ Bola qo'shish"],
    ["🔑 Maxfiy raqamni ko'rish", "🛡 Nazorat paneli"],
    ["🚀 Mini App"],
  ],
  mentor: [
    ["📂 Loyihalarni ko'rish", "🧩 Jamoa so'rovlari"],
    ["🎓 Mentor profilim", "🚀 Mini App"],
  ],
  investor: [
    ["📜 Patentlangan ixtirolar", "📂 Startaplar"],
    ["💼 Investor profilim", "🚀 Mini App"],
  ],
};

function menuFor(role: string | null) {
  const keyboard = MENUS[role ?? ""] ?? [["/start"]];
  return { reply_markup: { keyboard, resize_keyboard: true } };
}

const roleKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🧑‍🔬 Yosh ixtirochi (16 yoshgacha)", callback_data: "role:inventor" }],
      [{ text: "👨‍👩‍👦 Ota-ona", callback_data: "role:parent" }],
      [{ text: "🎓 Mentor", callback_data: "role:mentor" }],
      [{ text: "💼 Investor", callback_data: "role:investor" }],
    ],
  },
};

const phoneKeyboard = {
  reply_markup: {
    keyboard: [[{ text: "📱 Telefon raqamimni yuborish", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

/* ------------------------------------ db ------------------------------------- */

async function getUser(telegramId: number) {
  const { data } = await supabaseAdmin
    .from("bot_users")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  return data as BotUser | null;
}

async function upsertUser(telegramId: number, patch: Record<string, unknown>) {
  const existing = await getUser(telegramId);
  if (existing) {
    const { data } = await supabaseAdmin
      .from("bot_users")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("telegram_id", telegramId)
      .select("*")
      .single();
    return data as BotUser;
  }
  const { data } = await supabaseAdmin
    .from("bot_users")
    .insert({ telegram_id: telegramId, ...patch })
    .select("*")
    .single();
  return data as BotUser;
}

/* ------------------------------ forced subscription -------------------------- */

async function missingChannels(telegramId: number) {
  const { data } = await supabaseAdmin.from("channels").select("*").eq("is_active", true);
  const channels = data ?? [];
  const missing: { title: string; url: string }[] = [];
  for (const ch of channels) {
    const res = await tg("getChatMember", { chat_id: ch.chat_id, user_id: telegramId });
    const status = (res.result as { status?: string } | undefined)?.status;
    if (!status || ["left", "kicked"].includes(status)) missing.push({ title: ch.title, url: ch.url });
  }
  return missing;
}

async function askSubscription(chatId: number, missing: { title: string; url: string }[]) {
  await sendMessage(
    chatId,
    "📢 <b>Botdan foydalanish uchun quyidagi kanallarga a'zo bo'ling:</b>\n\nA'zo bo'lgach «✅ Tekshirish» tugmasini bosing.",
    {
      reply_markup: {
        inline_keyboard: [
          ...missing.map((m) => [{ text: `📣 ${m.title}`, url: m.url }]),
          [{ text: "✅ Tekshirish", callback_data: "check_sub" }],
        ],
      },
    },
  );
}

/* --------------------------------- onboarding -------------------------------- */

function randomSecret() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function seal(payload: string) {
  let hash = 0;
  for (let i = 0; i < payload.length; i++) hash = (hash * 31 + payload.charCodeAt(i)) | 0;
  return `KH-${Date.now().toString(36).toUpperCase()}-${Math.abs(hash).toString(36).toUpperCase()}`;
}

async function startOnboarding(chatId: number, user: BotUser | null) {
  if (!user?.role) {
    await upsertUser(chatId, { state: "awaiting_role" });
    await sendMessage(
      chatId,
      "👋 <b>KelajakHub</b> platformasiga xush kelibsiz!\n\nG'oyangizni rasmiy patent darajasiga olib chiqamiz.\n\n<b>Kim sifatida qo'shilyapsiz?</b>",
      roleKeyboard,
    );
    return;
  }
  if (!user.full_name) {
    await upsertUser(chatId, { state: "awaiting_name" });
    await sendMessage(chatId, "✍️ Ism va familiyangizni yozing.\nMasalan: <i>Anvarov Axror</i>", {
      reply_markup: { remove_keyboard: true },
    });
    return;
  }
  if (!user.phone) {
    await upsertUser(chatId, { state: "awaiting_phone" });
    await sendMessage(
      chatId,
      "📱 Mobil telefon raqamingizni yuboring.\n\nRaqam SMS orqali tasdiqlanadi, shuning uchun haqiqiy raqamni kiriting.",
      phoneKeyboard,
    );
    return;
  }
  if (!isPhoneVerified(user)) {
    await promptOtp(chatId, user);
    return;
  }

  if (user.role === "inventor" && !user.parent_id) {
    if (!user.parent_phone) {
      await upsertUser(chatId, { state: "awaiting_parent_phone" });
      await sendMessage(
        chatId,
        "👨‍👩‍👦 <b>16 yoshgacha ixtirochilar uchun ota-ona nazorati majburiy.</b>\n\nOta-onangiz avval shu botdan «Ota-ona» bo'limi bilan ro'yxatdan o'tishi kerak.\n\nEndi ota-onangizning telefon raqamini yozing (masalan +998901234567).",
        { reply_markup: { remove_keyboard: true } },
      );
      return;
    }
    await upsertUser(chatId, { state: "awaiting_parent_secret" });
    await sendMessage(chatId, "🔑 Ota-onangiz bergan 6 xonali maxfiy raqamni kiriting.");
    return;
  }
  await showMenu(chatId, user);
}

async function showMenu(chatId: number, user: BotUser) {
  await upsertUser(chatId, { state: "ready", is_verified: true });
  const extra = user.role === "parent" && user.parent_secret ? `\n\n🔑 Farzandingiz uchun maxfiy raqam: <code>${user.parent_secret}</code>` : "";
  await sendMessage(
    chatId,
    `✅ Tayyor, <b>${user.full_name}</b>!\nRolingiz: <b>${ROLES[user.role ?? ""] ?? "-"}</b>${extra}\n\nPastdagi menyudan foydalaning 👇`,
    menuFor(user.role),
  );
  await sendMessage(chatId, "🚀 Mini App'ni ochish:", {
    reply_markup: { inline_keyboard: [[{ text: "KelajakHub Mini App", web_app: { url: webAppUrl() } }]] },
  });
}

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // 9 xonali lokal raqam (901234567) -> +998901234567
  if (digits.length === 9) return `+998${digits}`;
  return `+${digits}`;
}

function validUzPhone(phone: string) {
  return /^\+998\d{9}$/.test(phone) || /^\+\d{10,15}$/.test(phone);
}

/* ------------------------------- SMS tasdiqlash ------------------------------ */

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_MS = 60 * 1000;

/** Eski (SMS joriy etilishidan oldin ro'yxatdan o'tgan) foydalanuvchilar qayta tasdiqlanmaydi. */
function isPhoneVerified(user: BotUser) {
  return Boolean(user.phone_verified || (user.is_verified && user.state === "ready"));
}

function otpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const otpKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🔁 Kodni qayta yuborish", callback_data: "otp:resend" }],
      [{ text: "✏️ Raqamni o'zgartirish", callback_data: "otp:change" }],
    ],
  },
};

/** Kod yaratadi, SMS yuboradi va holatni `awaiting_otp` ga o'tkazadi. */
async function sendOtp(chatId: number, user: BotUser) {
  const phone = user.phone ?? "";
  if (!phone) return startOnboarding(chatId, user);

  const last = user.otp_sent_at ? Date.parse(user.otp_sent_at) : 0;
  if (last && Date.now() - last < OTP_RESEND_MS) {
    const wait = Math.ceil((OTP_RESEND_MS - (Date.now() - last)) / 1000);
    await sendMessage(chatId, `⏳ Yangi kod so'rash uchun ${wait} soniya kutib turing.`, otpKeyboard);
    return;
  }

  const code = otpCode();
  await upsertUser(chatId, {
    otp_code: code,
    otp_expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    otp_attempts: 0,
    otp_sent_at: new Date().toISOString(),
    state: "awaiting_otp",
  });

  const result = await sendSms(phone, otpMessage(code));
  if (result.ok) {
    await sendMessage(
      chatId,
      `📩 <b>${phone}</b> raqamiga 6 xonali tasdiqlash kodi yuborildi.\n\nKodni shu yerga yozing (masalan <code>123456</code>).\nKod 5 daqiqa amal qiladi.`,
      otpKeyboard,
    );
    return;
  }

  // SMS provayder sozlanmagan yoki xato bergan — oqim to'xtab qolmasligi uchun
  // kodni Telegram orqali yuboramiz.
  console.error(`[otp] SMS yuborilmadi (${result.error}) — Telegram fallback`);
  await sendMessage(
    chatId,
    `📩 Tasdiqlash kodi: <code>${code}</code>\n\n${
      smsConfigured()
        ? "SMS yuborishda vaqtinchalik uzilish bo'ldi, shuning uchun kod shu yerga yuborildi."
        : "SMS xizmati hali ulanmagani uchun kod shu yerga yuborildi."
    }\n\nKodni tasdiqlash uchun shu yerga yozing.`,
    otpKeyboard,
  );
}

async function promptOtp(chatId: number, user: BotUser) {
  const expired = !user.otp_code || !user.otp_expires_at || Date.parse(user.otp_expires_at) < Date.now();
  if (expired) {
    await sendOtp(chatId, user);
    return;
  }
  await upsertUser(chatId, { state: "awaiting_otp" });
  await sendMessage(
    chatId,
    `🔐 <b>${user.phone}</b> raqamiga yuborilgan 6 xonali kodni kiriting.`,
    otpKeyboard,
  );
}



/* --------------------------------- menu actions ------------------------------ */

async function aiMentor(chatId: number, question: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return sendMessage(chatId, "AI mentor hozircha ishlamayapti.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Sen KelajakHub platformasining AI mentorisan. O'zbek tilida, yosh ixtirochilarga tushunarli, qisqa va amaliy javob ber. Ixtiro, patent, MVP va jamoa haqida maslahat ber.",
        },
        { role: "user", content: question },
      ],
    }),
  });
  if (!res.ok) {
    console.error(`[ai] ${res.status}: ${await res.text()}`);
    return sendMessage(chatId, "AI mentor javob bermadi, keyinroq urinib ko'ring.");
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const answer = stripMarkdown(json.choices?.[0]?.message?.content ?? "Javob topilmadi.");
  return sendMessage(chatId, answer);
}

/** AI javoblaridan markdown belgilarini (**, *, `, #) olib tashlaydi. */
export function stripMarkdown(text: string) {
  return text
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|[\s(])\*(?!\s)([^*\n]+?)\*(?=[\s.,!?)]|$)/g, "$1$2")
    .replace(/^\s*[*+]\s+/gm, "• ")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/__(.+?)__/g, "$1")
    .trim();
}




async function listPosts(chatId: number, kind: string, emptyText: string, title: string) {
  const { data } = await supabaseAdmin
    .from("posts")
    .select("title, body, created_at")
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(10);
  if (!data?.length) return sendMessage(chatId, emptyText);
  const body = data.map((p, i) => `${i + 1}. <b>${p.title}</b>\n${p.body}`).join("\n\n");
  return sendMessage(chatId, `<b>${title}</b>\n\n${body}`);
}

async function handleMenu(chatId: number, user: BotUser, text: string): Promise<boolean> {
  switch (text) {
    case "🤖 AI mentor bilan bog'lanish":
      await upsertUser(chatId, { state: "ai_chat" });
      await sendMessage(chatId, "🤖 Savolingizni yozing. Chiqish uchun /start yuboring.");
      return true;

    case "🧪 Laboratoriya":
      await sendMessage(chatId, "🧪 <b>Laboratoriya</b> — ixtironingizni sinash va kod yozish muhiti.", {
        reply_markup: { inline_keyboard: [[{ text: "Laboratoriyani ochish", web_app: { url: webAppUrl("/app?tab=lab") } }]] },
      });
      return true;

    case "📜 Ixtironi patentlash markaziga yuborish":
      await upsertUser(chatId, { state: "patent_title" });
      await sendMessage(chatId, "📜 Ixtironingiz <b>nomini</b> yozing.", { reply_markup: { remove_keyboard: true } });
      return true;

    case "🧩 Jamoadosh topish":
      await upsertUser(chatId, { state: "team_post" });
      await sendMessage(chatId, "🧩 Qanday jamoadosh kerak? Qisqa yozing (masalan: «Mobil dasturchi kerak, loyiha: smart tejamkor hisoblagich»).");
      return true;

    case "🎓 Mentorlar tarmog'i":
      await listPosts(chatId, "mentor", "Hozircha mentorlar profili yo'q.", "🎓 Mentorlar tarmog'i");
      return true;

    case "💼 Investorlarga topshirish":
      await upsertUser(chatId, { state: "investor_pitch" });
      await sendMessage(chatId, "💼 Loyihangizni investorlar uchun qisqa tanishtiring (pitch).");
      return true;

    case "🗂 Kelajak portfeli": {
      const { data } = await supabaseAdmin
        .from("patent_applications")
        .select("title, status, digital_seal, created_at")
        .eq("telegram_id", chatId)
        .order("created_at", { ascending: false });
      const rows = (data ?? []).map((p) => `• <b>${p.title}</b> — ${p.status}\n  muhr: <code>${p.digital_seal}</code>`).join("\n");
      await sendMessage(chatId, `🗂 <b>Kelajak portfeli</b>\n\n${rows || "Hozircha yozuv yo'q."}`);
      return true;
    }

    case "👨‍👩‍👦 Ota-ona bilan bog'lanish": {
      if (!user.parent_id) {
        await sendMessage(chatId, "Ota-onangiz hali tizimga bog'lanmagan.");
        return true;
      }
      const { data: parent } = await supabaseAdmin
        .from("bot_users")
        .select("telegram_id, full_name")
        .eq("id", user.parent_id)
        .maybeSingle();
      if (parent) {
        await sendMessage(Number(parent.telegram_id), `👦 Farzandingiz <b>${user.full_name}</b> siz bilan bog'lanmoqchi.`);
        await sendMessage(chatId, `✅ <b>${parent.full_name}</b>ga xabar yuborildi.`);
      }
      return true;
    }

    case "👦 Farzandlarim": {
      const { data } = await supabaseAdmin
        .from("bot_users")
        .select("full_name, phone, is_verified")
        .eq("parent_id", user.id);
      const rows = (data ?? []).map((c) => `• ${c.full_name} (${c.phone}) ${c.is_verified ? "✅" : "⏳"}`).join("\n");
      await sendMessage(chatId, `👦 <b>Farzandlaringiz</b>\n\n${rows || "Hozircha bola bog'lanmagan."}`);
      return true;
    }

    case "➕ Bola qo'shish": {
      const secret = randomSecret();
      await upsertUser(chatId, { parent_secret: secret });
      await sendMessage(
        chatId,
        `➕ Yangi farzand uchun maxfiy raqam: <code>${secret}</code>\n\nFarzandingiz botda «Yosh ixtirochi» bo'limini tanlab, sizning telefon raqamingiz va shu raqamni kiritsin.`,
      );
      return true;
    }

    case "🔑 Maxfiy raqamni ko'rish":
      await sendMessage(chatId, `🔑 Maxfiy raqam: <code>${user.parent_secret ?? "-"}</code>`);
      return true;

    case "🛡 Nazorat paneli":
      await sendMessage(chatId, "🛡 Ota-ona nazorati panelini Mini App'da ko'ring.", {
        reply_markup: { inline_keyboard: [[{ text: "Nazorat panelini ochish", web_app: { url: webAppUrl("/app?tab=parent") } }]] },
      });
      return true;

    case "📂 Loyihalarni ko'rish":
    case "📂 Startaplar":
      await listPosts(chatId, "team", "Hozircha loyihalar yo'q.", "📂 Loyihalar");
      return true;

    case "🧩 Jamoa so'rovlari":
      await listPosts(chatId, "team", "Hozircha jamoa so'rovlari yo'q.", "🧩 Jamoa so'rovlari");
      return true;

    case "📜 Patentlangan ixtirolar": {
      const { data } = await supabaseAdmin
        .from("patent_applications")
        .select("title, description, status")
        .in("status", ["sent", "patented"])
        .limit(10);
      const rows = (data ?? []).map((p) => `• <b>${p.title}</b> — ${p.status}\n${p.description.slice(0, 160)}`).join("\n\n");
      await sendMessage(chatId, `📜 <b>Vazirlikka yuborilgan ixtirolar</b>\n\n${rows || "Hozircha yo'q."}`);
      return true;
    }

    case "🎓 Mentor profilim":
      await upsertUser(chatId, { state: "mentor_profile" });
      await sendMessage(chatId, "🎓 O'zingiz haqida yozing: yo'nalish, tajriba, qanday yordam bera olasiz.");
      return true;

    case "💼 Investor profilim":
      await upsertUser(chatId, { state: "investor_profile" });
      await sendMessage(chatId, "💼 O'zingiz haqida yozing: qiziqish yo'nalishi, investitsiya hajmi.");
      return true;

    case "🚀 Mini App":
      await sendMessage(chatId, "🚀 KelajakHub Mini App:", {
        reply_markup: { inline_keyboard: [[{ text: "Ochish", web_app: { url: webAppUrl() } }]] },
      });
      return true;

    default:
      return false;
  }
}

/* ------------------------------- state handling ------------------------------ */

async function handleState(chatId: number, user: BotUser, text: string): Promise<boolean> {
  switch (user.state) {
    case "awaiting_name": {
      const updated = await upsertUser(chatId, { full_name: text.trim() });
      await startOnboarding(chatId, updated);
      return true;
    }
    case "awaiting_phone": {
      const phone = normalizePhone(text);
      if (!validUzPhone(phone)) {
        await sendMessage(
          chatId,
          "❗️ Raqam noto'g'ri. Tugma orqali yuboring yoki <code>+998901234567</code> shaklida yozing.",
          phoneKeyboard,
        );
        return true;
      }
      const updated = await upsertUser(chatId, { phone, phone_verified: false });
      await sendOtp(chatId, updated);
      return true;
    }
    case "awaiting_otp": {
      const code = text.replace(/\D/g, "");
      if (code.length !== 6) {
        await sendMessage(chatId, "❗️ 6 xonali kodni raqamlar bilan yozing.", otpKeyboard);
        return true;
      }
      if (!user.otp_code || !user.otp_expires_at || Date.parse(user.otp_expires_at) < Date.now()) {
        await sendMessage(chatId, "⌛️ Kod muddati tugagan. Yangi kod yuboramiz.");
        await sendOtp(chatId, { ...user, otp_sent_at: null });
        return true;
      }
      if (code !== user.otp_code) {
        const attempts = (user.otp_attempts ?? 0) + 1;
        if (attempts >= OTP_MAX_ATTEMPTS) {
          const reset = await upsertUser(chatId, {
            otp_code: null,
            otp_expires_at: null,
            otp_attempts: 0,
            otp_sent_at: null,
            phone: null,
            state: "awaiting_phone",
          });
          await sendMessage(
            chatId,
            "🚫 Kod 5 marta xato kiritildi. Telefon raqamingizni qaytadan yuboring.",
            phoneKeyboard,
          );
          void reset;
          return true;
        }
        await upsertUser(chatId, { otp_attempts: attempts });
        await sendMessage(
          chatId,
          `❌ Kod mos kelmadi. Qolgan urinish: <b>${OTP_MAX_ATTEMPTS - attempts}</b>`,
          otpKeyboard,
        );
        return true;
      }
      const verified = await upsertUser(chatId, {
        phone_verified: true,
        otp_code: null,
        otp_expires_at: null,
        otp_attempts: 0,
        state: "verified_phone",
      });
      await sendMessage(chatId, "✅ Telefon raqamingiz tasdiqlandi!");
      await startOnboarding(chatId, verified);
      return true;
    }

    case "awaiting_parent_phone": {
      const phone = normalizePhone(text);
      const { data: parent } = await supabaseAdmin
        .from("bot_users")
        .select("id, full_name, parent_secret")
        .eq("role", "parent")
        .eq("phone", phone)
        .maybeSingle();
      if (!parent) {
        await sendMessage(
          chatId,
          "❗️ Bu raqam bilan ota-ona ro'yxatdan o'tmagan.\nOta-onangiz botga kirib «Ota-ona» bo'limini tanlab ro'yxatdan o'tsin, so'ng raqamni qayta kiriting.",
        );
        return true;
      }
      const updated = await upsertUser(chatId, { parent_phone: phone, state: "awaiting_parent_secret" });
      await sendMessage(chatId, `✅ Ota-ona topildi: <b>${parent.full_name}</b>\n🔑 Endi u bergan 6 xonali maxfiy raqamni kiriting.`);
      void updated;
      return true;
    }
    case "awaiting_parent_secret": {
      const { data: parent } = await supabaseAdmin
        .from("bot_users")
        .select("id, telegram_id, full_name, parent_secret")
        .eq("role", "parent")
        .eq("phone", user.parent_phone ?? "")
        .maybeSingle();
      if (!parent || parent.parent_secret !== text.trim()) {
        await sendMessage(chatId, "❌ Maxfiy raqam mos kelmadi. Qayta kiriting.");
        return true;
      }
      const updated = await upsertUser(chatId, { parent_id: parent.id, is_verified: true });
      await sendMessage(Number(parent.telegram_id), `✅ Farzandingiz <b>${updated.full_name}</b> tizimda tasdiqlandi.`);
      await showMenu(chatId, updated);
      return true;
    }
    case "ai_chat":
      await aiMentor(chatId, text);
      return true;
    case "patent_title": {
      await upsertUser(chatId, { state: "patent_desc", state_data: { title: text.trim() } });
      await sendMessage(chatId, "📝 Endi ixtironingiz tavsifini batafsil yozing (qanday muammoni yechadi, qanday ishlaydi).");
      return true;
    }
    case "patent_desc": {
      const title = String((user.state_data as { title?: string }).title ?? "Nomsiz ixtiro");
      const digital_seal = seal(`${chatId}:${title}:${text}`);
      const needsParent = Boolean(user.parent_id);
      const { data: created } = await supabaseAdmin
        .from("patent_applications")
        .insert({
          user_id: user.id,
          telegram_id: chatId,
          title,
          description: text,
          digital_seal,
          status: needsParent ? "pending_parent" : "new",
        })
        .select("id")
        .single();
      const fresh = await upsertUser(chatId, { state: "ready", state_data: {} });
      await sendMessage(
        chatId,
        needsParent
          ? `✅ <b>Arizangiz raqamli muhrlandi.</b>\n\n📜 Ixtiro: <b>${title}</b>\n🔒 Raqamli muhr: <code>${digital_seal}</code>\n\n🛡 Siz 16 yoshga to'lmaganingiz uchun ariza <b>ota-ona tasdig'i</b>ni kutmoqda. Ota-onangizga bildirishnoma yuborildi — u OneID orqali tasdiqlagach, hujjatlar rasmiy organlarga yuboriladi.`
          : `✅ <b>Arizangiz qabul qilindi va raqamli muhrlandi.</b>\n\n📜 Ixtiro: <b>${title}</b>\n🔒 Raqamli muhr: <code>${digital_seal}</code>\n\nEkspertizadan so'ng hujjatlar Adliya vazirligi va Intellektual mulk agentligiga rasmiy xat bilan yuboriladi.`,
        menuFor(fresh.role),
      );
      if (needsParent && created?.id && user.parent_id) {
        const { consentUrl } = await import("@/lib/oneid.server");
        const { data: parent } = await supabaseAdmin
          .from("bot_users")
          .select("telegram_id")
          .eq("id", user.parent_id)
          .maybeSingle();
        if (parent?.telegram_id) {
          await sendMessage(
            Number(parent.telegram_id),
            `🛡 <b>Ota-ona tasdig'i kerak</b>\n\nFarzandingiz ${user.full_name ?? ""} «<b>${title}</b>» ixtirosi uchun patent arizasini tayyorladi.\n\nQonuniy vakil sifatida OneID orqali tasdiqlang — shundan keyin ariza rasmiy organlarga yuboriladi.`,
            {
              reply_markup: {
                inline_keyboard: [[{ text: "🏛 OneID orqali tasdiqlash", url: consentUrl(created.id, user.parent_id) }]],
              },
            },
          );
        }
      }
      return true;
    }
    case "team_post":
    case "investor_pitch":
    case "mentor_profile":
    case "investor_profile": {
      const kind =
        user.state === "team_post" ? "team" : user.state === "investor_pitch" ? "investor_pitch" : user.state === "mentor_profile" ? "mentor" : "investor";
      await supabaseAdmin.from("posts").insert({
        user_id: user.id,
        kind,
        title: user.full_name ?? "Foydalanuvchi",
        body: text,
      });
      const fresh = await upsertUser(chatId, { state: "ready" });
      await sendMessage(chatId, "✅ Saqlandi va tizimga joylandi.", menuFor(fresh.role));
      return true;
    }
    default:
      return false;
  }
}

/* --------------------------------- entrypoint -------------------------------- */

export async function handleUpdate(update: Record<string, any>) {
  const callback = update['callback_query'];
  const message = update['message'] ?? update['edited_message'];

  if (callback) {
    const chatId = Number(callback.from.id);
    await tg("answerCallbackQuery", { callback_query_id: callback.id });
    const data = String(callback.data ?? "");
    if (data.startsWith("role:")) {
      const role = data.slice(5);
      const updated = await upsertUser(chatId, {
        role,
        username: callback.from.username ?? null,
        first_name: callback.from.first_name ?? null,
        parent_secret: role === "parent" ? randomSecret() : null,
      });
      await sendMessage(chatId, `✅ Tanlandi: <b>${ROLES[role]}</b>`);
      await startOnboarding(chatId, updated);
      return;
    }
    if (data === "check_sub") {
      const missing = await missingChannels(chatId);
      if (missing.length) return void askSubscription(chatId, missing);
      await sendMessage(chatId, "✅ Obuna tasdiqlandi!");
      await startOnboarding(chatId, await getUser(chatId));
      return;
    }
    if (data === "otp:resend") {
      const current = await getUser(chatId);
      if (current) await sendOtp(chatId, current);
      return;
    }
    if (data === "otp:change") {
      await upsertUser(chatId, {
        phone: null,
        phone_verified: false,
        otp_code: null,
        otp_expires_at: null,
        otp_attempts: 0,
        otp_sent_at: null,
        state: "awaiting_phone",
      });
      await sendMessage(chatId, "📱 Yangi telefon raqamingizni yuboring.", phoneKeyboard);
      return;
    }
    return;

  }

  if (!message?.chat?.id) return;
  const chatId = Number(message.chat.id);
  const text: string = message.text ?? "";

  let user = await getUser(chatId);
  if (!user) {
    user = await upsertUser(chatId, {
      username: message.from?.username ?? null,
      first_name: message.from?.first_name ?? null,
    });
  }

  if (text === "/help") {
    await sendMessage(
      chatId,
      "ℹ️ <b>KelajakHub bot yordami</b>\n\n/start — botni ishga tushirish va ro'yxatdan o'tish\n/help — yordam\n\nBot orqali:\n• ixtironi raqamli muhrlash va patentlash markaziga yuborish\n• AI mentor va mentorlar tarmog'i\n• jamoadosh topish\n• investorlarga pitch\n• ota-ona nazorati\n• laboratoriya va Kelajak portfeli\n\nSavollar: @kelajakhub",
    );
    return;
  }

  // Forced subscription gate
  const missing = await missingChannels(chatId);
  if (missing.length) {
    await askSubscription(chatId, missing);
    return;
  }

  if (text === "/start") {
    await refreshMiniAppMenu(chatId);
    await upsertUser(chatId, { state: user.role ? user.state : "awaiting_role" });
    await startOnboarding(chatId, await getUser(chatId));
    return;
  }

  if (message.contact?.phone_number) {
    const phone = normalizePhone(String(message.contact.phone_number));
    const updated = await upsertUser(chatId, { phone, phone_verified: false, otp_sent_at: null });
    await sendOtp(chatId, updated);
    return;
  }

  // Telefon tasdiqlanmaguncha menyu ochilmaydi.
  if (user.role && user.full_name && user.phone && !isPhoneVerified(user)) {
    if (await handleState(chatId, user, text)) return;
    await promptOtp(chatId, user);
    return;
  }

  if (user.state === "ready" || user.is_verified) {
    if (await handleMenu(chatId, user, text)) return;
  }
  if (await handleState(chatId, user, text)) return;


  if (!user.role || user.state === "awaiting_role") {
    await startOnboarding(chatId, user);
    return;
  }
  await sendMessage(chatId, "Menyudan tanlang 👇", menuFor(user.role));
}
