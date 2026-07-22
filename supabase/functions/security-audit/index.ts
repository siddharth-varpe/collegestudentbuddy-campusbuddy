// Automated re-validation of the security findings that were fixed.
// Invoke manually (supabase.functions.invoke('security-audit')) or via the
// pg_cron job defined in the migration that ships with this function.
// Returns 200 when every check passes, 500 with a failure list otherwise.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckResult {
  id: string;
  finding: string;
  passed: boolean;
  details?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  const results: CheckResult[] = [];

  // Helper: run read-only SQL via PostgREST is not available; use a SQL RPC.
  // We rely on a helper function `public.security_audit_snapshot()` created in
  // the accompanying migration that returns the rows we need.
  const { data: snapshot, error: snapErr } = await admin.rpc('security_audit_snapshot');

  if (snapErr || !snapshot) {
    return new Response(
      JSON.stringify({ ok: false, error: snapErr?.message ?? 'no snapshot' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const { college_policies, storage_policies, documents_bucket, hibp_enabled } =
    snapshot as {
      college_policies: Array<{ policyname: string; cmd: string; roles: string[]; qual: string | null; with_check: string | null }>;
      storage_policies: Array<{ policyname: string; cmd: string; roles: string[]; qual: string | null; with_check: string | null }>;
      documents_bucket: { id: string; public: boolean } | null;
      hibp_enabled: boolean | null;
    };

  // 1. college_data_anon_write — no anon INSERT/UPDATE/DELETE on college_data.
  const anonWrites = college_policies.filter(
    (p) => ['INSERT', 'UPDATE', 'DELETE'].includes(p.cmd) && (p.roles ?? []).includes('anon'),
  );
  results.push({
    id: 'college_data_anon_write',
    finding: 'Anonymous users cannot write to college_data',
    passed: anonWrites.length === 0,
    details: anonWrites.length ? `Anon-writable policies: ${anonWrites.map((p) => p.policyname).join(', ')}` : undefined,
  });

  // 2. SUPA_rls_policy_always_true — no always-true INSERT/UPDATE/DELETE on college_data.
  const alwaysTrue = college_policies.filter(
    (p) =>
      ['INSERT', 'UPDATE', 'DELETE'].includes(p.cmd) &&
      ((p.qual ?? '').trim() === 'true' || (p.with_check ?? '').trim() === 'true'),
  );
  results.push({
    id: 'SUPA_rls_policy_always_true',
    finding: 'No permissive USING(true)/WITH CHECK(true) write policies on college_data',
    passed: alwaysTrue.length === 0,
    details: alwaysTrue.length ? `Permissive policies: ${alwaysTrue.map((p) => p.policyname).join(', ')}` : undefined,
  });

  // 3. college_data_anon_delete_update — reinforce anon has no delete/update.
  const anonMutate = college_policies.filter(
    (p) => ['UPDATE', 'DELETE'].includes(p.cmd) && (p.roles ?? []).includes('anon'),
  );
  results.push({
    id: 'college_data_anon_delete_update',
    finding: 'Anonymous users cannot delete or update college_data',
    passed: anonMutate.length === 0,
    details: anonMutate.length ? `Anon mutate policies: ${anonMutate.map((p) => p.policyname).join(', ')}` : undefined,
  });

  // 4/5. public_bucket_listing / SUPA_public_bucket_allows_listing — bucket private.
  const bucketPrivate = documents_bucket?.public === false;
  results.push({
    id: 'public_bucket_listing',
    finding: 'documents storage bucket is private',
    passed: bucketPrivate,
    details: bucketPrivate ? undefined : `documents_bucket.public = ${documents_bucket?.public}`,
  });
  results.push({
    id: 'SUPA_public_bucket_allows_listing',
    finding: 'documents bucket does not allow public listing',
    passed: bucketPrivate,
  });

  // 6. documents_bucket_no_ownership_check — every write policy on documents
  // requires the auth.uid() = folder prefix check.
  const OWNERSHIP_MARK = "auth.uid()::text = (storage.foldername(name))[1]";
  const documentsWritePolicies = storage_policies.filter((p) =>
    ['INSERT', 'UPDATE', 'DELETE'].includes(p.cmd) &&
    // Only consider policies scoped to the documents bucket
    (`${p.qual ?? ''} ${p.with_check ?? ''}`).includes("'documents'"),
  );
  const missingOwnership = documentsWritePolicies.filter(
    (p) => !(`${p.qual ?? ''} ${p.with_check ?? ''}`).includes(OWNERSHIP_MARK),
  );
  results.push({
    id: 'documents_bucket_no_ownership_check',
    finding: 'documents write policies enforce owner path prefix',
    passed: documentsWritePolicies.length > 0 && missingOwnership.length === 0,
    details:
      documentsWritePolicies.length === 0
        ? 'No write policies found on documents bucket'
        : missingOwnership.length
          ? `Policies missing owner check: ${missingOwnership.map((p) => p.policyname).join(', ')}`
          : undefined,
  });

  // 7. SUPA_auth_leaked_password_protection — HIBP toggle on.
  results.push({
    id: 'SUPA_auth_leaked_password_protection',
    finding: 'Leaked password protection (HIBP) enabled',
    passed: hibp_enabled === true,
    details: hibp_enabled === true ? undefined : `password_hibp_enabled = ${hibp_enabled}`,
  });

  const failed = results.filter((r) => !r.passed);
  const ok = failed.length === 0;

  // Persist for history / debugging.
  await admin.from('security_audit_log').insert({
    ok,
    results,
  });

  return new Response(
    JSON.stringify({ ok, checked_at: new Date().toISOString(), results }, null, 2),
    { status: ok ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
