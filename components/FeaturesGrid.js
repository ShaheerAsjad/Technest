'use client';

export default function FeaturesGrid() {
  const features = [
    {
      title: 'Real-time AI Analytics',
      desc: 'Harness the power of machine learning to track inventory and user behavior in real time.',
      icon: '🧠',
      glowColor: 'var(--amber)'
    },
    {
      title: 'Hyper-Fast Checkout',
      desc: 'Seamless zero-latency checkout flows with top-tier encryption for your peace of mind.',
      icon: '⚡',
      glowColor: 'var(--cyan)'
    },
    {
      title: 'Automated Restocking',
      desc: 'Never run out of stock. Our AI predicts demand and triggers supply chain alerts.',
      icon: '📦',
      glowColor: 'var(--color-success)'
    },
    {
      title: 'Global Distribution',
      desc: 'Edge-cached product catalog ensures lightning-fast load times anywhere in the world.',
      icon: '🌍',
      glowColor: 'var(--color-danger)'
    }
  ];

  return (
    <section className="features-grid-section py-16">
      <div className="container">
        <div className="features-grid__header">
          <h2 className="section-title text-center">Powerful Features</h2>
          <p className="features-grid__sub text-center">
            Explore the frontier of tech. Our latest features redefine the boundaries of what is possible.
          </p>
        </div>

        <div className="features-grid__layout mt-12">
          {/* Main Feature Highlight (Left) */}
          <div className="feature-card feature-card--featured">
            <div className="feature-card__glow" style={{ background: 'var(--cyan)' }} aria-hidden="true" />
            <div className="feature-card__content">
              <h3>Top Management, to help you see the bigger picture</h3>
              <p>Gain clarity and harness the power of your data with TechNest. Our intuitive dashboard provides real-time analytics.</p>
              
              <ul className="feature-card__list">
                <li>
                  <span className="feature-card__check">✔</span> Customisable layouts for efficient tracking
                </li>
                <li>
                  <span className="feature-card__check">✔</span> Dark preferences to match your style
                </li>
                <li>
                  <span className="feature-card__check">✔</span> Create multiple profiles for versatility
                </li>
              </ul>
              
              <button className="btn btn--primary btn--small mt-4">See Doc →</button>
            </div>
            {/* Abstract visual mockup */}
            <div className="feature-card__visual">
               <div className="feature-card__mock-panel">
                 <div className="feature-card__mock-row"></div>
                 <div className="feature-card__mock-row"></div>
                 <div className="feature-card__mock-circle">
                   <div className="feature-card__mock-shield">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Grid of smaller features (Right) */}
          <div className="features-grid__items">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card feature-card--small">
                <div className="feature-card__glow" style={{ background: feature.glowColor }} aria-hidden="true" />
                <div className="feature-card__icon">{feature.icon}</div>
                <h4 className="feature-card__title">{feature.title}</h4>
                <p className="feature-card__desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Strip */}
        <div className="features-integrations mt-16">
          <p className="features-integrations__text">Join 4,000+ companies already growing</p>
          <div className="features-integrations__logos">
            <span className="features-integrations__logo">◎ Trace</span>
            <span className="features-integrations__logo">◒ Volume</span>
            <span className="features-integrations__logo">◈ Clues</span>
            <span className="features-integrations__logo">▤ Rise</span>
            <span className="features-integrations__logo">◎ Trace</span>
          </div>
        </div>
      </div>
    </section>
  );
}
