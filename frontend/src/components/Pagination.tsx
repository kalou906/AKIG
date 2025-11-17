import React from 'react';

interface PaginationProps {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, pages, onPage }: PaginationProps) {
  const prev = () => onPage(Math.max(1, page - 1));
  const next = () => onPage(Math.min(pages, page + 1));

  return (
    <div className="mt-3 flex items-center justify-between">
      <button
        className="btn bg-gray-100"
        onClick={prev}
        disabled={page <= 1}
        type="button"
        aria-label="Page précédente"
      >
        ← Précédent
      </button>

      <div className="text-sm text-gray-600">
        Page {page} / {pages}
      </div>

      <button
        className="btn bg-gray-100"
        onClick={next}
        disabled={page >= pages}
        type="button"
        aria-label="Page suivante"
      >
        Suivant →
      </button>
    </div>
  );
}
