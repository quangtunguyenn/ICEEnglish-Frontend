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

export function ExamPager({ loading = false, onPageChange, page, totalPages }) {
  if (totalPages <= 1) return null;
  const anchors = [...new Set([0, page - 1, page, page + 1, totalPages - 1])]
    .filter((number) => number >= 0 && number < totalPages)
    .sort((a, b) => a - b);
  const pages = anchors.flatMap((number, index) =>
    index > 0 && number - anchors[index - 1] === 2 ? [number - 1, number] : [number],
  );
  const buttonClass = "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102b5c] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      aria-label="Phân trang"
      className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-3 py-5 shadow-sm sm:flex-row sm:justify-between sm:px-5"
    >
      <p aria-live="polite" className="text-sm font-medium text-slate-600">
        Trang <span className="font-bold text-[#102b5c]">{page + 1}</span> / {totalPages}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          aria-label="Trang trước"
          className={`${buttonClass} border-slate-200 px-3 text-slate-600 hover:border-ice-gold hover:text-[#102b5c]`}
          disabled={loading || page <= 0}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <span aria-hidden="true">←</span><span className="ml-1.5 hidden sm:inline">Trước</span>
        </button>
        {pages.map((number, index) => (
          <span className="inline-flex items-center gap-1.5" key={number}>
            {index > 0 && number - pages[index - 1] > 1 && (
              <span aria-hidden="true" className="px-0.5 text-slate-400">…</span>
            )}
            <button
              aria-current={number === page ? "page" : undefined}
              aria-label={`Trang ${number + 1}`}
              className={`${buttonClass} ${number === page ? "border-[#102b5c] bg-[#102b5c] text-white shadow-sm" : "border-slate-200 text-slate-600 hover:border-ice-gold hover:bg-amber-50 hover:text-[#102b5c]"}`}
              disabled={loading}
              onClick={() => onPageChange(number)}
              type="button"
            >
              {number + 1}
            </button>
          </span>
        ))}
        <button
          aria-label="Trang sau"
          className={`${buttonClass} border-slate-200 px-3 text-slate-600 hover:border-ice-gold hover:text-[#102b5c]`}
          disabled={loading || page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          <span className="mr-1.5 hidden sm:inline">Sau</span><span aria-hidden="true">→</span>
        </button>
      </div>
    </nav>
  );
}
