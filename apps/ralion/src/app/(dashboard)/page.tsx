import Link from 'next/link';
import { ArrowRight, BrainCircuit, CheckCircle2, Compass, Crown, Layers3, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react';

const audiences = [
  {
    label: '01 / LUXURY EXPLORERS',
    title: 'Okavango Untamed',
    subtitle: 'Private Concession Sanctuary',
    accent: 'amber',
    summary: 'An invitation to secluded wilderness, intimate conservation experiences and thoughtfully curated luxury.',
    audience: 'Luxury travellers',
    positioning: 'Private, personal, conservation-led',
    channels: 'Instagram · Bespoke concierge',
    sample: 'The wild, on your terms. Discover Botswana beyond the ordinary.',
  },
  {
    label: '02 / ADVENTURE SEEKERS',
    title: 'Botswana Frontier',
    subtitle: 'Mobile Expeditions & Mokoro Trails',
    accent: 'blue',
    summary: 'A completely different campaign built around freedom, authentic exploration and attainable adventure.',
    audience: 'Budget-conscious adventurers',
    positioning: 'Bold, accessible, immersive',
    channels: 'Social video · Explorer communities',
    sample: 'Go further. Get closer. Discover the Botswana you came for.',
  },
] as const;

export default function PublicHackathonHome() {
  return (
    <div className="min-h-full bg-[#070a12] text-white selection:bg-cyan-500/40">
      <div className="relative isolate overflow-hidden border-b border-white/10">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(100,79,232,.30),transparent_48%),radial-gradient(ellipse_at_10%_70%,rgba(18,140,202,.18),transparent_46%)]" />
        <div aria-hidden className="pointer-events-none absolute -right-32 top-24 h-[470px] w-[470px] rounded-full border border-cyan-300/10 blur-[1px]" />
        <nav aria-label="Public navigation" className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-6 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Ralion Adaptive home">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10"><BrainCircuit className="h-6 w-6 text-cyan-300" /></span>
            <span className="leading-tight"><strong className="block text-lg tracking-[.12em]">RALION <span className="text-cyan-300">ADAPTIVE</span></strong><span className="block text-[10px] uppercase tracking-[.22em] text-slate-400">By Ras Ali Labs · Botswana</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="/explore" className="hidden text-sm text-slate-300 transition hover:text-white sm:block">Explore the experience</a>
            <Link href="/judge-access" className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/20">Judge access <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
          </div>
        </nav>

        <section className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:pb-28 lg:pt-24">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-semibold tracking-[.12em] text-violet-200"><Sparkles className="h-4 w-4" /> AMD DEVELOPER HACKATHON · ACT III</div>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.07] tracking-tight sm:text-6xl xl:text-7xl">One business.<br /><span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">Infinite possibilities.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-300">Turn one business goal into distinctly personal marketing experiences. Ralion Adaptive brings AI reasoning, audience strategy and creative direction into one connected journey.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="/explore" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3.5 font-bold shadow-lg shadow-blue-800/20 transition hover:brightness-110">Launch interactive demo <ArrowRight className="h-5 w-5" /></a>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900/60 px-6 py-3.5 font-semibold transition hover:border-cyan-400">Access full demo <ShieldCheck className="h-4 w-4" /></Link>
            </div>
            <p className="mt-5 text-xs text-slate-400">Public experience is read-only. Live AI testing requires authorized sign-in.</p>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-blue-500/15 to-fuchsia-500/15 blur-3xl" />
            <div className="relative rounded-3xl border border-white/15 bg-[#111a2b]/90 p-5 shadow-2xl shadow-blue-900/20 sm:p-7">
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-5">
                <span className="text-sm font-semibold text-slate-300">ADAPTIVE CAMPAIGN ENGINE</span>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold tracking-wider text-cyan-300">GUIDED PREVIEW</span>
              </div>
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4"><span className="text-[11px] uppercase tracking-[.18em] text-cyan-300">Business objective</span><p className="mt-2 font-semibold">Grow bookings for a Botswana safari company</p></div>
              <div className="mx-auto h-10 w-px bg-gradient-to-b from-cyan-400 to-violet-400" />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-amber-400/25 bg-gradient-to-b from-amber-500/15 to-transparent p-4"><Crown className="mb-4 h-7 w-7 text-amber-300" /><div className="text-xs uppercase tracking-wider text-amber-200">Luxury audience</div><div className="mt-2 font-bold">Exclusive escapes</div><p className="mt-2 text-xs leading-relaxed text-slate-400">Privacy · conservation · tailored stays</p></div>
                <div className="rounded-xl border border-cyan-400/25 bg-gradient-to-b from-cyan-500/15 to-transparent p-4"><Compass className="mb-4 h-7 w-7 text-cyan-300" /><div className="text-xs uppercase tracking-wider text-cyan-200">Adventure audience</div><div className="mt-2 font-bold">Go beyond</div><p className="mt-2 text-xs leading-relaxed text-slate-400">Exploration · connection · value</p></div>
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Different audiences. Distinct strategy. Human oversight.</div>
            </div>
          </div>
        </section>
      </div>

      <section id="experience" className="mx-auto max-w-7xl scroll-mt-10 px-5 py-20 sm:px-8">
        <div className="mb-10 max-w-3xl"><div className="text-sm font-bold uppercase tracking-[.22em] text-cyan-300">Experience the difference</div><h2 className="mt-4 text-3xl font-extrabold sm:text-5xl">One objective. Two entirely different journeys.</h2><p className="mt-5 text-slate-400">Meet Kalahari &amp; Okavango Wilderness Expeditions, a <strong className="text-slate-200">fictional Botswana safari business</strong>. The examples below are seeded demonstration concepts, not a live API generation.</p></div>
        <div className="grid gap-6 md:grid-cols-2">
          {audiences.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-3xl border border-white/10 bg-[#101827]">
              <div className={item.accent === 'amber' ? 'h-2 bg-gradient-to-r from-amber-500 via-orange-300 to-amber-800' : 'h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600'} />
              <div className="p-7 sm:p-9"><p className="text-xs font-bold tracking-[.2em] text-slate-400">{item.label}</p><h3 className="mt-4 text-3xl font-extrabold">{item.title}</h3><p className="mt-2 text-sm text-slate-300">{item.subtitle}</p><p className="mt-5 min-h-[64px] text-slate-400">{item.summary}</p><div className="mt-7 space-y-3 border-t border-white/10 pt-6 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-500">Audience</span><span className="text-right font-medium">{item.audience}</span></div><div className="flex justify-between gap-4"><span className="text-slate-500">Positioning</span><span className="text-right font-medium">{item.positioning}</span></div><div className="flex justify-between gap-4"><span className="text-slate-500">Channels</span><span className="text-right font-medium">{item.channels}</span></div></div><blockquote className="mt-7 rounded-xl border border-white/10 bg-white/5 p-5 text-lg font-semibold italic leading-relaxed">“{item.sample}”</blockquote></div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b1220] px-5 py-20 sm:px-8"><div className="mx-auto max-w-7xl"><div className="mb-10 text-center"><p className="text-sm font-bold uppercase tracking-[.2em] text-violet-300">Connected intelligence</p><h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">From brief to audience-ready campaign</h2></div><div className="grid gap-4 md:grid-cols-4">{[{name:'Mari AI',icon:BrainCircuit,desc:'Understand the goal and shape a strategic brief.'},{name:'Growth',icon:TrendingUp,desc:'Adapt positioning and messaging to each audience.'},{name:'Social',icon:Layers3,desc:'Prepare channel-aware drafts with human approval.'},{name:'Creative Studio',icon:Sparkles,desc:'Develop distinctive creative directions.'}].map((step) => <div key={step.name} className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><step.icon className="h-7 w-7 text-cyan-300" /><h3 className="mt-5 text-xl font-bold">{step.name}</h3><p className="mt-3 text-sm leading-relaxed text-slate-400">{step.desc}</p></div>)}</div></div></section>

      <section className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-16 sm:px-8 md:flex-row md:items-center"><div><p className="text-sm font-bold uppercase tracking-widest text-cyan-300">Ready to go deeper?</p><h2 className="mt-3 text-3xl font-extrabold">Explore the full Ralion workspace.</h2><p className="mt-3 text-slate-400">Authorized users can access the dashboard, AMD monitoring and application workflows.</p></div><Link href="/login" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-bold hover:bg-blue-500">Access full demo <ArrowRight className="h-5 w-5" /></Link></section>
      <footer className="border-t border-white/10 px-5 py-6 text-center text-xs text-slate-500">Ralion Adaptive · An AMD Developer Hackathon ACT III project · Built by Ras Ali Labs in Botswana · Demonstration data is fictional</footer>
    </div>
  );
}
