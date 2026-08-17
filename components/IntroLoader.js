'use client';

import { useEffect, useState } from 'react';

export default function IntroLoader() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let shown = true;
    try {
      shown = sessionStorage.getItem('technest_intro_shown');
    } catch {
      shown = true;
    }
    if (shown) return;

    setVisible(true);
    document.body.style.overflow = 'hidden';

    const fadeTimer = setTimeout(() => setFading(true), 900);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = '';
      try {
        sessionStorage.setItem('technest_intro_shown', '1');
      } catch {
        // sessionStorage unavailable — intro will simply replay next load
      }
    }, 1300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      document.body.style.overflow = '';
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`intro-loader${fading ? ' intro-loader--fading' : ''}`}>
      <div className="intro-loader__glow" />
      <div className="intro-loader__mark">
        <span className="intro-loader__ring" />
        <span className="intro-loader__logo">N</span>
      </div>
      <p className="intro-loader__text">TechNest</p>
    </div>
  );
}
