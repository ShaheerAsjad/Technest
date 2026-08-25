'use client';

import { useEffect, useRef, useState } from 'react';

// Bumping this key means any "already played" flag left over from
// earlier testing sessions is ignored — the intro will show fresh
// the next time this code ships, regardless of old sessionStorage
// state in your browser.
const SESSION_KEY = 'technest_intro_v7';

export default function IntroLoader() {
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState('in'); // in -> hold -> out
  const startedRef = useRef(false);

  useEffect(() => {
    // React Strict Mode (development only) invokes effects twice in a
    // row. startedRef persists across both invocations of the SAME
    // component instance, so only the first invocation actually runs
    // the logic below — the second is a harmless no-op.
    if (startedRef.current) return;
    startedRef.current = true;

    let alreadyPlayed = false;
    try {
      alreadyPlayed = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // sessionStorage unavailable (private mode etc.) — just play it
    }

    if (alreadyPlayed) return;

    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* ignore */
    }

    setVisible(true);
    document.body.style.overflow = 'hidden';

    // Timeline: rings + logo animate in (CSS handles this on mount),
    // hold for a beat, then fade the whole overlay out.
    setTimeout(() => setStage('out'), 1900);
    setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = '';
    }, 2500);
  }, []);

  if (!visible) return null;

  return (
    <div className={`intro2${stage === 'out' ? ' intro2--out' : ''}`}>
      <div className="intro2__grid" aria-hidden="true" />

      <div className="intro2__center">
        <div className="intro2__rings" aria-hidden="true">
          <span className="intro2__ring intro2__ring--1" />
          <span className="intro2__ring intro2__ring--2" />
          <span className="intro2__ring intro2__ring--3" />
          <span className="intro2__core" />
          <span className="intro2__mark">T</span>
        </div>

        <div className="intro2__wordmark">
          <span className="intro2__word-tech">TECH</span>
          <span className="intro2__word-nest">NEST</span>
        </div>

        <div className="intro2__bar-track">
          <div className="intro2__bar-fill" />
        </div>
        <span className="intro2__status">INITIALIZING</span>
      </div>
    </div>
  );
}
