'use client';

import { useEffect, useRef, useState } from 'react';

export default function IntroLoader() {
  const [visible, setVisible] = useState(false);
  const [animStage, setAnimStage] = useState('active'); // active -> fadeout -> done
  const startedRef = useRef(false);

  useEffect(() => {
    // Guard against React Strict Mode's development double-invoke of
    // effects. Without this, the effect below runs twice in quick
    // succession — the first run marks sessionStorage as "played", so
    // the second run sees that flag and bails out before the loader
    // ever becomes visible. startedRef persists across both synthetic
    // invocations (same component instance), so only the first one
    // actually proceeds.
    if (startedRef.current) return;
    startedRef.current = true;

    // Session storage check to only play once per session
    let alreadyPlayed = false;
    try {
      alreadyPlayed = sessionStorage.getItem('technest_intro_session_v5') === 'true';
    } catch (e) {
      // Ignore — sessionStorage unavailable, intro will just replay
    }

    if (alreadyPlayed) return;

    try {
      sessionStorage.setItem('technest_intro_session_v5', 'true');
    } catch (e) {
      // Ignore
    }

    // Play loader
    setVisible(true);
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      setAnimStage('fadeout');
    }, 1800);

    setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = '';
    }, 2400);

    // Intentionally no cleanup here that cancels the timers above —
    // this is a one-shot splash effect that should run to completion
    // once genuinely mounted at the root layout.
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