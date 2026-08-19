'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Three.js canvas — client-side only, no SSR
const ParticleHero = dynamic(() => import('./ParticleHero'), {
  ssr: false,
  loading: () => null,
});

export default function Hero() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const overlayRef = useRef(null);

  // Scroll-linked parallax: content rises & fades, overlay deepens
  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    let ticking = false;

    const update = () => {
      const rect     = section.getBoundingClientRect();
      const progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);

      if (content) {
        content.style.transform = `translateY(${progress * 50}px)`;
        content.style.opacity   = String(1 - progress * 0.85);
      }
      if (overlayRef.current) {
        overlayRef.current.style.opacity = String(0.55 + progress * 0.35);
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="hero" ref={sectionRef}>

      {/* ── Three.js Particle Canvas — absolute behind everything ── */}
      <ParticleHero />

      {/* Overlays stacked on top of canvas */}
      <div className="hero__overlay" ref={overlayRef} />
      <div className="hero__grid" aria-hidden="true" />

      {/* Subtle radial light leaks (keep from old design) */}
      <span className="hero__glow hero__glow--a" />
      <span className="hero__glow hero__glow--b" />

      {/* ── Content ── */}
      <div className="hero__content" ref={contentRef}>
        <span className="hero__badge">
          <span style={{ color: 'var(--cyan)', fontSize: '10px' }}>✦</span>
          &nbsp;2026 Collection — Now Live
        </span>

        <h1 className="hero__title">
          Intelligent Solutions<br />
          <em>Powered by Tech.</em>
        </h1>

        <p className="hero__subtitle">
          Phones, laptops, gaming gear, and accessories —<br />
          all curated for the next generation of makers.
        </p>

        <div className="hero__cta-row">
          <Link href="/products" className="btn btn--primary hero__cta">
            Shop Now
          </Link>
          <Link href="/about" className="btn btn--ghost hero__cta-secondary">
            Learn More →
          </Link>
        </div>

        {/* Trust badges */}
        <div className="hero__trust">
          <span className="hero__trust-item">
            <span className="hero__trust-dot" />
            Free Shipping $100+
          </span>
          <span className="hero__trust-sep" aria-hidden="true">·</span>
          <span className="hero__trust-item">
            <span className="hero__trust-dot" />
            Cash on Delivery
          </span>
          <span className="hero__trust-sep" aria-hidden="true">·</span>
          <span className="hero__trust-item">
            <span className="hero__trust-dot" />
            Easy Returns
          </span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll-hint" aria-hidden="true">
        <span className="hero__scroll-dot" />
      </div>
    </section>
  );
}
