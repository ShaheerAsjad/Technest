'use client';

import { useEffect, useRef, useState } from 'react';

const SESSION_KEY = 'technest_intro_v7';

export default function IntroLoader() {
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState('in'); // in -> hold -> out
  const startedRef = useRef(false);

  useEffect(() => {
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

    // Timeline: Play intro animation and gracefully exit without locking body scroll
    setTimeout(() => setStage('out'), 1900);
    setTimeout(() => {
      setVisible(false);
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