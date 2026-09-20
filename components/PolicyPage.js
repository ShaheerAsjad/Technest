import Link from 'next/link';

/** Simple readable layout for policy pages. */
export default function PolicyPage({ title, intro, sections = [], updated }) {
  return (
    <div className="container py-8 policy-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol className="breadcrumbs__list">
          <li className="breadcrumbs__item"><Link href="/">Home</Link></li>
          <li className="breadcrumbs__separator" aria-hidden="true">/</li>
          <li className="breadcrumbs__item breadcrumbs__item--current" aria-current="page">{title}</li>
        </ol>
      </nav>
      <h1 className="page-title mt-4">{title}</h1>
      {updated && <p className="policy-page__updated">Last updated: {updated}</p>}
      {intro && <p className="policy-page__intro">{intro}</p>}
      {sections.map((s) => (
        <section key={s.title} className="policy-page__section">
          <h2>{s.title}</h2>
          {(Array.isArray(s.body) ? s.body : [s.body]).map((para, i) => <p key={i}>{para}</p>)}
          {s.list && <ul>{s.list.map((li, i) => <li key={i}>{li}</li>)}</ul>}
        </section>
      ))}
      <p className="policy-page__foot">Questions? <Link href="/contact">Contact us</Link>.</p>
    </div>
  );
}
