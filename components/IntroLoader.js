'use client';

import { useEffect, useState } from 'react';

export default function IntroLoader() {
  const [visible, setVisible] = useState(false);
  const [animStage, setAnimStage] = useState('active'); // active -> fadeout -> done

  useEffect(() => {
    // Session storage check to only play once per session
    try {
      const played = sessionStorage.getItem('technest_intro_session_v5');
      if (played === 'true') {
        return;
      }
      sessionStorage.setItem('technest_intro_session_v5', 'true');
    } catch (e) {
      // Ignore
    }

    // Play loader
    setVisible(true);
    document.body.style.overflow = 'hidden';

    const fadeTimer = setTimeout(() => {
      setAnimStage('fadeout');
    }, 1800);

    const endTimer = setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = '';
    }, 2400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
      document.body.style.overflow = '';
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`technest-preloader ${animStage === 'fadeout' ? 'technest-preloader--fade' : ''}`}>
      {/* Radial Futuristic Background Glow */}
      <div className="technest-preloader__bg-glow" />

      {/* Cyber Grid Lines */}
      <div className="technest-preloader__grid" />

      {/* Central Content */}
      <div className="technest-preloader__content">
        {/* Animated Ring */}
        <div className="technest-preloader__ring-container">
          <div className="technest-preloader__ring technest-preloader__ring--outer" />
          <div className="technest-preloader__ring technest-preloader__ring--inner" />
          <div className="technest-preloader__logo">T</div>
        </div>

        {/* Title */}
        <h1 className="technest-preloader__title">
          TECH<span className="technest-preloader__title-accent">NEST</span>
        </h1>

        {/* Loading Bar */}
        <div className="technest-preloader__bar-track">
          <div className="technest-preloader__bar-fill" />
        </div>
        <span className="technest-preloader__status">INITIALIZING SYSTEM...</span>
      </div>
    </div>
  );
}