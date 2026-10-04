export const metadata = { title: 'Returns & Refunds | NACOS 100' };

export default function RefundsPage() {
  return (
    <main className="flex-1 bg-bg">
      <article className="mx-auto max-w-4xl px-6 py-16 sm:px-10 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-nacos-green">Legal</p>
        <h1 className="mt-4 text-5xl font-display font-bold uppercase leading-none tracking-tight sm:text-7xl">Returns & Refunds</h1>
        <div className="mt-10 space-y-8 text-sm leading-7 text-text-muted">
          <p>Returns, cancellations, refunds and fulfilment remedies depend on the product, campaign and payment method involved. The applicable terms should be presented before a user commits to a cash payment.</p>
          <p>Where a payment provider is used, a provider transaction does not by itself determine the application's order state. Payment status is verified against the provider and the corresponding order.</p>
          <p>Promotional NACOS Coins are not cash and are not automatically refundable as money. Any reversal or adjustment must follow the applicable campaign rules.</p>
        </div>
      </article>
    </main>
  );
}
