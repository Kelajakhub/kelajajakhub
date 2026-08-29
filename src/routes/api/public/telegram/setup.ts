import { createFileRoute } from "@tanstack/react-router";

const MINI_APP_URL = "https://kelajajakhub.lovable.app/app";

/** One-time bot wiring endpoint. Requires the webhook secret as a bearer token. */
export const Route = createFileRoute("/api/public/telegram/setup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["TELEGRAM_WEBHOOK_SECRET"] ?? "";
        const provided = (request.headers.get("authorization") ?? "").replace("Bearer ", "");
        if (!expected || provided !== expected) return new Response("Unauthorized", { status: 401 });

        const base = process.env["PUBLIC_APP_URL"];
        const botToken = process.env["TELEGRAM_BOT_TOKEN"];
        const call = async (method: string, body: unknown) => {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
          return res.json();
        };

        const setWebhook = await call("setWebhook", {
          url: `${base}/api/public/telegram/webhook`,
          secret_token: expected,
          allowed_updates: ["message", "edited_message", "callback_query"],
          drop_pending_updates: true,
        });
        const commands = await call("setMyCommands", {
          commands: [
            { command: "start", description: "Botni ishga tushirish" },
            { command: "help", description: "Yordam" },
          ],
        });
        const menu = await call("setChatMenuButton", {
          menu_button: { type: "web_app", text: "KelajakHub", web_app: { url: MINI_APP_URL } },
        });
        const me = await call("getMe", {});
        return Response.json({ setWebhook, commands, menu, me });
      },
    },
  },
});
