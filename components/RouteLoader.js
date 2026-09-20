'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const SHOW_DELAY_MS = 140;   // fast navigations never flash the loader
const MIN_VISIBLE_MS = 350;  // once shown, stay long enough to look intentional
const FAILSAFE_MS = 10000;   // NEVER get stuck: hide after 10s no matter what

/**
 * Route-change loader: thin top progress bar + centred ring with the "T" mark.
 *  - Shown on internal link clicks and on `technest:route-start` events (used for router.push).
 *  - Hidden as soon as the URL (path or query) changes.
 *  - Path changes get the full ring overlay, query-only changes (filters) only get the top bar.
 */
export default function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locationKey = `${pathname}?${searchParams?.toString() || ''}`;

  const [bar, setBar] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const showTimer = useRef(null);
  const failTimer = useRef(null);
  const shownAt = useRef(0);
  const pending = useRef(false);
  const keyRef = useRef(locationKey);

  function clearTimers() {
    clearTimeout(showTimer.current);
    clearTimeout(failTimer.current);
  }

  function finish() {
    clearTimeout(showTimer.current);
    clearTimeout(failTimer.current);
    pending.current = false;
    const elapsed = Date.now() - shownAt.current;
    const wait = shownAt.current ? Math.max(0, MIN_VISIBLE_MS - elapsed) : 0;
    setTimeout(() => {
      if (!pending.current) { setBar(false); setOverlay(false); }
    }, wait);
    shownAt.current = 0;
  }

  function start(full) {
    if (pending.current) return;
    pending.current = true;
    setBar(true);
    clearTimers();
    showTimer.current = setTimeout(() => {
      if (!pending.current) return;
      shownAt.current = Date.now();
      if (full) setOverlay(true);
    }, SHOW_DELAY_MS);
    failTimer.current = setTimeout(finish, FAILSAFE_MS);
  }

  // URL changed -> navigation finished
  useEffect(() => {
    if (keyRef.current !== locationKey) {
      keyRef.current = locationKey;
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey]);

  useEffect(() => {
    function onClick(e) {
      if (e.defaultPrevented && e.button !== 0) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest('a') : null;
      if (!a || !a.href) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      let url;
      try { url = new URL(a.href, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin) return;
      const samePath = url.pathname === window.location.pathname;
      if (samePath && url.search === window.location.search) return; // same page / hash jump
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
      start(!samePath);
    }
    function onCustom(e) { start(e?.detail?.full !== false); }
    function onError() { finish(); }

    window.addEventListener('click', onClick, true);
    window.addEventListener('technest:route-start', onCustom);
    window.addEventListener('technest:route-end', onError);
    window.addEventListener('pageshow', onError);
    return () => {
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('technest:route-start', onCustom);
      window.removeEventListener('technest:route-end', onError);
      window.removeEventListener('pageshow', onError);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {bar && <div className="route-progress" aria-hidden="true"><span /></div>}
      {overlay && (
        <div className="route-loader" role="status" aria-live="polite" aria-label="Loading page">
          <div className="route-loader__box">
            <div className="route-loader__ring-wrap" aria-hidden="true">
              <span className="route-loader__ring" />
              <span className="route-loader__ring route-loader__ring--b" />
              <span className="route-loader__orbit"><i /></span>
              <span className="route-loader__mark">T</span>
            </div>
            <div className="route-loader__word">TECHNEST</div>
            <div className="route-loader__dots" aria-hidden="true"><i /><i /><i /></div>
          </div>
        </div>
      )}
    </>
  );
}
