'use client';

import { usePathname } from 'next/navigation';

export default function AmbientGlow() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="ambient-glow" aria-hidden="true">
      <span className="ambient-glow__blob ambient-glow__blob--primary" />
      <span className="ambient-glow__blob ambient-glow__blob--accent" />
    </div>
  );
}
