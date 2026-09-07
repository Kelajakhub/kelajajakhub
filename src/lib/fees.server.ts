/**
 * Patent to'lovlari (server-only).
 *
 * Davlat yig'imi (`patent_state_fee`) to'liq davlat budjetiga o'tadi,
 * platforma xizmat haqi (`patent_service_percent`) esa KelajakHub ushlab
 * qoladigan foiz. Ikkisi birga foydalanuvchiga umumiy summa sifatida ko'rinadi.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PatentFees = {
  stateFee: number;
  servicePercent: number;
  serviceFee: number;
  total: number;
};

const DEFAULT_STATE_FEE = 1_250_000;
const DEFAULT_PERCENT = 15;

export function formatSum(value: number) {
  return `${value.toLocaleString("ru-RU").replace(/\u00a0/g, " ")} so'm`;
}

export async function patentFees(): Promise<PatentFees> {
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("key, value")
    .in("key", ["patent_state_fee", "patent_service_percent"]);
  const map = Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));
  const stateFee = Number(map["patent_state_fee"] ?? DEFAULT_STATE_FEE) || DEFAULT_STATE_FEE;
  const servicePercent = Number(map["patent_service_percent"] ?? DEFAULT_PERCENT) || DEFAULT_PERCENT;
  const serviceFee = Math.round((stateFee * servicePercent) / 100);
  return { stateFee, servicePercent, serviceFee, total: stateFee + serviceFee };
}

export function feeBreakdownText(fees: PatentFees) {
  return [
    "💳 <b>Patent to'lovi</b>",
    `• Davlat yig'imi (Intellektual mulk agentligi): <b>${formatSum(fees.stateFee)}</b>`,
    `• KelajakHub xizmat haqi (${fees.servicePercent}%): <b>${formatSum(fees.serviceFee)}</b>`,
    `• Umumiy: <b>${formatSum(fees.total)}</b>`,
    "",
    "To'lov ariza ekspertizadan o'tgach hisob-kitob qilinadi. Davlat yig'imi to'liq davlat budjetiga o'tadi.",
  ].join("\n");
}
