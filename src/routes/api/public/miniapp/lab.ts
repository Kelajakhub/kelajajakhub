import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

export const Route = createFileRoute("/api/public/miniapp/lab")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        try {
          const body = z
            .object({ initData: z.string().min(10), code: z.string().min(1).max(6000) })
            .parse(await request.json());
          const core = await import("@/lib/miniapp-core.server");
          const data = await core.runLab(body.initData, body.code);
          return Response.json(data, { headers: cors });
        } catch (error) {
          return Response.json({ error: (error as Error).message }, { status: 400, headers: cors });
        }
      },
    },
  },
});
