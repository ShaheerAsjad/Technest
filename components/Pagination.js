import Link from 'next/link';
import { toQueryString } from '@/lib/catalog-params';

function pageList(page, total) {
  const set = new Set([1, total, page, page - 1, page + 1, page - 2, page + 2]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}

/** Server-rendered numbered pagination (plain links, SEO friendly). */
export default function Pagination({ basePath, filters, page, totalPages }) {
  if (totalPages <= 1) return null;
  const href = (p) => `${basePath}${toQueryString({ ...filters, page: p })}`;
  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1
        ? <Link className="pager__btn" href={href(page - 1)} rel="prev">← Prev</Link>
        : <span className="pager__btn pager__btn--disabled">← Prev</span>}
      {pageList(page, totalPages).map((n, i) =>
        n === '…'
          ? <span key={`d${i}`} className="pager__dots">…</span>
          : <Link key={n} href={href(n)} className={`pager__btn${n === page ? ' pager__btn--active' : ''}`} aria-current={n === page ? 'page' : undefined}>{n}</Link>
      )}
      {page < totalPages
        ? <Link className="pager__btn" href={href(page + 1)} rel="next">Next →</Link>
        : <span className="pager__btn pager__btn--disabled">Next →</span>}
    </nav>
  );
}
