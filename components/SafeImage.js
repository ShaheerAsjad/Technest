'use client';

import { useEffect, useState } from 'react';

export const PLACEHOLDER = '/placeholder.svg';

/** <img> that swaps to a placeholder if the picture is missing or broken. */
export default function SafeImage({ src, alt = '', className, loading = 'lazy', ...rest }) {
  const [current, setCurrent] = useState(src || PLACEHOLDER);
  useEffect(() => { setCurrent(src || PLACEHOLDER); }, [src]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => { if (current !== PLACEHOLDER) setCurrent(PLACEHOLDER); }}
      {...rest}
    />
  );
}
