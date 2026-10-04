export const metadata = { title: 'Privacy Policy | NACOS 100' };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      sections={[
        ['Information we collect', 'Depending on the feature used, NACOS 100 may collect account, membership, academic, contact, campaign, order and support information necessary to operate the service.'],
        ['Why we use it', 'Information is used for account management, membership verification, campaign eligibility, order fulfilment, support, security, fraud prevention and required administration.'],
        ['Membership verification', 'Your NACOS ID may be checked against an authorized membership record. The platform should return only the information necessary to establish your eligibility.'],
        ['Payments and service providers', 'Where external providers such as payment, hosting, authentication or storage services are used, relevant information may be processed by those providers as necessary to provide the service.'],
        ['Security and retention', 'Reasonable technical and organizational safeguards are used to protect information. Information is retained only for as long as necessary for the relevant purpose, legal obligations, dispute handling and legitimate operational needs.'],
        ['Your rights', 'Applicable data protection rights and request procedures should be exercised through the contact channel published by the operator.'],
      ]}
    />
  );
}

function LegalPage({ title, sections }: { title: string; sections: [string, string][] }) {
  return (
    <main className="flex-1 bg-bg">
      <article className="mx-auto max-w-4xl px-6 py-16 sm:px-10 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-nacos-green">Legal</p>
        <h1 className="mt-4 text-5xl font-display font-bold uppercase leading-none tracking-tight sm:text-7xl">{title}</h1>
        <p className="mt-8 text-sm leading-7 text-text-muted">This policy is intended to explain the platform's current data practices and should be reviewed before production launch.</p>
        <div className="mt-14 space-y-10">{sections.map(([h,b]) => <section key={h}><h2 className="text-xl font-bold">{h}</h2><p className="mt-3 text-sm leading-7 text-text-muted">{b}</p></section>)}</div>
      </article>
    </main>
  );
}
