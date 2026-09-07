import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/oneid/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { verifyConsent, verifyIdentity, oneIdIdentify, htmlPage } = await import("@/lib/oneid.server");
        const url = new URL(request.url);
        const code = url.searchParams.get("code") ?? "";
        const rawState = url.searchParams.get("state") ?? "";
        try {
          if (!code || !rawState) throw new Error("OneID javobi to'liq emas");
          const state = JSON.parse(Buffer.from(rawState, "base64url").toString("utf8")) as {
            kind?: string;
            user?: string;
            patent?: string;
            parent?: string;
            t?: string;
          };
          if (state.kind === "identity") {
            if (!state.user || !state.t || !verifyIdentity(state.user, state.t)) {
              throw new Error("Tasdiqlash havolasi yaroqsiz");
            }
            const identity = await oneIdIdentify(code);
            const { applyIdentityVerification } = await import("@/lib/miniapp-core.server");
            const result = await applyIdentityVerification(state.user, identity);
            return htmlPage(
              "✅ Shaxsingiz tasdiqlandi",
              `${result.name} — OneID orqali shaxsingiz rasmiy tasdiqlandi. Endi ixtirolaringiz qonuniy tartibda patentlash uchun qabul qilinadi. Telegram botga qaytishingiz mumkin.`,
            );
          }
          if (!state.patent || !state.parent || !state.t || !verifyConsent(state.patent, state.parent, state.t)) {
            throw new Error("Tasdiqlash havolasi yaroqsiz");
          }
          const identity = await oneIdIdentify(code);
          const { applyParentConsent } = await import("@/lib/miniapp-core.server");
          const result = await applyParentConsent(state.patent, state.parent, identity);
          return htmlPage(
            "✅ Tasdiqlandi",
            `«${result.title}» ixtirosi uchun ota-ona roziligi OneID orqali rasmiylashtirildi va ariza ko'rib chiqishga yuborildi. Telegram botga qaytishingiz mumkin.`,
          );
        } catch (error) {
          return htmlPage("Xatolik", (error as Error).message);
        }
      },
    },
  },
});
