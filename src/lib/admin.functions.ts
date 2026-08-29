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
