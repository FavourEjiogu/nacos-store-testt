import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import CountdownClient from '@/components/CountdownClient';

export default async function Home() {
  const supabase = await createClient();
  
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('ends_at, status')
    .in('status', ['SCHEDULED', 'LIVE', 'ENDING'])
    .order('ends_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-[#FAFAFA]">
      
      {/* iOS style background blurs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-nacos-green/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-black/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/3 pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-16 relative z-10">
        
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-bold leading-none tracking-tighter text-black">
            NACOS 100
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold uppercase text-black/40 tracking-widest">
            100 COINS. 14 DAYS. YOUR CHOICE.
          </p>
        </div>

        <div className="text-lg sm:text-xl text-black/60 max-w-2xl mx-auto space-y-6 font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 ease-out fill-mode-both">
          <p>The merch wasn't the problem. Choosing one thing for everybody was.</p>
          <p>Every verified NACOSite gets <strong className="text-black">100 NACOS Coins</strong> to spend however they want during the drop.</p>
        </div>

        {campaign ? (
          <div className="py-8 animate-in fade-in zoom-in-95 duration-700 delay-300 ease-out fill-mode-both">
            <div className="inline-block p-8 border border-black/10 rounded-3xl bg-white/60 backdrop-blur-xl shadow-lg shadow-black/5 space-y-3">
              <p className="text-xs font-bold tracking-[0.2em] text-black/40 uppercase">THE DROP CLOSES IN</p>
              <CountdownClient endsAt={campaign.ends_at} />
            </div>
          </div>
        ) : (
          <div className="py-8">
            <div className="inline-block p-8 border border-black/10 rounded-3xl bg-white/60 backdrop-blur-xl shadow-lg shadow-black/5">
              <p className="text-sm font-bold tracking-widest text-black/60 uppercase">NO ACTIVE DROPS</p>
            </div>
          </div>
        )}

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 ease-out fill-mode-both">
          <Link 
            href="/onboarding" 
            className="inline-flex h-16 items-center justify-center bg-black text-white px-12 rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20"
          >
            START NOW
          </Link>
        </div>
      </div>
    </main>
  );
}
