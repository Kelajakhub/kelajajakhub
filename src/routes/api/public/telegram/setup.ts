import { createFileRoute } from "@tanstack/react-router";

/** Bot wiring endpoint for all bots. Requires the webhook secret as a bearer token. */
export const Route = createFileRoute("/api/public/telegram/setup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["TELEGRAM_WEBHOOK_SECRET"] ?? "";
        const provided = (request.headers.get("authorization") ?? "").replace("Bearer ", "");
        if (!expected || provided !== expected) return new Response("Unauthorized", { status: 401 });
        const { setupBots } = await import("@/lib/bot.server");
        return Response.json(await setupBots());
      },
    },
  },
});
