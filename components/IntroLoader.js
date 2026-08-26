'use client';

import { useLayoutEffect, useRef, useState } from 'react';

// Bumping this key resets any "already played" flag from earlier
// testing — the intro plays fresh next load regardless of old
// sessionStorage state in your browser.
const SESSION_KEY = 'technest_intro_v8';

export default function IntroLoader() {
  // Starts TRUE on both the server-rendered HTML and the first
  // client render, so the overlay is present from the very first
  // paint — nothing behind it can ever flash into view first.
  const [visible, setVisible] = useState(true);
  const [stage, setStage] = useState('in'); // in -> out
  const startedRef = useRef(false);

  // useLayoutEffect (not useEffect) runs synchronously *before* the
  // browser paints, so even the "hide immediately" branch below
  // never flashes the intro on-screen for repeat page loads within
  // the same tab session.
  useLayoutEffect(() => {
    if (startedRef.current) return; // guards React Strict Mode's dev double-invoke
    startedRef.current = true;

    let alreadyPlayed = false;
    try {
      alreadyPlayed = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // sessionStorage unavailable — just play it
    }

    if (alreadyPlayed) {
      setVisible(false);
      return;
    }

    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* ignore */
    }

    document.body.style.overflow = 'hidden';

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

      <svg className="intro2__circuit" viewBox="0 0 400 400" aria-hidden="true">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <line
            key={angle}
            x1={200 + Math.cos((angle * Math.PI) / 180) * 190}
            y1={200 + Math.sin((angle * Math.PI) / 180) * 190}
            x2="200"
            y2="200"
            className="intro2__circuit-line"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </svg>

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
