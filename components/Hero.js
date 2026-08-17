'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

const HERO_IMAGE =
  'https://images.pexels.com/photos/986774/pexels-photo-986774.jpeg?auto=compress&cs=tinysrgb&w=1600';

export default function Hero() {
  const imageRef = useRef(null);
  const sectionRef = useRef(null);

  // Scroll-linked zoom: the background image slowly scales up as the user
  // scrolls past the hero, similar to a parallax "zoom into the scene" effect.
  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    if (!section || !image) return;

    let ticking = false;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);
      const scale = 1 + progress * 0.18;
      image.style.transform = `scale(${scale})`;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="hero" ref={sectionRef}>
      <div className="hero__image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imageRef} src={HERO_IMAGE} alt="" className="hero__image" />
      </div>
      <div className="hero__overlay" />
      <span className="hero__glow hero__glow--a" />
      <span className="hero__glow hero__glow--b" />

      <div className="hero__content">
        <span className="hero__badge">✦ New season, new tech</span>
        <h1 className="hero__title">Tech that moves you forward</h1>
        <p className="hero__subtitle">
          Phones, laptops, gaming gear, and accessories — all in one place.
        </p>
        <div className="hero__cta-row">
          <Link href="/products" className="btn btn--primary hero__cta">
            Shop Now
          </Link>
          <Link href="/about" className="btn btn--ghost hero__cta-secondary">
            Learn More →
          </Link>
        </div>
      </div>

      <div className="hero__scroll-hint" aria-hidden="true">
        <span className="hero__scroll-dot" />
      </div>
    </section>
  );
}
