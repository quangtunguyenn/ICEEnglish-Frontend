import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageIntro } from '../components/PageIntro'
import {
  getApiErrorMessage,
  getGeneralExams,
  getLatestPracticeReview,
  getLatestPracticeScore,
} from '../services/api'

export function PracticePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewingExamId, setReviewingExamId] = useState('')

  useEffect(() => {
    getGeneralExams()
      .then((items) =>
        Promise.all(
          items.map(async (exam) => {
            try {
              return { ...exam, latestScore: await getLatestPracticeScore(exam.id) }
            } catch {
              return { ...exam, latestScore: null }
            }
          }),
        ),
      )
      .then(setExams)
      .catch((requestError) => setError(getApiErrorMessage(requestError, 'Không thể tải danh sách bài thi. Vui lòng thử lại.')))
      .finally(() => setLoading(false))
  }, [])

  async function handleReview(exam) {
    setReviewingExamId(exam.id)
    setError('')
    try {
      const review = await getLatestPracticeReview(exam.id)
      const submissionId = review?.submissionId || review?.submission_id
      if (!submissionId) {
        throw new Error('API review không trả về submissionId.')
      }

      sessionStorage.setItem(`exam-result:${submissionId}`, JSON.stringify(review))
      navigate(`/ket-qua/${submissionId}`, { state: { result: review } })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải bài thi gần nhất.'))
    } finally {
      setReviewingExamId('')
    }
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
      {error && <p className="rounded-lg bg-red-50 p-4 text-red-600">{error}</p>}
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
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-emerald-600">
                  Điểm gần nhất: {exam.latestScore.score ?? '—'}
                </p>
                <button
                  className="text-sm font-bold text-cyan-800 underline decoration-cyan-300 underline-offset-4 hover:text-cyan-950 disabled:cursor-wait disabled:opacity-50"
                  disabled={Boolean(reviewingExamId)}
                  onClick={() => handleReview(exam)}
                  type="button"
                >
                  {reviewingExamId === exam.id ? 'Đang tải...' : 'Xem lại bài thi gần nhất'}
                </button>
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
