
-- Log table for audit runs
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ok boolean NOT NULL,
  results jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.security_audit_log TO service_role;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated: only service_role (bypasses RLS) can read/write.

-- Snapshot helper used by the security-audit edge function. SECURITY DEFINER so
-- it can inspect pg_policies/storage.buckets/auth.config, but EXECUTE is
-- restricted to service_role so it isn't exposed via the Data API.
CREATE OR REPLACE FUNCTION public.security_audit_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  college_policies jsonb;
  storage_policies jsonb;
  documents_bucket jsonb;
  hibp_enabled boolean;
BEGIN
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'policyname', policyname,
    'cmd', cmd,
    'roles', roles,
    'qual', qual,
    'with_check', with_check
  )), '[]'::jsonb)
  INTO college_policies
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'college_data';

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'policyname', policyname,
    'cmd', cmd,
    'roles', roles,
    'qual', qual,
    'with_check', with_check
  )), '[]'::jsonb)
  INTO storage_policies
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects';

  SELECT to_jsonb(b) INTO documents_bucket
  FROM (SELECT id, public FROM storage.buckets WHERE id = 'documents') b;

  BEGIN
    EXECUTE 'SELECT (raw_config->''security''->>''password_hibp_enabled'')::boolean FROM auth.config LIMIT 1'
      INTO hibp_enabled;
  EXCEPTION WHEN OTHERS THEN
    hibp_enabled := NULL;
  END;

  RETURN jsonb_build_object(
    'college_policies', college_policies,
    'storage_policies', storage_policies,
    'documents_bucket', documents_bucket,
    'hibp_enabled', hibp_enabled
  );
END;
$$;

REVOKE ALL ON FUNCTION public.security_audit_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.security_audit_snapshot() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.security_audit_snapshot() TO service_role;
