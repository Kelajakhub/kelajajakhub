import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ email: z.string().email(), password: z.string().min(1), pin: z.string().min(4) }).parse(d),
  )
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.login(data.email, data.password, data.pin);
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const core = await import("./admin-core.server");
  return core.logout();
});

export const adminMe = createServerFn({ method: "GET" }).handler(async () => {
  const core = await import("./admin-core.server");
  return { email: await core.currentAdmin() };
});

export const adminDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const core = await import("./admin-core.server");
  return core.dashboard();
});

export const adminAddChannel = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ chat_id: z.string().min(2), title: z.string().min(1), url: z.string().url() }).parse(d),
  )
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.addChannel(data);
  });

export const adminRemoveChannel = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.removeChannel(data.id);
  });

export const adminSaveSetting = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ key: z.string().min(1), value: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.saveSetting(data.key, data.value);
  });

export const adminSendToMinistry = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.sendToMinistry(data.id);
  });

export const adminLetterPreview = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.letterPreview(data.id);
  });

export const adminMarkPatented = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.markPatented(data.id);
  });

export const adminBroadcast = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ text: z.string().min(1).max(3000) }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.broadcast(data.text);
  });

export const submitWaitlist = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        full_name: z.string().trim().min(2).max(120),
        role: z.string().trim().min(2).max(60),
        contact: z.string().trim().min(3).max(160),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.joinWaitlist(data);
  });

export const setupTelegramWebhook = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().min(6) }).parse(d))
  .handler(async ({ data }) => {
    const expected = process.env["TELEGRAM_WEBHOOK_SECRET"] ?? "";
    if (!expected || data.token !== expected) throw new Error("Ruxsat yo'q");
    const { setupBots, botsStatus } = await import("./bot.server");
    await setupBots();
    return botsStatus();
  });

export const adminBots = createServerFn({ method: "GET" }).handler(async () => {
  const core = await import("./admin-core.server");
  return core.bots();
});

export const adminSetupBots = createServerFn({ method: "POST" }).handler(async () => {
  const core = await import("./admin-core.server");
  return core.reconnectBots();
});

const lessonSchema = z.object({
  youtube: z.string().trim().min(5).max(200),
  category: z.enum(["dasturlash", "dizayn", "startup"]),
  title: z.string().trim().min(2).max(300),
  author: z.string().trim().min(2).max(200),
  channel: z.string().trim().min(1).max(200),
  about: z.string().trim().max(1000).default(""),
  topic: z.string().trim().max(1000).default(""),
});

export const adminAddLesson = createServerFn({ method: "POST" })
  .inputValidator((d) => lessonSchema.parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.addLesson(data);
  });

export const adminDeleteLesson = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.deleteLesson(data.id);
  });

export const adminToggleLesson = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.toggleLesson(data.id, data.active);
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.deleteUser(data.id);
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), role: z.enum(["inventor", "mentor", "investor", "parent"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.setUserRole(data.id, data.role);
  });

export const adminSetUserVerified = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), verified: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.setUserVerified(data.id, data.verified);
  });

export const adminDeleteProject = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.deleteProject(data.id);
  });

export const adminDeletePatent = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.deletePatent(data.id);
  });

export const adminDeleteWaitlist = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.deleteWaitlist(data.id);
  });

export const adminMessageUser = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), text: z.string().min(1).max(3000) }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./admin-core.server");
    return core.messageUser(data.id, data.text);
  });
