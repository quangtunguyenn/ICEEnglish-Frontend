import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PageIntro } from '../components/PageIntro'
import {
  getApiErrorMessage,
  getGeneralExams,
  getLatestPracticeScore,
  getPracticeHistory,
} from '../services/api'

function getSubmittedFlag(exam) {
  if (typeof exam.hasSubmitted === 'boolean') return exam.hasSubmitted
  if (Number.isInteger(exam.submittedCount) && exam.submittedCount >= 0) return exam.submittedCount > 0
  return null
}

async function loadExamSummary(exam) {
  const flag = getSubmittedFlag(exam)
  const [score, history] = await Promise.allSettled([
    flag === false ? Promise.resolve(null) : getLatestPracticeScore(exam.id),
    flag === null ? getPracticeHistory(exam.id, 0, 1) : Promise.resolve(null),
  ])
  const noHistory = flag === false || (history.status === 'fulfilled' && history.value?.totalElements === 0)
  return {
    ...exam,
    latestScore: score.status === 'fulfilled' ? score.value : null,
    scoreError: score.status === 'rejected' && !noHistory,
    hasSubmitted: flag ?? (history.status === 'fulfilled' ? history.value.totalElements > 0 : null),
    historyError: history.status === 'rejected',
  }
}

export function PracticePage() {
  const location = useLocation()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    getGeneralExams()
      .then((items) => Promise.all(items.map(loadExamSummary)))
      .then((items) => { if (active) setExams(items) })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải danh sách bài thi. Vui lòng thử lại.'))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])

  function retryLoading() {
    setError('')
    setLoading(true)
    setRetry((current) => current + 1)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <PageIntro
        description="Chọn một bài thi đã được phát hành và bắt đầu luyện tập theo tốc độ của bạn."
        eyebrow="Luyện tập"
        title="Luyện đề"
      />
      {location.state?.submitted && (
        <p className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          Bài làm đã được nộp thành công.
        </p>
      )}
      {loading && <p className="text-slate-500">Đang tải danh sách bài thi...</p>}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-600" role="alert">
          <p>{error}</p>
          <button className="mt-2 font-semibold underline" onClick={retryLoading} type="button">Thử lại</button>
        </div>
      )}
      {!loading && !error && exams.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Chưa có bài thi nào được phát hành.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={exam.id}>
            <span className="text-sm font-bold uppercase tracking-wider text-cyan-600">
              {exam.mode || 'GENERAL_EXAM'}
            </span>
            <h2 className="mt-3 text-xl font-bold text-slate-900">
              {exam.title || exam.name || 'Bài luyện đề'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {exam.durationMinutes || exam.duration || 0} phút · {exam.totalQuestions || exam.questionCount || 'Nhiều'} câu hỏi
            </p>
            {exam.latestScore && (
              <p className="mt-3 text-sm font-bold text-emerald-600">
                Điểm gần nhất: {exam.latestScore.score ?? '—'}
              </p>
            )}
            {exam.hasSubmitted === true && (
              <Link
                className="mt-3 text-sm font-bold text-cyan-800 underline decoration-cyan-300 underline-offset-4 hover:text-cyan-950"
                to={`/luyen-de/${encodeURIComponent(exam.id)}/lich-su`}
              >
                Xem danh sách bài đã làm
              </Link>
            )}
            {(exam.historyError || exam.scoreError) && (
              <div className="mt-3 text-sm text-amber-700" role="alert">
                <p>{exam.historyError ? 'Không thể kiểm tra lịch sử bài làm.' : 'Không thể tải điểm gần nhất.'}</p>
                <button className="mt-1 font-semibold underline" onClick={retryLoading} type="button">Thử lại</button>
              </div>
            )}
            <Link
              className="mt-6 inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
              to={`/luyen-de/${exam.id}`}
            >
              Làm bài thi
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
