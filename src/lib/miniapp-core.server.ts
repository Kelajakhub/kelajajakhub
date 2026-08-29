import { createHmac } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMessage } from "@/lib/bot.server";

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

type Me = {
  id: string;
  telegram_id: number;
  full_name: string | null;
  role: string | null;
  phone: string | null;
  is_verified: boolean;
  parent_id: string | null;
  parent_secret: string | null;
};

async function auth(initData: string): Promise<Me> {
  const telegramId = verifyInitData(initData);
  const { data } = await supabaseAdmin
    .from("bot_users")
    .select("id, telegram_id, full_name, role, phone, is_verified, parent_id, parent_secret")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  if (!data) throw new Error("Avval botda ro'yxatdan o'ting");
  return data as Me;
}

/** Chat history is kept for 30 days only; patent history is never touched. */
async function purgeOldMessages() {
  try {
    await supabaseAdmin.rpc("purge_old_messages");
  } catch {
    /* ignore */
  }
}

async function notify(userId: string, text: string) {
  const { data } = await supabaseAdmin.from("bot_users").select("telegram_id").eq("id", userId).maybeSingle();
  if (data?.telegram_id) {
    try {
      await sendMessage(Number(data.telegram_id), text);
    } catch {
      /* ignore */
    }
  }
}

export async function profile(initData: string) {
  const me = await auth(initData);
  await purgeOldMessages();

  const [patents, myProjects, mentors, convos, teamAds, children, mentorLinks] = await Promise.all([
    supabaseAdmin
      .from("patent_applications")
      .select("id, title, status, digital_seal, created_at")
      .eq("telegram_id", me.telegram_id)
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("projects").select("*").eq("user_id", me.id).order("created_at", { ascending: false }),
    supabaseAdmin
      .from("bot_users")
      .select("id, full_name, expertise, bio, username")
      .eq("role", "mentor")
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("conversations")
      .select("id, kind, user_id, mentor_id, updated_at")
      .or(`user_id.eq.${me.id},mentor_id.eq.${me.id}`)
      .order("updated_at", { ascending: false }),
    supabaseAdmin
      .from("projects")
      .select("id, title, description, logo_url, team_note, telegram_group_url, user_id, created_at")
      .eq("looking_for_team", true)
      .order("created_at", { ascending: false })
      .limit(30),
    supabaseAdmin.from("bot_users").select("id, full_name, phone, is_verified, telegram_id").eq("parent_id", me.id),
    supabaseAdmin.from("mentor_links").select("id, project_id, user_id, status, created_at").eq("mentor_id", me.id),
  ]);

  const childIds = (children.data ?? []).map((c) => c.id);
  const [childProjects, childPatents, investorFeed, myInvestments, receivedInvestments, mentorProjects] =
    await Promise.all([
      childIds.length
        ? supabaseAdmin.from("projects").select("*").in("user_id", childIds).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as never[] }),
      childIds.length
        ? supabaseAdmin
            .from("patent_applications")
            .select("id, title, status, digital_seal, created_at, user_id")
            .in("user_id", childIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as never[] }),
      me.role === "investor"
        ? supabaseAdmin
            .from("projects")
            .select("id, title, description, logo_url, funding_goal, user_id, created_at")
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] as never[] }),
      me.role === "investor"
        ? supabaseAdmin
            .from("investments")
            .select("id, project_id, amount, message, status, created_at")
            .eq("investor_id", me.id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as never[] }),
      supabaseAdmin
        .from("investments")
        .select("id, project_id, investor_id, amount, message, status, created_at")
        .order("created_at", { ascending: false })
        .limit(80),
      (mentorLinks.data ?? []).length
        ? supabaseAdmin
            .from("projects")
            .select("id, title, description, logo_url, telegram_group_url, user_id")
            .in(
              "id",
              (mentorLinks.data ?? []).map((l) => l.project_id),
            )
        : Promise.resolve({ data: [] as never[] }),
    ]);

  // names for counterparts
  const ids = new Set<string>();
  (convos.data ?? []).forEach((c) => {
    if (c.user_id) ids.add(c.user_id);
    if (c.mentor_id) ids.add(c.mentor_id);
  });
  (teamAds.data ?? []).forEach((p) => p.user_id && ids.add(p.user_id));
  (investorFeed.data ?? []).forEach((p: { user_id: string | null }) => p.user_id && ids.add(p.user_id));
  (receivedInvestments.data ?? []).forEach((i) => i.investor_id && ids.add(i.investor_id));
  const { data: nameRows } = ids.size
    ? await supabaseAdmin.from("bot_users").select("id, full_name, username").in("id", [...ids])
    : { data: [] as { id: string; full_name: string | null; username: string | null }[] };
  const names: Record<string, string> = {};
  (nameRows ?? []).forEach((r) => {
    names[r.id] = r.full_name ?? r.username ?? "Foydalanuvchi";
  });

  const myProjectIds = new Set((myProjects.data ?? []).map((p) => p.id));
  const childProjectIds = new Set((childProjects.data ?? []).map((p: { id: string }) => p.id));

  return {
    user: {
      id: me.id,
      full_name: me.full_name ?? "Ixtirochi",
      role: me.role ?? "inventor",
      phone: me.phone ?? "",
      is_verified: me.is_verified,
      has_parent: Boolean(me.parent_id),
      parent_secret: me.role === "parent" ? me.parent_secret : null,
    },
    patents: patents.data ?? [],
    myProjects: myProjects.data ?? [],
    mentors: mentors.data ?? [],
    conversations: (convos.data ?? []).map((c) => ({
      id: c.id,
      kind: c.kind,
      title:
        c.kind === "ai"
          ? "AI Mentor"
          : (names[c.user_id === me.id ? (c.mentor_id ?? "") : c.user_id] ?? "Mentor"),
      updated_at: c.updated_at,
    })),
    teamAds: (teamAds.data ?? []).map((p) => ({ ...p, owner: names[p.user_id ?? ""] ?? "Ixtirochi" })),
    children: children.data ?? [],
    childProjects: childProjects.data ?? [],
    childPatents: childPatents.data ?? [],
    investorFeed: (investorFeed.data ?? []).map((p: { user_id: string | null }) => ({
      ...p,
      owner: names[p.user_id ?? ""] ?? "Ixtirochi",
    })),
    myInvestments: myInvestments.data ?? [],
    incomingInvestments: (receivedInvestments.data ?? [])
      .filter((i) => myProjectIds.has(i.project_id))
      .map((i) => ({ ...i, investor: names[i.investor_id] ?? "Investor" })),
    parentPendingInvestments: (receivedInvestments.data ?? [])
      .filter((i) => childProjectIds.has(i.project_id))
      .map((i) => ({ ...i, investor: names[i.investor_id] ?? "Investor" })),
    mentorProjects: (mentorProjects.data ?? []).map((p: { user_id: string | null }) => ({
      ...p,
      owner: names[p.user_id ?? ""] ?? "Ixtirochi",
    })),
  };
}

export async function saveProject(
  initData: string,
  input: {
    id?: string;
    title: string;
    description: string;
    logo_url?: string | null;
    funding_goal?: string | null;
    looking_for_team?: boolean;
    team_note?: string | null;
    telegram_group_url?: string | null;
  },
) {
  const me = await auth(initData);
  const patch = {
    title: input.title,
    description: input.description,
    logo_url: input.logo_url ?? null,
    funding_goal: input.funding_goal ?? null,
    looking_for_team: input.looking_for_team ?? false,
    team_note: input.team_note ?? null,
    telegram_group_url: input.telegram_group_url ?? null,
    updated_at: new Date().toISOString(),
  };
  if (input.id) {
    const { error } = await supabaseAdmin.from("projects").update(patch).eq("id", input.id).eq("user_id", me.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  }
  const { error } = await supabaseAdmin.from("projects").insert({ ...patch, user_id: me.id });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function connectMentor(initData: string, projectId: string, mentorId: string) {
  const me = await auth(initData);
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, title, telegram_group_url, user_id")
    .eq("id", projectId)
    .eq("user_id", me.id)
    .maybeSingle();
  if (!project) throw new Error("Loyiha topilmadi");

  await supabaseAdmin
    .from("mentor_links")
    .upsert({ project_id: projectId, mentor_id: mentorId, user_id: me.id, status: "active" }, { onConflict: "project_id,mentor_id" });

  const conv = await ensureConversation(me.id, mentorId, "mentor");

  await notify(
    mentorId,
    `👨‍🏫 Yangi mentorlik so'rovi\n\nIxtirochi: ${me.full_name ?? ""}\nLoyiha: ${project.title}\n${
      project.telegram_group_url ? `Guruh: ${project.telegram_group_url}\n(«mentor» sifatida qo'shilishingiz mumkin)` : "Guruh havolasi hali kiritilmagan."
    }\n\nMini App → Mentorlik bo'limida chatni davom ettiring.`,
  );
  return { ok: true, conversationId: conv };
}

async function ensureConversation(userId: string, mentorId: string | null, kind: "ai" | "mentor") {
  const query = supabaseAdmin.from("conversations").select("id").eq("user_id", userId).eq("kind", kind);
  const { data: found } = mentorId ? await query.eq("mentor_id", mentorId).maybeSingle() : await query.is("mentor_id", null).maybeSingle();
  if (found?.id) return found.id;
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({ user_id: userId, mentor_id: mentorId, kind })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function openChat(initData: string, opts: { conversationId?: string; mentorId?: string; ai?: boolean }) {
  const me = await auth(initData);
  await purgeOldMessages();
  let conversationId = opts.conversationId;
  if (!conversationId) {
    conversationId = opts.ai ? await ensureConversation(me.id, null, "ai") : await ensureConversation(me.id, opts.mentorId!, "mentor");
  }
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id, kind, user_id, mentor_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv || (conv.user_id !== me.id && conv.mentor_id !== me.id)) throw new Error("Suhbat topilmadi");
  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("id, sender_id, sender_role, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);
  return {
    conversationId,
    kind: conv.kind,
    mine: conv.user_id === me.id,
    meId: me.id,
    messages: messages ?? [],
  };
}

export async function sendChatMessage(initData: string, conversationId: string, body: string) {
  const me = await auth(initData);
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id, kind, user_id, mentor_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv || (conv.user_id !== me.id && conv.mentor_id !== me.id)) throw new Error("Suhbat topilmadi");

  const role = conv.kind === "ai" ? "user" : conv.user_id === me.id ? "user" : "mentor";
  await supabaseAdmin.from("messages").insert({ conversation_id: conversationId, sender_id: me.id, sender_role: role, body });
  await supabaseAdmin.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

  if (conv.kind === "ai") {
    const { data: history } = await supabaseAdmin
      .from("messages")
      .select("sender_role, body")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);
    const reply = await aiReply(history ?? []);
    await supabaseAdmin.from("messages").insert({ conversation_id: conversationId, sender_role: "ai", body: reply });
  } else {
    const other = conv.user_id === me.id ? conv.mentor_id : conv.user_id;
    if (other) await notify(other, `💬 ${me.full_name ?? "Foydalanuvchi"}: ${body.slice(0, 300)}`);
  }
  return openChat(initData, { conversationId });
}

async function aiReply(history: { sender_role: string; body: string }[]) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return "AI mentor hozircha sozlanmagan.";
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Sen KelajakHub AI mentorisan. Yosh ixtirochilarga g'oya, patent, prototip va jamoa masalalarida o'zbek tilida qisqa, amaliy maslahat berasan.",
        },
        ...history.map((m) => ({ role: m.sender_role === "ai" ? "assistant" : "user", content: m.body })),
      ],
    }),
  });
  if (!res.ok) return "AI mentor javob bermadi, keyinroq urinib ko'ring.";
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

export async function runLab(initData: string, code: string) {
  verifyInitData(initData);
  return { output: await aiReply([{ sender_role: "user", body: `Quyidagi kod yoki g'oyani tahlil qil:\n\n${code}` }]) };
}

export async function invest(initData: string, projectId: string, amount: string, message: string) {
  const me = await auth(initData);
  if (me.role !== "investor") throw new Error("Faqat investorlar investitsiya taklif qiladi");
  const { data: project } = await supabaseAdmin.from("projects").select("id, title, user_id").eq("id", projectId).maybeSingle();
  if (!project) throw new Error("Loyiha topilmadi");
  const { data: owner } = await supabaseAdmin.from("bot_users").select("id, parent_id").eq("id", project.user_id).maybeSingle();
  const needsParent = Boolean(owner?.parent_id);
  const { error } = await supabaseAdmin.from("investments").insert({
    project_id: projectId,
    investor_id: me.id,
    amount,
    message,
    status: needsParent ? "pending_parent" : "approved",
  });
  if (error) throw new Error(error.message);
  await notify(
    project.user_id,
    `💰 Investitsiya taklifi: ${amount}\nLoyiha: ${project.title}\n${needsParent ? "Ota-onangiz roziligi kutilmoqda." : "Taklif qabul qilindi."}`,
  );
  if (needsParent && owner?.parent_id) {
    await notify(
      owner.parent_id,
      `🛡 Farzandingiz loyihasiga investitsiya taklifi keldi.\nLoyiha: ${project.title}\nSumma: ${amount}\n\nMini App → Nazorat bo'limida rozilik bering yoki rad eting.`,
    );
  }
  return { ok: true, needsParent };
}

export async function parentDecision(initData: string, investmentId: string, approve: boolean) {
  const me = await auth(initData);
  const { data: inv } = await supabaseAdmin
    .from("investments")
    .select("id, project_id, investor_id, amount, status")
    .eq("id", investmentId)
    .maybeSingle();
  if (!inv) throw new Error("Taklif topilmadi");
  const { data: project } = await supabaseAdmin.from("projects").select("id, title, user_id").eq("id", inv.project_id).maybeSingle();
  const { data: owner } = await supabaseAdmin.from("bot_users").select("id, parent_id").eq("id", project?.user_id ?? "").maybeSingle();
  if (!owner || owner.parent_id !== me.id) throw new Error("Ruxsat yo'q");
  await supabaseAdmin
    .from("investments")
    .update({ status: approve ? "approved" : "rejected", updated_at: new Date().toISOString() })
    .eq("id", investmentId);
  await notify(owner.id, approve ? `✅ Ota-onangiz «${project?.title}» uchun investitsiyaga rozilik berdi.` : `❌ Ota-onangiz investitsiya taklifini rad etdi.`);
  await notify(inv.investor_id, approve ? `✅ «${project?.title}» loyihasi uchun taklifingiz ota-ona tomonidan tasdiqlandi.` : `❌ «${project?.title}» uchun taklifingiz rad etildi.`);
  return { ok: true };
}
