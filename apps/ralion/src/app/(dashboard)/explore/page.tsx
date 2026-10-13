'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, Compass, Crown, Sparkles, ShieldCheck, Target, Megaphone, BarChart3 } from 'lucide-react';

const campaigns = {
  luxury: {
    label: 'Luxury travellers', title: 'Okavango Untamed', subtitle: 'Private Concession Sanctuary',
    tagline: 'The wild, on your terms.',
    audience: 'Affluent experiential travellers, conservation patrons and private safari guests.',
    motivation: 'Privacy, bespoke experiences, sustainability and meaningful connection to the wilderness.',
    positioning: 'An exclusive, conservation-led Botswana escape with personal guidance and tailored itineraries.',
    message: 'Trade the ordinary for an intimate Okavango sanctuary, where every encounter is your own.',
    channels: ['Instagram editorial carousel', 'Premium travel partnerships', 'Concierge email campaign'],
    creative: 'Golden-hour waterways, intimate tented suites, close-up conservation storytelling, restrained gold typography.',
    cta: 'Enquire about a private safari', tone: 'Understated · premium · aspirational', accent: 'amber',
  },
  adventure: {
    label: 'Budget-conscious adventurers', title: 'Botswana Frontier', subtitle: 'Mobile Expedition & Mokoro Trails',
    tagline: 'Go further. Get closer.',
    audience: 'Independent explorers, mobile-camping enthusiasts and wildlife photographers.',
    motivation: 'Authentic wilderness, practical value, discovery, community and hands-on experiences.',
    positioning: 'Accessible, adventurous guided expeditions that bring travellers closer to Botswana’s landscapes.',
    message: 'Follow the river, share the campfire and discover Botswana one unforgettable trail at a time.',
    channels: ['Short-form social video', 'Explorer travel communities', 'Adventure email newsletter'],
    creative: 'Dynamic trail footage, mokoro paddling, campfire imagery, energetic type and action-forward storytelling.',
    cta: 'Explore adventure departures', tone: 'Energetic · inviting · authentic', accent: 'cyan',
  },
} as const;

export default function ExploreDemoPage() {
 const [selected, setSelected] = useState<'luxury'|'adventure'>('luxury');
 const [step, setStep] = useState(0);
 const campaign = campaigns[selected];
 const steps = ['Business objective','Audience intelligence','Adaptive strategy','Campaign preview'];
 return <main className="min-h-full overflow-y-auto bg-[#080d18] text-white">
   <div className="mx-auto max-w-6xl px-5 pb-20 pt-7 sm:px-8">
     <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-6">
       <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft size={17}/> Back to Ralion Adaptive</Link>
       <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-200">PUBLIC GUIDED DEMO · NO LOGIN REQUIRED</span>
       <Link href="/login" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">Sign in <ArrowRight size={15}/></Link>
     </nav>
     <div className="pt-12"><div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-cyan-300"><Sparkles size={16}/> Ralion Adaptive · Experience walkthrough</div>
       <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">One objective.<br/><span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">Two powerful directions.</span></h1>
       <p className="mt-5 max-w-2xl text-slate-300">Step through how Mari and Growth would adapt one fictional Botswana safari business objective for two different audiences.</p>
       <p className="mt-3 text-xs text-amber-200/90">Interactive guided example using synthetic campaign content. This preview does not call AMD or read protected customer records.</p>
     </div>
     <div className="mt-10 grid gap-6 lg:grid-cols-[300px_1fr]">
       <aside className="space-y-4">
         <div className="rounded-2xl border border-white/10 bg-[#111c2f] p-5"><div className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Your journey</div>
         {steps.map((name,i)=><button key={name} onClick={()=>setStep(i)} className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${step===i?'bg-blue-600 text-white':'text-slate-300 hover:bg-white/10'}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/30 text-xs">{i+1}</span>{name}</button>)}</div>
         <div className="rounded-2xl border border-white/10 bg-[#111c2f] p-5"><div className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Compare audiences</div>
           <button onClick={()=>setSelected('luxury')} aria-pressed={selected==='luxury'} className={`mb-2 flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm ${selected==='luxury'?'border-amber-400 bg-amber-400/10':'border-white/10 hover:bg-white/5'}`}><Crown className="h-5 w-5 text-amber-300"/>Luxury travellers</button>
           <button onClick={()=>setSelected('adventure')} aria-pressed={selected==='adventure'} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm ${selected==='adventure'?'border-cyan-400 bg-cyan-400/10':'border-white/10 hover:bg-white/5'}`}><Compass className="h-5 w-5 text-cyan-300"/>Adventure travellers</button>
         </div>
       </aside>
       <section aria-live="polite" className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#14223a] to-[#0c1525] p-6 sm:p-9">
         <div className="mb-8 flex items-center justify-between gap-2 border-b border-white/10 pb-5"><div className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">STEP {step+1} / 04</div><div className="text-xs text-slate-400">{steps[step]}</div></div>
         {step===0&&<div><Target className="h-10 w-10 text-cyan-300"/><h2 className="mt-5 text-3xl font-extrabold">The business challenge</h2><p className="mt-5 text-xl text-white">Grow bookings for Kalahari &amp; Okavango Wilderness Expeditions.</p><p className="mt-4 max-w-2xl leading-relaxed text-slate-300">A fictional safari business based in Maun, Botswana needs to appeal to travellers with radically different motivations without losing its brand identity.</p><div className="mt-9 rounded-xl border border-blue-400/20 bg-blue-400/5 p-5"><div className="mb-2 font-bold text-blue-200">Mari AI · Strategic brief</div><p className="text-sm leading-relaxed text-slate-300">Define the objective, understand the business context and establish audience-specific paths before developing content.</p></div></div>}
         {step===1&&<div><BrainCircuit className="h-10 w-10 text-cyan-300"/><h2 className="mt-5 text-3xl font-extrabold">{campaign.label}</h2><p className="mt-4 text-lg text-slate-200">{campaign.audience}</p><div className="mt-7 rounded-xl border border-white/10 bg-white/5 p-5"><div className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-300">Primary motivations</div><p className="leading-relaxed text-slate-200">{campaign.motivation}</p></div><p className="mt-5 text-sm text-slate-400">Switch audience on the left to see the reasoning context change.</p></div>}
         {step===2&&<div><BarChart3 className="h-10 w-10 text-violet-300"/><h2 className="mt-5 text-3xl font-extrabold">Growth · Adaptive strategy</h2><div className="mt-7 space-y-5"><div className="rounded-xl border border-white/10 bg-white/5 p-5"><div className="text-xs font-bold uppercase tracking-widest text-cyan-300">Positioning</div><p className="mt-2 leading-relaxed text-slate-200">{campaign.positioning}</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-5"><div className="text-xs font-bold uppercase tracking-widest text-cyan-300">Recommended channels</div><ul className="mt-3 space-y-2">{campaign.channels.map(x=><li className="flex items-center gap-2 text-sm text-slate-200" key={x}><CheckCircle2 className="h-4 w-4 text-emerald-400"/>{x}</li>)}</ul></div><div className="text-sm text-slate-400">Messaging tone: <strong className="text-white">{campaign.tone}</strong></div></div></div>}
         {step===3&&<div><Megaphone className="h-10 w-10 text-amber-300"/><div className="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">{campaign.subtitle}</div><h2 className="mt-2 text-4xl font-extrabold">{campaign.title}</h2><div className="mt-7 rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-600/20 to-cyan-600/10 p-7"><div className="mb-3 text-xs font-bold uppercase tracking-widest text-violet-200">Example campaign copy</div><p className="text-3xl font-extrabold leading-tight">{campaign.tagline}</p><p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-200">{campaign.message}</p><div className="mt-6 inline-block rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-950">{campaign.cta}</div></div><div className="mt-5 rounded-xl border border-white/10 p-5"><div className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-300">Creative Studio direction</div><p className="text-sm leading-relaxed text-slate-300">{campaign.creative}</p></div><p className="mt-5 flex items-center gap-2 text-xs text-amber-200"><ShieldCheck size={16}/> Sample draft only · publishing requires human approval</p></div>}
         <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6"><button onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0} className="rounded-lg border border-white/20 px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40">Previous</button>{step<3?<button onClick={()=>setStep(step+1)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold hover:bg-blue-500">Next step <ArrowRight size={16}/></button>:<button onClick={()=>{setSelected(selected==='luxury'?'adventure':'luxury');setStep(1)}} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-bold hover:bg-violet-500">Compare other audience <ArrowRight size={16}/></button>}</div>
       </section>
     </div>
     <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-8 text-center"><h2 className="text-2xl font-bold">Go beyond the guided example</h2><p className="max-w-xl text-sm leading-relaxed text-slate-400">Authorized users can sign in to the Ralion dashboard and AMD Monitoring Centre. Live AMD inference is not part of this anonymous preview.</p><Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold">Sign in to Ralion <ArrowRight size={16}/></Link></div>
   </div>
 </main>;
}
