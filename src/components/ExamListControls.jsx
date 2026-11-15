export function ExamSearchForm({ keywordInput, onKeywordChange, student = false }) {
  return (
    <div className="relative mb-6 max-w-xl">
      {student && (
        <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="m16 16 4 4" strokeLinecap="round" />
        </svg>
      )}
      <input
        aria-label="Tìm theo tên đề"
        className={`w-full font-questrial text-lg rounded-full border-2 border-slate-200 bg-white px-6 py-2.5 pr-12 text-slate-800 shadow-sm transition-all duration-300 placeholder:text-slate-400 hover:border-ice-gold hover:shadow-md focus:border-ice-gold focus:bg-white focus:outline-none focus:ring-4 focus:ring-ice-gold/20 ${student ? "pl-12" : ""}`}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder="Tìm theo tên đề..."
        type="search"
        value={keywordInput}
      />
    </div>
  );
}

export function ExamPager({ onPageChange, page, totalPages }) {
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label="Phân trang"
      className="mt-8 flex items-center justify-center gap-4 text-sm"
    >
      <button
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold disabled:opacity-40"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        ← Trước
      </button>
      <span className="text-slate-500">
        Trang {page + 1}/{totalPages}
      </span>
      <button
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold disabled:opacity-40"
        disabled={page + 1 >= totalPages}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        Sau →
      </button>
    </nav>
  );
}
