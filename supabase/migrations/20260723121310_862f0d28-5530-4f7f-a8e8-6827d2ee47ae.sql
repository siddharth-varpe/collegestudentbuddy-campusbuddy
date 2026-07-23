
-- Tighten SyncSpot INSERT policies with WITH CHECK
DROP POLICY IF EXISTS "Anyone can insert syncspot questions" ON public.syncspot_questions;
CREATE POLICY "Users insert their own syncspot questions"
ON public.syncspot_questions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = asked_by OR asked_by IS NULL);

DROP POLICY IF EXISTS "Anyone can insert syncspot answers" ON public.syncspot_answers;
CREATE POLICY "Users insert their own syncspot answers"
ON public.syncspot_answers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Restrict UPDATE on syncspot_questions to the owner (fixes RLS always true)
DROP POLICY IF EXISTS "Anyone can update syncspot questions" ON public.syncspot_questions;
CREATE POLICY "Owners can update their syncspot questions"
ON public.syncspot_questions FOR UPDATE TO authenticated
USING (auth.uid() = asked_by)
WITH CHECK (auth.uid() = asked_by);

-- Lock down SECURITY DEFINER helper: only service_role should execute
REVOKE EXECUTE ON FUNCTION public.security_audit_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.security_audit_snapshot() TO service_role;
