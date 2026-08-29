import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const miniProfile = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ initData: z.string().min(10) }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./miniapp-core.server");
    return core.profile(data.initData);
  });

export const miniRunLab = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ initData: z.string().min(10), code: z.string().min(1).max(6000) }).parse(d))
  .handler(async ({ data }) => {
    const core = await import("./miniapp-core.server");
    return core.runLab(data.initData, data.code);
  });
