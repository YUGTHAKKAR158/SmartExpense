// ═══════════════════════════════════════════════
// src/components/common/Pagination.jsx
// Page navigation controls
// ═══════════════════════════════════════════════

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { currentPage, totalPages, totalCount, limit } = pagination;

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">

      {/* Showing X - Y of Z */}
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalCount}</span> expenses
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>

        {/* Page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          // Show max 5 page buttons around current page
          .filter(page =>
            page === 1 ||
            page === totalPages ||
            Math.abs(page - currentPage) <= 1
          )
          .map((page, index, array) => (
            <span key={page}>
              {/* Add ellipsis if there's a gap */}
              {index > 0 && array[index - 1] !== page - 1 && (
                <span className="px-2 text-gray-400">...</span>
              )}
              <button
                onClick={() => onPageChange(page)}
                className={`
                  w-9 h-9 text-sm rounded-lg font-medium transition-colors
                  ${page === currentPage
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {page}
              </button>
            </span>
          ))
        }

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Pagination;