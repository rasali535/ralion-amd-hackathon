import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPrivilegedSupabase, resolveSupabaseUrl } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const DEMO_WORKSPACE_ID = 'c0000000-0000-0000-0000-000000000001';
const HACKATHON_PROJECT = 'uosaqcgfvmxzwpxekoov';

/** Enrols a verified visitor as a non-admin member of the fictional safari workspace. */
export async function POST(request: NextRequest) {
  const noStore = { 'Cache-Control': 'no-store' };
  try {
    if (!resolveSupabaseUrl().includes(HACKATHON_PROJECT)) {
      return NextResponse.json({ error: 'ISOLATION_FAILURE' }, { status: 503, headers: noStore });
    }
    const authHeader = request.headers.get('authorization') || '';
    if (!/^Bearer\s+[^\s]+$/i.test(authHeader)) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401, headers: noStore });
    }
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!publicKey) return NextResponse.json({ error: 'AUTH_UNAVAILABLE' }, { status: 503, headers: noStore });
    const verifier = createClient(resolveSupabaseUrl(), publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await verifier.auth.getUser(token);
    const user = data.user;
    if (error || !user || !user.email || !user.email_confirmed_at || user.is_anonymous) {
      return NextResponse.json({ error: 'VERIFIED_EMAIL_REQUIRED' }, { status: 403, headers: noStore });
    }

    const admin = getPrivilegedSupabase();
    // Never overwrite an existing member's role/profile; admin users stay untouched.
    const { data: existing, error: membershipError } = await admin.from('workspace_members')
      .select('id,role').eq('workspace_id', DEMO_WORKSPACE_ID).eq('user_id', user.id).maybeSingle();
    if (membershipError) throw membershipError;

    if (!existing) {
      const { data: profile, error: profileLookupError } = await admin.from('profiles').select('id').eq('id', user.id).maybeSingle();
      if (profileLookupError) throw profileLookupError;
      if (!profile) {
        const { error: profileError } = await admin.from('profiles').insert({
          id: user.id, email: user.email, full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          role: 'VIEWER',
        });
        if (profileError && profileError.code !== '23505') throw profileError;
      }
      const { error: membershipInsertError } = await admin.from('workspace_members').insert({
        workspace_id: DEMO_WORKSPACE_ID, user_id: user.id, role: 'member',
      });
      if (membershipInsertError && membershipInsertError.code !== '23505') throw membershipInsertError;
    }
    return NextResponse.json({ success: true, next: '/dashboard' }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: 'JUDGE_ENROLMENT_FAILED', message: 'Unable to open the demo workspace right now.' }, { status: 503, headers: noStore });
  }
}
