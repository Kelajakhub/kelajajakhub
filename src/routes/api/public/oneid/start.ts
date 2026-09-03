import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/oneid/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { verifyConsent, oneIdConfigured, oneIdAuthorizeUrl, htmlPage } = await import("@/lib/oneid.server");
        const url = new URL(request.url);
        const patent = url.searchParams.get("patent") ?? "";
        const parent = url.searchParams.get("parent") ?? "";
        const t = url.searchParams.get("t") ?? "";
        if (!patent || !parent || !verifyConsent(patent, parent, t)) {
          return htmlPage("Havola yaroqsiz", "Bu tasdiqlash havolasi yaroqsiz yoki muddati o'tgan. Iltimos, Mini App → Nazorat bo'limidan qayta urinib ko'ring.");
        }
        if (!oneIdConfigured()) {
          return htmlPage(
            "OneID hali ulanmagan",
            "Platforma OneID (sso.egov.uz) tizimida ro'yxatdan o'tkazilishi kutilmoqda. Kalitlar ulangach, bu havola sizni to'g'ridan-to'g'ri OneID sahifasiga olib boradi.",
          );
        }
        const state = Buffer.from(JSON.stringify({ patent, parent, t })).toString("base64url");
        return new Response(null, { status: 302, headers: { location: oneIdAuthorizeUrl(state) } });
      },
    },
  },
});
