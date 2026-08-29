import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        const expected = process.env["TELEGRAM_WEBHOOK_SECRET"] ?? "";
        if (expected && secret !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        let update: Record<string, unknown>;
        try {
          update = await request.json();
        } catch {
          return Response.json({ ok: true, ignored: true });
        }
        try {
          const { handleUpdate } = await import("@/lib/bot.server");
          await handleUpdate(update);
        } catch (error) {
          console.error("[telegram webhook]", error);
        }
        return Response.json({ ok: true });
      },
    },
  },
});
