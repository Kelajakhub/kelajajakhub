import { createHmac, timingSafeEqual } from "node:crypto";

export const SITE_ORIGIN = "https://kelajajakhub.lovable.app";
const ONEID_BASE = "https://sso.egov.uz/sso/oauth/Authorization.do";

function secret() {
  return process.env["SESSION_SECRET"] ?? process.env["TELEGRAM_BOT_TOKEN"] ?? "kelajakhub-oneid";
}

/** Signed one-time-ish token binding a patent application to its parent guardian. */
export function signConsent(patentId: string, parentId: string) {
  return createHmac("sha256", secret()).update(`consent:${patentId}:${parentId}`).digest("base64url");
}

export function verifyConsent(patentId: string, parentId: string, token: string) {
  const expected = Buffer.from(signConsent(patentId, parentId));
  const got = Buffer.from(token);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export function consentUrl(patentId: string, parentId: string) {
  const t = signConsent(patentId, parentId);
  return `${SITE_ORIGIN}/api/public/oneid/start?patent=${patentId}&parent=${parentId}&t=${t}`;
}

export function oneIdConfigured() {
  return Boolean(process.env["ONEID_CLIENT_ID"] && process.env["ONEID_CLIENT_SECRET"]);
}

export function oneIdAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    response_type: "one_code",
    client_id: process.env["ONEID_CLIENT_ID"] ?? "",
    redirect_uri: `${SITE_ORIGIN}/api/public/oneid/callback`,
    scope: process.env["ONEID_SCOPE"] ?? "kelajakhub",
    state,
  });
  return `${ONEID_BASE}?${params.toString()}`;
}

type OneIdUser = { pinfl: string | null; full_name: string | null };

/** Exchange the OneID authorization code for the citizen's identity. */
export async function oneIdIdentify(code: string): Promise<OneIdUser> {
  const clientId = process.env["ONEID_CLIENT_ID"] ?? "";
  const clientSecret = process.env["ONEID_CLIENT_SECRET"] ?? "";
  const tokenBody = new URLSearchParams({
    grant_type: "one_authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: `${SITE_ORIGIN}/api/public/oneid/callback`,
  });
  const tokenRes = await fetch(ONEID_BASE, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: tokenBody,
  });
  if (!tokenRes.ok) throw new Error(`OneID token xatosi (${tokenRes.status})`);
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("OneID access token qaytmadi");

  const infoBody = new URLSearchParams({
    grant_type: "one_access_token_identify",
    client_id: clientId,
    client_secret: clientSecret,
    access_token: token.access_token,
    scope: process.env["ONEID_SCOPE"] ?? "kelajakhub",
  });
  const infoRes = await fetch(ONEID_BASE, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: infoBody,
  });
  if (!infoRes.ok) throw new Error(`OneID identifikatsiya xatosi (${infoRes.status})`);
  const info = (await infoRes.json()) as Record<string, string>;
  const name = [info["sur_name"], info["first_name"], info["mid_name"]].filter(Boolean).join(" ").trim();
  return { pinfl: info["pin"] ?? info["pinfl"] ?? null, full_name: name || (info["full_name"] ?? null) };
}

export function htmlPage(title: string, body: string) {
  return new Response(
    `<!doctype html><html lang="uz"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex,nofollow"/><title>${title}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#08090d;color:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;padding:24px}div{max-width:420px;text-align:center;background:#12141c;border:1px solid #23273a;border-radius:22px;padding:28px}h1{font-size:20px;margin:0 0 12px}p{opacity:.75;line-height:1.6;font-size:15px;margin:0}</style></head><body><div><h1>${title}</h1><p>${body}</p></div></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" } },
  );
}
