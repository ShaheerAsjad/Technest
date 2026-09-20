'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import SafeBoundary from './SafeBoundary';

// Three.js canvas — client-side only, no SSR
const ParticleHero = dynamic(() => import('./ParticleHero'), {
  ssr: false,
  loading: () => null,
});

export default function Hero({ freeShippingText = '' }) {
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
      <SafeBoundary name="ParticleHero" fallback={null}>
        <ParticleHero />
      </SafeBoundary>

      {/* Overlays stacked on top of canvas */}
      <div className="hero__overlay" ref={overlayRef} />
      <div className="hero__grid" aria-hidden="true" />

      {/* Subtle radial light leaks (keep from old design) */}
      <span className="hero__glow hero__glow--a" />
      <span className="hero__glow hero__glow--b" />

      {/* ── Content ── */}
      <div className="hero__content" ref={contentRef}>
        <span className="hero__badge" style={{ borderColor: 'rgba(255,102,0,0.3)', background: 'rgba(255,102,0,0.05)' }}>
          <span style={{ color: '#FF6600', fontSize: '10px' }}>✦</span>
          &nbsp;Networking, CCTV &amp; IT Hardware
        </span>

        <h1 className="hero__title">
          Reliable Hardware<br />
          <em style={{ color: '#FF6600', WebkitTextFillColor: 'initial' }}>For Every Network.</em>
        </h1>

        <p className="hero__subtitle">
          Fiber, switches, CCTV, racks and accessories from trusted brands &mdash;<br />
          alongside the latest phones, laptops and gaming gear.
        </p>

        <div className="hero__cta-row">
          <Link href="/products" className="btn btn--primary hero__cta" style={{ background: '#FF6600', color: '#000', boxShadow: '0 0 20px rgba(255,102,0,0.4)' }}>
            Shop Now
          </Link>
          <Link href="/products?dept=networking" className="btn btn--ghost hero__cta-secondary" style={{ borderColor: 'rgba(255,102,0,0.3)', color: '#FF6600' }}>
            Networking &amp; IT →
          </Link>
        </div>

        {/* Trust badges */}
        <div className="hero__trust">
          <span className="hero__trust-item">
            <span className="hero__trust-dot" style={{ background: '#FF6600', boxShadow: '0 0 8px #FF6600' }} />
            {freeShippingText || 'Nationwide Delivery'}
          </span>
          <span className="hero__trust-sep" aria-hidden="true">·</span>
          <span className="hero__trust-item">
            <span className="hero__trust-dot" style={{ background: '#FF6600', boxShadow: '0 0 8px #FF6600' }} />
            Cash on Delivery
          </span>
          <span className="hero__trust-sep" aria-hidden="true">·</span>
          <span className="hero__trust-item">
            <span className="hero__trust-dot" style={{ background: '#FF6600', boxShadow: '0 0 8px #FF6600' }} />
            Genuine Products
          </span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll-hint" aria-hidden="true">
        <span className="hero__scroll-dot" style={{ background: '#FF6600' }} />
      </div>
    </section>
  );
}
