'use client';

import { useEffect, useState } from 'react';

function getNextMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0); // next midnight, local time
  return next;
}

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return { h, m, s };
}

export default function DropCountdown({ label = 'This Drop Ends In' }) {
  const [target, setTarget] = useState(null);
  const [remaining, setRemaining] = useState({ h: '00', m: '00', s: '00' });

  useEffect(() => {
    const deadline = getNextMidnight();
    setTarget(deadline);

    const tick = () => {
      setRemaining(formatRemaining(deadline.getTime() - Date.now()));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!target) return null;

  return (
    <div className="drop-countdown" role="timer" aria-label={`${label}: ${remaining.h} hours ${remaining.m} minutes ${remaining.s} seconds`}>
      <span className="drop-countdown__label">{label}</span>
      <div className="drop-countdown__digits">
        <span className="drop-countdown__unit">{remaining.h}<small>h</small></span>
        <span className="drop-countdown__sep">:</span>
        <span className="drop-countdown__unit">{remaining.m}<small>m</small></span>
        <span className="drop-countdown__sep">:</span>
        <span className="drop-countdown__unit">{remaining.s}<small>s</small></span>
      </div>
    </div>
  );
}
