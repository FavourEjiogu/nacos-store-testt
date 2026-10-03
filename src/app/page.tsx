import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl mx-auto space-y-12">
        <h1 className="text-[6rem] sm:text-[10rem] md:text-[12rem] font-bold leading-none tracking-tighter">
          100
        </h1>
        
        <div className="space-y-4">
          <p className="text-2xl sm:text-3xl font-display font-bold uppercase">
            THE MERCH WASN&apos;T THE PROBLEM.
          </p>
          <p className="text-2xl sm:text-3xl font-display font-bold uppercase text-text-muted">
            CHOOSING ONE THING FOR EVERYBODY WAS.
          </p>
        </div>

        <div className="text-lg sm:text-xl text-text-muted max-w-xl mx-auto space-y-4">
          <p>So we&apos;re doing it differently.</p>
          <p>Every verified NACOSite gets <strong>100 NACOS Coins</strong>.</p>
          <p>Choose what you want. Build your cart over 14 days. We&apos;ll consolidate the orders when the drop closes.</p>
        </div>

        <div className="py-8">
          <div className="inline-block p-6 border-2 border-border-strong rounded-xl bg-bg-subtle space-y-2">
            <p className="text-sm font-bold tracking-widest text-text-faint uppercase">THE DROP CLOSES IN</p>
            <p className="text-4xl sm:text-5xl font-display font-bold tabular-nums">
              13D 07H 42M
            </p>
          </div>
        </div>

        <div>
          <Link 
            href="/onboarding" 
            className="inline-flex h-14 items-center justify-center bg-black text-white px-10 text-lg font-bold uppercase hover:scale-95 transition-transform"
          >
            START NOW &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
