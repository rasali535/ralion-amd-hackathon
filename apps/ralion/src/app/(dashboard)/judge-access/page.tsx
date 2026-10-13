'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/** Public access, backed by a scoped anonymous Supabase Auth identity. */
export default function JudgeAccessPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function enterDemo() {
    setBusy(true);
    setError('');
    try {
      const client = createClient();
      let { data: { session } } = await client.auth.getSession();
      if (!session) {
        const result = await client.auth.signInAnonymously();
        if (result.error || !result.data.session) throw result.error || new Error('Guest session could not be created.');
        session = result.data.session;
      }
      const res = await fetch('/ralion/api/hackathon/judge-access', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Could not open the demo workspace. Please try again.');
      window.location.assign('/ralion/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Guest sign-in is temporarily unavailable.');
      setBusy(false);
    }
  }
  return (
    <main className="flex min-h-full items-center justify-center bg-[#080d18] p-5 text-white">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={16}/> Back to Ralion Adaptive
        </Link>
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#15213a] to-[#0d1422] p-8 sm:p-10">
          <ShieldCheck className="h-10 w-10 text-cyan-300"/>
          <div className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-cyan-300">AMD Hackathon · Guest experience</div>
          <h1 className="mt-3 text-3xl font-extrabold">Explore the full Ralion dashboard</h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">No signup, passwords or email confirmation. Enter the preconfigured Botswana safari demonstration with limited guest permissions.</p>
          <button onClick={enterDemo} disabled={busy} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold transition hover:bg-blue-500 disabled:opacity-50">
            {busy ? 'Opening your demo…' : 'Enter Demo'} <ArrowRight size={18}/>
          </button>
          {error && <p role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          <p className="mt-7 border-t border-white/10 pt-5 text-xs leading-relaxed text-slate-400">Guest mode uses a temporary authenticated identity, not an email address. Public content is synthetic. AI usage is limited and admin, billing and publishing must remain protected.</p>
        </div>
      </div>
    </main>
  );
}
