import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

const schema = z.object({
  initData: z.string().min(10),
  action: z.enum(["saveProject", "connectMentor", "openChat", "sendMessage", "invest", "parentDecision"]),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const Route = createFileRoute("/api/public/miniapp/rpc")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        try {
          const { initData, action, payload } = schema.parse(await request.json());
          const core = await import("@/lib/miniapp-core.server");
          const p = payload as Record<string, never>;

          switch (action) {
            case "saveProject": {
              const input = z
                .object({
                  id: z.string().uuid().optional(),
                  title: z.string().trim().min(2).max(120),
                  description: z.string().trim().min(5).max(3000),
                  logo_url: z.string().trim().max(500).nullish(),
                  funding_goal: z.string().trim().max(100).nullish(),
                  looking_for_team: z.boolean().optional(),
                  team_note: z.string().trim().max(1000).nullish(),
                  telegram_group_url: z.string().trim().max(300).nullish(),
                })
                .parse(payload);
              return Response.json(await core.saveProject(initData, input), { headers: cors });
            }
            case "connectMentor": {
              const input = z.object({ projectId: z.string().uuid(), mentorId: z.string().uuid() }).parse(payload);
              return Response.json(await core.connectMentor(initData, input.projectId, input.mentorId), {
                headers: cors,
              });
            }
            case "openChat": {
              const input = z
                .object({
                  conversationId: z.string().uuid().optional(),
                  mentorId: z.string().uuid().optional(),
                  ai: z.boolean().optional(),
                })
                .parse(payload);
              return Response.json(await core.openChat(initData, input), { headers: cors });
            }
            case "sendMessage": {
              const input = z
                .object({ conversationId: z.string().uuid(), body: z.string().trim().min(1).max(4000) })
                .parse(payload);
              return Response.json(await core.sendChatMessage(initData, input.conversationId, input.body), {
                headers: cors,
              });
            }
            case "invest": {
              const input = z
                .object({
                  projectId: z.string().uuid(),
                  amount: z.string().trim().min(1).max(60),
                  message: z.string().trim().max(1000).default(""),
                })
                .parse(payload);
              return Response.json(await core.invest(initData, input.projectId, input.amount, input.message), {
                headers: cors,
              });
            }
            case "parentDecision": {
              const input = z.object({ investmentId: z.string().uuid(), approve: z.boolean() }).parse(payload);
              return Response.json(await core.parentDecision(initData, input.investmentId, input.approve), {
                headers: cors,
              });
            }
            default:
              void p;
              return Response.json({ error: "Noma'lum amal" }, { status: 400, headers: cors });
          }
        } catch (error) {
          return Response.json({ error: (error as Error).message }, { status: 400, headers: cors });
        }
      },
    },
  },
});
