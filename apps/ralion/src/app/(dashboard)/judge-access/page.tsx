'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function JudgeAccessPage() {
 const [email,setEmail]=useState('');
 const [code,setCode]=useState('');
 const [phase,setPhase]=useState<'email'|'code'>('email');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [info,setInfo]=useState('');
 async function sendCode(e:React.FormEvent){
   e.preventDefault();setBusy(true);setError('');setInfo('');
   try{
     const {error:err}=await createClient().auth.signInWithOtp({email:email.trim().toLowerCase(),options:{shouldCreateUser:true}});
     if(err)throw err;
     setPhase('code');setInfo('Check your inbox for your six-digit code. If you received a link instead, the Supabase email template needs to be configured to send {{ .Token }}.');
   } catch(e:any){setError(e?.message||'Could not send code.');}finally{setBusy(false);}
 }
 async function verify(e:React.FormEvent){
   e.preventDefault();setBusy(true);setError('');
   try{
     const {data,error:err}=await createClient().auth.verifyOtp({email:email.trim().toLowerCase(),token:code.trim(),type:'email'});
     if(err||!data.session?.access_token)throw err||new Error('Email verification did not return a session');
     const res=await fetch('/ralion/api/hackathon/judge-access',{method:'POST',headers:{Authorization:`Bearer ${data.session.access_token}`}});
     if(!res.ok)throw new Error('Email verified, but we could not open the demo workspace. Please try again.');
     window.location.assign('/ralion/dashboard');
   }catch(e:any){setError(e?.message||'Verification failed.');setBusy(false);}
 }
 return <main className="min-h-full flex items-center justify-center bg-[#080d18] p-5 text-white">
   <div className="w-full max-w-lg">
     <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> Back to Ralion Adaptive</Link>
     <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#15213a] to-[#0d1422] p-7 shadow-2xl sm:p-10">
       <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15"><ShieldCheck className="h-7 w-7 text-cyan-300"/></div>
       <div className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-cyan-300">AMD Hackathon · Open evaluator access</div>
       <h1 className="mt-3 text-3xl font-extrabold">{phase==='email'?'Enter the full Ralion demo':'Verify your email'}</h1>
       <p className="mt-4 text-sm leading-relaxed text-slate-300">No organization setup, subscription or payment. Verify your email to enter our fictional Botswana safari workspace as a restricted demo member.</p>
       {phase==='email'?
         <form onSubmit={sendCode} className="mt-7 space-y-4">
           <label htmlFor="judge-email" className="block text-sm font-semibold">Email address</label>
           <input id="judge-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-slate-600 bg-slate-950 p-3.5 text-white outline-none focus:border-cyan-400"/>
           <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold disabled:opacity-50">{busy?'Sending…':'Send verification code'}<Mail size={17}/></button>
         </form>
         :<form onSubmit={verify} className="mt-7 space-y-4">
            <label htmlFor="judge-code" className="block text-sm font-semibold">Email verification code</label>
            <input id="judge-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value)} placeholder="000000" className="w-full rounded-xl border border-slate-600 bg-slate-950 p-3.5 text-lg tracking-[.25em] text-white outline-none focus:border-cyan-400"/>
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold disabled:opacity-50">{busy?'Opening workspace…':'Verify and enter workspace'}<ArrowRight size={17}/></button>
            <button type="button" onClick={()=>{setPhase('email');setCode('');setInfo('');setError('')}} className="text-sm text-slate-400 hover:text-white">Use a different email</button>
          </form>}
       {info&&<p role="status" className="mt-5 rounded-lg border border-blue-500/25 bg-blue-500/10 p-3 text-sm text-blue-100">{info}</p>}
       {error&&<p role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
       <p className="mt-7 border-t border-white/10 pt-5 text-xs leading-relaxed text-slate-400">Access is limited to the hackathon's synthetic demo. AI requests are metered (8 per verified user per day; 200 total daily). No unrestricted publishing, billing or administrator access.</p>
     </div>
   </div>
 </main>;
}
