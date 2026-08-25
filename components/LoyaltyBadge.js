'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function LoyaltyBadge() {
  const { isSignedIn } = useUser();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const res = await fetch('/api/loyalty');
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Loyalty fetch error:', err);
      }
    })();
  }, [isSignedIn]);

  if (!isSignedIn || !data || data.points <= 0) return null;

  return (
    <div className="loyalty-badge" title={`${data.tier} member · $${data.totalSpent.toFixed(2)} spent`}>
      <span className="loyalty-badge__icon" aria-hidden="true">✦</span>
      <span>{data.points} pts</span>
      <span className="loyalty-badge__tier">{data.tier}</span>
    </div>
  );
}
