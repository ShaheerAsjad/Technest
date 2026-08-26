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
        <defs>
          <pattern id="intro2PcbPattern" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M 22 0 L 0 0 0 22" className="intro2__pcb-grid" />
          </pattern>
        </defs>

        {/* ── Fine PCB grid texture across the whole board ── */}
        <rect x="0" y="0" width="400" height="400" fill="url(#intro2PcbPattern)" />
        {/* ── PCB traces: right-angle paths carrying a glowing pulse
             inward from the edges toward the core ── */}
        <g className="intro2__traces">
          <path className="intro2__trace" style={{ animationDelay: '0s' }}
                d="M20,70 L20,150 L92,150 L140,182" />
          <path className="intro2__trace" style={{ animationDelay: '0.35s' }}
                d="M380,90 L380,160 L308,160 L260,184" />
          <path className="intro2__trace" style={{ animationDelay: '0.7s' }}
                d="M30,330 L104,330 L104,255 L152,222" />
          <path className="intro2__trace" style={{ animationDelay: '1.05s' }}
                d="M372,315 L296,315 L296,248 L248,220" />
          <path className="intro2__trace" style={{ animationDelay: '1.4s' }}
                d="M200,16 L200,95 L200,140" />
          <path className="intro2__trace" style={{ animationDelay: '1.75s' }}
                d="M200,384 L200,305 L200,262" />
        </g>

        {/* ── Pads / vias at trace bends & endpoints ── */}
        {[
          [20, 70], [20, 150], [92, 150],
          [380, 90], [380, 160], [308, 160],
          [30, 330], [104, 330], [104, 255],
          [372, 315], [296, 315], [296, 248],
          [200, 16], [200, 95],
          [200, 384], [200, 305],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3" className="intro2__pad" />
        ))}

        {/* ── IC chip rectangles (purely decorative PCB detail) ── */}
        {[
          { x: 4,   y: 52,  w: 34, h: 22 },
          { x: 362, y: 72,  w: 34, h: 22 },
          { x: 8,   y: 312, w: 34, h: 22 },
          { x: 358, y: 297, w: 34, h: 22 },
        ].map((c, i) => (
          <g key={i} className="intro2__chip">
            <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="2" />
            <line x1={c.x + 6}  y1={c.y} x2={c.x + 6}  y2={c.y - 6} />
            <line x1={c.x + 16} y1={c.y} x2={c.x + 16} y2={c.y - 6} />
            <line x1={c.x + 26} y1={c.y} x2={c.x + 26} y2={c.y - 6} />
            <line x1={c.x + 6}  y1={c.y + c.h} x2={c.x + 6}  y2={c.y + c.h + 6} />
            <line x1={c.x + 16} y1={c.y + c.h} x2={c.x + 16} y2={c.y + c.h + 6} />
            <line x1={c.x + 26} y1={c.y + c.h} x2={c.x + 26} y2={c.y + c.h + 6} />
          </g>
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
