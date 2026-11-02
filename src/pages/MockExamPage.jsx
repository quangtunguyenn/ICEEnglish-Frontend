import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageIntro } from '../components/PageIntro'
import { getMockExams } from '../services/api'

export function MockExamPage() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMockExams()
      .then(setExams)
      .catch(() => setError('Không thể tải danh sách đề thi thử. Vui lòng thử lại.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <PageIntro
        description="Chọn một đề thi thử để làm bài trong thời gian quy định. Bài sẽ tự động nộp khi hết giờ."
        eyebrow="Kiểm tra năng lực"
        title="Thi thử"
      />
      {loading && <p className="text-slate-500">Đang tải danh sách đề thi...</p>}
      {error && <p className="rounded-lg bg-red-50 p-4 text-red-600">{error}</p>}
      {!loading && !error && exams.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Chưa có đề thi thử nào được phát hành.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={exam.id}>
            <span className="text-sm font-bold uppercase tracking-wider text-cyan-600">MOCK</span>
            <h2 className="mt-3 text-xl font-bold text-slate-900">
              {exam.title || exam.name || 'Đề thi thử'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {exam.durationMinutes || exam.duration || exam.timeLimitMinutes || 0} phút ·{' '}
              {exam.totalQuestions || exam.questionCount || 'Nhiều'} câu hỏi
            </p>
            <Link
              className="mt-6 inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
              to={`/thi-thu/${exam.id}`}
            >
              Vào phòng thi
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
