import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/oneid/verify")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { verifyIdentity, oneIdConfigured, oneIdAuthorizeUrl, htmlPage } = await import("@/lib/oneid.server");
        const url = new URL(request.url);
        const user = url.searchParams.get("user") ?? "";
        const t = url.searchParams.get("t") ?? "";
        if (!user || !verifyIdentity(user, t)) {
          return htmlPage(
            "Havola yaroqsiz",
            "Bu shaxsni tasdiqlash havolasi yaroqsiz. Telegram botdan yoki Mini App'dan qayta urinib ko'ring.",
          );
        }
        if (!oneIdConfigured()) {
          return htmlPage(
            "OneID hali ulanmagan",
            "Platforma OneID (sso.egov.uz) tizimida ro'yxatdan o'tkazilishi kutilmoqda. Kalitlar ulangach, bu havola sizni to'g'ridan-to'g'ri OneID sahifasiga olib boradi.",
          );
        }
        const state = Buffer.from(JSON.stringify({ kind: "identity", user, t })).toString("base64url");
        return new Response(null, { status: 302, headers: { location: oneIdAuthorizeUrl(state) } });
      },
    },
  },
});
