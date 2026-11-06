/**
 * Which page buttons to show: a small window around the current page (0-based), with room to step before it.
 * `before` and `after` are where the "…" buttons jump to, or null when there's nothing that way.
 */
export const pageWindow = (pageIndex: number, totalPages: number, size = 3) => {
  const start = Math.max(0, Math.min(pageIndex - 1, totalPages - size));
  const end = Math.min(start + size, totalPages);

  return {
    pages: Array.from({ length: end - start }, (_, i) => start + i),
    before: start > 0 ? start - 1 : null,
    after: end < totalPages ? end : null,
  };
};
