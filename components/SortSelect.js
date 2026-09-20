'use client';

import { useRouter } from 'next/navigation';
import { toQueryString } from '@/lib/catalog-params';

export default function SortSelect({ basePath, filters, options }) {
  const router = useRouter();
  return (
    <label className="catalog-sort">
      <span>Sort:</span>
      <select
        className="form-input catalog-select"
        value={filters.sort || 'latest'}
        onChange={(e) => router.push(`${basePath}${toQueryString({ ...filters, sort: e.target.value, page: 1 })}`, { scroll: false })}
        aria-label="Sort products"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
