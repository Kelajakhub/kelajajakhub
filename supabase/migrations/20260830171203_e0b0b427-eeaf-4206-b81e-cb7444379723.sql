ALTER TABLE public.bot_users
  ADD COLUMN IF NOT EXISTS otp_code text,
  ADD COLUMN IF NOT EXISTS otp_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS otp_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otp_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;