const faqs = [
  ['What is NACOS 100?', 'NACOS 100 is a limited campaign where eligible, verified NACOSites receive campaign credits and choose what they actually want instead of everyone receiving the same item.'],
  ['How do I get my 100 NACOS Coins?', 'Create an account, enter your NACOS ID and complete membership verification. Coins are issued only after the platform confirms that your NACOS membership is eligible for the campaign.'],
  ['Are NACOS Coins cash?', 'No. They are campaign-specific promotional credits. They are not legal tender, are not transferable and cannot be withdrawn as cash.'],
  ['What happens when the timer reaches zero?', 'The campaign closes based on the campaign timestamps on the server. The browser countdown is only a display of that deadline.'],
  ['Can I change my selection?', 'You can manage your cart while the campaign is open. Once an order or selection is finalized, changes are subject to the campaign and fulfilment rules.'],
  ['What is NACOSite Market?', 'It is the marketplace area for approved NACOSites to offer eligible products, services and experiences.'],
];

export const metadata = {
  title: 'How it Works | NACOS 100',
  description: 'How NACOS 100 works, from verification to selection.',
};

export default function FAQPage() {
  return (
    <main className="flex-1 bg-bg">
      <section className="mx-auto max-w-4xl px-6 py-16 sm:px-10 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-nacos-green">How it works</p>
        <h1 className="mt-4 text-5xl font-display font-bold uppercase leading-none tracking-tight sm:text-7xl">
          Your choice, explained.
        </h1>

        <div className="mt-14 divide-y-2 divide-border-main border-y-2 border-border-strong">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-bold">
                {question}
                <span className="text-2xl text-text-faint transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="max-w-3xl pt-4 text-sm leading-7 text-text-muted">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
