ALTER TABLE public.patent_applications
  ADD COLUMN IF NOT EXISTS parent_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS parent_consent_pinfl text,
  ADD COLUMN IF NOT EXISTS parent_consent_name text,
  ADD COLUMN IF NOT EXISTS parent_consent_by uuid;
CREATE INDEX IF NOT EXISTS idx_patent_status ON public.patent_applications (status);