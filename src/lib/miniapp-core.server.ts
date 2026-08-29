import { createHmac } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Verify Telegram WebApp initData and return the telegram user id. */
export function verifyInitData(initData: string): number {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("Bot sozlanmagan");
  const params = new URLSearchParams(initData);
  const hash = params.get("hash") ?? "";
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(token).digest();
  const computed = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  if (computed !== hash) throw new Error("initData tasdiqlanmadi");
  const user = JSON.parse(params.get("user") ?? "{}") as { id?: number };
  if (!user.id) throw new Error("Foydalanuvchi topilmadi");
  return Number(user.id);
}

export async function profile(initData: string) {
  const telegramId = verifyInitData(initData);
  const { data: user } = await supabaseAdmin.from("bot_users").select("*").eq("telegram_id", telegramId).maybeSingle();
  if (!user) throw new Error("Avval botda ro'yxatdan o'ting");
  const [patents, posts, children] = await Promise.all([
    supabaseAdmin
      .from("patent_applications")
      .select("id, title, status, digital_seal, created_at")
      .eq("telegram_id", telegramId)
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("posts").select("id, kind, title, body, created_at").eq("kind", "team").order("created_at", { ascending: false }).limit(20),
    supabaseAdmin.from("bot_users").select("id, full_name, phone, is_verified, created_at").eq("parent_id", user.id),
  ]);
  return {
    user: {
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      is_verified: user.is_verified,
      parent_secret: user.role === "parent" ? user.parent_secret : null,
    },
    patents: patents.data ?? [],
    teamPosts: posts.data ?? [],
    children: children.data ?? [],
  };
}

export async function runLab(initData: string, code: string) {
  verifyInitData(initData);
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI sozlanmagan");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Sen KelajakHub laboratoriyasining kod tekshiruvchisisan. Berilgan kodni yoki ixtiro g'oyasini tahlil qil: xatolar, yaxshilash yo'llari va natija. O'zbek tilida qisqa javob ber.",
        },
        { role: "user", content: code },
      ],
    }),
  });
  if (!res.ok) throw new Error("Laboratoriya javob bermadi");
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return { output: json.choices?.[0]?.message?.content ?? "" };
}
