import { useEffect } from 'react'

export function SubmitConfirmationDialog({ unansweredCount, onCancel, onConfirm }) {
  const unanswered = Math.max(0, Number(unansweredCount) || 0)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onCancel()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      aria-describedby="submit-confirmation-description"
      aria-labelledby="submit-confirmation-title"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
    >
      <section className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-6 shadow-[0_30px_90px_-25px_rgba(2,6,23,0.65)] sm:p-7">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${unanswered ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {unanswered ? (
            <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M12 8v4m0 4h.01M10.3 3.9 1.8 18.2A1.8 1.8 0 0 0 3.3 21h17.4a1.8 1.8 0 0 0 1.5-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-700">Xác nhận nộp bài</p>
        <h2 className="mt-1 font-gf text-xl font-extrabold text-[#102b5c]" id="submit-confirmation-title">Bạn đã sẵn sàng?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600" id="submit-confirmation-description">
          {unanswered > 0
            ? <>Bạn còn <strong className="font-extrabold text-amber-800">{unanswered} câu chưa làm</strong>. Bạn có chắc chắn muốn nộp bài không?</>
            : 'Bạn đã hoàn thành tất cả câu hỏi. Bạn có chắc chắn muốn nộp bài không?'}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            autoFocus
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102b5c]"
            onClick={onCancel}
            type="button"
          >
            Tiếp tục làm bài
          </button>
          <button
            className="rounded-xl bg-[#102b5c] px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#174783] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
            onClick={onConfirm}
            type="button"
          >
            Xác nhận nộp
          </button>
        </div>
      </section>
    </div>
  )
}
