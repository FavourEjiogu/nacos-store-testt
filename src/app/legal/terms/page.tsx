export const metadata = { title: 'Terms & Conditions | NACOS 100' };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      intro="These terms describe the rules for using NACOS 100, participating in campaigns and interacting with supported marketplace features."
      sections={[
        ['Eligibility', 'Participation is limited to users who meet the eligibility requirements stated for the relevant campaign. Membership verification may be required before campaign credits are issued.'],
        ['NACOS Coins', 'NACOS Coins are campaign-specific promotional credits. They are not cash, are not legal tender, are not transferable and have no cash redemption value unless a campaign explicitly states otherwise.'],
        ['Campaigns', 'Campaign dates, eligibility, available products and selection deadlines are determined by the applicable campaign configuration and published campaign information. Server-side campaign timestamps control whether actions are permitted.'],
        ['Products and services', 'Product information should be accurate and complete. Availability may change. Marketplace offerings may be subject to additional seller or campaign rules.'],
        ['Acceptable use', 'Do not attempt to bypass membership verification, manipulate balances, interfere with another account, submit malicious content or abuse the platform.'],
        ['Changes', 'Campaign rules and these terms may be updated when reasonably necessary. Material changes should be communicated through appropriate channels.'],
      ]}
    />
  );
}

function LegalPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro: string; sections: [string, string][] }) {
  return (
    <main className="flex-1 bg-bg">
      <article className="mx-auto max-w-4xl px-6 py-16 sm:px-10 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-nacos-green">{eyebrow}</p>
        <h1 className="mt-4 text-5xl font-display font-bold uppercase leading-none tracking-tight sm:text-7xl">{title}</h1>
        <p className="mt-8 max-w-3xl text-base leading-7 text-text-muted">{intro}</p>
        <div className="mt-14 space-y-10">
          {sections.map(([heading, body]) => (
            <section key={heading}>
              <h2 className="text-xl font-bold">{heading}</h2>
              <p className="mt-3 text-sm leading-7 text-text-muted">{body}</p>
            </section>
          ))}
        </div>
        <p className="mt-16 border-t border-border-main pt-6 text-xs leading-6 text-text-faint">
          This page is a product policy summary and should be reviewed against the final operating model before launch.
        </p>
      </article>
    </main>
  );
}
