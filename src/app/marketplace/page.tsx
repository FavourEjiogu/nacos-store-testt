import Link from 'next/link';

export const metadata = {
  title: 'NACOSite Market | NACOS 100',
  description: 'Products and services from verified NACOSites.',
};

export default function MarketplacePage() {
  return (
    <main className="flex-1 bg-bg-subtle">
      <section className="border-b-2 border-border-strong bg-bg px-6 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-text-faint">NACOSite Market</p>
          <h1 className="max-w-4xl text-5xl font-display font-bold uppercase leading-[0.9] tracking-tight sm:text-7xl">
            Things made, sold & offered by NACOSites.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-text-muted sm:text-lg">
            A place for approved NACOSites to offer products, services and experiences to the community.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ['PRODUCTS', 'Physical products, accessories and useful things made or sourced by NACOSites.'],
            ['SERVICES', 'Skills, creative work, technical services and other approved offerings.'],
            ['EXPERIENCES', 'Community activities and other campaign-approved experiences.'],
          ].map(([title, body]) => (
            <article key={title} className="border-2 border-border-strong bg-bg p-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-nacos-green">{title}</p>
              <p className="mt-5 text-sm leading-6 text-text-muted">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 border-2 border-black bg-black p-7 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">COMING INTO THE DROP</p>
          <h2 className="mt-3 text-3xl font-display font-bold uppercase">Want to sell on NACOSite Market?</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">
            Seller access is approval-based. Products must meet the campaign and marketplace rules before they are published.
          </p>
          <Link href="/contact" className="mt-7 inline-flex min-h-11 items-center bg-white px-6 text-sm font-bold uppercase tracking-widest text-black">
            Contact the team
          </Link>
        </div>
      </section>
    </main>
  );
}
