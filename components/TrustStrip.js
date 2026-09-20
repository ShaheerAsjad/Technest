/** Four honest reassurance points under the hero. Text comes from store settings. */
export default function TrustStrip({ eta = '', freeText = '' }) {
  const items = [
    { icon: '✔', title: 'Genuine Products', text: 'Original, brand-warranty items' },
    { icon: '⚡', title: 'Fast Delivery', text: eta ? `Delivered in ${eta}` : 'Nationwide delivery' },
    { icon: '₨', title: 'Cash on Delivery', text: freeText || 'Pay when you receive' },
    { icon: '🏢', title: 'Bulk / B2B Pricing', text: 'Special rates for larger orders' },
  ];
  return (
    <section className="truststrip" aria-label="Why shop with us">
      {items.map((i) => (
        <div key={i.title} className="truststrip__item">
          <span className="truststrip__icon" aria-hidden="true">{i.icon}</span>
          <div>
            <strong>{i.title}</strong>
            <span>{i.text}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
