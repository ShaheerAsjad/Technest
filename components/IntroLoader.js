'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function IntroLoader() {
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState('drawing');
  const pathname = usePathname();

  useEffect(() => {
    // Only run intro animation on main home page ('/')
    if (pathname !== '/') return;

    // Check if intro has already played in this browser session
    const hasLoaded = sessionStorage.getItem('technest_intro_played');
    if (hasLoaded) return;

    // Trigger preloader on initial home load
    setVisible(true);
    sessionStorage.setItem('technest_intro_played', 'true');
    document.body.style.overflow = 'hidden';

    const popTimer = setTimeout(() => setStage('popping'), 2200);
    const fadeTimer = setTimeout(() => setStage('fading'), 3200);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = '';
    }, 4000);

    return () => {
      clearTimeout(popTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      document.body.style.overflow = '';
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className={`intro-loader intro-loader--${stage}`} aria-hidden="true">
      <div className="intro-loader__circuit-bg">
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="circuit-svg">
          <path d="M0,200 L300,200 L400,300 L450,300 L500,400" className="circuit-line circuit-line--cyan" />
          <path d="M100,0 L100,100 L250,250 L400,250 L480,350" className="circuit-line circuit-line--amber" />
          <path d="M1000,150 L750,150 L650,250 L550,250 L500,300" className="circuit-line circuit-line--cyan" />
          <path d="M0,800 L200,800 L300,700 L400,700 L500,600" className="circuit-line circuit-line--amber" />
          <path d="M150,1000 L150,850 L350,650 L450,650 L500,600" className="circuit-line circuit-line--cyan" />
          <path d="M1000,900 L800,900 L650,750 L550,750 L500,650" className="circuit-line circuit-line--cyan" />
          <path d="M350,500 L450,500 L500,500" className="circuit-line circuit-line--cyan" />
          <path d="M650,500 L550,500 L500,500" className="circuit-line circuit-line--cyan" />
          <path d="M500,350 L500,450 L500,500" className="circuit-line circuit-line--amber" />
          <path d="M500,650 L500,550 L500,500" className="circuit-line circuit-line--amber" />
          <circle cx="500" cy="400" r="4" className="circuit-node" />
          <circle cx="500" cy="600" r="4" className="circuit-node" />
          <circle cx="450" cy="500" r="4" className="circuit-node" />
          <circle cx="550" cy="500" r="4" className="circuit-node" />
        </svg>
      </div>

      <div className="intro-loader__center">
        <div className="intro-loader__logo-wrapper">
          <div className="intro-loader__glow-sphere" />
          <div className="intro-loader__logo">T</div>
        </div>
        <div className="intro-loader__text-wrapper">
          <span className="intro-loader__title">TechNest</span>
        </div>
      </div>
    </div>
  );
}