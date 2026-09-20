import { revalidateTag } from 'next/cache';

/** Refresh cached catalogue data (category tree, counts) after an admin edit. Never throws. */
export function bustCatalog() {
  try {
    revalidateTag('catalog');
  } catch (err) {
    console.warn('[revalidate] skipped:', err?.message);
  }
}
