ALTER TABLE public.bot_users
  ADD COLUMN IF NOT EXISTS oneid_pinfl text,
  ADD COLUMN IF NOT EXISTS oneid_name text,
  ADD COLUMN IF NOT EXISTS oneid_verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS mentor_fee text;

ALTER TABLE public.patent_applications
  ADD COLUMN IF NOT EXISTS state_fee bigint,
  ADD COLUMN IF NOT EXISTS service_fee bigint,
  ADD COLUMN IF NOT EXISTS total_fee bigint,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

INSERT INTO public.app_settings (key, value)
VALUES
  ('patent_state_fee', '1250000'),
  ('patent_service_percent', '15'),
  ('mentor_fee_default', '150000')
ON CONFLICT (key) DO NOTHING;