/**
 * SMS yuborish qatlami (Eskiz.uz). Server-only.
 *
 * ESKIZ_EMAIL va ESKIZ_PASSWORD secretlari mavjud bo'lmasa, SMS yuborilmaydi
 * va chaqiruvchi kod (fallback sifatida) foydalanuvchiga Telegram orqali
 * kod yuborishi mumkin — shunda oqim to'xtab qolmaydi.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ESKIZ_BASE = "https://notify.eskiz.uz/api";
const TOKEN_KEY = "eskiz_token";

export function smsConfigured() {
  return Boolean(process.env["ESKIZ_EMAIL"] && process.env["ESKIZ_PASSWORD"]);
}

/** Eskiz +998XXXXXXXXX ni 998XXXXXXXXX shaklida kutadi. */
export function eskizPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

async function login(): Promise<string | null> {
  const email = process.env["ESKIZ_EMAIL"];
  const password = process.env["ESKIZ_PASSWORD"];
  if (!email || !password) return null;

  const form = new FormData();
  form.append("email", email);
  form.append("password", password);

  const res = await fetch(`${ESKIZ_BASE}/auth/login`, { method: "POST", body: form });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[eskiz] login failed [${res.status}]: ${text}`);
    return null;
  }
  let token: string | undefined;
  try {
    token = (JSON.parse(text) as { data?: { token?: string } }).data?.token;
  } catch {
    console.error(`[eskiz] login javobi JSON emas: ${text}`);
    return null;
  }
  if (!token) {
    console.error(`[eskiz] tokensiz javob: ${text}`);
    return null;
  }
  await supabaseAdmin
    .from("app_settings")
    .upsert({ key: TOKEN_KEY, value: token, updated_at: new Date().toISOString() }, { onConflict: "key" });
  return token;
}

async function cachedToken(): Promise<string | null> {
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", TOKEN_KEY).maybeSingle();
  return data?.value ?? null;
}

async function post(token: string, path: string, body: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(body)) form.append(k, v);
  return fetch(`${ESKIZ_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}

export type SmsResult = { ok: boolean; error?: string };

/** SMS yuboradi. Token eskirgan bo'lsa bir marta qayta login qiladi. */
export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  if (!smsConfigured()) return { ok: false, error: "sms_not_configured" };

  const payload = {
    mobile_phone: eskizPhone(phone),
    message,
    from: process.env["ESKIZ_SENDER"] ?? "4546",
  };

  let token = (await cachedToken()) ?? (await login());
  if (!token) return { ok: false, error: "eskiz_login_failed" };

  let res = await post(token, "/message/sms/send", payload);
  if (res.status === 401 || res.status === 403) {
    token = await login();
    if (!token) return { ok: false, error: "eskiz_login_failed" };
    res = await post(token, "/message/sms/send", payload);
  }

  const text = await res.text();
  if (!res.ok) {
    console.error(`[eskiz] sms send failed [${res.status}]: ${text}`);
    return { ok: false, error: `eskiz_${res.status}` };
  }
  return { ok: true };
}

export function otpMessage(code: string) {
  // Eskiz'da SMS matni moderatsiyadan o'tgan shablon bo'lishi kerak.
  return `KelajakHub: tasdiqlash kodingiz ${code}. Kod 5 daqiqa amal qiladi. Kodni hech kimga bermang.`;
}
