import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageIntro } from '../components/PageIntro'
import { getApiErrorMessage, getPracticeHistory } from '../services/api'
import { formatPracticeSubmissionDate } from '../utils/practiceHistory'

export function PracticeHistoryPage() {
  const { examId } = useParams()
  const [page, setPage] = useState(0)
  const [retry, setRetry] = useState(0)
  const [loaded, setLoaded] = useState(null)
  const requestKey = `${examId}:${page}:${retry}`
  const current = loaded?.key === requestKey ? loaded : null

  useEffect(() => {
    let active = true
    getPracticeHistory(examId, page)
      .then((history) => {
        if (active) setLoaded({ key: requestKey, history })
      })
      .catch((error) => {
        if (active) setLoaded({ key: requestKey, error: getApiErrorMessage(error, 'Không thể tải lịch sử bài làm.') })
      })
    return () => { active = false }
  }, [examId, page, requestKey])

  const history = current?.history
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <PageIntro
        eyebrow="Luyện tập"
        title="Danh sách bài đã làm"
        description={history?.examTitle || 'Các lần nộp bài của đề luyện tập.'}
      />
      <Link className="text-sm font-bold text-cyan-800 underline" to="/luyen-de">← Về danh sách luyện đề</Link>
      {!current && <p className="mt-6 text-slate-500">Đang tải lịch sử bài làm...</p>}
      {current?.error && (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-600" role="alert">
          <p>{current.error}</p>
          <button className="mt-2 font-semibold underline" onClick={() => setRetry((value) => value + 1)} type="button">Thử lại</button>
        </div>
      )}
      {history && history.items.length === 0 && (
        <p className="mt-6 rounded-lg bg-slate-50 p-5 text-slate-600">
          {history.totalElements === 0 ? 'Bạn chưa nộp bài cho đề này.' : 'Không có bài làm ở trang này.'}
        </p>
      )}
      {history?.items.length > 0 && (
        <ul className="mt-6 space-y-3">
          {history.items.map((item) => (
            <li key={item.submissionId}>
              <Link
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-500"
                to={`/luyen-de/bai-lam/${encodeURIComponent(item.submissionId)}`}
              >
                <span>
                  <span className="block font-bold text-slate-900">Nộp lúc: {formatPracticeSubmissionDate(item.submittedAt)}</span>
                  <span className="mt-1 block text-sm text-slate-500">
                    {item.totalCorrect != null && item.totalQuestions != null
                      ? `${item.totalCorrect} / ${item.totalQuestions} câu đúng`
                      : 'Xem chi tiết bài làm'}
                  </span>
                </span>
                <span className="font-bold text-cyan-700">Điểm: {item.score ?? '—'} →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {history && history.totalPages > 1 && (
        <nav aria-label="Phân trang lịch sử" className="mt-6 flex items-center justify-center gap-4">
          <button className="rounded border border-slate-300 px-4 py-2 disabled:opacity-40" disabled={page === 0} onClick={() => setPage((value) => value - 1)} type="button">Trang trước</button>
          <span className="text-sm text-slate-600">Trang {page + 1} / {history.totalPages}</span>
          <button className="rounded border border-slate-300 px-4 py-2 disabled:opacity-40" disabled={page + 1 >= history.totalPages} onClick={() => setPage((value) => value + 1)} type="button">Trang sau</button>
        </nav>
      )}
    </div>
  )
}
