export function ExamSearchForm({ keywordInput, onKeywordChange }) {
  return (
    <div className="relative mb-6 max-w-xl">
      <input
        aria-label="Tìm theo tên đề"
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm"
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder="Tìm theo tên đề (gõ có dấu hoặc không dấu)"
        type="search"
        value={keywordInput}
      />
    </div>
  )
}

export function ExamPager({ onPageChange, page, totalPages }) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Phân trang" className="mt-8 flex items-center justify-center gap-4 text-sm">
      <button
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold disabled:opacity-40"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        ← Trước
      </button>
      <span className="text-slate-500">Trang {page + 1}/{totalPages}</span>
      <button
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold disabled:opacity-40"
        disabled={page + 1 >= totalPages}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        Sau →
      </button>
    </nav>
  )
}
