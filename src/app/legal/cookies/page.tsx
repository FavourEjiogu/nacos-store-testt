export const metadata = { title: 'Cookie Notice | NACOS 100' };

export default function CookiesPage() {
  return (
    <main className="flex-1 bg-bg">
      <article className="mx-auto max-w-4xl px-6 py-16 sm:px-10 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-nacos-green">Legal</p>
        <h1 className="mt-4 text-5xl font-display font-bold uppercase leading-none tracking-tight sm:text-7xl">Cookie Notice</h1>
        <div className="mt-10 space-y-8 text-sm leading-7 text-text-muted">
          <p>NACOS 100 may use essential cookies or similar browser storage mechanisms required for authentication, security and core application functionality.</p>
          <p>Optional analytics or marketing technologies should only be introduced with the appropriate disclosures and consent controls where required. This notice must be updated if such technologies are added.</p>
          <p>Do not disable essential session cookies if you need to sign in or use authenticated campaign features.</p>
        </div>
      </article>
    </main>
  );
}
