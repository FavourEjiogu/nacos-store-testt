import Link from 'next/link';

export const metadata = { title: 'Contact Us | NACOS 100' };

export default function ContactPage() {
  return (
    <main className="flex-1 bg-bg-subtle">
      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-10 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-nacos-green">Support</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-display font-bold uppercase leading-[0.92] tracking-tight sm:text-7xl">
          Need a hand?
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-text-muted">
          For account, membership verification, campaign or fulfilment questions, contact the NACOS Store support team.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          <a href="mailto:support@nacos.org" className="border-2 border-border-strong bg-bg p-7 transition-transform hover:-translate-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-faint">Email</p>
            <p className="mt-3 text-xl font-bold">support@nacos.org</p>
            <p className="mt-2 text-sm text-text-muted">For support and campaign questions.</p>
          </a>
          <Link href="/faq" className="border-2 border-border-strong bg-black p-7 text-white transition-transform hover:-translate-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Before you email</p>
            <p className="mt-3 text-xl font-bold">Read How It Works</p>
            <p className="mt-2 text-sm text-white/60">Find answers to common campaign questions.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
