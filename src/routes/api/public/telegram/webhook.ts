import { createFileRoute } from "@tanstack/react-router";

/** One webhook for every bot: ?bot=1 (default) or ?bot=2 selects which token replies. */
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
          const { handleUpdate, withBot, botTokens } = await import("@/lib/bot.server");
          const idx = Math.max(1, Number(new URL(request.url).searchParams.get("bot") ?? "1")) - 1;
          const token = botTokens()[idx];
          if (!token) return Response.json({ ok: true, ignored: true });
          await withBot(token, () => handleUpdate(update));
        } catch (error) {
          console.error("[telegram webhook]", error);
        }
        return Response.json({ ok: true });
      },
    },
  },
});
